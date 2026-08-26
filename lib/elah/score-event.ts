import "server-only";
import type { SessionUser } from "@/lib/auth/session";
import { actorTypeFromRole, tierFromRole } from "@/lib/auth/roles";
import { isConfirmationRequired } from "@/lib/agent/policy";
import type { AgentIntent } from "@/lib/agent/types";
import {
  canonicalActionType,
  ELAH_APP_ID,
  ELAH_EVENT_SCHEMA_VERSION,
  ELAH_TOOL_NAMES,
  type ElahActionType,
  type ElahEvent,
  type ElahExecutionState,
  type ElahOutcome,
  type ElahToolName,
} from "./envelope";
import { mintEventId, toIsoUtc, truncateUserAgent } from "./event-context";
import {
  detectAccountContext,
  detectAmountBucket,
  detectInitialIntent,
  detectRecipientType,
  hashUserId,
  sanitizeToolArgs,
} from "./helpers";
import type { ElahBankingIntent } from "./types";

const UTTERANCE_CAP = 2000;

const SCHEMA_FORBIDDEN_ARG_KEYS = new Set([
  "userId",
  "customerProfileId",
  "profileId",
  "actorId",
  "sessionId",
  "accountId",
  "fromAccountId",
  "toAccountId",
  "ownerId",
  "targetUserId",
  "password",
  "token",
  "role",
  "cardId",
]);

const AMOUNT_BUCKETS = new Set([
  "none",
  "micro_1_99",
  "small_100_499",
  "medium_500_1999",
  "large_2000_9999",
  "very_large_10000_plus",
]);

const ACCOUNT_CONTEXTS = new Set([
  "checking",
  "savings",
  "investment",
  "checking_and_savings",
  "all",
  "unspecified",
]);

const RECIPIENT_TYPES = new Set([
  "none",
  "self",
  "utility",
  "person_name",
  "business",
  "saved_payee",
]);

const TOOL_NAME_SET = new Set<string>(ELAH_TOOL_NAMES);

const AGENT_INTENT_TO_ELAH: Partial<Record<AgentIntent, ElahBankingIntent>> = {
  balance_query: "balance_awareness",
  transaction_search: "recent_transactions",
  spending_analysis: "spending_summary",
  internal_transfer: "internal_transfer",
  external_transfer: "external_transfer",
  bill_payment: "bill_payment",
  statement_download: "statement_download",
  support_request: "support_escalation",
  recipients_query: "external_transfer",
  small_talk: "non_banking_request",
  unsafe_request: "prompt_injection_or_policy_bypass",
  prompt_injection_attempt: "prompt_injection_or_policy_bypass",
  ambiguous_request: "ambiguous_banking_request",
};

export type BuildAgentPreToolEventInput = {
  eventId?: string | null;
  user: SessionUser;
  sessionId: string | null;
  conversationId: string;
  messageId: string;
  utterance: string;
  toolName?: string | null;
  toolArgs?: Record<string, unknown> | null;
  policyDecision: "allow" | "deny" | "needs_confirmation";
  policyReasons?: string[];
  outcome: ElahOutcome;
  executionState: ElahExecutionState;
  intent?: AgentIntent | null;
  isInjection?: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
};

function capUtterance(text: string | null | undefined): string | null {
  if (!text) return null;
  return text.length > UTTERANCE_CAP ? text.slice(0, UTTERANCE_CAP) : text;
}

function asToolName(name: string | null | undefined): ElahToolName | null {
  if (!name || !TOOL_NAME_SET.has(name)) return null;
  return name as ElahToolName;
}

function sanitizeEventArgs(
  toolArgs: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const sanitized = sanitizeToolArgs(toolArgs);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(sanitized)) {
    if (SCHEMA_FORBIDDEN_ARG_KEYS.has(key)) continue;
    if (typeof value === "string") {
      if (/recipient|merchant|name/i.test(key) && value !== "[recipient_redacted]") {
        out[key] = "[recipient_redacted]";
        continue;
      }
      let next = value.replace(/\d{8,}/g, "[redacted_account_number]");
      if (next.length > 400) next = `${next.slice(0, 400)}…`;
      out[key] = next;
      continue;
    }
    out[key] = value;
  }
  return out;
}

function finiteAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/,/g, ""));
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function mapCustomerTier(
  user: SessionUser,
): NonNullable<ElahEvent["actor"]["customerTier"]> {
  const fromProfile = user.customerProfile?.tier;
  if (fromProfile === "basic" || fromProfile === "premium" || fromProfile === "vip") {
    return fromProfile;
  }
  const fromRole = tierFromRole(user.role);
  return fromRole === "not_applicable" ? "not_applicable" : fromRole;
}

function mapDetectedIntent(input: {
  isInjection: boolean;
  intent?: AgentIntent | null;
  toolName: string | null;
  utterance: string;
}): ElahBankingIntent {
  if (input.isInjection) return "prompt_injection_or_policy_bypass";
  if (input.intent === "card_management") {
    if (input.toolName === "freeze_card") return "card_freeze";
    if (input.toolName === "unfreeze_card") return "card_unfreeze";
    if (input.toolName === "get_cards") return "recent_transactions";
  }
  if (input.intent && AGENT_INTENT_TO_ELAH[input.intent]) {
    return AGENT_INTENT_TO_ELAH[input.intent]!;
  }
  return detectInitialIntent(input.utterance, input.toolName, null);
}

function asAmountBucket(raw: string): ElahEvent["action"]["amountBucket"] {
  return AMOUNT_BUCKETS.has(raw)
    ? (raw as ElahEvent["action"]["amountBucket"])
    : "none";
}

function asAccountContext(raw: string): ElahEvent["action"]["accountContext"] {
  return ACCOUNT_CONTEXTS.has(raw)
    ? (raw as ElahEvent["action"]["accountContext"])
    : "unspecified";
}

function asRecipientType(raw: string): ElahEvent["action"]["recipientType"] {
  return RECIPIENT_TYPES.has(raw)
    ? (raw as ElahEvent["action"]["recipientType"])
    : "none";
}

/**
 * Build a valid ElahEvent 1.0 for the pre-tool scoring hook.
 * Does not include elahScore or any output-contract fields.
 */
export function buildAgentPreToolEvent(
  input: BuildAgentPreToolEventInput,
): ElahEvent | null {
  const isInjection = !!input.isInjection;
  const actionType: ElahActionType | null = isInjection
    ? "prompt_injection"
    : canonicalActionType(input.toolName ?? "");
  if (!actionType) return null;
  const toolName = isInjection ? null : asToolName(input.toolName);
  const args = sanitizeEventArgs(input.toolArgs);
  const amount = finiteAmount(args.amount) ?? finiteAmount(input.toolArgs?.amount);
  const hint = ["/assistant", toolName, input.utterance].filter(Boolean).join(" ");
  const ipAddress = input.ipAddress ?? null;
  const userAgent = truncateUserAgent(input.userAgent);

  const event: ElahEvent = {
    schemaVersion: ELAH_EVENT_SCHEMA_VERSION,
    eventId: input.eventId || mintEventId(),
    occurredAt: toIsoUtc(new Date()),
    appId: ELAH_APP_ID,
    source: "agent",
    actionType,
    outcome: input.outcome,
    executionState: input.executionState,
    actor: {
      userIdHash: hashUserId(input.user.id),
      sessionId: input.sessionId,
      actorType: actorTypeFromRole(input.user.role),
      role: input.user.role,
      customerTier: mapCustomerTier(input.user),
    },
    action: {
      toolName,
      page: "/assistant",
      args,
      amount,
      currency: amount != null ? "ILS" : null,
      amountBucket: asAmountBucket(detectAmountBucket(hint, { ...args, ...(amount != null ? { amount } : {}) })),
      accountContext: asAccountContext(detectAccountContext(hint, args)),
      recipientType: asRecipientType(detectRecipientType(hint, args)),
    },
    policy: {
      decision: input.policyDecision,
      reasons: input.policyReasons ?? [],
      confirmationRequired: toolName ? isConfirmationRequired(toolName) : false,
    },
    conversation: {
      conversationId: input.conversationId,
      messageId: input.messageId,
      utterance: capUtterance(input.utterance),
    },
    mfaStatus: "unknown",
    detectedIntent: mapDetectedIntent({
      isInjection,
      intent: input.intent,
      toolName: toolName ?? input.toolName ?? null,
      utterance: input.utterance,
    }),
  };

  if (ipAddress || userAgent) {
    event.client = { ipAddress, userAgent };
  }

  return event;
}

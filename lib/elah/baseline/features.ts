import type { ElahEvent } from "@/lib/elah/envelope";
import { ELAH_BANKING_INTENTS, type ElahBankingIntent } from "@/lib/elah/types";

const INTENT_SET = new Set<string>(ELAH_BANKING_INTENTS);

const INJECTION_REASON_RE = /injection|ignore_previous|policy_bypass|jailbreak/i;

const HIGH_VALUE_BUCKETS = new Set(["large_2000_9999", "very_large_10000_plus"]);

const FIRST_PAYEE_TYPES = new Set(["person_name", "business"]);

/**
 * Tool → expected intent. Used only for single-event intent/tool mismatch.
 * Copied from the Phase 3 mock-scorer map.
 */
const TOOL_TO_INTENT: Record<string, ElahBankingIntent> = {
  get_account_balance: "balance_awareness",
  get_recent_transactions: "recent_transactions",
  get_transaction_by_id: "recent_transactions",
  get_spending_summary: "spending_summary",
  create_internal_transfer: "internal_transfer",
  create_external_transfer: "external_transfer",
  pay_bill: "bill_payment",
  get_monthly_statement: "statement_download",
  freeze_card: "card_freeze",
  unfreeze_card: "card_unfreeze",
  create_support_case: "support_escalation",
  get_cards: "recent_transactions",
  get_saved_recipients: "external_transfer",
};

export type PolicyDecisionFeature =
  | "allow"
  | "deny"
  | "needs_confirmation"
  | "not_applicable"
  | "missing";

export type BaselineFeatures = {
  amountBucket: ElahEvent["action"]["amountBucket"];
  recipientType: ElahEvent["action"]["recipientType"];
  policyDecision: PolicyDecisionFeature;
  confirmationRequired: boolean;
  highValue: boolean;
  injectionLikely: boolean;
  policyDenied: boolean;
  utteranceLength: number;
  shortUtterance: boolean;
  questionMark: boolean;
  oddHours: boolean;
  firstPayeeHint: boolean;
  source: ElahEvent["source"];
  toolName: string | null;
  executionState: ElahEvent["executionState"];
  hasPlannedTool: boolean;
  outcome: ElahEvent["outcome"];
  noTool: boolean;
  actionType: ElahEvent["actionType"];
  accountContext: ElahEvent["action"]["accountContext"];
  customerTier: ElahEvent["actor"]["customerTier"] | null;
  actorType: ElahEvent["actor"]["actorType"];
  mfaStatus: NonNullable<ElahEvent["mfaStatus"]> | "missing";
  currency: ElahEvent["action"]["currency"] | null;
  conversationPresent: boolean;
  intentToolMismatch: boolean;
};

function utteranceOf(event: ElahEvent): string {
  return event.conversation?.utterance ?? "";
}

function tokenCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function utcHour(occurredAt: string): number | null {
  const ms = Date.parse(occurredAt);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).getUTCHours();
}

function isValidIntent(value: string | undefined | null): value is ElahBankingIntent {
  return typeof value === "string" && INTENT_SET.has(value);
}

export function injectionLikelyFromEvent(event: ElahEvent): boolean {
  if (event.actionType === "prompt_injection") return true;
  if (event.detectedIntent === "prompt_injection_or_policy_bypass") return true;
  const reasons = event.policy?.reasons ?? [];
  return reasons.some((reason) => INJECTION_REASON_RE.test(reason));
}

export function extractBaselineFeatures(event: ElahEvent): BaselineFeatures {
  const utterance = utteranceOf(event);
  const toolName = event.action.toolName ?? null;
  const amountBucket = event.action.amountBucket;
  const recipientType = event.action.recipientType;
  const policyDecision: PolicyDecisionFeature = event.policy?.decision ?? "missing";
  const outcome = event.outcome;
  const hour = utcHour(event.occurredAt);
  const detected = event.detectedIntent;

  const intentToolMismatch = Boolean(
    isValidIntent(detected) &&
      toolName &&
      TOOL_TO_INTENT[toolName] &&
      TOOL_TO_INTENT[toolName] !== detected,
  );

  return {
    amountBucket,
    recipientType,
    policyDecision,
    confirmationRequired: event.policy?.confirmationRequired ?? false,
    highValue: HIGH_VALUE_BUCKETS.has(amountBucket),
    injectionLikely: injectionLikelyFromEvent(event),
    policyDenied:
      outcome === "blocked" || outcome === "refused" || policyDecision === "deny",
    utteranceLength: utterance.length,
    shortUtterance: tokenCount(utterance) < 4,
    questionMark: utterance.includes("?"),
    oddHours: hour != null && (hour < 6 || hour >= 22),
    firstPayeeHint: FIRST_PAYEE_TYPES.has(recipientType),
    source: event.source,
    toolName,
    executionState: event.executionState,
    hasPlannedTool: toolName != null && event.executionState !== "no_tool",
    outcome,
    noTool: event.executionState === "no_tool" || toolName == null,
    actionType: event.actionType,
    accountContext: event.action.accountContext,
    customerTier: event.actor.customerTier ?? null,
    actorType: event.actor.actorType,
    mfaStatus: event.mfaStatus ?? "missing",
    currency: event.action.currency ?? null,
    conversationPresent: event.conversation != null,
    intentToolMismatch,
  };
}

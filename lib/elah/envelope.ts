import "server-only";
import { prisma } from "@/lib/db";
import { ELAH_BANKING_INTENTS } from "./types";
import {
  detectAccountContext,
  detectAmountBucket,
  detectRecipientType,
  hashUserId,
  sanitizeToolArgs,
} from "./helpers";
import {
  isPageViewActionType,
  toIsoUtc,
  truncateUserAgent,
} from "./event-context";
import { checkElahEvent, findDuplicateEventIds, type QualityResult } from "./quality";

export const ELAH_EVENT_SCHEMA_VERSION = "1.0";
export const ELAH_APP_ID = "elah-banking-demo";

const UTTERANCE_CAP = 2000;

export const ELAH_ACTION_TYPES = [
  "login",
  "login_failed",
  "logout",
  "password_reset",
  "internal_transfer",
  "external_transfer",
  "bill_payment",
  "card_freeze",
  "card_unfreeze",
  "statement_download",
  "account_balance_read",
  "transactions_read",
  "transaction_lookup",
  "spending_summary",
  "recipients_read",
  "cards_read",
  "support_case_created",
  "document_download",
  "document_bulk_download",
  "profile_update",
  "card_request",
  "loan_application",
  "prompt_injection",
] as const;

export type ElahActionType = (typeof ELAH_ACTION_TYPES)[number];

export const ELAH_TOOL_NAMES = [
  "get_account_balance",
  "get_recent_transactions",
  "get_transaction_by_id",
  "get_spending_summary",
  "get_monthly_statement",
  "get_saved_recipients",
  "get_cards",
  "create_internal_transfer",
  "create_external_transfer",
  "pay_bill",
  "freeze_card",
  "unfreeze_card",
  "create_support_case",
] as const;

export type ElahToolName = (typeof ELAH_TOOL_NAMES)[number];

const ACTION_TYPE_SET = new Set<string>(ELAH_ACTION_TYPES);
const TOOL_NAME_SET = new Set<string>(ELAH_TOOL_NAMES);
const INTENT_SET = new Set<string>(ELAH_BANKING_INTENTS);

const CONFIRMATION_REQUIRED = new Set<string>([
  "create_internal_transfer",
  "create_external_transfer",
  "pay_bill",
  "freeze_card",
  "unfreeze_card",
  "get_monthly_statement",
]);

const SESSION_ACTION_TYPES = new Set<ElahActionType>([
  "login",
  "login_failed",
  "logout",
  "password_reset",
]);

const DO_NOT_MAP = new Set([
  "unauthorized_route_access",
  "transfer_approved",
  "transfer_rejected",
  "loan_approved",
  "loan_rejected",
  "transfer_draft_created",
  "transfer_confirmation_viewed",
]);

/** Live AuditLog.actionType / tool aliases → canonical ElahEvent.actionType. */
const ACTION_ALIAS_TO_CANONICAL: Record<string, ElahActionType> = {
  login: "login",
  login_failed: "login_failed",
  logout: "logout",
  password_reset_requested: "password_reset",
  password_reset: "password_reset",
  create_internal_transfer: "internal_transfer",
  internal_transfer: "internal_transfer",
  create_external_transfer: "external_transfer",
  external_transfer: "external_transfer",
  transfer_submitted: "external_transfer",
  transfer_blocked: "external_transfer",
  pay_bill: "bill_payment",
  bill_payment: "bill_payment",
  freeze_card: "card_freeze",
  card_freeze: "card_freeze",
  unfreeze_card: "card_unfreeze",
  card_unfreeze: "card_unfreeze",
  get_monthly_statement: "statement_download",
  agent_statement_downloaded: "statement_download",
  statement_download: "statement_download",
  get_account_balance: "account_balance_read",
  agent_account_balance_read: "account_balance_read",
  account_balance_read: "account_balance_read",
  get_recent_transactions: "transactions_read",
  agent_transactions_search: "transactions_read",
  transactions_search: "transactions_read",
  transactions_read: "transactions_read",
  get_transaction_by_id: "transaction_lookup",
  agent_transaction_lookup: "transaction_lookup",
  transaction_lookup: "transaction_lookup",
  get_spending_summary: "spending_summary",
  agent_spending_summary: "spending_summary",
  spending_summary: "spending_summary",
  get_saved_recipients: "recipients_read",
  agent_recipients_read: "recipients_read",
  recipients_read: "recipients_read",
  get_cards: "cards_read",
  agent_cards_read: "cards_read",
  cards_read: "cards_read",
  create_support_case: "support_case_created",
  support_ticket_created: "support_case_created",
  support_case_created: "support_case_created",
  document_downloaded: "document_download",
  document_download: "document_download",
  document_bulk_download_attempt: "document_bulk_download",
  document_bulk_download: "document_bulk_download",
  profile_updated: "profile_update",
  profile_update: "profile_update",
  card_request_submitted: "card_request",
  card_request: "card_request",
  loan_request_submitted: "loan_application",
  loan_request_blocked: "loan_application",
  loan_application: "loan_application",
  suspicious_prompt_detected: "prompt_injection",
  prompt_injection: "prompt_injection",
};

const FORBIDDEN_ARG_KEYS = new Set([
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

const ACTOR_TYPES = new Set(["customer", "manager", "admin", "ai_agent", "anonymous"]);
const OUTCOMES = new Set([
  "executed",
  "blocked",
  "cancelled",
  "failed",
  "pending_confirmation",
  "conversational",
  "refused",
  "session",
]);
const EXECUTION_STATES = new Set(["pre_tool", "post_tool", "no_tool"]);
const SOURCES = new Set(["ui", "agent", "system"]);
const TIERS = new Set(["basic", "premium", "vip", "not_applicable"]);
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
const POLICY_DECISIONS = new Set(["allow", "deny", "needs_confirmation", "not_applicable"]);
const MFA_STATUSES = new Set(["unknown", "not_enabled", "passed", "failed", "skipped"]);

const ALLOWED_TOP_LEVEL = new Set([
  "schemaVersion",
  "eventId",
  "occurredAt",
  "appId",
  "source",
  "actionType",
  "outcome",
  "executionState",
  "actor",
  "client",
  "action",
  "policy",
  "conversation",
  "mfaStatus",
  "detectedIntent",
]);

const ACTOR_KEYS = new Set(["userIdHash", "sessionId", "actorType", "role", "customerTier"]);
const CLIENT_KEYS = new Set(["ipAddress", "userAgent"]);
const ACTION_KEYS = new Set([
  "toolName",
  "page",
  "args",
  "amount",
  "currency",
  "amountBucket",
  "accountContext",
  "recipientType",
]);
const POLICY_KEYS = new Set(["decision", "reasons", "confirmationRequired"]);
const CONVERSATION_KEYS = new Set(["conversationId", "messageId", "utterance"]);

const ISO_UTC_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const PAGE_VIEW_ACTION_RE = /_(view|viewed|opened|searched)$/;

export type ElahSource = "ui" | "agent" | "system";
export type ElahOutcome =
  | "executed"
  | "blocked"
  | "cancelled"
  | "failed"
  | "pending_confirmation"
  | "conversational"
  | "refused"
  | "session";
export type ElahExecutionState = "pre_tool" | "post_tool" | "no_tool";
export type ElahActorType = "customer" | "manager" | "admin" | "ai_agent" | "anonymous";

export type ElahEvent = {
  schemaVersion: typeof ELAH_EVENT_SCHEMA_VERSION;
  eventId: string;
  occurredAt: string;
  appId: string;
  source: ElahSource;
  actionType: ElahActionType;
  outcome: ElahOutcome;
  executionState: ElahExecutionState;
  actor: {
    userIdHash?: string | null;
    sessionId: string | null;
    actorType: ElahActorType;
    role?: string | null;
    customerTier?: "basic" | "premium" | "vip" | "not_applicable" | null;
  };
  client?: {
    ipAddress?: string | null;
    userAgent?: string | null;
  };
  action: {
    toolName: ElahToolName | null;
    page?: string | null;
    args: Record<string, unknown>;
    amount?: number | null;
    currency?: "ILS" | null;
    amountBucket:
      | "none"
      | "micro_1_99"
      | "small_100_499"
      | "medium_500_1999"
      | "large_2000_9999"
      | "very_large_10000_plus";
    accountContext:
      | "checking"
      | "savings"
      | "investment"
      | "checking_and_savings"
      | "all"
      | "unspecified";
    recipientType: "none" | "self" | "utility" | "person_name" | "business" | "saved_payee";
  };
  policy?: {
    decision: "allow" | "deny" | "needs_confirmation" | "not_applicable";
    reasons: string[];
    confirmationRequired: boolean;
  };
  conversation?: {
    conversationId: string;
    messageId: string;
    utterance?: string | null;
  };
  mfaStatus?: "unknown" | "not_enabled" | "passed" | "failed" | "skipped";
  detectedIntent?: (typeof ELAH_BANKING_INTENTS)[number];
};

export type AuditLogLike = {
  id?: string;
  eventId?: string | null;
  userIdHash?: string | null;
  actorId?: string | null;
  source?: string | null;
  userAgent?: string | null;
  createdByAgent?: boolean | null;
  actionType: string;
  actionOutcome?: string | null;
  inputDataSummary?: string | Record<string, unknown> | null;
  amount?: number | null;
  sessionId?: string | null;
  actorType?: string | null;
  role?: string | null;
  customerTier?: string | null;
  page?: string | null;
  toolOrFeatureUsed?: string | null;
  timestamp?: Date | string | null;
  ipAddress?: string | null;
  userIntent?: string | null;
  conversationId?: string | null;
  messageId?: string | null;
  utterance?: string | null;
  policyDecision?: string | null;
  policyReasons?: string[] | string | null;
  detectedIntent?: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function parseSummary(
  raw: AuditLogLike["inputDataSummary"],
): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "object" && !Array.isArray(raw)) return { ...raw };
  if (typeof raw !== "string") return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return {};
  }
  return {};
}

function parseStringArray(raw: string[] | string | null | undefined): string[] {
  if (Array.isArray(raw)) return raw.filter((item) => typeof item === "string");
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
  } catch {
    return [];
  }
  return [];
}

function applySchemaSanitization(args: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args)) {
    if (FORBIDDEN_ARG_KEYS.has(key)) continue;
    if (typeof value === "string") {
      if (/recipient|merchant|name/i.test(key)) {
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

function argsFailSanitization(args: unknown): string[] {
  const obj = asRecord(args);
  const errors: string[] = [];
  if (!obj) {
    errors.push("action.args must be an object");
    return errors;
  }
  for (const [key, value] of Object.entries(obj)) {
    if (FORBIDDEN_ARG_KEYS.has(key)) {
      errors.push(`action.args contains forbidden key '${key}'`);
    }
    if (typeof value !== "string") continue;
    if (/recipient|merchant|name/i.test(key) && value !== "[recipient_redacted]") {
      errors.push(`action.args.${key} is not redacted`);
    }
    if (/\d{8,}/.test(value)) {
      errors.push(`action.args.${key} contains an unsanitized digit run`);
    }
    if (value.length > 400) {
      errors.push(`action.args.${key} exceeds 400 characters`);
    }
  }
  return errors;
}

function extraKeys(obj: Record<string, unknown>, allowed: Set<string>): string[] {
  return Object.keys(obj).filter((key) => !allowed.has(key));
}

function extractToolName(
  raw: string | null | undefined,
  source: ElahSource,
): ElahToolName | null {
  if (source !== "agent" || !raw) return null;
  if (TOOL_NAME_SET.has(raw)) return raw as ElahToolName;
  const last = raw.split(".").pop();
  if (last && TOOL_NAME_SET.has(last)) return last as ElahToolName;
  for (const name of ELAH_TOOL_NAMES) {
    if (raw.includes(name)) return name;
  }
  return null;
}

function resolveSource(row: AuditLogLike): ElahSource {
  if (row.source === "ui" || row.source === "agent" || row.source === "system") {
    return row.source;
  }
  return row.createdByAgent ? "agent" : "ui";
}

function resolveCanonicalAction(
  liveType: string,
  source: ElahSource,
  createdByAgent: boolean | null | undefined,
  toolName: ElahToolName | null,
): ElahActionType | null {
  if (DO_NOT_MAP.has(liveType) || isPageViewActionType(liveType)) return null;
  if (liveType === "transfer_submitted" || liveType === "transfer_blocked") {
    if (
      (createdByAgent || source === "agent") &&
      toolName === "create_internal_transfer"
    ) {
      return "internal_transfer";
    }
    return "external_transfer";
  }
  const mapped = ACTION_ALIAS_TO_CANONICAL[liveType];
  if (mapped) return mapped;
  if (toolName) {
    const fromTool = ACTION_ALIAS_TO_CANONICAL[toolName];
    if (fromTool) return fromTool;
  }
  return null;
}

function mapOutcome(
  actionType: ElahActionType,
  actionOutcome: string | null | undefined,
): ElahOutcome {
  if (actionType === "login" || actionType === "logout" || actionType === "password_reset") {
    return "session";
  }
  const live = (actionOutcome ?? "").toLowerCase();
  if (live === "blocked") return "blocked";
  if (live === "cancelled" || live === "canceled") return "cancelled";
  if (live === "failed" || live === "error") return "failed";
  if (
    live === "pending" ||
    live === "pending_confirmation" ||
    live === "needs_confirmation"
  ) {
    return "pending_confirmation";
  }
  if (live === "refused") return "refused";
  if (live === "conversational") return "conversational";
  if (live === "session") return "session";
  if (actionType === "login_failed") return "failed";
  if (actionType === "prompt_injection" && (live === "blocked" || live === "refused")) {
    return live === "blocked" ? "blocked" : "refused";
  }
  if (
    live === "posted" ||
    live === "succeeded" ||
    live === "submitted" ||
    live === "viewed" ||
    live === "downloaded" ||
    live === "success" ||
    live === "executed"
  ) {
    return "executed";
  }
  if (actionType === "prompt_injection") return "refused";
  return "executed";
}

function mapExecutionState(
  source: ElahSource,
  _actionType: ElahActionType,
  toolName: ElahToolName | null,
): ElahExecutionState {
  if (source === "agent" && toolName) return "pre_tool";
  return "no_tool";
}

function mapActorType(
  raw: string | null | undefined,
  actionType: ElahActionType,
): ElahActorType {
  if (raw && ACTOR_TYPES.has(raw)) return raw as ElahActorType;
  if (actionType === "login_failed") return "anonymous";
  return "customer";
}

function mapTier(
  raw: string | null | undefined,
): ElahEvent["actor"]["customerTier"] | undefined {
  if (raw == null || raw === "") return undefined;
  if (TIERS.has(raw)) return raw as NonNullable<ElahEvent["actor"]["customerTier"]>;
  return "not_applicable";
}

function capUtterance(text: string | null | undefined): string | null {
  if (!text) return null;
  return text.length > UTTERANCE_CAP ? text.slice(0, UTTERANCE_CAP) : text;
}

function occurredAtFrom(row: AuditLogLike, summary: Record<string, unknown>): string {
  const nested = asRecord(summary.elah);
  if (nested && typeof nested.occurredAt === "string" && ISO_UTC_RE.test(nested.occurredAt)) {
    return nested.occurredAt;
  }
  if (row.timestamp instanceof Date) return toIsoUtc(row.timestamp);
  if (typeof row.timestamp === "string" && row.timestamp) {
    const parsed = new Date(row.timestamp);
    if (!Number.isNaN(parsed.getTime())) return toIsoUtc(parsed);
  }
  return toIsoUtc(new Date());
}

function finiteAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/,/g, ""));
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function profileUpdateArgs(args: Record<string, unknown>): Record<string, unknown> {
  if (Array.isArray(args.fields)) {
    return { fields: args.fields.filter((item) => typeof item === "string") };
  }
  if (Array.isArray(args.changedFields)) {
    return { fields: args.changedFields.filter((item) => typeof item === "string") };
  }
  return { fields: Object.keys(args) };
}

/**
 * Map one operational AuditLog row to ElahEvent 1.0.
 * Returns null for page-views, manager ops, and unknown live types.
 */
export function mapAuditLogToElahEvent(row: AuditLogLike): ElahEvent | null {
  const source = resolveSource(row);
  const toolName = extractToolName(row.toolOrFeatureUsed, source);
  const actionType = resolveCanonicalAction(
    row.actionType,
    source,
    row.createdByAgent,
    toolName,
  );
  if (!actionType) return null;

  const eventId = row.eventId || row.id;
  if (!eventId) return null;

  const summary = parseSummary(row.inputDataSummary);
  const nestedElah = asRecord(summary.elah);
  const { elah: _elah, ...rawArgs } = summary;
  void _elah;
  let args = applySchemaSanitization(sanitizeToolArgs(rawArgs));
  if (actionType === "profile_update") args = profileUpdateArgs(args);

  const amount = finiteAmount(row.amount) ?? finiteAmount(args.amount);
  const hint = [row.page, toolName, row.toolOrFeatureUsed].filter(Boolean).join(" ");
  const amountBucketRaw =
    nestedElah && typeof nestedElah.amountBucket === "string"
      ? nestedElah.amountBucket
      : detectAmountBucket(hint, { ...args, ...(amount != null ? { amount } : {}) });
  const accountContextRaw =
    nestedElah && typeof nestedElah.accountContext === "string"
      ? nestedElah.accountContext
      : detectAccountContext(hint, args);
  const recipientTypeRaw =
    nestedElah && typeof nestedElah.recipientType === "string"
      ? nestedElah.recipientType
      : detectRecipientType(hint, args);

  const outcome = mapOutcome(actionType, row.actionOutcome);
  const executionState = mapExecutionState(source, actionType, toolName);
  const userIdHash = row.userIdHash || (row.actorId ? hashUserId(row.actorId) : null);

  const event: ElahEvent = {
    schemaVersion: ELAH_EVENT_SCHEMA_VERSION,
    eventId,
    occurredAt: occurredAtFrom(row, summary),
    appId: ELAH_APP_ID,
    source,
    actionType,
    outcome,
    executionState,
    actor: {
      sessionId: row.sessionId ?? null,
      actorType: mapActorType(row.actorType, actionType),
    },
    action: {
      toolName,
      page: row.page ?? null,
      args,
      amount,
      currency: amount != null ? "ILS" : null,
      amountBucket: AMOUNT_BUCKETS.has(amountBucketRaw)
        ? (amountBucketRaw as ElahEvent["action"]["amountBucket"])
        : "none",
      accountContext: ACCOUNT_CONTEXTS.has(accountContextRaw)
        ? (accountContextRaw as ElahEvent["action"]["accountContext"])
        : "unspecified",
      recipientType: RECIPIENT_TYPES.has(recipientTypeRaw)
        ? (recipientTypeRaw as ElahEvent["action"]["recipientType"])
        : "none",
    },
  };

  if (userIdHash) event.actor.userIdHash = userIdHash;
  if (row.role) event.actor.role = row.role;
  const tier = mapTier(row.customerTier);
  if (tier !== undefined) event.actor.customerTier = tier;

  const ipAddress = row.ipAddress ?? null;
  const userAgent = truncateUserAgent(row.userAgent);
  if (ipAddress || userAgent) {
    event.client = {
      ipAddress,
      userAgent,
    };
  }

  const policyDecision =
    row.policyDecision && POLICY_DECISIONS.has(row.policyDecision)
      ? (row.policyDecision as NonNullable<ElahEvent["policy"]>["decision"])
      : null;
  if (source === "agent" && (toolName || actionType === "prompt_injection")) {
    const decision =
      policyDecision ??
      (outcome === "blocked" || outcome === "refused"
        ? "deny"
        : outcome === "pending_confirmation"
          ? "needs_confirmation"
          : "allow");
    event.policy = {
      decision,
      reasons: parseStringArray(row.policyReasons),
      confirmationRequired: toolName ? CONFIRMATION_REQUIRED.has(toolName) : false,
    };
  }

  if (source === "agent" && row.conversationId && row.messageId) {
    event.conversation = {
      conversationId: row.conversationId,
      messageId: row.messageId,
      utterance: capUtterance(row.utterance),
    };
  }

  const intentHint = row.detectedIntent ?? row.userIntent;
  if (intentHint && INTENT_SET.has(intentHint)) {
    event.detectedIntent = intentHint as ElahEvent["detectedIntent"];
  }

  return event;
}

/**
 * Strict ElahEvent 1.0 validator (schema §§4–6 plus JSON Schema §9).
 * Accepts samples 8.1–8.5 and rejects 8.6–8.9.
 */
export function validateElahEvent(event: unknown): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const obj = asRecord(event);
  if (!obj) return { ok: false, errors: ["event must be an object"] };

  for (const key of extraKeys(obj, ALLOWED_TOP_LEVEL)) {
    errors.push(`unknown top-level property '${key}'`);
  }

  const schemaVersion = obj.schemaVersion;
  if (schemaVersion == null || schemaVersion === "") {
    errors.push("missing schemaVersion");
  } else if (typeof schemaVersion !== "string") {
    errors.push("schemaVersion must be a string");
  } else {
    const major = schemaVersion.split(".")[0];
    if (major !== "1") errors.push(`unknown major version '${schemaVersion}'`);
    if (schemaVersion !== ELAH_EVENT_SCHEMA_VERSION) {
      errors.push(`schemaVersion must be ${ELAH_EVENT_SCHEMA_VERSION}`);
    }
  }

  if (typeof obj.eventId !== "string" || obj.eventId.length < 8) {
    errors.push("eventId must be a string of at least 8 characters");
  }
  if (typeof obj.occurredAt !== "string" || !ISO_UTC_RE.test(obj.occurredAt)) {
    errors.push("occurredAt must be ISO-8601 UTC");
  }
  if (typeof obj.appId !== "string" || !obj.appId) {
    errors.push("appId is required");
  }

  if (obj.source == null || obj.source === "") {
    errors.push("missing source");
  } else if (typeof obj.source !== "string" || !SOURCES.has(obj.source)) {
    errors.push("source must be ui | agent | system");
  }

  const actionType = obj.actionType;
  if (typeof actionType !== "string" || !actionType) {
    errors.push("actionType is required");
  } else if (!ACTION_TYPE_SET.has(actionType)) {
    errors.push(`unknown actionType '${actionType}'`);
    if (PAGE_VIEW_ACTION_RE.test(actionType) || actionType.endsWith("_view")) {
      errors.push("page views are not ElahEvents");
    }
  }

  if (typeof obj.outcome !== "string" || !OUTCOMES.has(obj.outcome)) {
    errors.push("outcome is invalid");
  }
  if (
    typeof obj.executionState !== "string" ||
    !EXECUTION_STATES.has(obj.executionState)
  ) {
    errors.push("executionState is invalid");
  }

  const actor = asRecord(obj.actor);
  if (!actor) {
    errors.push("actor is required");
  } else {
    for (const key of extraKeys(actor, ACTOR_KEYS)) {
      errors.push(`unknown actor property '${key}'`);
    }
    if (typeof actor.actorType !== "string" || !ACTOR_TYPES.has(actor.actorType)) {
      errors.push("actor.actorType is invalid");
    }
    const hash = actor.userIdHash;
    const needsHash = actionType !== "login_failed";
    if (needsHash && (typeof hash !== "string" || hash.length < 16)) {
      errors.push("actor.userIdHash is required");
    } else if (typeof hash === "string" && hash.length < 16) {
      errors.push("actor.userIdHash is too short");
    }
    const sessionId = actor.sessionId;
    if (sessionId != null && typeof sessionId !== "string") {
      errors.push("actor.sessionId must be a string or null");
    }
    if (
      actionType !== "login_failed" &&
      (sessionId == null || (typeof sessionId === "string" && sessionId.length === 0))
    ) {
      errors.push("actor.sessionId is required");
    }
    if (actor.role != null && typeof actor.role !== "string") {
      errors.push("actor.role must be a string or null");
    }
    if (
      actor.customerTier != null &&
      typeof actor.customerTier === "string" &&
      !TIERS.has(actor.customerTier)
    ) {
      errors.push("actor.customerTier is invalid");
    }
  }

  if (obj.client !== undefined) {
    const client = asRecord(obj.client);
    if (!client) {
      errors.push("client must be an object");
    } else {
      for (const key of extraKeys(client, CLIENT_KEYS)) {
        errors.push(`unknown client property '${key}'`);
      }
      if (
        client.userAgent != null &&
        typeof client.userAgent === "string" &&
        client.userAgent.length > 400
      ) {
        errors.push("client.userAgent exceeds 400 characters");
      }
    }
  }

  const action = asRecord(obj.action);
  if (!action) {
    errors.push("action is required");
  } else {
    for (const key of extraKeys(action, ACTION_KEYS)) {
      errors.push(`unknown action property '${key}'`);
    }
    const toolName = action.toolName;
    if (toolName != null && (typeof toolName !== "string" || !TOOL_NAME_SET.has(toolName))) {
      errors.push("action.toolName is not on the allow-list");
    }
    if (obj.source === "ui" && toolName != null) {
      errors.push("action.toolName must be null when source is ui");
    }
    if (!asRecord(action.args)) {
      errors.push("action.args must be an object");
    } else {
      errors.push(...argsFailSanitization(action.args));
    }
    if (action.amount != null) {
      if (typeof action.amount !== "number" || !Number.isFinite(action.amount) || action.amount <= 0) {
        errors.push("action.amount must be a finite number > 0");
      }
      if (action.currency !== "ILS") {
        errors.push("action.currency is required when amount is set");
      }
    }
    if (typeof action.amountBucket !== "string" || !AMOUNT_BUCKETS.has(action.amountBucket)) {
      errors.push("action.amountBucket is invalid");
    }
    if (
      typeof action.accountContext !== "string" ||
      !ACCOUNT_CONTEXTS.has(action.accountContext)
    ) {
      errors.push("action.accountContext is invalid");
    }
    if (
      typeof action.recipientType !== "string" ||
      !RECIPIENT_TYPES.has(action.recipientType)
    ) {
      errors.push("action.recipientType is invalid");
    }
  }

  if (obj.policy !== undefined) {
    const policy = asRecord(obj.policy);
    if (!policy) {
      errors.push("policy must be an object");
    } else {
      for (const key of extraKeys(policy, POLICY_KEYS)) {
        errors.push(`unknown policy property '${key}'`);
      }
      if (typeof policy.decision !== "string" || !POLICY_DECISIONS.has(policy.decision)) {
        errors.push("policy.decision is invalid");
      }
      if (!Array.isArray(policy.reasons)) {
        errors.push("policy.reasons must be an array");
      } else if (policy.reasons.some((item) => typeof item !== "string")) {
        errors.push("policy.reasons must be string[]");
      }
      if (typeof policy.confirmationRequired !== "boolean") {
        errors.push("policy.confirmationRequired must be boolean");
      }
    }
  }

  const toolName = action ? action.toolName : undefined;
  if (obj.source === "agent" && typeof toolName === "string" && !obj.policy) {
    errors.push("policy is required for agent tool events");
  }

  if (obj.source === "agent") {
    const conversation = asRecord(obj.conversation);
    if (!conversation) {
      errors.push("conversation is required when source is agent");
    } else {
      for (const key of extraKeys(conversation, CONVERSATION_KEYS)) {
        errors.push(`unknown conversation property '${key}'`);
      }
      if (typeof conversation.conversationId !== "string" || !conversation.conversationId) {
        errors.push("conversation.conversationId is required");
      }
      if (typeof conversation.messageId !== "string" || !conversation.messageId) {
        errors.push("conversation.messageId is required");
      }
      if (
        conversation.utterance != null &&
        typeof conversation.utterance === "string" &&
        conversation.utterance.length > UTTERANCE_CAP
      ) {
        errors.push("conversation.utterance exceeds 2000 characters");
      }
    }
  } else if (obj.conversation != null) {
    errors.push("conversation must be omitted when source is not agent");
  }

  if (obj.mfaStatus != null && (typeof obj.mfaStatus !== "string" || !MFA_STATUSES.has(obj.mfaStatus))) {
    errors.push("mfaStatus is invalid");
  }
  if (
    obj.detectedIntent != null &&
    (typeof obj.detectedIntent !== "string" || !INTENT_SET.has(obj.detectedIntent))
  ) {
    errors.push("detectedIntent is not a valid ElahBankingIntent");
  }

  return { ok: errors.length === 0, errors };
}

type AgentEnrichment = {
  conversationId?: string | null;
  messageId?: string | null;
  utterance?: string | null;
  policyDecision?: string | null;
  policyReasons?: string[] | null;
  detectedIntent?: string | null;
};

function enrichFromAgentLogs(
  eventId: string | null | undefined,
  byEventId: Map<string, AgentEnrichment>,
): AgentEnrichment {
  if (!eventId) return {};
  return byEventId.get(eventId) ?? {};
}

export async function listIngestibleEvents(filters: {
  userIdHash?: string;
  sessionId?: string;
  actionType?: string;
  toolName?: string;
  outcome?: string;
  source?: "ui" | "agent" | "system";
  quality?: "ok" | "fail";
  eventId?: string;
  take?: number;
}): Promise<Array<{ event: ElahEvent; quality: QualityResult; auditLogId: string }>> {
  const take = filters.take ?? 100;
  if (take <= 0) return [];
  const dbTake = Math.min(1000, Math.max(take * 10, take));

  const rows = await prisma.auditLog.findMany({
    where: {
      ...(filters.userIdHash ? { userIdHash: filters.userIdHash } : {}),
      ...(filters.sessionId ? { sessionId: filters.sessionId } : {}),
      ...(filters.source ? { source: filters.source } : {}),
      ...(filters.eventId ? { eventId: filters.eventId } : {}),
    },
    orderBy: { timestamp: "desc" },
    take: dbTake,
  });

  const eventIds = [
    ...new Set(rows.map((row) => row.eventId).filter((id): id is string => !!id)),
  ];
  const agentRows =
    eventIds.length === 0
      ? []
      : await prisma.agentEventLog.findMany({
          where: { eventId: { in: eventIds } },
          orderBy: { timestamp: "asc" },
        });

  const enrichment = new Map<string, AgentEnrichment>();
  for (const agent of agentRows) {
    if (!agent.eventId) continue;
    const current = enrichment.get(agent.eventId) ?? {};
    if (agent.conversationId && agent.messageId) {
      current.conversationId = current.conversationId ?? agent.conversationId;
      current.messageId = current.messageId ?? agent.messageId;
    }
    if (agent.userMessage) {
      current.utterance = current.utterance ?? capUtterance(agent.userMessage);
    }
    if (agent.policyDecision) {
      current.policyDecision = current.policyDecision ?? agent.policyDecision;
      current.policyReasons =
        current.policyReasons ?? parseStringArray(agent.policyReasons);
    }
    if (agent.detectedIntent) {
      current.detectedIntent = current.detectedIntent ?? agent.detectedIntent;
    }
    enrichment.set(agent.eventId, current);
  }

  const mapped: Array<{ event: ElahEvent; auditLogId: string }> = [];
  for (const row of rows) {
    const extra = enrichFromAgentLogs(row.eventId, enrichment);
    const event = mapAuditLogToElahEvent({
      ...row,
      ...extra,
    });
    if (!event) continue;
    mapped.push({ event, auditLogId: row.id });
  }

  const duplicateIds = findDuplicateEventIds(mapped.map((item) => item.event));
  const keepAuditLogId = new Map<string, string>();
  for (const id of duplicateIds) {
    const group = mapped.filter((item) => item.event.eventId === id);
    group.sort(
      (a, b) =>
        a.event.occurredAt.localeCompare(b.event.occurredAt) ||
        a.auditLogId.localeCompare(b.auditLogId),
    );
    keepAuditLogId.set(id, group[0]!.auditLogId);
  }

  const results: Array<{ event: ElahEvent; quality: QualityResult; auditLogId: string }> =
    [];
  for (const item of mapped) {
    const quality = checkElahEvent(item.event);
    const keepId = keepAuditLogId.get(item.event.eventId);
    if (keepId && item.auditLogId !== keepId) {
      if (!quality.ruleIds.includes("duplicate_event_id")) {
        quality.ruleIds.push("duplicate_event_id");
      }
      quality.ok = false;
    }

    if (filters.actionType && item.event.actionType !== filters.actionType) continue;
    if (filters.toolName && item.event.action.toolName !== filters.toolName) continue;
    if (filters.outcome && item.event.outcome !== filters.outcome) continue;
    if (filters.source && item.event.source !== filters.source) continue;
    if (filters.quality === "ok" && !quality.ok) continue;
    if (filters.quality === "fail" && quality.ok) continue;
    if (filters.userIdHash && item.event.actor.userIdHash !== filters.userIdHash) {
      continue;
    }
    if (filters.sessionId && item.event.actor.sessionId !== filters.sessionId) {
      continue;
    }
    if (filters.eventId && item.event.eventId !== filters.eventId) continue;

    results.push({ event: item.event, quality, auditLogId: item.auditLogId });
    if (results.length >= take) break;
  }

  return results;
}

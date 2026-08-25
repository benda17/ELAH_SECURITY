import type { ElahEvent } from "./envelope";

export type QualityResult = {
  ok: boolean;
  eventId: string;
  ruleIds: string[];
};

const ACTION_TYPES = new Set([
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
]);

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

const PAGE_VIEW_ACTION_RE = /_(view|viewed|opened|searched)$/;

const DIGIT_RUN_RE = /\d{8,}/;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function argsAreUnsanitized(args: unknown): boolean {
  const obj = asRecord(args);
  if (!obj) return false;
  for (const [key, value] of Object.entries(obj)) {
    if (FORBIDDEN_ARG_KEYS.has(key)) return true;
    if (typeof value !== "string") continue;
    if (/recipient|merchant|name/i.test(key) && value !== "[recipient_redacted]") {
      return true;
    }
    if (DIGIT_RUN_RE.test(value) && !value.includes("[redacted_account_number]")) {
      return true;
    }
    if (value.length > 400) return true;
  }
  return false;
}

/**
 * Data-quality rules for an already-shaped envelope.
 * `duplicate_event_id` is applied to batches in `findDuplicateEventIds` /
 * `listIngestibleEvents`, not to a single event.
 */
export function checkElahEvent(event: ElahEvent): QualityResult {
  const raw = asRecord(event) ?? {};
  const ruleIds: string[] = [];
  const eventId = typeof raw.eventId === "string" ? raw.eventId : "";

  if (raw.schemaVersion == null || raw.schemaVersion === "") {
    ruleIds.push("missing_schema_version");
  } else if (typeof raw.schemaVersion === "string") {
    const major = raw.schemaVersion.split(".")[0];
    if (major !== "1") ruleIds.push("unknown_major_version");
  } else {
    ruleIds.push("unknown_major_version");
  }

  for (const key of Object.keys(raw)) {
    if (!ALLOWED_TOP_LEVEL.has(key)) {
      ruleIds.push("extra_top_level_property");
      break;
    }
  }

  if (raw.source == null || raw.source === "") {
    ruleIds.push("missing_source");
  }

  const actor = asRecord(raw.actor) ?? {};
  const actionType = typeof raw.actionType === "string" ? raw.actionType : "";
  const userIdHash = actor.userIdHash;
  const hasHash = typeof userIdHash === "string" && userIdHash.length > 0;
  if (!hasHash && actionType !== "login_failed") {
    ruleIds.push("missing_user_id_hash");
  }

  const sessionId = actor.sessionId;
  const hasSession = typeof sessionId === "string" && sessionId.length > 0;
  if (!hasSession && actionType !== "login_failed") {
    ruleIds.push("missing_session_id");
  }

  if (raw.source === "agent") {
    const conversation = asRecord(raw.conversation);
    const conversationId =
      conversation && typeof conversation.conversationId === "string"
        ? conversation.conversationId
        : "";
    const messageId =
      conversation && typeof conversation.messageId === "string"
        ? conversation.messageId
        : "";
    if (!conversation || !conversationId || !messageId) {
      ruleIds.push("missing_conversation");
    }
  }

  if (actionType && !ACTION_TYPES.has(actionType)) {
    ruleIds.push("unknown_action_type");
  }
  if (
    actionType &&
    (PAGE_VIEW_ACTION_RE.test(actionType) || actionType.endsWith("_view"))
  ) {
    ruleIds.push("page_view_not_event");
  }

  const action = asRecord(raw.action) ?? {};
  if (argsAreUnsanitized(action.args)) {
    ruleIds.push("unsanitized_args");
  }

  if (raw.source === "agent" && action.toolName != null && action.toolName !== "") {
    const policy = asRecord(raw.policy);
    if (!policy) ruleIds.push("missing_policy_agent");
  }

  return { ok: ruleIds.length === 0, eventId, ruleIds };
}

/** Event ids that appear more than once among ingestible envelopes. */
export function findDuplicateEventIds(events: ElahEvent[]): Set<string> {
  const counts = new Map<string, number>();
  for (const event of events) {
    const id = event?.eventId;
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const dupes = new Set<string>();
  for (const [id, n] of counts) {
    if (n > 1) dupes.add(id);
  }
  return dupes;
}

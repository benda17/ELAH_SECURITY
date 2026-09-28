/**
 * Phase 4 log conversion / cleaning — pure functions.
 *
 * No prisma, no server-only, no POST /v1/score.
 * Importable from tests without next/server.
 *
 * Envelope mapping stays in lib/elah/envelope.ts (Phase 2). This module
 * only dedupes, lints, checks completeness/order, and reports drop reasons.
 */

export const DATASET_SCHEMA_VERSION = "1.0";
export const FROM_SIMULATOR_DATASET_VERSION = "from-simulator";
export const SIMULATOR_EXPORT_PACK = "simulator_export";
export const NORMALIZE_GENERATOR_VERSION = "normalize_v1";
export const TAXONOMY_VERSION = "1.0";
export const UTTERANCE_CAP = 2000;

export type DropReason =
  | "dropped_quality"
  | "dropped_duplicate"
  | "dropped_incomplete"
  | "dropped_timestamp"
  | "dropped_pii"
  | "dropped_lifecycle";

export const DROP_REASONS: readonly DropReason[] = [
  "dropped_quality",
  "dropped_duplicate",
  "dropped_incomplete",
  "dropped_timestamp",
  "dropped_pii",
  "dropped_lifecycle",
] as const;

/** AgentEventLog hop types that are not ElahEvent scoring units. */
export const LIFECYCLE_HOP_TYPES = new Set<string>([
  "user_message_received",
  "agent_message_created",
  "agent_intent_classified",
  "tool_call_requested",
  "policy_check_passed",
  "policy_check_failed",
  "confirmation_required",
  "action_confirmed",
  "action_cancelled",
  "tool_call_executed",
  "tool_call_failed",
  "suspicious_prompt_detected",
  "unauthorized_access_attempt",
  "agent_error",
  "elah_scored",
  "elah_scoring_unavailable",
]);

const ISO_UTC_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

const FORBIDDEN_PII_KEYS = new Set([
  "userId",
  "accountId",
  "cardId",
  "password",
  "token",
  "fromAccountId",
  "toAccountId",
]);

const DIGIT_RUN_RE = /\d{8,}/;
const HASH_RE = /^[a-fA-F0-9]{16,}$/;

/** Keys whose values are ids/hashes — do not treat hex digit runs as PANs. */
const SKIP_DIGIT_RUN_KEYS = new Set([
  "userIdHash",
  "eventId",
  "sessionId",
  "conversationId",
  "messageId",
  "scenarioId",
  "sequenceId",
  "twinGroupId",
  "requestId",
  "annotatorId",
  "id",
]);

const GOLD_SPLITS = new Set(["train", "val", "holdout"]);

export type NormalizeCounts = {
  scanned: number;
  kept: number;
  dropped_quality: number;
  dropped_duplicate: number;
  dropped_incomplete: number;
  dropped_timestamp: number;
  dropped_pii: number;
  dropped_lifecycle: number;
  byActionType?: Record<string, number>;
  bySource?: Record<string, number>;
  out?: string;
};

export type SequenceRow = {
  sequenceId?: string | null;
  stepIndex?: number | null;
  occurredAt: string;
};

export type CompletenessGoldRow = {
  labels?: { intentLabel?: string };
  provenance?: unknown;
  event?: { eventId?: string; actionType?: string; source?: string };
  split?: string | null;
  datasetVersion?: string;
};

export type UnlabeledSimulatorRecord = {
  schemaVersion: typeof DATASET_SCHEMA_VERSION;
  datasetVersion: typeof FROM_SIMULATOR_DATASET_VERSION;
  pack: typeof SIMULATOR_EXPORT_PACK;
  scenarioId: string;
  event: unknown;
  labels: null;
  provenance: {
    source: "simulator_export";
    generatorVersion: typeof NORMALIZE_GENERATOR_VERSION;
    taxonomyVersion: typeof TAXONOMY_VERSION;
    annotatorId: "unlabeled";
    createdAt: string;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emptyCounts(): NormalizeCounts {
  return {
    scanned: 0,
    kept: 0,
    dropped_quality: 0,
    dropped_duplicate: 0,
    dropped_incomplete: 0,
    dropped_timestamp: 0,
    dropped_pii: 0,
    dropped_lifecycle: 0,
    byActionType: {},
    bySource: {},
  };
}

/** Ids (eventId or scenarioId) that appear more than once. */
export function findDuplicateKeys(ids: string[]): Set<string> {
  const counts = new Map<string, number>();
  for (const id of ids) {
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const dupes = new Set<string>();
  for (const [id, n] of counts) {
    if (n > 1) dupes.add(id);
  }
  return dupes;
}

/** True for schema-style ISO-8601 UTC (`YYYY-MM-DDTHH:mm:ss(.sss)?Z`). */
export function assertIsoTimestamp(value: string): boolean {
  if (typeof value !== "string" || !ISO_UTC_RE.test(value)) return false;
  const ms = Date.parse(value);
  return Number.isFinite(ms);
}

function occurredAtMs(value: string): number {
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : Number.NaN;
}

/**
 * Within each sequenceId, stepIndex must be unique and occurredAt
 * must be non-decreasing as stepIndex increases.
 * Rows without sequenceId are ignored.
 */
export function assertSequenceOrder(rows: SequenceRow[]): {
  ok: boolean;
  badSequenceIds: string[];
} {
  const groups = new Map<string, SequenceRow[]>();
  for (const row of rows) {
    if (!row.sequenceId) continue;
    const list = groups.get(row.sequenceId) ?? [];
    list.push(row);
    groups.set(row.sequenceId, list);
  }

  const bad: string[] = [];
  for (const [sequenceId, group] of groups) {
    let failed = false;
    for (const row of group) {
      if (!assertIsoTimestamp(row.occurredAt)) {
        failed = true;
        break;
      }
      if (row.stepIndex == null || !Number.isFinite(row.stepIndex)) {
        failed = true;
        break;
      }
    }
    if (failed) {
      bad.push(sequenceId);
      continue;
    }

    const indexes = group.map((row) => row.stepIndex as number);
    if (new Set(indexes).size !== indexes.length) {
      bad.push(sequenceId);
      continue;
    }

    const ordered = [...group].sort(
      (a, b) => (a.stepIndex as number) - (b.stepIndex as number),
    );
    for (let i = 1; i < ordered.length; i++) {
      const prev = occurredAtMs(ordered[i - 1]!.occurredAt);
      const curr = occurredAtMs(ordered[i]!.occurredAt);
      if (!(curr >= prev)) {
        bad.push(sequenceId);
        break;
      }
    }
  }

  return { ok: bad.length === 0, badSequenceIds: [...new Set(bad)] };
}

/**
 * Gold-row completeness. Unlabeled simulator exports (`labels: null`) MUST NOT
 * be passed here — they are a separate file, not train/val/holdout gold.
 */
export function completenessGold(
  row: CompletenessGoldRow,
  allowedIntents: readonly string[],
): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const allowed = new Set(allowedIntents);

  const intent = row.labels?.intentLabel;
  if (typeof intent !== "string" || intent.length === 0) {
    reasons.push("missing_intent_label");
  } else if (!allowed.has(intent)) {
    reasons.push("unknown_intent_label");
  }

  if (!isRecord(row.provenance)) {
    reasons.push("missing_provenance");
  }

  const event = row.event;
  if (!event || typeof event.eventId !== "string" || event.eventId.length === 0) {
    reasons.push("missing_event_id");
  }
  if (!event || typeof event.actionType !== "string" || event.actionType.length === 0) {
    reasons.push("missing_action_type");
  }
  if (!event || typeof event.source !== "string" || event.source.length === 0) {
    reasons.push("missing_source");
  }

  if (
    Object.prototype.hasOwnProperty.call(row, "split") &&
    (typeof row.split !== "string" || !GOLD_SPLITS.has(row.split))
  ) {
    reasons.push("missing_split");
  }

  if (
    Object.prototype.hasOwnProperty.call(row, "datasetVersion") &&
    (typeof row.datasetVersion !== "string" || row.datasetVersion.length === 0)
  ) {
    reasons.push("missing_dataset_version");
  }

  return { ok: reasons.length === 0, reasons };
}

function pathString(path: string[]): string {
  return path.length ? path.join(".") : "(root)";
}

function emailMatches(value: string): string[] {
  return value.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) ?? [];
}

function isElahDemoEmail(email: string): boolean {
  return email.toLowerCase().endsWith("@elah.demo");
}

function isUtterancePath(path: string[]): boolean {
  return path[path.length - 1] === "utterance";
}

function isArgsPath(path: string[]): boolean {
  return path.includes("args");
}

function isAnnotatorIdPath(path: string[]): boolean {
  return path[path.length - 1] === "annotatorId" && path.includes("provenance");
}

function walkPii(value: unknown, path: string[], findings: string[]): void {
  if (typeof value === "string") {
    const key = path[path.length - 1] ?? "";
    if (!SKIP_DIGIT_RUN_KEYS.has(key) && DIGIT_RUN_RE.test(value)) {
      findings.push(`digit_run at ${pathString(path)}`);
    }

    const emails = emailMatches(value);
    if (emails.length === 0) return;

    if (isAnnotatorIdPath(path)) {
      if (!HASH_RE.test(value)) {
        findings.push(`unhashed_email_annotatorId at ${pathString(path)}`);
      }
      return;
    }

    if (isArgsPath(path)) {
      for (const _email of emails) {
        findings.push(`email_in_args at ${pathString(path)}`);
      }
      return;
    }

    if (isUtterancePath(path)) {
      for (const email of emails) {
        if (!isElahDemoEmail(email)) {
          findings.push(`email_in_utterance at ${pathString(path)}`);
        }
      }
      return;
    }

    for (const _email of emails) {
      findings.push(`email at ${pathString(path)}`);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => walkPii(item, [...path, String(index)], findings));
    return;
  }

  if (!isRecord(value)) return;

  for (const [key, child] of Object.entries(value)) {
    const next = [...path, key];
    if (FORBIDDEN_PII_KEYS.has(key)) {
      findings.push(`forbidden_key ${key} at ${pathString(next)}`);
    }
    walkPii(child, next, findings);
  }
}

/**
 * Fail-closed PII lint for dataset rows.
 *
 * Forbidden keys: userId, accountId, cardId, password, token, fromAccountId, toAccountId.
 * Digit runs of 8+ fail (PAN / account-number shaped).
 * Emails fail everywhere except:
 *   - `conversation.utterance` (and other `utterance` fields) may contain `@elah.demo`
 *   - `provenance.annotatorId` may be a hex hash, never a raw email
 * Args reject emails even `@elah.demo`.
 */
export function piiLint(obj: unknown): string[] {
  const findings: string[] = [];
  walkPii(obj, [], findings);
  return findings;
}

export function isLifecycleActionType(actionType: string | undefined | null): boolean {
  return typeof actionType === "string" && LIFECYCLE_HOP_TYPES.has(actionType);
}

export function capUtterance(text: string | null | undefined, cap = UTTERANCE_CAP): string | null {
  if (text == null || text === "") return text ?? null;
  return text.length > cap ? text.slice(0, cap) : text;
}

export function toUnlabeledSimulatorRecord(
  event: { eventId: string; schemaVersion?: string },
  createdAt: string,
): UnlabeledSimulatorRecord {
  return {
    schemaVersion: DATASET_SCHEMA_VERSION,
    datasetVersion: FROM_SIMULATOR_DATASET_VERSION,
    pack: SIMULATOR_EXPORT_PACK,
    scenarioId: event.eventId,
    event,
    labels: null,
    provenance: {
      source: "simulator_export",
      generatorVersion: NORMALIZE_GENERATOR_VERSION,
      taxonomyVersion: TAXONOMY_VERSION,
      annotatorId: "unlabeled",
      createdAt,
    },
  };
}

export function emptyNormalizeCounts(): NormalizeCounts {
  return emptyCounts();
}

export function buildReport(counts: NormalizeCounts): string {
  const lines: string[] = [];
  lines.push(
    `normalize:elah-logs scanned=${counts.scanned} kept=${counts.kept}`,
  );
  lines.push(
    [
      `dropped_quality=${counts.dropped_quality}`,
      `dropped_duplicate=${counts.dropped_duplicate}`,
      `dropped_incomplete=${counts.dropped_incomplete}`,
      `dropped_timestamp=${counts.dropped_timestamp}`,
      `dropped_pii=${counts.dropped_pii}`,
      `dropped_lifecycle=${counts.dropped_lifecycle}`,
    ].join(" "),
  );
  if (counts.byActionType && Object.keys(counts.byActionType).length > 0) {
    const parts = Object.entries(counts.byActionType)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, n]) => `${k}=${n}`);
    lines.push(`byActionType ${parts.join(" ")}`);
  }
  if (counts.bySource && Object.keys(counts.bySource).length > 0) {
    const parts = Object.entries(counts.bySource)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, n]) => `${k}=${n}`);
    lines.push(`bySource ${parts.join(" ")}`);
  }
  if (counts.out) {
    lines.push(`out=${counts.out}`);
  }
  return `${lines.join("\n")}\n`;
}

/**
 * Phase 9 analyst constants. Client-safe (no server imports).
 *
 * Every analyst write is a NEW append-only AuditLog row whose `actionType`
 * starts with `elah_analyst_`. These rows are operational metadata about
 * ElahEvents; they are never ElahEvents themselves (see
 * `isAnalystActionType` + `lib/elah/envelope.ts`).
 */

export const ELAH_ANALYST_ACTION_PREFIX = "elah_analyst_";

/** AuditLog.actionType values written by the analyst data layer. */
export const ELAH_ANALYST_ACTION_TYPES = {
  NOTE_ADDED: "elah_analyst_note_added",
  REVIEW_STATUS_SET: "elah_analyst_review_status_set",
  OUTCOME_MARKED: "elah_analyst_outcome_marked",
  FEEDBACK_SUBMITTED: "elah_analyst_feedback_submitted",
  VIEW_SAVED: "elah_analyst_view_saved",
  VIEW_DELETED: "elah_analyst_view_deleted",
  THRESHOLDS_SET: "elah_analyst_thresholds_set",
  EXPORT_CREATED: "elah_analyst_export_created",
} as const;

export type ElahAnalystActionType =
  (typeof ELAH_ANALYST_ACTION_TYPES)[keyof typeof ELAH_ANALYST_ACTION_TYPES];

/** Value written to AuditLog.toolOrFeatureUsed on every analyst row. */
export const ELAH_ANALYST_FEATURE = "elah_analyst";

/** True for any `elah_analyst_*` actionType (never an ingestible ElahEvent). */
export function isAnalystActionType(actionType: string | null | undefined): boolean {
  return typeof actionType === "string" && actionType.startsWith(ELAH_ANALYST_ACTION_PREFIX);
}

export const REVIEW_STATUSES = ["unreviewed", "in_review", "reviewed", "escalated"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const OUTCOME_MARKS = ["confirmed_correct", "false_positive", "false_negative"] as const;
export type OutcomeMark = (typeof OUTCOME_MARKS)[number];

/** Max characters for any analyst free text (notes, feedback, reasons). */
export const ANALYST_TEXT_MAX = 2000;
/** Max characters for a saved view name. */
export const ANALYST_VIEW_NAME_MAX = 80;

/** Generic result for validated analyst writes. */
export type AnalystResult<T> = { ok: true; value: T } | { ok: false; error: string };

/** Reviewer identity recorded on analyst rows (internal staff, not customers). */
export interface AnalystActor {
  id: string;
  name: string | null;
  role: string;
}

/** Actor as read back from an AuditLog row (fields may be missing on old rows). */
export interface AnalystActorRef {
  id: string | null;
  name: string | null;
  role: string | null;
}

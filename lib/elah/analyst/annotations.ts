import "server-only";
import { prisma } from "@/lib/db";
import { ELAH_BANKING_INTENTS, type ElahBankingIntent } from "@/lib/elah/types";
import {
  ELAH_ANALYST_ACTION_TYPES,
  OUTCOME_MARKS,
  REVIEW_STATUSES,
  type AnalystActor,
  type AnalystActorRef,
  type AnalystResult,
  type OutcomeMark,
  type ReviewStatus,
} from "./constants";
import {
  ANALYST_ROW_SELECT,
  actorRefOf,
  eventExists,
  parsePayload,
  writeAnalystRow,
  type AnalystAuditRow,
} from "./store";
import { emptyReviewState, type EventReviewState } from "./types";
import {
  parseFeedbackInput,
  parseNoteInput,
  parseOutcomeMarkInput,
  parseReviewStatusInput,
  type FeedbackInput,
  type NoteInput,
  type OutcomeMarkInput,
  type ReviewStatusInput,
} from "./validation";

/**
 * Analyst annotations on ElahEvents: notes, review status, outcome marks,
 * structured feedback. Append-only AuditLog rows keyed by `eventId`; reads fold
 * rows oldest → newest (latest wins for status / mark). Callers must enforce
 * RBAC (`requireAnalystPermission("analyst:annotate")`) before writing.
 */

export interface AnalystNote {
  id: string;
  eventId: string;
  text: string;
  createdAt: string;
  actor: AnalystActorRef;
}

export interface ReviewStatusEntry {
  status: ReviewStatus;
  /** null when the event was never reviewed (default `unreviewed`). */
  updatedAt: string | null;
  actor: AnalystActorRef | null;
}

export interface OutcomeMarkEntry {
  /** null = a previous mark was cleared. */
  mark: OutcomeMark | null;
  reason: string | null;
  updatedAt: string;
  actor: AnalystActorRef;
}

export interface AnalystFeedback {
  id: string;
  eventId: string;
  rating: number;
  text: string | null;
  suggestedIntentLabel: ElahBankingIntent | null;
  createdAt: string;
  actor: AnalystActorRef;
}

export interface EventAnnotations {
  eventId: string;
  /** Oldest first. */
  notes: AnalystNote[];
  reviewStatus: ReviewStatusEntry;
  /** null when never marked. */
  outcomeMark: OutcomeMarkEntry | null;
  /** Oldest first. */
  feedback: AnalystFeedback[];
}

const ANNOTATION_ACTION_TYPES = [
  ELAH_ANALYST_ACTION_TYPES.NOTE_ADDED,
  ELAH_ANALYST_ACTION_TYPES.REVIEW_STATUS_SET,
  ELAH_ANALYST_ACTION_TYPES.OUTCOME_MARKED,
  ELAH_ANALYST_ACTION_TYPES.FEEDBACK_SUBMITTED,
];

const REVIEW_STATUS_SET = new Set<string>(REVIEW_STATUSES);
const OUTCOME_MARK_SET = new Set<string>(OUTCOME_MARKS);
const INTENT_SET = new Set<string>(ELAH_BANKING_INTENTS);

function str(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

async function requireEvent(eventId: string): Promise<AnalystResult<true>> {
  if (!(await eventExists(eventId))) {
    return { ok: false, error: "No ElahEvent with this eventId." };
  }
  return { ok: true, value: true };
}

/** Append a note (sanitized, <= 2000 chars, PII redacted). */
export async function addAnalystNote(
  actor: AnalystActor,
  input: NoteInput,
): Promise<AnalystResult<AnalystNote>> {
  const parsed = parseNoteInput(input);
  if (!parsed.ok) return parsed;
  const exists = await requireEvent(parsed.value.eventId);
  if (!exists.ok) return exists;
  const row = await writeAnalystRow({
    actionType: ELAH_ANALYST_ACTION_TYPES.NOTE_ADDED,
    actor,
    eventId: parsed.value.eventId,
    page: `/admin/elah-events/${parsed.value.eventId}`,
    payload: { text: parsed.value.text },
  });
  return {
    ok: true,
    value: {
      id: row.id,
      eventId: parsed.value.eventId,
      text: parsed.value.text,
      createdAt: row.timestamp.toISOString(),
      actor: actorRefOf(row),
    },
  };
}

/** Set review status (latest wins). */
export async function setReviewStatus(
  actor: AnalystActor,
  input: ReviewStatusInput,
): Promise<AnalystResult<ReviewStatusEntry>> {
  const parsed = parseReviewStatusInput(input);
  if (!parsed.ok) return parsed;
  const exists = await requireEvent(parsed.value.eventId);
  if (!exists.ok) return exists;
  const row = await writeAnalystRow({
    actionType: ELAH_ANALYST_ACTION_TYPES.REVIEW_STATUS_SET,
    actor,
    eventId: parsed.value.eventId,
    page: `/admin/elah-events/${parsed.value.eventId}`,
    payload: { status: parsed.value.status },
  });
  return {
    ok: true,
    value: {
      status: parsed.value.status,
      updatedAt: row.timestamp.toISOString(),
      actor: actorRefOf(row),
    },
  };
}

/** Mark the ELAH score outcome (confirmed_correct / false_positive / false_negative); `mark: null` clears. */
export async function markOutcome(
  actor: AnalystActor,
  input: OutcomeMarkInput,
): Promise<AnalystResult<OutcomeMarkEntry>> {
  const parsed = parseOutcomeMarkInput(input);
  if (!parsed.ok) return parsed;
  const exists = await requireEvent(parsed.value.eventId);
  if (!exists.ok) return exists;
  const reason = parsed.value.reason ? parsed.value.reason : null;
  const row = await writeAnalystRow({
    actionType: ELAH_ANALYST_ACTION_TYPES.OUTCOME_MARKED,
    actor,
    eventId: parsed.value.eventId,
    page: `/admin/elah-events/${parsed.value.eventId}`,
    payload: { mark: parsed.value.mark, reason },
  });
  return {
    ok: true,
    value: {
      mark: parsed.value.mark,
      reason,
      updatedAt: row.timestamp.toISOString(),
      actor: actorRefOf(row),
    },
  };
}

/** Submit structured feedback: rating 1-5, optional text, optional closed-taxonomy suggested intentLabel. */
export async function submitFeedback(
  actor: AnalystActor,
  input: FeedbackInput,
): Promise<AnalystResult<AnalystFeedback>> {
  const parsed = parseFeedbackInput(input);
  if (!parsed.ok) return parsed;
  const exists = await requireEvent(parsed.value.eventId);
  if (!exists.ok) return exists;
  const text = parsed.value.text ? parsed.value.text : null;
  const suggestedIntentLabel = parsed.value.suggestedIntentLabel ?? null;
  const row = await writeAnalystRow({
    actionType: ELAH_ANALYST_ACTION_TYPES.FEEDBACK_SUBMITTED,
    actor,
    eventId: parsed.value.eventId,
    page: `/admin/elah-events/${parsed.value.eventId}`,
    payload: { rating: parsed.value.rating, text, suggestedIntentLabel },
  });
  return {
    ok: true,
    value: {
      id: row.id,
      eventId: parsed.value.eventId,
      rating: parsed.value.rating,
      text,
      suggestedIntentLabel,
      createdAt: row.timestamp.toISOString(),
      actor: actorRefOf(row),
    },
  };
}

/** Pure fold of one event's analyst rows (any order) into annotations. */
export function foldEventAnnotations(eventId: string, rows: AnalystAuditRow[]): EventAnnotations {
  const sorted = [...rows].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime() || a.id.localeCompare(b.id),
  );
  const out: EventAnnotations = {
    eventId,
    notes: [],
    reviewStatus: { status: "unreviewed", updatedAt: null, actor: null },
    outcomeMark: null,
    feedback: [],
  };
  for (const row of sorted) {
    if (row.eventId !== eventId) continue;
    const payload = parsePayload(row.inputDataSummary);
    const at = row.timestamp.toISOString();
    const actor = actorRefOf(row);
    switch (row.actionType) {
      case ELAH_ANALYST_ACTION_TYPES.NOTE_ADDED: {
        const text = str(payload.text);
        if (text) out.notes.push({ id: row.id, eventId, text, createdAt: at, actor });
        break;
      }
      case ELAH_ANALYST_ACTION_TYPES.REVIEW_STATUS_SET: {
        const status = str(payload.status);
        if (status && REVIEW_STATUS_SET.has(status)) {
          out.reviewStatus = { status: status as ReviewStatus, updatedAt: at, actor };
        }
        break;
      }
      case ELAH_ANALYST_ACTION_TYPES.OUTCOME_MARKED: {
        const mark = payload.mark === null ? null : str(payload.mark);
        if (mark === null || OUTCOME_MARK_SET.has(mark)) {
          out.outcomeMark = {
            mark: mark as OutcomeMark | null,
            reason: str(payload.reason),
            updatedAt: at,
            actor,
          };
        }
        break;
      }
      case ELAH_ANALYST_ACTION_TYPES.FEEDBACK_SUBMITTED: {
        const rating = payload.rating;
        if (typeof rating === "number" && Number.isInteger(rating) && rating >= 1 && rating <= 5) {
          out.feedback.push({
            id: row.id,
            eventId,
            rating,
            text: str(payload.text),
            suggestedIntentLabel: INTENT_SET.has(str(payload.suggestedIntentLabel) ?? "")
              ? (payload.suggestedIntentLabel as ElahBankingIntent)
              : null,
            createdAt: at,
            actor,
          });
        }
        break;
      }
      default:
        break;
    }
  }
  return out;
}

/** Pure fold of analyst rows into per-event review state (every requested id present). */
export function foldReviewStates(
  eventIds: string[],
  rows: AnalystAuditRow[],
): Map<string, EventReviewState> {
  const out = new Map<string, EventReviewState>();
  for (const id of eventIds) out.set(id, emptyReviewState(id));
  const byEvent = new Map<string, AnalystAuditRow[]>();
  for (const row of rows) {
    if (!row.eventId || !out.has(row.eventId)) continue;
    const list = byEvent.get(row.eventId) ?? [];
    list.push(row);
    byEvent.set(row.eventId, list);
  }
  for (const [eventId, list] of byEvent) {
    const folded = foldEventAnnotations(eventId, list);
    const last = list.reduce((max, row) => Math.max(max, row.timestamp.getTime()), 0);
    out.set(eventId, {
      eventId,
      reviewStatus: folded.reviewStatus.status,
      outcomeMark: folded.outcomeMark?.mark ?? null,
      noteCount: folded.notes.length,
      feedbackCount: folded.feedback.length,
      lastActivityAt: last ? new Date(last).toISOString() : null,
    });
  }
  return out;
}

/** Full annotation history for one event. */
export async function getEventAnnotations(eventId: string): Promise<EventAnnotations> {
  if (!eventId) return foldEventAnnotations(eventId, []);
  const rows = await prisma.auditLog.findMany({
    where: { eventId, actionType: { in: ANNOTATION_ACTION_TYPES } },
    orderBy: { timestamp: "asc" },
    select: ANALYST_ROW_SELECT,
  });
  return foldEventAnnotations(eventId, rows);
}

const REVIEW_BATCH = 500;

/** Latest review state for many events. Every requested id is present (defaults: `unreviewed`, no mark). */
export async function getReviewStates(eventIds: string[]): Promise<Map<string, EventReviewState>> {
  const unique = [...new Set(eventIds.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const rows: AnalystAuditRow[] = [];
  for (let i = 0; i < unique.length; i += REVIEW_BATCH) {
    const chunk = unique.slice(i, i + REVIEW_BATCH);
    rows.push(
      ...(await prisma.auditLog.findMany({
        where: { eventId: { in: chunk }, actionType: { in: ANNOTATION_ACTION_TYPES } },
        orderBy: { timestamp: "asc" },
        select: ANALYST_ROW_SELECT,
      })),
    );
  }
  return foldReviewStates(unique, rows);
}

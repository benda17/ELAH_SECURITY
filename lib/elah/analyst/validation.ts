/**
 * Input validation + free-text sanitization for analyst writes. Client-safe (pure).
 */

import { z } from "zod";
import { ELAH_BANKING_INTENTS, type ElahBankingIntent } from "@/lib/elah/types";
import {
  ANALYST_TEXT_MAX,
  ANALYST_VIEW_NAME_MAX,
  OUTCOME_MARKS,
  REVIEW_STATUSES,
  type AnalystResult,
  type OutcomeMark,
  type ReviewStatus,
} from "./constants";

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
/** 8+ digits, optionally separated by space / dot / dash / parens (accounts, cards, phones, IDs). */
const LONG_NUMBER_RE = /\+?\d(?:[\s().-]?\d){7,}/g;
// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const EVENT_ID_RE = /^[A-Za-z0-9_.:-]{8,128}$/;

/**
 * Strip control chars, trim, and redact PII-shaped substrings (emails, 8+ digit
 * runs). Does not truncate; length limits are enforced by the schemas.
 */
export function sanitizeAnalystText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL_RE, "")
    .replace(EMAIL_RE, "[redacted_email]")
    .replace(LONG_NUMBER_RE, "[redacted_number]")
    .trim();
}

function freeText(field: string, { required }: { required: boolean }) {
  const base = z
    .string({ invalid_type_error: `${field} must be a string.` })
    .max(ANALYST_TEXT_MAX, `${field} must be at most ${ANALYST_TEXT_MAX} characters.`)
    .transform(sanitizeAnalystText);
  return required
    ? base.refine((value) => value.length > 0, `${field} is required.`)
    : base;
}

export const eventIdSchema = z
  .string({ required_error: "eventId is required.", invalid_type_error: "eventId must be a string." })
  .trim()
  .regex(EVENT_ID_RE, "eventId is malformed.");

export const noteInputSchema = z
  .object({ eventId: eventIdSchema, text: freeText("text", { required: true }) })
  .strict();

export const reviewStatusInputSchema = z
  .object({
    eventId: eventIdSchema,
    status: z.enum(REVIEW_STATUSES, {
      errorMap: () => ({ message: `status must be one of: ${REVIEW_STATUSES.join(", ")}.` }),
    }),
  })
  .strict();

export const outcomeMarkInputSchema = z
  .object({
    eventId: eventIdSchema,
    mark: z
      .enum(OUTCOME_MARKS, {
        errorMap: () => ({ message: `mark must be one of: ${OUTCOME_MARKS.join(", ")} (or null to clear).` }),
      })
      .nullable(),
    reason: freeText("reason", { required: false }).optional(),
  })
  .strict();

export const feedbackInputSchema = z
  .object({
    eventId: eventIdSchema,
    rating: z.coerce
      .number({ invalid_type_error: "rating must be an integer 1-5." })
      .int("rating must be an integer 1-5.")
      .min(1, "rating must be an integer 1-5.")
      .max(5, "rating must be an integer 1-5."),
    text: freeText("text", { required: false }).optional(),
    suggestedIntentLabel: z
      .enum(ELAH_BANKING_INTENTS, {
        errorMap: () => ({ message: "suggestedIntentLabel must be a closed ElahBankingIntent value." }),
      })
      .nullable()
      .optional(),
  })
  .strict();

export const viewNameSchema = z
  .string({ invalid_type_error: "name must be a string." })
  .max(ANALYST_VIEW_NAME_MAX, `name must be at most ${ANALYST_VIEW_NAME_MAX} characters.`)
  .transform((value) => sanitizeAnalystText(value).replace(/\s+/g, " "))
  .refine((value) => value.length > 0, "name is required.");

export const viewIdSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9][a-z0-9_-]{0,63}$/, "viewId is malformed.");

export interface NoteInput {
  eventId: string;
  text: string;
}
export interface ReviewStatusInput {
  eventId: string;
  status: ReviewStatus;
}
export interface OutcomeMarkInput {
  eventId: string;
  /** `null` clears a previous mark. */
  mark: OutcomeMark | null;
  reason?: string;
}
export interface FeedbackInput {
  eventId: string;
  rating: number;
  text?: string;
  suggestedIntentLabel?: ElahBankingIntent | null;
}

function run<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, input: unknown): AnalystResult<T> {
  const parsed = schema.safeParse(input);
  if (parsed.success) return { ok: true, value: parsed.data };
  return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
}

/** Validate + sanitize a note. */
export function parseNoteInput(input: unknown): AnalystResult<NoteInput> {
  return run(noteInputSchema, input);
}
/** Validate a review-status change. */
export function parseReviewStatusInput(input: unknown): AnalystResult<ReviewStatusInput> {
  return run(reviewStatusInputSchema, input);
}
/** Validate an outcome mark (`mark: null` clears). */
export function parseOutcomeMarkInput(input: unknown): AnalystResult<OutcomeMarkInput> {
  return run(outcomeMarkInputSchema, input);
}
/** Validate structured feedback (rating 1-5, optional text, optional closed-taxonomy label). */
export function parseFeedbackInput(input: unknown): AnalystResult<FeedbackInput> {
  return run(feedbackInputSchema, input);
}
/** Validate + sanitize a saved-view name. */
export function parseViewName(input: unknown): AnalystResult<string> {
  return run(viewNameSchema, input);
}

/** Deterministic viewId from a name (same name → same view, latest wins). */
export function viewIdFromName(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return slug || "view";
}

/**
 * Analyst event filters: URL parse / serialize, date presets, and the pure
 * in-memory matcher. Client-safe (no server imports).
 *
 * Where each filter runs (see `queryAnalystEvents`):
 * - DB (AuditLog WHERE via `listIngestibleEvents`): userIdHash, sessionId,
 *   source (and channel=agent → source=agent), from/to/preset (AuditLog.timestamp).
 * - `listIngestibleEvents` in memory, before its `take` cut-off: actionType,
 *   toolName, outcome, quality.
 * - Analyst layer in memory, after joining scores + review state: q, channel=ui,
 *   modelVersion, scoreMin/scoreMax, confidenceMin, intentLabel, reviewStatus,
 *   outcomeMark, band.
 */

import {
  ELAH_ACTION_TYPES,
  ELAH_OUTCOMES,
  ELAH_SOURCES,
  ELAH_TOOL_NAMES,
  type ElahActionType,
  type ElahToolName,
} from "@/lib/elah/event-vocab";
import type { ElahOutcome, ElahSource } from "@/lib/elah/envelope";
import { ELAH_BANKING_INTENTS, type ElahBankingIntent } from "@/lib/elah/types";
import { SCORE_BANDS, type ScoreBand } from "./bands";
import {
  OUTCOME_MARKS,
  REVIEW_STATUSES,
  type OutcomeMark,
  type ReviewStatus,
} from "./constants";
import type { AnalystEventRow } from "./types";

export const ANALYST_DATE_PRESETS = ["1h", "24h", "7d", "30d"] as const;
export type AnalystDatePreset = (typeof ANALYST_DATE_PRESETS)[number];

export const ANALYST_DATE_PRESET_MS: Readonly<Record<AnalystDatePreset, number>> = Object.freeze({
  "1h": 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
});

/** `agent` = source agent (AI assistant); `ui` = anything else (ui + system). */
export const ANALYST_CHANNELS = ["agent", "ui"] as const;
export type AnalystChannel = (typeof ANALYST_CHANNELS)[number];

/** Outcome-mark filter: a specific mark, any FP/FN, or no mark at all. */
export const ANALYST_MARK_FILTERS = [...OUTCOME_MARKS, "fp_or_fn", "unmarked"] as const;
export type AnalystMarkFilter = (typeof ANALYST_MARK_FILTERS)[number];

export const ANALYST_QUALITY_FILTERS = ["ok", "fail"] as const;

export const ANALYST_LIMIT_DEFAULT = 100;
export const ANALYST_LIMIT_MAX = 1000;
const Q_MAX = 200;

export interface AnalystEventFilters {
  /** Free text over eventId, userIdHash, utterance, toolName (case-insensitive). */
  q?: string;
  /** Relative window ending now; ignored for `from` when `from` is set. */
  preset?: AnalystDatePreset;
  /** ISO-8601 inclusive lower bound. */
  from?: string;
  /** ISO-8601 inclusive upper bound. */
  to?: string;
  userIdHash?: string;
  sessionId?: string;
  source?: ElahSource;
  actionType?: ElahActionType;
  toolName?: ElahToolName;
  channel?: AnalystChannel;
  outcome?: ElahOutcome;
  quality?: "ok" | "fail";
  /** Matches `row.modelVersion` or `row.scorer`. */
  modelVersion?: string;
  /** Inclusive, 0-1. Unscored rows are excluded when set. */
  scoreMin?: number;
  /** Inclusive, 0-1. Unscored rows are excluded when set. */
  scoreMax?: number;
  /** Inclusive, 0-1. */
  confidenceMin?: number;
  /** ELAH score snapshot `intentLabel` (closed 22-label taxonomy). */
  intentLabel?: ElahBankingIntent;
  reviewStatus?: ReviewStatus;
  outcomeMark?: AnalystMarkFilter;
  band?: ScoreBand;
  /** 1..1000, default 100. */
  limit?: number;
}

/** Canonical URL key order used by `serializeAnalystFilters`. */
export const ANALYST_FILTER_KEYS = [
  "q",
  "preset",
  "from",
  "to",
  "userIdHash",
  "sessionId",
  "source",
  "actionType",
  "toolName",
  "channel",
  "outcome",
  "quality",
  "modelVersion",
  "scoreMin",
  "scoreMax",
  "confidenceMin",
  "intentLabel",
  "reviewStatus",
  "outcomeMark",
  "band",
  "limit",
] as const satisfies readonly (keyof AnalystEventFilters)[];

export type SearchParamsLike =
  | URLSearchParams
  | string
  | Record<string, string | string[] | undefined>
  | null
  | undefined;

function reader(input: SearchParamsLike): (key: string) => string | undefined {
  if (input == null) return () => undefined;
  if (typeof input === "string") {
    const params = new URLSearchParams(input.startsWith("?") ? input.slice(1) : input);
    return (key) => params.get(key) ?? undefined;
  }
  if (input instanceof URLSearchParams) return (key) => input.get(key) ?? undefined;
  return (key) => {
    const raw = input[key];
    const value = Array.isArray(raw) ? raw[0] : raw;
    return typeof value === "string" ? value : undefined;
  };
}

function clean(value: string | undefined): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "all") return undefined;
  return trimmed;
}

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return value != null && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

function matching(value: string | undefined, re: RegExp): string | undefined {
  return value != null && re.test(value) ? value : undefined;
}

function unitNumber(value: string | undefined): number | undefined {
  if (value == null) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 1) return undefined;
  return n;
}

function isoDate(value: string | undefined): string | undefined {
  if (value == null) return undefined;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? undefined : new Date(ms).toISOString();
}

/**
 * Parse URL search params into typed filters. Tolerant: unknown keys, junk
 * values, and `all` are dropped silently; ranges are clamped / swapped.
 */
export function parseAnalystFilters(searchParams: SearchParamsLike): AnalystEventFilters {
  const get = reader(searchParams);
  const read = (key: string) => clean(get(key));
  const out: AnalystEventFilters = {};

  const q = read("q");
  if (q) out.q = q.slice(0, Q_MAX);

  const preset = oneOf(read("preset"), ANALYST_DATE_PRESETS);
  if (preset) out.preset = preset;
  let from = isoDate(read("from"));
  let to = isoDate(read("to"));
  if (from && to && from > to) [from, to] = [to, from];
  if (from) out.from = from;
  if (to) out.to = to;

  const userIdHash = matching(read("userIdHash"), /^[A-Za-z0-9]{16,128}$/);
  if (userIdHash) out.userIdHash = userIdHash;
  const sessionId = matching(read("sessionId"), /^[A-Za-z0-9_.:-]{1,128}$/);
  if (sessionId) out.sessionId = sessionId;

  const source = oneOf(read("source"), ELAH_SOURCES);
  if (source) out.source = source;
  const actionType = oneOf(read("actionType"), ELAH_ACTION_TYPES);
  if (actionType) out.actionType = actionType;
  const toolName = oneOf(read("toolName"), ELAH_TOOL_NAMES);
  if (toolName) out.toolName = toolName;
  const channel = oneOf(read("channel"), ANALYST_CHANNELS);
  if (channel) out.channel = channel;
  const outcome = oneOf(read("outcome"), ELAH_OUTCOMES);
  if (outcome) out.outcome = outcome;
  const quality = oneOf(read("quality"), ANALYST_QUALITY_FILTERS);
  if (quality) out.quality = quality;

  const modelVersion = matching(read("modelVersion"), /^[A-Za-z0-9_.:@/+-]{1,64}$/);
  if (modelVersion) out.modelVersion = modelVersion;

  let scoreMin = unitNumber(read("scoreMin"));
  let scoreMax = unitNumber(read("scoreMax"));
  if (scoreMin != null && scoreMax != null && scoreMin > scoreMax) {
    [scoreMin, scoreMax] = [scoreMax, scoreMin];
  }
  if (scoreMin != null) out.scoreMin = scoreMin;
  if (scoreMax != null) out.scoreMax = scoreMax;
  const confidenceMin = unitNumber(read("confidenceMin"));
  if (confidenceMin != null) out.confidenceMin = confidenceMin;

  const intentLabel = oneOf(read("intentLabel"), ELAH_BANKING_INTENTS);
  if (intentLabel) out.intentLabel = intentLabel;
  const reviewStatus = oneOf(read("reviewStatus"), REVIEW_STATUSES);
  if (reviewStatus) out.reviewStatus = reviewStatus;
  const outcomeMark = oneOf(read("outcomeMark"), ANALYST_MARK_FILTERS);
  if (outcomeMark) out.outcomeMark = outcomeMark;
  const band = oneOf(read("band"), SCORE_BANDS);
  if (band) out.band = band;

  const limitRaw = read("limit");
  if (limitRaw != null) {
    const n = Number(limitRaw);
    if (Number.isFinite(n) && n >= 1) out.limit = Math.min(ANALYST_LIMIT_MAX, Math.floor(n));
  }

  return out;
}

/**
 * Serialize filters to a query string (no leading `?`), canonical key order,
 * empty values omitted. `parseAnalystFilters(serializeAnalystFilters(f))`
 * round-trips any filters produced by `parseAnalystFilters`.
 */
export function serializeAnalystFilters(filters: AnalystEventFilters): string {
  const params = new URLSearchParams();
  for (const key of ANALYST_FILTER_KEYS) {
    const value = filters[key];
    if (value == null || value === "") continue;
    params.set(key, String(value));
  }
  return params.toString();
}

/** Resolve `from` / `to` / `preset` to concrete Dates. Explicit `from` wins over `preset`. */
export function resolveDateRange(
  filters: AnalystEventFilters,
  now: Date = new Date(),
): { from: Date | null; to: Date | null } {
  const from = filters.from
    ? new Date(filters.from)
    : filters.preset
      ? new Date(now.getTime() - ANALYST_DATE_PRESET_MS[filters.preset])
      : null;
  const to = filters.to ? new Date(filters.to) : null;
  return { from, to };
}

/** Filters that `listIngestibleEvents` cannot apply (require the analyst join). */
export function hasAnalystOnlyFilters(filters: AnalystEventFilters): boolean {
  return (
    !!filters.q ||
    filters.channel === "ui" ||
    !!filters.modelVersion ||
    filters.scoreMin != null ||
    filters.scoreMax != null ||
    filters.confidenceMin != null ||
    !!filters.intentLabel ||
    !!filters.reviewStatus ||
    !!filters.outcomeMark ||
    !!filters.band
  );
}

/**
 * Pure matcher applying EVERY filter (including DB-pushed ones) to a joined row.
 * `range` defaults to `resolveDateRange(filters)`.
 */
export function matchesAnalystFilters(
  row: AnalystEventRow,
  filters: AnalystEventFilters,
  range: { from: Date | null; to: Date | null } = resolveDateRange(filters),
): boolean {
  const { event } = row;

  if (range.from || range.to) {
    const at = Date.parse(event.occurredAt);
    if (range.from && at < range.from.getTime()) return false;
    if (range.to && at > range.to.getTime()) return false;
  }
  if (filters.userIdHash && event.actor.userIdHash !== filters.userIdHash) return false;
  if (filters.sessionId && event.actor.sessionId !== filters.sessionId) return false;
  if (filters.source && event.source !== filters.source) return false;
  if (filters.actionType && event.actionType !== filters.actionType) return false;
  if (filters.toolName && event.action.toolName !== filters.toolName) return false;
  if (filters.channel === "agent" && event.source !== "agent") return false;
  if (filters.channel === "ui" && event.source === "agent") return false;
  if (filters.outcome && event.outcome !== filters.outcome) return false;
  if (filters.quality === "ok" && !row.quality.ok) return false;
  if (filters.quality === "fail" && row.quality.ok) return false;

  if (filters.q) {
    const needle = filters.q.toLowerCase();
    const haystack = [
      event.eventId,
      event.actor.userIdHash ?? "",
      event.conversation?.utterance ?? "",
      event.action.toolName ?? "",
    ];
    if (!haystack.some((value) => value.toLowerCase().includes(needle))) return false;
  }

  if (
    filters.modelVersion &&
    row.modelVersion !== filters.modelVersion &&
    row.scorer !== filters.modelVersion
  ) {
    return false;
  }
  if (filters.scoreMin != null && (row.elahScore == null || row.elahScore < filters.scoreMin)) {
    return false;
  }
  if (filters.scoreMax != null && (row.elahScore == null || row.elahScore > filters.scoreMax)) {
    return false;
  }
  if (
    filters.confidenceMin != null &&
    (row.confidence == null || row.confidence < filters.confidenceMin)
  ) {
    return false;
  }
  if (filters.intentLabel && row.intentLabel !== filters.intentLabel) return false;
  if (filters.reviewStatus && row.review.reviewStatus !== filters.reviewStatus) return false;
  if (filters.outcomeMark) {
    const mark: OutcomeMark | null = row.review.outcomeMark;
    if (filters.outcomeMark === "unmarked") {
      if (mark != null) return false;
    } else if (filters.outcomeMark === "fp_or_fn") {
      if (mark !== "false_positive" && mark !== "false_negative") return false;
    } else if (mark !== filters.outcomeMark) {
      return false;
    }
  }
  if (filters.band && row.band !== filters.band) return false;
  return true;
}

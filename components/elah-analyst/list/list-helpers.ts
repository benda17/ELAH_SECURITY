/**
 * Pure helpers for the ELAH events list page. Client-safe (no server imports).
 */

import {
  ANALYST_FILTER_KEYS,
  ANALYST_LIMIT_DEFAULT,
  ANALYST_LIMIT_MAX,
  serializeAnalystFilters,
  type AnalystEventFilters,
} from "@/lib/elah/analyst/filters";
import type { AnalystEventRow } from "@/lib/elah/analyst/types";

export const ELAH_EVENTS_PATH = "/admin/elah-events";
export const ANALYST_EXPORT_PATH = "/api/admin/elah/analyst/export";

/* ------------------------------------------------------------------ sort */

/**
 * Display-only sort of the rows already loaded for the page. Not part of the
 * analyst filters, so it is not stored in saved views and does not affect export.
 */
export const LIST_SORTS = [
  "newest",
  "oldest",
  "score_asc",
  "score_desc",
  "confidence_asc",
  "confidence_desc",
] as const;
export type ListSort = (typeof LIST_SORTS)[number];
export const LIST_SORT_DEFAULT: ListSort = "newest";

export function parseListSort(raw: string | string[] | undefined | null): ListSort {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (LIST_SORTS as readonly string[]).includes(value ?? "")
    ? (value as ListSort)
    : LIST_SORT_DEFAULT;
}

function compareNullable(a: number | null, b: number | null, dir: 1 | -1): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return (a - b) * dir;
}

/** Stable sort; rows without a score / confidence always go last. */
export function sortAnalystRows(rows: readonly AnalystEventRow[], sort: ListSort): AnalystEventRow[] {
  const indexed = rows.map((row, index) => ({ row, index }));
  const time = (row: AnalystEventRow) => Date.parse(row.event.occurredAt) || 0;
  const cmp = (a: AnalystEventRow, b: AnalystEventRow): number => {
    switch (sort) {
      case "newest":
        return time(b) - time(a);
      case "oldest":
        return time(a) - time(b);
      case "score_asc":
        return compareNullable(a.elahScore, b.elahScore, 1);
      case "score_desc":
        return compareNullable(a.elahScore, b.elahScore, -1);
      case "confidence_asc":
        return compareNullable(a.confidence, b.confidence, 1);
      case "confidence_desc":
        return compareNullable(a.confidence, b.confidence, -1);
    }
  };
  indexed.sort((a, b) => cmp(a.row, b.row) || a.index - b.index);
  return indexed.map((item) => item.row);
}

export type SortColumn = "time" | "score" | "confidence";

const COLUMN_SORTS: Record<SortColumn, { first: ListSort; second: ListSort }> = {
  time: { first: "newest", second: "oldest" },
  score: { first: "score_asc", second: "score_desc" },
  confidence: { first: "confidence_asc", second: "confidence_desc" },
};

/** `aria-sort` value for a column header given the active sort. */
export function ariaSortFor(column: SortColumn, sort: ListSort): "ascending" | "descending" | "none" {
  if (sort === "oldest" && column === "time") return "ascending";
  if (sort === "newest" && column === "time") return "descending";
  if (sort === `${column}_asc`) return "ascending";
  if (sort === `${column}_desc`) return "descending";
  return "none";
}

/** Next sort when a column header is clicked (toggles within the column). */
export function nextSortFor(column: SortColumn, sort: ListSort): ListSort {
  const { first, second } = COLUMN_SORTS[column];
  return sort === first ? second : first;
}

/* ------------------------------------------------------------------ hrefs */

/** `/admin/elah-events?<canonical filters>[&sort=…]`; default sort omitted. */
export function buildListHref(filters: AnalystEventFilters, sort: ListSort = LIST_SORT_DEFAULT): string {
  const params = new URLSearchParams(serializeAnalystFilters(filters));
  if (sort !== LIST_SORT_DEFAULT) params.set("sort", sort);
  const query = params.toString();
  return query ? `${ELAH_EVENTS_PATH}?${query}` : ELAH_EVENTS_PATH;
}

export function buildExportHref(filters: AnalystEventFilters, format: "csv" | "json"): string {
  const params = new URLSearchParams(serializeAnalystFilters(filters));
  params.set("format", format);
  return `${ANALYST_EXPORT_PATH}?${params.toString()}`;
}

export function hrefForSavedView(query: string): string {
  return query ? `${ELAH_EVENTS_PATH}?${query}` : ELAH_EVENTS_PATH;
}

/* ------------------------------------------------------------------ chips */

export type FilterKey = (typeof ANALYST_FILTER_KEYS)[number];

export interface ActiveFilterChip {
  key: FilterKey;
  label: string;
  value: string;
  /** List href with this one filter removed (other filters + sort kept). */
  removeHref: string;
}

const CHIP_LABELS: Record<FilterKey, string> = {
  q: "Search",
  preset: "Last",
  from: "From",
  to: "To",
  userIdHash: "User",
  sessionId: "Session",
  source: "Source",
  actionType: "Action",
  toolName: "Tool",
  channel: "Channel",
  outcome: "Outcome",
  quality: "Quality",
  modelVersion: "Model",
  scoreMin: "Score ≥",
  scoreMax: "Score ≤",
  confidenceMin: "Confidence ≥",
  intentLabel: "Intent",
  reviewStatus: "Review",
  outcomeMark: "Mark",
  band: "Band",
  limit: "Rows",
};

const MARK_FILTER_LABELS: Record<string, string> = {
  confirmed_correct: "confirmed correct",
  false_positive: "false positive",
  false_negative: "false negative",
  fp_or_fn: "any FP / FN",
  unmarked: "unmarked",
};

export function humanize(value: string): string {
  return value.replaceAll("_", " ");
}

/** `2026-09-28T07:05:00.000Z` → `2026-09-28 07:05 UTC` (unambiguous across time zones). */
export function formatUtcShort(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return iso;
  const d = new Date(ms).toISOString();
  return `${d.slice(0, 10)} ${d.slice(11, 16)} UTC`;
}

export function shortHash(value: string, head = 8): string {
  return value.length > head + 1 ? `${value.slice(0, head)}…` : value;
}

function chipValue(
  key: FilterKey,
  filters: AnalystEventFilters,
  userLabels: ReadonlyMap<string, string>,
): string {
  const raw = filters[key];
  switch (key) {
    case "from":
    case "to":
      return formatUtcShort(String(raw));
    case "userIdHash":
      return userLabels.get(String(raw)) ?? shortHash(String(raw));
    case "channel":
      return raw === "agent" ? "agent (AI assistant)" : "ui (non-agent)";
    case "outcomeMark":
      return MARK_FILTER_LABELS[String(raw)] ?? humanize(String(raw));
    case "scoreMin":
    case "scoreMax":
    case "confidenceMin":
      return Number(raw).toFixed(2);
    default:
      return humanize(String(raw));
  }
}

/**
 * One chip per active filter, in canonical key order. `limit` is only shown
 * when it differs from the default.
 */
export function buildActiveFilterChips(
  filters: AnalystEventFilters,
  opts: { sort?: ListSort; userLabels?: ReadonlyMap<string, string> } = {},
): ActiveFilterChip[] {
  const userLabels = opts.userLabels ?? new Map<string, string>();
  const chips: ActiveFilterChip[] = [];
  for (const key of ANALYST_FILTER_KEYS) {
    const raw = filters[key];
    if (raw == null || raw === "") continue;
    if (key === "limit" && raw === ANALYST_LIMIT_DEFAULT) continue;
    const rest: AnalystEventFilters = { ...filters };
    delete rest[key];
    chips.push({
      key,
      label: CHIP_LABELS[key],
      value: chipValue(key, filters, userLabels),
      removeHref: buildListHref(rest, opts.sort),
    });
  }
  return chips;
}

/** Filters beyond search + date range (drives the mobile "More filters" default). */
export function hasAdvancedFilters(filters: AnalystEventFilters): boolean {
  return ANALYST_FILTER_KEYS.some(
    (key) =>
      key !== "q" &&
      key !== "preset" &&
      key !== "from" &&
      key !== "to" &&
      filters[key] != null &&
      !(key === "limit" && filters.limit === ANALYST_LIMIT_DEFAULT),
  );
}

export function hasAnyFilter(filters: AnalystEventFilters): boolean {
  return buildActiveFilterChips(filters).length > 0;
}

/* ------------------------------------------------------------------ dates */

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Date → `YYYY-MM-DDTHH:mm` in the runtime's local time zone (for `datetime-local`). */
export function toDatetimeLocalValue(date: Date): string {
  if (Number.isNaN(date.getTime())) return "";
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/** `datetime-local` value (runtime local time) → ISO-8601 UTC, or null when blank / invalid. */
export function datetimeLocalToIso(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const ms = new Date(trimmed).getTime();
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}

/**
 * Turn submitted filter-form entries into a clean query string: drops blanks,
 * `all`, and defaults (sort, limit); converts `from` / `to` from local
 * `datetime-local` values to ISO.
 */
export function filterFormToQuery(entries: Iterable<[string, FormDataEntryValue]>): string {
  const params = new URLSearchParams();
  for (const [key, value] of entries) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed || trimmed.toLowerCase() === "all") continue;
    if (key === "from" || key === "to") {
      const iso = datetimeLocalToIso(trimmed);
      if (iso) params.set(key, iso);
      continue;
    }
    if (key === "sort" && trimmed === LIST_SORT_DEFAULT) continue;
    if (key === "limit" && trimmed === String(ANALYST_LIMIT_DEFAULT)) continue;
    params.set(key, trimmed);
  }
  return params.toString();
}

/* ------------------------------------------------------------------ misc */

export function truncateText(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, Math.max(0, max - 1))}…` : clean;
}

/** rules_v0 (and any rules_v0 variant) is an uncalibrated baseline. */
export function isUncalibratedModel(modelVersion: string | null, scorer?: string | null): boolean {
  return [modelVersion, scorer].some((value) => typeof value === "string" && /^rules_v0\b/.test(value));
}

export const UNCALIBRATED_MODEL_NOTE =
  "rules_v0 is an uncalibrated baseline: scores rank events for triage but are not probabilities.";

export function formatUnit(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "—";
}

/**
 * Warning shown when more matches may exist than were returned.
 * - Scan hit the 1000-row cap → only narrowing the date range reaches older events.
 * - Row limit reached (scan below the cap) → raising the row limit or narrowing helps.
 */
export function truncationNotice(result: {
  truncated: boolean;
  scanned: number;
  limit: number;
  rowCount: number;
}): string | null {
  if (!result.truncated && result.rowCount < result.limit) return null;
  if (result.truncated && result.scanned >= ANALYST_LIMIT_MAX) {
    return `The scan reached its ${ANALYST_LIMIT_MAX}-event cap, so older matching events may be missing. Narrow the date range to reach them.`;
  }
  return `Showing the newest ${result.limit} matching events; older matches may exist. Raise the row limit or narrow the date range.`;
}

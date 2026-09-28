/**
 * Pure helpers for the ELAH operational dashboard. Client-safe (no server imports).
 */

import {
  bandForScore,
  type ElahDisplayThresholds,
  type ScoreBand,
} from "@/lib/elah/analyst/bands";
import {
  serializeAnalystFilters,
  type AnalystEventFilters,
} from "@/lib/elah/analyst/filters";
import type { DashboardStats } from "@/lib/elah/analyst/stats";
import type { AnalystEventRow } from "@/lib/elah/analyst/types";

export const DASHBOARD_PATH = "/admin/elah-dashboard";
export const EVENTS_PATH = "/admin/elah-events";
export const DASHBOARD_DEFAULT_PRESET = "24h" as const;
export const DASHBOARD_POLL_MS = 15_000;

/** One scored event, reduced to the numbers the charts need. */
export interface ScorePoint {
  score: number;
  confidence: number | null;
}

/**
 * Aggregates the dashboard needs that `DashboardSnapshot` does not carry
 * (raw score / confidence distribution, quality failures, review ∩ unreviewed).
 */
export interface DashboardExtras {
  generatedAt: string;
  /** Scored rows only (finite elahScore). */
  points: ScorePoint[];
  qualityFailures: number;
  /** Rows in the `review` band whose review status is still `unreviewed`. */
  reviewUnreviewed: number;
  /** `modelVersion ?? scorer` → scored row count. */
  modelVersions: Record<string, number>;
}

export function computeDashboardExtras(
  rows: AnalystEventRow[],
  now: Date = new Date(),
): DashboardExtras {
  const points: ScorePoint[] = [];
  const modelVersions: Record<string, number> = {};
  let qualityFailures = 0;
  let reviewUnreviewed = 0;
  for (const row of rows) {
    if (!row.quality.ok) qualityFailures += 1;
    if (row.band === "review" && row.review.reviewStatus === "unreviewed") reviewUnreviewed += 1;
    if (row.elahScore == null || !Number.isFinite(row.elahScore)) continue;
    const confidence =
      row.confidence != null && Number.isFinite(row.confidence) ? row.confidence : null;
    points.push({ score: row.elahScore, confidence });
    const version = row.modelVersion ?? row.scorer;
    if (version) modelVersions[version] = (modelVersions[version] ?? 0) + 1;
  }
  return {
    generatedAt: now.toISOString(),
    points,
    qualityFailures,
    reviewUnreviewed,
    modelVersions,
  };
}

/** Dashboard filters default to the last 24h when no date range is given. */
export function withDefaultPreset(filters: AnalystEventFilters): AnalystEventFilters {
  if (filters.preset || filters.from || filters.to) return filters;
  return { ...filters, preset: DASHBOARD_DEFAULT_PRESET };
}

export interface HistogramBin {
  from: number;
  to: number;
  count: number;
}

/** Equal-width bins over [0, 1]. Non-finite / out-of-range values are skipped; 1.0 lands in the last bin. */
export function histogram(values: readonly number[], binCount = 10): HistogramBin[] {
  const n = Math.max(1, Math.floor(binCount));
  const round = (x: number) => Math.round(x * 1000) / 1000;
  const bins: HistogramBin[] = Array.from({ length: n }, (_, i) => ({
    from: round(i / n),
    to: round((i + 1) / n),
    count: 0,
  }));
  for (const v of values) {
    if (!Number.isFinite(v) || v < 0 || v > 1) continue;
    const index = Math.min(n - 1, Math.floor(v * n + 1e-9));
    bins[index].count += 1;
  }
  return bins;
}

/** Band of a bin, judged at its midpoint (display only). */
export function binBand(bin: HistogramBin, thresholds: ElahDisplayThresholds): ScoreBand {
  return bandForScore((bin.from + bin.to) / 2, thresholds);
}

export type ScoredBand = Exclude<ScoreBand, "unscored">;

/** Count scores per band under `thresholds` (used for the threshold preview). */
export function bandCounts(
  scores: readonly number[],
  thresholds: ElahDisplayThresholds,
): Record<ScoredBand, number> {
  const out: Record<ScoredBand, number> = { review: 0, watch: 0, clear: 0 };
  for (const s of scores) {
    const band = bandForScore(s, thresholds);
    if (band !== "unscored") out[band] += 1;
  }
  return out;
}

/** Mean confidence per band (null when a band has no confidence values). */
export function meanConfidenceByBand(
  points: readonly ScorePoint[],
  thresholds: ElahDisplayThresholds,
): Record<ScoredBand, { mean: number | null; n: number }> {
  const acc: Record<ScoredBand, number[]> = { review: [], watch: [], clear: [] };
  for (const p of points) {
    if (p.confidence == null) continue;
    const band = bandForScore(p.score, thresholds);
    if (band !== "unscored") acc[band].push(p.confidence);
  }
  const summarize = (xs: number[]) => ({
    mean: xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 1000) / 1000 : null,
    n: xs.length,
  });
  return { review: summarize(acc.review), watch: summarize(acc.watch), clear: summarize(acc.clear) };
}

/**
 * Link to the events list carrying the dashboard's filters plus `overrides`
 * (`undefined` removes a key). `limit` is never carried over.
 */
export function eventsHref(
  base: AnalystEventFilters,
  overrides: Partial<Record<keyof AnalystEventFilters, string | number | undefined>> = {},
): string {
  const merged: Record<string, unknown> = { ...base, limit: undefined };
  for (const [key, value] of Object.entries(overrides)) merged[key] = value;
  const query = serializeAnalystFilters(merged as AnalystEventFilters);
  return query ? `${EVENTS_PATH}?${query}` : EVENTS_PATH;
}

/** Dashboard link for a date preset, keeping every other filter (explicit from/to dropped). */
export function presetHref(base: AnalystEventFilters, preset: string): string {
  const query = serializeAnalystFilters({
    ...base,
    preset: preset as AnalystEventFilters["preset"],
    from: undefined,
    to: undefined,
    limit: undefined,
  });
  return query ? `${DASHBOARD_PATH}?${query}` : DASHBOARD_PATH;
}

/** Non-date filters that narrow the dashboard (shown as chips). */
export function activeNarrowingFilters(filters: AnalystEventFilters): [string, string][] {
  const skip = new Set(["preset", "from", "to", "limit"]);
  return Object.entries(filters)
    .filter(([key, value]) => !skip.has(key) && value != null && value !== "")
    .map(([key, value]) => [key, String(value)]);
}

/** Scorers whose scores are known to be uncalibrated heuristics. */
export function isUncalibratedModel(version: string | null | undefined): boolean {
  if (!version) return false;
  return version.startsWith("rules_v0") || version.startsWith("intent_matrix");
}

export function formatScore(value: number | null | undefined, digits = 2): string {
  return value == null || !Number.isFinite(value) ? "—" : value.toFixed(digits);
}

export function formatPct(part: number, whole: number): string {
  if (!whole) return "—";
  const pct = (part / whole) * 100;
  return `${pct >= 10 || pct === 0 ? pct.toFixed(0) : pct.toFixed(1)}%`;
}

const UTC_TIME = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "UTC",
});
const UTC_DATETIME = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});
const UTC_DAY = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});
const UTC_HOUR = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

/** Times render in UTC so server and client output match (no hydration drift). */
export function formatUtcTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : `${UTC_TIME.format(d)} UTC`;
}

export function formatUtcDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : `${UTC_DATETIME.format(d)} UTC`;
}

export function formatBucketLabel(iso: string, granularity: "hour" | "day"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return granularity === "hour" ? UTC_HOUR.format(d) : UTC_DAY.format(d);
}

export type IndicatorLevel = "attention" | "ok" | "info";

export interface RiskIndicator {
  key: string;
  label: string;
  value: number;
  /** Short context line, e.g. a rate. */
  detail: string;
  level: IndicatorLevel;
  /** Events list link showing exactly these events (null when not filterable). */
  href: string | null;
}

/**
 * Triage indicators for analysts. These describe what deserves a human look;
 * they are not decisions — bank policy alone allows / denies / confirms.
 */
export function riskIndicators(
  stats: DashboardStats,
  extras: Pick<DashboardExtras, "qualityFailures" | "reviewUnreviewed">,
  filters: AnalystEventFilters,
): RiskIndicator[] {
  const total = stats.total;
  const level = (n: number): IndicatorLevel => (n > 0 ? "attention" : "ok");
  return [
    {
      key: "review",
      label: "Review band",
      value: stats.byBand.review,
      detail: `${formatPct(stats.byBand.review, total)} of events`,
      level: level(stats.byBand.review),
      href: eventsHref(filters, { band: "review" }),
    },
    {
      key: "review_unreviewed",
      label: "Review band, unreviewed",
      value: extras.reviewUnreviewed,
      detail: `${formatPct(extras.reviewUnreviewed, stats.byBand.review)} of review band`,
      level: level(extras.reviewUnreviewed),
      href: eventsHref(filters, { band: "review", reviewStatus: "unreviewed" }),
    },
    {
      key: "escalated",
      label: "Escalated",
      value: stats.byReviewStatus.escalated,
      detail: "Analyst escalations",
      level: level(stats.byReviewStatus.escalated),
      href: eventsHref(filters, { reviewStatus: "escalated" }),
    },
    {
      key: "false_negative",
      label: "False negatives",
      value: stats.falseNegatives,
      detail: "Marked by analysts",
      level: level(stats.falseNegatives),
      href: eventsHref(filters, { outcomeMark: "false_negative" }),
    },
    {
      key: "false_positive",
      label: "False positives",
      value: stats.falsePositives,
      detail: "Marked by analysts",
      level: level(stats.falsePositives),
      href: eventsHref(filters, { outcomeMark: "false_positive" }),
    },
    {
      key: "unavailable",
      label: "Scorer unavailable",
      value: stats.unavailable,
      detail: `${formatPct(stats.unavailable, total)} failed open`,
      level: level(stats.unavailable),
      href: null,
    },
    {
      key: "unscored",
      label: "Unscored",
      value: stats.unscored,
      detail: `${formatPct(stats.unscored, total)} · ${stats.abstained} abstained · ${stats.noScore} no score row`,
      level: stats.unscored > 0 ? "info" : "ok",
      href: eventsHref(filters, { band: "unscored" }),
    },
    {
      key: "quality",
      label: "Quality failures",
      value: extras.qualityFailures,
      detail: `${formatPct(extras.qualityFailures, total)} of events`,
      level: level(extras.qualityFailures),
      href: eventsHref(filters, { quality: "fail" }),
    },
  ];
}

/** Top-N entries of a count record, descending, ties by key. */
export function topEntries(record: Record<string, number>, n = 8): [string, number][] {
  return Object.entries(record)
    .filter(([, count]) => count > 0)
    .sort(([ka, a], [kb, b]) => b - a || ka.localeCompare(kb))
    .slice(0, n);
}

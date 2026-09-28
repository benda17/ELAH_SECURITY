/**
 * Dashboard aggregates. Client-safe (pure). Server snapshot lives in `snapshot.ts`.
 */

import { bandForScore, type ElahDisplayThresholds, type ScoreBand } from "./bands";
import { REVIEW_STATUSES, type ReviewStatus } from "./constants";
import type { AnalystEventRow } from "./types";

export type SeriesGranularity = "hour" | "day";

export interface DashboardSeriesBucket {
  /** ISO start of the UTC hour / day. */
  start: string;
  count: number;
  scoredCount: number;
  /** Mean elahScore of scored events in the bucket, null if none. */
  meanScore: number | null;
}

export interface DashboardStats {
  total: number;
  /** Rows with a numeric elahScore (band != unscored). */
  scored: number;
  unscored: number;
  /** Score snapshot status `abstained`. */
  abstained: number;
  /** Score snapshot `elah_scoring_unavailable` (fail-open). */
  unavailable: number;
  /** No score row at all. */
  noScore: number;
  byBand: Record<ScoreBand, number>;
  bySource: Record<string, number>;
  byActionType: Record<string, number>;
  byReviewStatus: Record<ReviewStatus, number>;
  falsePositives: number;
  falseNegatives: number;
  confirmedCorrect: number;
  /** null when nothing scored. Rounded to 3 dp. */
  averageScore: number | null;
  averageConfidence: number | null;
  series: {
    granularity: SeriesGranularity;
    buckets: DashboardSeriesBucket[];
  };
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
/** Ranges up to this length use hourly buckets. */
export const HOURLY_SERIES_MAX_MS = 48 * HOUR_MS;
const MAX_FILLED_BUCKETS = 1000;

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return round3(values.reduce((sum, v) => sum + v, 0) / values.length);
}

function bump(record: Record<string, number>, key: string) {
  record[key] = (record[key] ?? 0) + 1;
}

function floorTo(ms: number, granularity: SeriesGranularity): number {
  const d = new Date(ms);
  if (granularity === "hour") {
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours());
  }
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Pure aggregate over analyst rows. Bands are recomputed from `elahScore` with
 * `thresholds` (display only). The series spans `range` (default: min / max
 * occurredAt, `to` defaults to `now`); hourly when <= 48h, daily otherwise;
 * empty buckets are filled when the span has <= 1000 buckets.
 */
export function computeDashboardStats(
  rows: AnalystEventRow[],
  thresholds: ElahDisplayThresholds,
  opts: { from?: Date | null; to?: Date | null; now?: Date } = {},
): DashboardStats {
  const byBand: Record<ScoreBand, number> = { review: 0, watch: 0, clear: 0, unscored: 0 };
  const byReviewStatus = Object.fromEntries(REVIEW_STATUSES.map((s) => [s, 0])) as Record<
    ReviewStatus,
    number
  >;
  const bySource: Record<string, number> = {};
  const byActionType: Record<string, number> = {};
  const scores: number[] = [];
  const confidences: number[] = [];
  let abstained = 0;
  let unavailable = 0;
  let noScore = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  let confirmedCorrect = 0;
  const times: number[] = [];

  for (const row of rows) {
    const band = bandForScore(row.elahScore, thresholds);
    byBand[band] += 1;
    byReviewStatus[row.review.reviewStatus] += 1;
    bump(bySource, row.event.source);
    bump(byActionType, row.event.actionType);
    if (row.elahScore != null && Number.isFinite(row.elahScore)) scores.push(row.elahScore);
    if (row.confidence != null && Number.isFinite(row.confidence)) confidences.push(row.confidence);
    if (row.scoreStatus === "abstained") abstained += 1;
    if (row.scoreStatus === "unavailable") unavailable += 1;
    if (row.scoreStatus === "none") noScore += 1;
    if (row.review.outcomeMark === "false_positive") falsePositives += 1;
    if (row.review.outcomeMark === "false_negative") falseNegatives += 1;
    if (row.review.outcomeMark === "confirmed_correct") confirmedCorrect += 1;
    const at = Date.parse(row.event.occurredAt);
    if (!Number.isNaN(at)) times.push(at);
  }

  const now = opts.now ?? new Date();
  const startMs = opts.from?.getTime() ?? (times.length ? Math.min(...times) : now.getTime());
  const endMs =
    opts.to?.getTime() ??
    (opts.from || times.length === 0 ? now.getTime() : Math.max(...times));
  const granularity: SeriesGranularity =
    endMs - startMs <= HOURLY_SERIES_MAX_MS ? "hour" : "day";
  const step = granularity === "hour" ? HOUR_MS : DAY_MS;

  const bucketMap = new Map<number, { count: number; scores: number[] }>();
  const firstBucket = floorTo(Math.min(startMs, endMs), granularity);
  const lastBucket = floorTo(Math.max(startMs, endMs), granularity);
  if ((lastBucket - firstBucket) / step < MAX_FILLED_BUCKETS) {
    for (let t = firstBucket; t <= lastBucket; t += step) bucketMap.set(t, { count: 0, scores: [] });
  }
  for (const row of rows) {
    const at = Date.parse(row.event.occurredAt);
    if (Number.isNaN(at)) continue;
    const key = floorTo(at, granularity);
    const bucket = bucketMap.get(key) ?? { count: 0, scores: [] };
    bucket.count += 1;
    if (row.elahScore != null && Number.isFinite(row.elahScore)) bucket.scores.push(row.elahScore);
    bucketMap.set(key, bucket);
  }
  const buckets: DashboardSeriesBucket[] = [...bucketMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([start, bucket]) => ({
      start: new Date(start).toISOString(),
      count: bucket.count,
      scoredCount: bucket.scores.length,
      meanScore: mean(bucket.scores),
    }));

  return {
    total: rows.length,
    scored: scores.length,
    unscored: rows.length - scores.length,
    abstained,
    unavailable,
    noScore,
    byBand,
    bySource,
    byActionType,
    byReviewStatus,
    falsePositives,
    falseNegatives,
    confirmedCorrect,
    averageScore: mean(scores),
    averageConfidence: mean(confidences),
    series: { granularity, buckets },
  };
}

/**
 * Display thresholds + score bands. Client-safe (pure).
 *
 * IMPORTANT: thresholds are an analyst DISPLAY / TRIAGE preference only.
 * They never change `elahScore`, never feed back into the scorer, and never
 * allow, block, or execute anything. Bank policy alone decides allow / deny /
 * confirm. `elahScore` is in [0, 1]; higher = more genuine banking intent, so
 * LOW scores are the ones that deserve analyst attention.
 */

import type { AnalystResult } from "./constants";

export interface ElahDisplayThresholds {
  /** elahScore strictly below this → `review`. */
  reviewBelow: number;
  /** elahScore strictly below this (and >= reviewBelow) → `watch`. */
  watchBelow: number;
}

export const SCORE_BANDS = ["review", "watch", "clear", "unscored"] as const;
export type ScoreBand = (typeof SCORE_BANDS)[number];

export const DEFAULT_DISPLAY_THRESHOLDS: Readonly<ElahDisplayThresholds> = Object.freeze({
  reviewBelow: 0.4,
  watchBelow: 0.7,
});

/**
 * Band for a score in [0, 1]. `null` / non-finite → `unscored`.
 * `score < reviewBelow` → review; `score < watchBelow` → watch; else clear.
 */
export function bandForScore(
  score: number | null | undefined,
  thresholds: ElahDisplayThresholds = DEFAULT_DISPLAY_THRESHOLDS,
): ScoreBand {
  if (typeof score !== "number" || !Number.isFinite(score)) return "unscored";
  if (score < thresholds.reviewBelow) return "review";
  if (score < thresholds.watchBelow) return "watch";
  return "clear";
}

function toThresholdNumber(value: unknown): number | null {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

/** Validate `{ reviewBelow, watchBelow }`: both in [0, 1], reviewBelow <= watchBelow. Rounds to 3 dp. */
export function validateThresholds(input: unknown): AnalystResult<ElahDisplayThresholds> {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "thresholds must be an object." };
  }
  const obj = input as Record<string, unknown>;
  const reviewBelow = toThresholdNumber(obj.reviewBelow);
  const watchBelow = toThresholdNumber(obj.watchBelow);
  if (reviewBelow == null || reviewBelow < 0 || reviewBelow > 1) {
    return { ok: false, error: "reviewBelow must be a number between 0 and 1." };
  }
  if (watchBelow == null || watchBelow < 0 || watchBelow > 1) {
    return { ok: false, error: "watchBelow must be a number between 0 and 1." };
  }
  if (reviewBelow > watchBelow) {
    return { ok: false, error: "reviewBelow must be less than or equal to watchBelow." };
  }
  const round3 = (n: number) => Math.round(n * 1000) / 1000;
  return { ok: true, value: { reviewBelow: round3(reviewBelow), watchBelow: round3(watchBelow) } };
}

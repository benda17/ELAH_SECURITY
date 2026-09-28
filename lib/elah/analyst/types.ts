/**
 * Shared analyst row types + pure row builder. Client-safe (type-only imports).
 */

import type { ElahEvent } from "@/lib/elah/envelope";
import type { QualityResult } from "@/lib/elah/quality";
import type { ElahScoreSnapshot } from "@/lib/elah/score-read";
import { bandForScore, type ElahDisplayThresholds, type ScoreBand } from "./bands";
import type { OutcomeMark, ReviewStatus } from "./constants";

/** Latest-wins review state for one event (defaults when never touched). */
export interface EventReviewState {
  eventId: string;
  reviewStatus: ReviewStatus;
  outcomeMark: OutcomeMark | null;
  noteCount: number;
  feedbackCount: number;
  /** ISO time of the newest analyst row for this event, or null. */
  lastActivityAt: string | null;
}

/** `none` = no score row yet; `unavailable` = scorer failed open. */
export type AnalystScoreStatus = "scored" | "abstained" | "unavailable" | "none";

/**
 * One analyst list row: ElahEvent envelope + quality + latest score snapshot +
 * latest review state. Score fields are joined here, NEVER onto `event`.
 */
export interface AnalystEventRow {
  auditLogId: string;
  event: ElahEvent;
  quality: QualityResult;
  score: ElahScoreSnapshot | null;
  scoreStatus: AnalystScoreStatus;
  /** 0-1, higher = more genuine banking intent. Analyst UI only. */
  elahScore: number | null;
  confidence: number | null;
  uncertainty: number | null;
  intentLabel: string | null;
  /** `provenance.scorer` (e.g. `rules_v0`). */
  scorer: string | null;
  /** `provenance.modelVersion` when set, else the scorer name (e.g. `rules_v0`). */
  modelVersion: string | null;
  band: ScoreBand;
  review: EventReviewState;
}

/** Default review state for an event with no analyst rows. */
export function emptyReviewState(eventId: string): EventReviewState {
  return {
    eventId,
    reviewStatus: "unreviewed",
    outcomeMark: null,
    noteCount: 0,
    feedbackCount: 0,
    lastActivityAt: null,
  };
}

/** Pure join of an ingestible event with its score snapshot + review state. */
export function buildAnalystRow(
  listed: { event: ElahEvent; quality: QualityResult; auditLogId: string },
  score: ElahScoreSnapshot | null,
  review: EventReviewState | null | undefined,
  thresholds: ElahDisplayThresholds,
): AnalystEventRow {
  const scored = score?.kind === "scored" ? score : null;
  const elahScore = scored?.elahScore ?? null;
  const scoreStatus: AnalystScoreStatus = !score
    ? "none"
    : score.kind === "unavailable"
      ? "unavailable"
      : score.status;
  return {
    auditLogId: listed.auditLogId,
    event: listed.event,
    quality: listed.quality,
    score,
    scoreStatus,
    elahScore,
    confidence: scored?.confidence ?? null,
    uncertainty: scored?.uncertainty ?? null,
    intentLabel: scored?.intentLabel ?? null,
    scorer: scored?.provenanceScorer ?? null,
    modelVersion: scored ? (scored.provenanceModelVersion ?? scored.provenanceScorer) : null,
    band: bandForScore(elahScore, thresholds),
    review: review ?? emptyReviewState(listed.event.eventId),
  };
}

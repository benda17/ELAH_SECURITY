import { describe, expect, it } from "vitest";
import { computeDashboardStats } from "@/lib/elah/analyst/stats";
import { DEFAULT_DISPLAY_THRESHOLDS } from "@/lib/elah/analyst/bands";
import type { ElahScoreSnapshot } from "@/lib/elah/score-read";
import { makeRow, scored } from "./analyst-helpers";

const unavailable: ElahScoreSnapshot = {
  kind: "unavailable",
  eventType: "elah_scoring_unavailable",
  status: "unavailable",
  reason: "timeout",
  requestId: null,
  httpStatus: null,
  errorCode: null,
};

function rows() {
  return [
    makeRow({
      event: { eventId: "evt_s_0001", occurredAt: "2026-09-28T07:10:00.000Z" },
      score: scored(0.2, { confidence: 0.6 }),
      review: { reviewStatus: "reviewed", outcomeMark: "false_positive" },
    }),
    makeRow({
      event: { eventId: "evt_s_0002", occurredAt: "2026-09-28T07:50:00.000Z", source: "ui", actionType: "login", conversation: undefined },
      score: scored(0.5, { confidence: 0.8, status: "abstained" }),
      review: { reviewStatus: "escalated", outcomeMark: "false_negative" },
    }),
    makeRow({
      event: { eventId: "evt_s_0003", occurredAt: "2026-09-28T09:05:00.000Z" },
      score: scored(0.9, { confidence: 1 }),
      review: { outcomeMark: "confirmed_correct" },
    }),
    makeRow({
      event: { eventId: "evt_s_0004", occurredAt: "2026-09-28T09:30:00.000Z", source: "system" },
      score: unavailable,
    }),
    makeRow({
      event: { eventId: "evt_s_0005", occurredAt: "2026-09-28T09:45:00.000Z" },
      score: null,
    }),
  ];
}

describe("computeDashboardStats", () => {
  it("counts totals, bands, sources, actions, review status, and marks", () => {
    const stats = computeDashboardStats(rows(), DEFAULT_DISPLAY_THRESHOLDS);
    expect(stats.total).toBe(5);
    expect(stats.scored).toBe(3);
    expect(stats.unscored).toBe(2);
    expect(stats.abstained).toBe(1);
    expect(stats.unavailable).toBe(1);
    expect(stats.noScore).toBe(1);
    expect(stats.byBand).toEqual({ review: 1, watch: 1, clear: 1, unscored: 2 });
    expect(stats.bySource).toEqual({ agent: 3, ui: 1, system: 1 });
    expect(stats.byActionType).toEqual({ external_transfer: 4, login: 1 });
    expect(stats.byReviewStatus).toEqual({
      unreviewed: 3,
      in_review: 0,
      reviewed: 1,
      escalated: 1,
    });
    expect(stats.falsePositives).toBe(1);
    expect(stats.falseNegatives).toBe(1);
    expect(stats.confirmedCorrect).toBe(1);
    expect(stats.averageScore).toBe(0.533);
    expect(stats.averageConfidence).toBe(0.8);
  });

  it("recomputes bands with the supplied thresholds", () => {
    const stats = computeDashboardStats(rows(), { reviewBelow: 0.6, watchBelow: 0.95 });
    expect(stats.byBand).toEqual({ review: 2, watch: 1, clear: 0, unscored: 2 });
  });

  it("uses hourly buckets for <= 48h and fills gaps", () => {
    const stats = computeDashboardStats(rows(), DEFAULT_DISPLAY_THRESHOLDS);
    expect(stats.series.granularity).toBe("hour");
    expect(stats.series.buckets.map((b) => b.start)).toEqual([
      "2026-09-28T07:00:00.000Z",
      "2026-09-28T08:00:00.000Z",
      "2026-09-28T09:00:00.000Z",
    ]);
    expect(stats.series.buckets.map((b) => b.count)).toEqual([2, 0, 3]);
    expect(stats.series.buckets[0]!.meanScore).toBe(0.35);
    expect(stats.series.buckets[1]!.meanScore).toBeNull();
    expect(stats.series.buckets[2]!.scoredCount).toBe(1);
  });

  it("uses daily buckets for wider ranges", () => {
    const stats = computeDashboardStats(rows(), DEFAULT_DISPLAY_THRESHOLDS, {
      from: new Date("2026-09-21T12:00:00.000Z"),
      now: new Date("2026-09-28T12:00:00.000Z"),
    });
    expect(stats.series.granularity).toBe("day");
    expect(stats.series.buckets).toHaveLength(8);
    expect(stats.series.buckets.at(-1)).toMatchObject({
      start: "2026-09-28T00:00:00.000Z",
      count: 5,
    });
  });

  it("handles empty input", () => {
    const stats = computeDashboardStats([], DEFAULT_DISPLAY_THRESHOLDS, {
      now: new Date("2026-09-28T12:00:00.000Z"),
    });
    expect(stats.total).toBe(0);
    expect(stats.averageScore).toBeNull();
    expect(stats.series.granularity).toBe("hour");
    expect(stats.series.buckets).toEqual([
      { start: "2026-09-28T12:00:00.000Z", count: 0, scoredCount: 0, meanScore: null },
    ]);
  });
});

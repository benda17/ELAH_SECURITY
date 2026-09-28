import { describe, expect, it } from "vitest";
import { DEFAULT_DISPLAY_THRESHOLDS } from "@/lib/elah/analyst/bands";
import { parseAnalystFilters } from "@/lib/elah/analyst/filters";
import { computeDashboardStats } from "@/lib/elah/analyst/stats";
import {
  activeNarrowingFilters,
  bandCounts,
  binBand,
  computeDashboardExtras,
  eventsHref,
  formatPct,
  histogram,
  isUncalibratedModel,
  meanConfidenceByBand,
  presetHref,
  riskIndicators,
  topEntries,
  withDefaultPreset,
} from "@/components/elah-analyst/dashboard/helpers";
import { makeRow, scored } from "./analyst-helpers";

function rows() {
  return [
    makeRow({
      event: { eventId: "evt_d_0001" },
      score: scored(0.1, { confidence: 0.4 }),
    }),
    makeRow({
      event: { eventId: "evt_d_0002" },
      score: scored(0.2, { confidence: 0.6 }),
      review: { reviewStatus: "in_review", outcomeMark: "false_positive" },
    }),
    makeRow({
      event: { eventId: "evt_d_0003" },
      score: scored(0.55, { confidence: null, provenanceModelVersion: "rules_v0@2" }),
      qualityOk: false,
    }),
    makeRow({
      event: { eventId: "evt_d_0004" },
      score: scored(0.95, { confidence: 1 }),
      review: { reviewStatus: "escalated", outcomeMark: "false_negative" },
    }),
    makeRow({ event: { eventId: "evt_d_0005" }, score: null }),
  ];
}

describe("computeDashboardExtras", () => {
  it("collects scored points, quality failures, unreviewed review-band, model versions", () => {
    const extras = computeDashboardExtras(rows(), new Date("2026-09-28T08:00:00.000Z"));
    expect(extras.generatedAt).toBe("2026-09-28T08:00:00.000Z");
    expect(extras.points).toEqual([
      { score: 0.1, confidence: 0.4 },
      { score: 0.2, confidence: 0.6 },
      { score: 0.55, confidence: null },
      { score: 0.95, confidence: 1 },
    ]);
    expect(extras.qualityFailures).toBe(1);
    expect(extras.reviewUnreviewed).toBe(1);
    expect(extras.modelVersions).toEqual({ rules_v0: 3, "rules_v0@2": 1 });
  });

  it("is empty for no rows", () => {
    const extras = computeDashboardExtras([]);
    expect(extras.points).toEqual([]);
    expect(extras.qualityFailures).toBe(0);
    expect(extras.reviewUnreviewed).toBe(0);
  });
});

describe("histogram", () => {
  it("bins over [0,1], puts 1.0 in the last bin, skips junk", () => {
    const bins = histogram([0, 0.05, 0.1, 0.3, 0.7, 0.99, 1, -0.1, 1.2, Number.NaN], 10);
    expect(bins).toHaveLength(10);
    expect(bins[0]).toEqual({ from: 0, to: 0.1, count: 2 });
    expect(bins[1].count).toBe(1);
    expect(bins[3].count).toBe(1);
    expect(bins[7].count).toBe(1);
    expect(bins[9].count).toBe(2);
    expect(bins.reduce((s, b) => s + b.count, 0)).toBe(7);
  });

  it("colours bins by midpoint band", () => {
    const bins = histogram([], 20);
    expect(binBand(bins[7], DEFAULT_DISPLAY_THRESHOLDS)).toBe("review");
    expect(binBand(bins[8], DEFAULT_DISPLAY_THRESHOLDS)).toBe("watch");
    expect(binBand(bins[14], DEFAULT_DISPLAY_THRESHOLDS)).toBe("clear");
  });
});

describe("bandCounts / meanConfidenceByBand", () => {
  it("re-buckets scores under draft thresholds without touching scores", () => {
    const scores = [0.1, 0.35, 0.5, 0.69, 0.7, 0.9];
    expect(bandCounts(scores, DEFAULT_DISPLAY_THRESHOLDS)).toEqual({ review: 2, watch: 2, clear: 2 });
    expect(bandCounts(scores, { reviewBelow: 0.5, watchBelow: 0.9 })).toEqual({ review: 2, watch: 3, clear: 1 });
    expect(scores).toEqual([0.1, 0.35, 0.5, 0.69, 0.7, 0.9]);
  });

  it("averages confidence per band, ignoring nulls", () => {
    const out = meanConfidenceByBand(
      [
        { score: 0.1, confidence: 0.4 },
        { score: 0.2, confidence: 0.6 },
        { score: 0.5, confidence: null },
      ],
      DEFAULT_DISPLAY_THRESHOLDS,
    );
    expect(out.review).toEqual({ mean: 0.5, n: 2 });
    expect(out.watch).toEqual({ mean: null, n: 0 });
  });
});

describe("links and filters", () => {
  it("defaults to 24h only when no range is given", () => {
    expect(withDefaultPreset({})).toEqual({ preset: "24h" });
    expect(withDefaultPreset({ preset: "7d" })).toEqual({ preset: "7d" });
    expect(withDefaultPreset({ from: "2026-09-01T00:00:00.000Z" })).toEqual({ from: "2026-09-01T00:00:00.000Z" });
  });

  it("builds events links that round-trip through parseAnalystFilters", () => {
    const base = { preset: "24h" as const, source: "agent" as const, limit: 1000 };
    const href = eventsHref(base, { band: "review", reviewStatus: "unreviewed" });
    expect(href).toBe("/admin/elah-events?preset=24h&source=agent&reviewStatus=unreviewed&band=review");
    expect(parseAnalystFilters(href.split("?")[1])).toEqual({
      preset: "24h",
      source: "agent",
      reviewStatus: "unreviewed",
      band: "review",
    });
    expect(eventsHref(base, { source: undefined })).toBe("/admin/elah-events?preset=24h");
    expect(eventsHref({})).toBe("/admin/elah-events");
  });

  it("preset links keep narrowing filters and drop explicit dates", () => {
    expect(presetHref({ preset: "24h", source: "ui", from: "2026-09-01T00:00:00.000Z" }, "7d")).toBe(
      "/admin/elah-dashboard?preset=7d&source=ui",
    );
    expect(activeNarrowingFilters({ preset: "24h", source: "ui", limit: 5 })).toEqual([["source", "ui"]]);
  });
});

describe("riskIndicators", () => {
  it("derives triage counts with filtered links", () => {
    const r = rows();
    const stats = computeDashboardStats(r, DEFAULT_DISPLAY_THRESHOLDS, {
      from: new Date("2026-09-28T00:00:00.000Z"),
      to: new Date("2026-09-28T12:00:00.000Z"),
    });
    const extras = computeDashboardExtras(r);
    const byKey = Object.fromEntries(
      riskIndicators(stats, extras, { preset: "24h" }).map((i) => [i.key, i]),
    );
    expect(byKey.review.value).toBe(2);
    expect(byKey.review.level).toBe("attention");
    expect(byKey.review_unreviewed.value).toBe(1);
    expect(byKey.review_unreviewed.href).toBe(
      "/admin/elah-events?preset=24h&reviewStatus=unreviewed&band=review",
    );
    expect(byKey.escalated.value).toBe(1);
    expect(byKey.false_positive.value).toBe(1);
    expect(byKey.false_negative.value).toBe(1);
    expect(byKey.unavailable.value).toBe(0);
    expect(byKey.unavailable.level).toBe("ok");
    expect(byKey.unavailable.href).toBeNull();
    expect(byKey.unscored.value).toBe(1);
    expect(byKey.unscored.level).toBe("info");
    expect(byKey.quality.value).toBe(1);
    expect(byKey.quality.href).toBe("/admin/elah-events?preset=24h&quality=fail");
  });
});

describe("formatting", () => {
  it("formats percentages and handles empty denominators", () => {
    expect(formatPct(1, 3)).toBe("33%");
    expect(formatPct(1, 200)).toBe("0.5%");
    expect(formatPct(0, 5)).toBe("0%");
    expect(formatPct(1, 0)).toBe("—");
  });

  it("labels rules_v0 as uncalibrated", () => {
    expect(isUncalibratedModel("rules_v0")).toBe(true);
    expect(isUncalibratedModel("rules_v0@2")).toBe(true);
    expect(isUncalibratedModel("calibrated_v1")).toBe(false);
    expect(isUncalibratedModel(null)).toBe(false);
  });

  it("sorts top entries by count then key", () => {
    expect(topEntries({ b: 2, a: 2, c: 5, z: 0 }, 2)).toEqual([
      ["c", 5],
      ["a", 2],
    ]);
  });
});

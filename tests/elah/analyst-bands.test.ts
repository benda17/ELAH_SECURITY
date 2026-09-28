import { describe, expect, it } from "vitest";
import {
  DEFAULT_DISPLAY_THRESHOLDS,
  bandForScore,
  validateThresholds,
} from "@/lib/elah/analyst/bands";

describe("bandForScore", () => {
  it("uses defaults review < 0.4 <= watch < 0.7 <= clear", () => {
    expect(DEFAULT_DISPLAY_THRESHOLDS).toEqual({ reviewBelow: 0.4, watchBelow: 0.7 });
    expect(bandForScore(0)).toBe("review");
    expect(bandForScore(0.399)).toBe("review");
    expect(bandForScore(0.4)).toBe("watch");
    expect(bandForScore(0.699)).toBe("watch");
    expect(bandForScore(0.7)).toBe("clear");
    expect(bandForScore(1)).toBe("clear");
  });

  it("returns unscored for missing or non-finite scores", () => {
    expect(bandForScore(null)).toBe("unscored");
    expect(bandForScore(undefined)).toBe("unscored");
    expect(bandForScore(Number.NaN)).toBe("unscored");
    expect(bandForScore(Number.POSITIVE_INFINITY)).toBe("unscored");
  });

  it("respects custom thresholds without changing the score", () => {
    const thresholds = { reviewBelow: 0.2, watchBelow: 0.9 };
    const score = 0.5;
    expect(bandForScore(score, thresholds)).toBe("watch");
    expect(bandForScore(0.1, thresholds)).toBe("review");
    expect(bandForScore(0.95, thresholds)).toBe("clear");
    expect(score).toBe(0.5);
  });

  it("collapses the watch band when thresholds are equal", () => {
    const thresholds = { reviewBelow: 0.5, watchBelow: 0.5 };
    expect(bandForScore(0.49, thresholds)).toBe("review");
    expect(bandForScore(0.5, thresholds)).toBe("clear");
  });
});

describe("validateThresholds", () => {
  it("accepts valid thresholds and rounds to 3 dp", () => {
    expect(validateThresholds({ reviewBelow: 0.33333, watchBelow: "0.8" })).toEqual({
      ok: true,
      value: { reviewBelow: 0.333, watchBelow: 0.8 },
    });
  });

  it.each([
    [null],
    [{}],
    [{ reviewBelow: -0.1, watchBelow: 0.5 }],
    [{ reviewBelow: 0.2, watchBelow: 1.5 }],
    [{ reviewBelow: 0.8, watchBelow: 0.5 }],
    [{ reviewBelow: "abc", watchBelow: 0.5 }],
    [{ reviewBelow: Number.NaN, watchBelow: 0.5 }],
  ])("rejects %j", (input) => {
    expect(validateThresholds(input).ok).toBe(false);
  });
});

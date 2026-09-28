import { describe, expect, it } from "vitest";
import {
  clamp01,
  complementaryUncertainty,
  normalizeCoordinates,
  normalizeUnitInterval,
  round3,
} from "@/lib/elah/baseline";

describe("clamp01", () => {
  it("clamps below 0 and above 1", () => {
    expect(clamp01(-0.2)).toBe(0);
    expect(clamp01(1.4)).toBe(1);
    expect(clamp01(0)).toBe(0);
    expect(clamp01(1)).toBe(1);
  });

  it("leaves in-range values unchanged", () => {
    expect(clamp01(0.08)).toBe(0.08);
    expect(clamp01(0.87)).toBe(0.87);
  });

  it("maps non-finite values to 0", () => {
    expect(clamp01(Number.NaN)).toBe(0);
    expect(clamp01(Number.POSITIVE_INFINITY)).toBe(0);
    expect(clamp01(Number.NEGATIVE_INFINITY)).toBe(0);
  });
});

describe("round3", () => {
  it("rounds to three decimal places", () => {
    expect(round3(0.1234)).toBe(0.123);
    expect(round3(0.08)).toBe(0.08);
    expect(round3(0.87)).toBe(0.87);
    expect(round3(0.125)).toBe(0.125);
  });
});

describe("normalizeUnitInterval", () => {
  it("clamps then rounds", () => {
    expect(normalizeUnitInterval(-1)).toBe(0);
    expect(normalizeUnitInterval(2)).toBe(1);
    expect(normalizeUnitInterval(0.1234)).toBe(0.123);
  });
});

describe("complementaryUncertainty", () => {
  it("equals round3(1 - clamp01(confidence))", () => {
    for (const confidence of [0, 0.08, 0.35, 0.48, 0.82, 0.91, 1, 1.2, -0.1]) {
      const c = normalizeUnitInterval(confidence);
      const u = complementaryUncertainty(confidence);
      expect(u).toBe(round3(1 - c));
      expect(Math.abs(c + u - 1)).toBeLessThanOrEqual(0.001);
    }
  });

  it("matches Phase 3 fixture pairs", () => {
    expect(complementaryUncertainty(0.82)).toBe(0.18);
    expect(complementaryUncertainty(0.91)).toBe(0.09);
    expect(complementaryUncertainty(0.88)).toBe(0.12);
    expect(complementaryUncertainty(0.35)).toBe(0.65);
  });
});

describe("normalizeCoordinates", () => {
  it("clamps and rounds each axis independently", () => {
    expect(
      normalizeCoordinates({
        humanAgency: 1.2,
        financialRisk: -0.1,
        emotionalUrgency: 0.3512,
      }),
    ).toEqual({
      humanAgency: 1,
      financialRisk: 0,
      emotionalUrgency: 0.351,
    });
  });
});

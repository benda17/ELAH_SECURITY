import { describe, expect, it } from "vitest";
import {
  BUBBLE_RADIUS,
  DEFAULT_PLOT,
  axisLevel,
  confidenceOpacity,
  projectPoint,
  regionReading,
  toPlotX,
  toPlotY,
} from "@/components/elah-analyst/detail/coordinates";

describe("plot mapping", () => {
  const { width, height, padding } = DEFAULT_PLOT;

  it("maps X = Human Agency left→right and Y = Financial Risk bottom→top", () => {
    expect(toPlotX(0)).toBe(padding);
    expect(toPlotX(1)).toBe(width - padding);
    expect(toPlotY(0)).toBe(height - padding);
    expect(toPlotY(1)).toBe(padding);
    expect(toPlotX(0.5)).toBe(width / 2);
  });

  it("clamps out-of-range values for drawing only", () => {
    expect(toPlotX(-1)).toBe(toPlotX(0));
    expect(toPlotY(2)).toBe(toPlotY(1));
  });
});

describe("projectPoint", () => {
  it("returns null when HA or FR is missing (never invents a point)", () => {
    expect(projectPoint(null)).toBeNull();
    expect(projectPoint({ humanAgency: null, financialRisk: 0.5, emotionalUrgency: 0.2 })).toBeNull();
    expect(projectPoint({ humanAgency: 0.5, financialRisk: null, emotionalUrgency: 0.2 })).toBeNull();
  });

  it("uses Z for bubble size, confidence for opacity, abstain for hollow", () => {
    const p = projectPoint(
      { humanAgency: 0.7, financialRisk: 0.74, emotionalUrgency: 1 },
      { confidence: 1, abstained: true },
    )!;
    expect(p.cx).toBeCloseTo(toPlotX(0.7));
    expect(p.cy).toBeCloseTo(toPlotY(0.74));
    expect(p.r).toBe(BUBBLE_RADIUS.max);
    expect(p.opacity).toBe(1);
    expect(p.hollow).toBe(true);
    expect(p.clamped).toBe(false);
    expect(p.zMissing).toBe(false);

    const low = projectPoint({ humanAgency: 0.1, financialRisk: 0.1, emotionalUrgency: 0 })!;
    expect(low.r).toBe(BUBBLE_RADIUS.min);
    expect(low.hollow).toBe(false);
  });

  it("flags missing Z and clamped values", () => {
    const p = projectPoint({ humanAgency: 1.2, financialRisk: 0.5, emotionalUrgency: null })!;
    expect(p.zMissing).toBe(true);
    expect(p.r).toBe(BUBBLE_RADIUS.unknownZ);
    expect(p.clamped).toBe(true);
    expect(p.cx).toBe(toPlotX(1));
  });

  it("does not move an abstained point", () => {
    const coords = { humanAgency: 0.35, financialRisk: 0.25, emotionalUrgency: 0.3 };
    const a = projectPoint(coords, { abstained: true })!;
    const s = projectPoint(coords, { abstained: false })!;
    expect([a.cx, a.cy, a.r]).toEqual([s.cx, s.cy, s.r]);
  });
});

describe("confidenceOpacity", () => {
  it("maps [0,1] to [0.3,1] and defaults unknown to 0.6", () => {
    expect(confidenceOpacity(0)).toBe(0.3);
    expect(confidenceOpacity(1)).toBe(1);
    expect(confidenceOpacity(0.5)).toBe(0.65);
    expect(confidenceOpacity(null)).toBe(0.6);
    expect(confidenceOpacity(Number.NaN)).toBe(0.6);
  });
});

describe("axis readings", () => {
  it("buckets levels", () => {
    expect(axisLevel(0.39)).toBe("low");
    expect(axisLevel(0.4)).toBe("mid");
    expect(axisLevel(0.6)).toBe("mid");
    expect(axisLevel(0.61)).toBe("high");
    expect(axisLevel(null)).toBeNull();
  });

  it("reads Phase 7 regions and never uses enforcement words", () => {
    const injection = regionReading({ humanAgency: 0.15, financialRisk: 0.88, emotionalUrgency: 0.28 });
    const transfer = regionReading({ humanAgency: 0.8, financialRisk: 0.75, emotionalUrgency: 0.3 });
    const read = regionReading({ humanAgency: 0.7, financialRisk: 0.1, emotionalUrgency: 0.2 });
    const offDomain = regionReading({ humanAgency: 0.12, financialRisk: 0.08, emotionalUrgency: 0.1 });
    const mixed = regionReading({ humanAgency: 0.5, financialRisk: 0.9, emotionalUrgency: 0.1 });
    expect(injection).toMatch(/^Low agency, high financial risk/);
    expect(transfer).toMatch(/^High agency, high financial risk/);
    expect(read).toMatch(/^High agency, low financial risk/);
    expect(offDomain).toMatch(/^Low agency, low financial risk/);
    expect(mixed).toMatch(/^Mixed region/);
    for (const text of [injection, transfer, read, offDomain, mixed]) {
      expect(text).not.toMatch(/\b(allow|block|deny|fraud)/i);
    }
    expect(regionReading(null)).toBeNull();
    expect(regionReading({ humanAgency: null, financialRisk: 0.5, emotionalUrgency: null })).toBeNull();
  });
});

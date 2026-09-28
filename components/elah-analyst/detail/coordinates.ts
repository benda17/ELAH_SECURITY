import type { ElahScoreCoordinates } from "@/lib/elah/score-read";

/**
 * Pure projection of a stored ELAH coordinate onto the Phase 7 2-D plot
 * (ELAH-P7-DIM-001 G3): X = Human Agency, Y = Financial Risk, Z (Emotional
 * Urgency) = bubble size, confidence = opacity, abstained = hollow glyph.
 * Coordinates are plotted verbatim from the snapshot (clamped to the unit
 * square only for drawing); nothing is inferred when they are missing.
 * `elahScore` is never an axis (G9).
 */

export interface PlotGeometry {
  width: number;
  height: number;
  padding: number;
}

export const DEFAULT_PLOT: Readonly<PlotGeometry> = Object.freeze({
  width: 320,
  height: 320,
  padding: 40,
});

export const BUBBLE_RADIUS = Object.freeze({ min: 6, max: 18, unknownZ: 8 });

export interface ProjectedPoint {
  cx: number;
  cy: number;
  r: number;
  opacity: number;
  hollow: boolean;
  /** True when a stored value was outside [0,1] and was clamped for drawing. */
  clamped: boolean;
  /** True when emotionalUrgency is missing (default bubble size used). */
  zMissing: boolean;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Map a [0,1] axis value to SVG x (left → right). */
export function toPlotX(value: number, geometry: PlotGeometry = DEFAULT_PLOT): number {
  return geometry.padding + clamp01(value) * (geometry.width - geometry.padding * 2);
}

/** Map a [0,1] axis value to SVG y (bottom → top). */
export function toPlotY(value: number, geometry: PlotGeometry = DEFAULT_PLOT): number {
  return geometry.height - geometry.padding - clamp01(value) * (geometry.height - geometry.padding * 2);
}

/** Confidence → opacity in [0.3, 1]; unknown confidence → 0.6. */
export function confidenceOpacity(confidence: number | null | undefined): number {
  if (typeof confidence !== "number" || !Number.isFinite(confidence)) return 0.6;
  return Math.round((0.3 + 0.7 * clamp01(confidence)) * 1000) / 1000;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Project a snapshot point. Returns null when Human Agency or Financial Risk
 * is missing — the plot must not invent a position.
 */
export function projectPoint(
  coordinates: ElahScoreCoordinates | null | undefined,
  options: { confidence?: number | null; abstained?: boolean; geometry?: PlotGeometry } = {},
): ProjectedPoint | null {
  if (!coordinates) return null;
  const { humanAgency, financialRisk, emotionalUrgency } = coordinates;
  if (!isFiniteNumber(humanAgency) || !isFiniteNumber(financialRisk)) return null;
  const geometry = options.geometry ?? DEFAULT_PLOT;
  const zMissing = !isFiniteNumber(emotionalUrgency);
  const values = zMissing ? [humanAgency, financialRisk] : [humanAgency, financialRisk, emotionalUrgency];
  const clamped = values.some((value) => value < 0 || value > 1);
  const r = zMissing
    ? BUBBLE_RADIUS.unknownZ
    : BUBBLE_RADIUS.min + clamp01(emotionalUrgency) * (BUBBLE_RADIUS.max - BUBBLE_RADIUS.min);
  return {
    cx: toPlotX(humanAgency, geometry),
    cy: toPlotY(financialRisk, geometry),
    r: Math.round(r * 100) / 100,
    opacity: confidenceOpacity(options.confidence),
    hollow: options.abstained === true,
    clamped,
    zMissing,
  };
}

export type AxisLevel = "low" | "mid" | "high";

/** Coarse display bucket: < 0.4 low, > 0.6 high, else mid. */
export function axisLevel(value: number | null | undefined): AxisLevel | null {
  if (!isFiniteNumber(value)) return null;
  if (value < 0.4) return "low";
  if (value > 0.6) return "high";
  return "mid";
}

/**
 * X/Y region reading from ELAH-P7-AXES-001 §6, adapted to the banking demo.
 * A deterministic function of the stored point — not a verdict, and high
 * Financial Risk is "harm if the tool ran", never "fraud" or "deny".
 */
export function regionReading(coordinates: ElahScoreCoordinates | null | undefined): string | null {
  if (!coordinates) return null;
  const x = axisLevel(coordinates.humanAgency);
  const y = axisLevel(coordinates.financialRisk);
  if (!x || !y) return null;
  if (x === "mid" || y === "mid") return "Mixed region: ambiguous or moderate-impact request.";
  if (x === "high" && y === "low") return "High agency, low financial risk: deliberate, lower-impact banking act (e.g. a read).";
  if (x === "high" && y === "high") return "High agency, high financial risk: deliberate high-impact act (e.g. a transfer or payment).";
  if (x === "low" && y === "high") return "Low agency, high financial risk: steered or hostile high-harm attempt region.";
  return "Low agency, low financial risk: off-domain or empty request region.";
}

export const AXES = [
  {
    key: "humanAgency",
    short: "HA",
    label: "Human Agency",
    plot: "X",
    low: "Vague, coerced, bot-like, or injection-steered",
    high: "Deliberate, specific, ordinary banking act",
  },
  {
    key: "financialRisk",
    short: "FR",
    label: "Financial Risk",
    plot: "Y",
    low: "Read-only, little harm if the tool ran",
    high: "Money movement or sensitive change if the tool ran",
  },
  {
    key: "emotionalUrgency",
    short: "EU",
    label: "Emotional Urgency",
    plot: "Bubble size",
    low: "Calm, routine",
    high: "Pressure, panic, or haste in the request",
  },
] as const satisfies ReadonlyArray<{ key: keyof ElahScoreCoordinates } & Record<string, string>>;

/**
 * Unit-interval helpers for rules_v0 score fields.
 * Numbers are JSON-safe to 3 decimal places (output contract O12).
 */

export function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}

export function round3(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 1000) / 1000;
}

/** Clamp to [0, 1] then round to 3 decimal places. */
export function normalizeUnitInterval(n: number): number {
  return round3(clamp01(n));
}

/**
 * `uncertainty` MUST equal `round3(1 − confidence)` after both are
 * unit-normalized (output contract O5; abs error ≤ 0.001).
 */
export function complementaryUncertainty(confidence: number): number {
  return round3(1 - normalizeUnitInterval(confidence));
}

export function normalizeCoordinates(input: {
  humanAgency: number;
  financialRisk: number;
  emotionalUrgency: number;
}): {
  humanAgency: number;
  financialRisk: number;
  emotionalUrgency: number;
} {
  return {
    humanAgency: normalizeUnitInterval(input.humanAgency),
    financialRisk: normalizeUnitInterval(input.financialRisk),
    emotionalUrgency: normalizeUnitInterval(input.emotionalUrgency),
  };
}

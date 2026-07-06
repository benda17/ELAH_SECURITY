import type { IntentVector5 } from "./types";

export function computeIntentPoint(H: IntentVector5, B: IntentVector5, S: IntentVector5) {
  const [needAwareness, controlDesire, moneyMovement, protectionNeed, supportNeed] = H;
  const [, , , , productChange] = B;
  const [privacySensitivity, financialRisk, irreversibility, authDepth, anomalyScore] = S;

  const x =
    0.3 * controlDesire +
    0.25 * moneyMovement +
    0.2 * productChange +
    0.15 * supportNeed +
    0.1 * needAwareness;

  const y =
    0.3 * financialRisk +
    0.25 * privacySensitivity +
    0.2 * irreversibility +
    0.15 * authDepth +
    0.1 * anomalyScore;

  const z =
    0.35 * protectionNeed +
    0.25 * supportNeed +
    0.2 * financialRisk +
    0.1 * controlDesire +
    0.1 * anomalyScore;

  return {
    x: round3(x),
    y: round3(y),
    z: round3(z),
  };
}

export function riskLevelFromVectors(
  intentId: string,
  S: IntentVector5,
  y: number,
): "low" | "medium" | "high" | "critical" {
  if (intentId === "unsafe_prompt_injection") return "critical";
  const anomaly = S[4];
  if (y >= 0.72 || anomaly >= 0.85) return "critical";
  if (y >= 0.52 || anomaly >= 0.6) return "high";
  if (y >= 0.32) return "medium";
  return "low";
}

function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}

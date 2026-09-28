import { describe, expect, it } from "vitest";
import {
  calibrationReport,
  classifyMetricHooks,
  confusionMatrix,
  intentAccuracy,
  isFalseNegative,
  isFalsePositive,
  percentile,
  perLabelMetrics,
} from "@/lib/elah/baseline/metrics";
import type { ElahBankingIntent } from "@/lib/elah/types";

const EXT: ElahBankingIntent = "external_transfer";
const INJ: ElahBankingIntent = "prompt_injection_or_policy_bypass";
const AMB: ElahBankingIntent = "ambiguous_banking_request";

/**
 * Toy 4-row gold/pred pairs:
 *  1. genuine wire scored as wire (correct; not FP)
 *  2. genuine wire scored as injection (FP)
 *  3. injection scored as wire (FN)
 *  4. injection scored as injection (correct)
 */
const TOY_PAIRS = [
  { gold: EXT, pred: EXT },
  { gold: EXT, pred: INJ },
  { gold: INJ, pred: EXT },
  { gold: INJ, pred: INJ },
] as const;

describe("Phase 5 baseline metrics (toy 4-row)", () => {
  it("computes intent accuracy 0.5 on the toy set", () => {
    expect(intentAccuracy([...TOY_PAIRS])).toBe(0.5);
  });

  it("builds a confusion matrix of the four cells", () => {
    const cells = confusionMatrix([...TOY_PAIRS]);
    const lookup = (gold: ElahBankingIntent, pred: ElahBankingIntent) =>
      cells.find((cell) => cell.gold === gold && cell.pred === pred)?.count ?? 0;
    expect(lookup(EXT, EXT)).toBe(1);
    expect(lookup(EXT, INJ)).toBe(1);
    expect(lookup(INJ, EXT)).toBe(1);
    expect(lookup(INJ, INJ)).toBe(1);
  });

  it("reports per-label P/R/F1 and n/a for zero-support labels", () => {
    const { perLabel, zeroSupportLabels, macroF1 } = perLabelMetrics([...TOY_PAIRS]);
    const ext = perLabel.find((row) => row.intent === EXT);
    const inj = perLabel.find((row) => row.intent === INJ);
    const bal = perLabel.find((row) => row.intent === "balance_awareness");
    expect(ext).toMatchObject({ support: 2, precision: 0.5, recall: 0.5, f1: 0.5 });
    expect(inj).toMatchObject({ support: 2, precision: 0.5, recall: 0.5, f1: 0.5 });
    expect(bal).toMatchObject({
      support: 0,
      precision: "n/a",
      recall: "n/a",
      f1: "n/a",
    });
    expect(zeroSupportLabels).toContain("balance_awareness");
    expect(zeroSupportLabels).not.toContain(EXT);
    expect(macroF1).toBe(0.5);
  });

  it("flags FP only when a genuine/legitimate row is predicted injection", () => {
    expect(
      isFalsePositive({ goldPack: "legitimate", goldIntent: EXT, predIntent: INJ }),
    ).toBe(true);
    expect(
      isFalsePositive({ goldPack: "high_value_transfer", goldIntent: EXT, predIntent: INJ }),
    ).toBe(true);
    expect(
      isFalsePositive({ goldPack: "legitimate", goldIntent: EXT, predIntent: EXT }),
    ).toBe(false);
    expect(
      isFalsePositive({
        goldPack: "prompt_injection",
        goldIntent: INJ,
        predIntent: INJ,
      }),
    ).toBe(false);
  });

  it("does not treat high financialRisk on a genuine wire as an FP", () => {
    expect(
      isFalsePositive({
        goldPack: "high_value_transfer",
        goldIntent: EXT,
        predIntent: EXT,
      }),
    ).toBe(false);
  });

  it("flags FN only when injection gold is predicted as P0 money-movement", () => {
    expect(isFalseNegative({ goldIntent: INJ, predIntent: EXT })).toBe(true);
    expect(isFalseNegative({ goldIntent: INJ, predIntent: "bill_payment" })).toBe(true);
    expect(isFalseNegative({ goldIntent: INJ, predIntent: AMB })).toBe(false);
    expect(isFalseNegative({ goldIntent: EXT, predIntent: EXT })).toBe(false);
  });

  it("classifies metric hooks from gold pack and intent", () => {
    expect(classifyMetricHooks({ goldPack: "legitimate", goldIntent: EXT })).toEqual([
      "intent_accuracy",
      "legitimate_false_positive",
    ]);
    expect(
      classifyMetricHooks({
        goldPack: "prompt_injection",
        goldIntent: INJ,
      }),
    ).toEqual(["intent_accuracy", "injection_catch"]);
  });

  it("computes ECE and always marks rules_v0 uncalibrated (C10)", () => {
    const report = calibrationReport([
      { confidence: 0.9, correct: true },
      { confidence: 0.9, correct: false },
      { confidence: 0.2, correct: false },
      { confidence: 0.2, correct: true },
    ]);
    expect(report.uncalibrated).toBe(true);
    expect(report.ece).toBeCloseTo(0.35, 8);
    const perfect = calibrationReport([
      { confidence: 1, correct: true },
      { confidence: 1, correct: true },
    ]);
    expect(perfect.ece).toBe(0);
    expect(perfect.uncalibrated).toBe(true);
  });

  it("computes linear-interpolation percentiles", () => {
    expect(percentile([1, 2, 3, 4], 50)).toBe(2.5);
    expect(percentile([10], 95)).toBe(10);
    expect(percentile([], 50)).toBe(0);
  });
});

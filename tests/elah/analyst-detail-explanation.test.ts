import { describe, expect, it } from "vitest";
import {
  classifyHookRecommendation,
  confidenceWord,
  formatPercent,
  groupReasonCodes,
  hasAnyEvidence,
  isUncalibratedScorer,
  structuredAlternatives,
} from "@/components/elah-analyst/detail/explanation";
import type { ElahScoredSnapshot } from "@/lib/elah/score-read";

function snapshot(overrides: Partial<ElahScoredSnapshot> = {}): ElahScoredSnapshot {
  return {
    kind: "scored",
    eventType: "elah_scored",
    status: "scored",
    elahScore: 0.2,
    confidence: 0.6,
    uncertainty: 0.4,
    intentLabel: "prompt_injection_or_policy_bypass",
    coordinates: null,
    explanation: { matchedSignals: [], weakSignals: [], negativeSignals: [], summary: null },
    policyHook: { recommendation: "review", reasons: [] },
    requestId: null,
    scoredAt: null,
    provenanceScorer: "rules_v0",
    provenanceModelVersion: null,
    ...overrides,
  };
}

describe("groupReasonCodes", () => {
  it("dedupes RC_* codes in order and flags everything else verbatim", () => {
    const groups = groupReasonCodes(["RC_INTENT_INJECTION", "RC_LOW_CONF", "RC_INTENT_INJECTION", "deny", "RC_DENY", "odd_token", " "]);
    expect(groups.codes).toEqual(["RC_INTENT_INJECTION", "RC_LOW_CONF"]);
    expect(groups.forbidden).toEqual(["deny", "RC_DENY"]);
    expect(groups.nonconforming).toEqual(["odd_token"]);
  });
});

describe("classifyHookRecommendation", () => {
  it("accepts only the four hook values", () => {
    expect(classifyHookRecommendation(null)).toEqual({ kind: "missing" });
    expect(classifyHookRecommendation("step_up_hint")).toEqual({ kind: "known", value: "step_up_hint" });
    expect(classifyHookRecommendation("block")).toEqual({ kind: "unrecognized", value: "block" });
  });
});

describe("structuredAlternatives", () => {
  it("returns nothing when there is no structured disagreement", () => {
    expect(structuredAlternatives(snapshot({ intentLabel: "internal_transfer" }), { detectedIntent: "internal_transfer" })).toEqual([]);
    expect(structuredAlternatives(snapshot())).toEqual([]);
  });

  it("reports planner / classifier disagreement and counter-signals naming another label", () => {
    const lines = structuredAlternatives(
      snapshot({
        intentLabel: "external_transfer",
        explanation: {
          matchedSignals: [],
          weakSignals: [],
          negativeSignals: ["looks_like:internal_transfer", "ignore_previous_instructions", "self:external_transfer"],
          summary: null,
        },
      }),
      { detectedIntent: "bill_payment", classifierIntent: "internal_transfer" },
    );
    expect(lines).toEqual([
      { kind: "planner_disagreement", text: "Planner: bill_payment. ELAH: external_transfer." },
      { kind: "classifier_disagreement", text: "Simulator classifier: internal_transfer. ELAH: external_transfer." },
      { kind: "counter_signal", text: "Counter-signal: looks_like:internal_transfer." },
    ]);
  });

  it("does not duplicate the classifier line when it equals the planner label", () => {
    const lines = structuredAlternatives(snapshot({ intentLabel: "external_transfer" }), {
      detectedIntent: "bill_payment",
      classifierIntent: "bill_payment",
    });
    expect(lines).toHaveLength(1);
  });
});

describe("display helpers", () => {
  it("flags rules scorers as uncalibrated", () => {
    expect(isUncalibratedScorer("rules_v0")).toBe(true);
    expect(isUncalibratedScorer("intent_matrix")).toBe(true);
    expect(isUncalibratedScorer(null)).toBe(true);
    expect(isUncalibratedScorer("model")).toBe(false);
  });

  it("formats percent and confidence words", () => {
    expect(formatPercent(0.823)).toBe("82%");
    expect(formatPercent(null)).toBe("—");
    expect(confidenceWord(0.8)).toBe("High");
    expect(confidenceWord(0.5)).toBe("Moderate");
    expect(confidenceWord(0.1)).toBe("Low");
    expect(confidenceWord(null)).toBeNull();
  });

  it("detects whether any evidence exists", () => {
    expect(hasAnyEvidence(null)).toBe(false);
    expect(hasAnyEvidence(snapshot())).toBe(false);
    expect(hasAnyEvidence(snapshot({ policyHook: { recommendation: "review", reasons: ["RC_X"] } }))).toBe(true);
  });
});

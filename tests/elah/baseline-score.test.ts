import { describe, expect, it } from "vitest";
import {
  RC_ABSTAIN_LOW_CONFIDENCE,
  RC_INJECTION_OVERRIDE,
  RC_P0_EXTERNAL_TRANSFER,
  RC_PLANNED_TOOL,
  RC_POLICY_DENIED_NOT_ELAH,
  round3,
  scoreElahEvent,
} from "@/lib/elah/baseline";
import {
  ambiguousEvent,
  expectRecommendationNeverEnforces,
  injectionEvent,
  transferEvent,
} from "./fixtures";

describe("scoreElahEvent (rules_v0 baseline)", () => {
  it("scores prompt injection low with high confidence and review", () => {
    const { status, score } = scoreElahEvent(injectionEvent());
    expect(status).toBe("scored");
    expect(score.elahScore).toBeCloseTo(0.08, 1);
    expect(score.elahScore).toBeLessThan(0.2);
    expect(score.elahScore).toBeLessThanOrEqual(0.12);
    expect(score.confidence).toBeGreaterThanOrEqual(0.7);
    expect(score.intentLabel).toBe("prompt_injection_or_policy_bypass");
    expect(score.policyHook.recommendation).toBe("review");
    expectRecommendationNeverEnforces(score.policyHook.recommendation);
    expect(score.uncertainty).toBe(round3(1 - score.confidence));
    expect(score.policyHook.reasons).toContain(RC_INJECTION_OVERRIDE);
    expect(score.policyHook.reasons).toContain(RC_POLICY_DENIED_NOT_ELAH);
    expect(score.provenance).toEqual({
      scorer: "rules_v0",
      modelVersion: null,
      labelSource: "rules_v0",
    });
  });

  it("scores external transfer as genuine with watch or none, never deny", () => {
    const { status, score } = scoreElahEvent(transferEvent());
    expect(status).toBe("scored");
    expect(score.elahScore).toBeCloseTo(0.87, 1);
    expect(score.elahScore).toBeGreaterThanOrEqual(0.75);
    expect(score.intentLabel).toBe("external_transfer");
    expect(["watch", "none"]).toContain(score.policyHook.recommendation);
    expect(score.policyHook.recommendation).not.toBe("deny");
    expectRecommendationNeverEnforces(score.policyHook.recommendation);
    expect(score.uncertainty).toBe(round3(1 - score.confidence));
    expect(score.policyHook.reasons).toContain(RC_P0_EXTERNAL_TRANSFER);
    expect(score.policyHook.reasons).toContain(RC_PLANNED_TOOL);
  });

  it("abstains on an ambiguous short request with confidence < 0.40", () => {
    const { status, score } = scoreElahEvent(ambiguousEvent());
    expect(status).toBe("abstained");
    expect(score.confidence).toBeLessThan(0.4);
    expect(score.elahScore).toBeCloseTo(0.48, 1);
    expect(score.intentLabel).toBe("ambiguous_banking_request");
    expectRecommendationNeverEnforces(score.policyHook.recommendation);
    expect(score.uncertainty).toBe(round3(1 - score.confidence));
    expect(score.policyHook.reasons).toContain(RC_ABSTAIN_LOW_CONFIDENCE);
  });

  it("keeps coordinates independent of elahScore on high-value genuine transfer", () => {
    const event = transferEvent();
    event.action.amount = 15000;
    event.action.amountBucket = "very_large_10000_plus";
    const { status, score } = scoreElahEvent(event);
    expect(status).toBe("scored");
    expect(score.intentLabel).toBe("external_transfer");
    expect(score.elahScore).toBeGreaterThanOrEqual(0.75);
    expect(score.coordinates.financialRisk).toBeGreaterThan(0.78);
    expect(score.coordinates.financialRisk).toBeLessThanOrEqual(1);
    expect(["watch", "none"]).toContain(score.policyHook.recommendation);
  });

  it("drops humanAgency for injection without changing the Phase 3 atlas point", () => {
    const { score } = scoreElahEvent(injectionEvent());
    expect(score.coordinates).toEqual({
      humanAgency: 0.15,
      financialRisk: 0.92,
      emotionalUrgency: 0.25,
    });
  });

  it("never writes enforcement verbs into explanation summary", () => {
    for (const event of [injectionEvent(), transferEvent(), ambiguousEvent()]) {
      const { score } = scoreElahEvent(event);
      const summary = score.explanation.summary ?? "";
      expect(summary.length).toBeLessThanOrEqual(240);
      expect(summary).not.toMatch(/ELAH allowed|ELAH blocked/i);
      expect(score.policyHook.recommendation).not.toMatch(/allow|deny|block|confirm/);
    }
  });

  it("returns identical output for identical input", () => {
    const event = transferEvent();
    expect(scoreElahEvent(event)).toEqual(scoreElahEvent(event));
    expect(scoreElahEvent(injectionEvent())).toEqual(scoreElahEvent(injectionEvent()));
  });

  it("does not put enforcement fields on the score object", () => {
    const { score } = scoreElahEvent(injectionEvent());
    expect(score).not.toHaveProperty("decision");
    expect(score).not.toHaveProperty("allow");
    expect(score).not.toHaveProperty("deny");
    expect(score.policyHook).not.toHaveProperty("decision");
    expect(Object.keys(score.provenance).sort()).toEqual(
      ["labelSource", "modelVersion", "scorer"].sort(),
    );
  });
});

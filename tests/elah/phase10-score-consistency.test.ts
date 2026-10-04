import { describe, expect, it } from "vitest";
import { scoreElahEvent } from "@/lib/elah/baseline";
import { injectionEvent, transferEvent } from "./fixtures";

function coreScore(event: ReturnType<typeof transferEvent>) {
  const { status, score } = scoreElahEvent(event);
  return {
    status,
    elahScore: score.elahScore,
    confidence: score.confidence,
    uncertainty: score.uncertainty,
    intentLabel: score.intentLabel,
    coordinates: score.coordinates,
    recommendation: score.policyHook.recommendation,
    reasons: [...score.policyHook.reasons],
    scorer: score.provenance.scorer,
  };
}

describe("Phase 10 score consistency (rules_v0)", () => {
  it("scores the same transfer envelope identically three times", () => {
    const event = transferEvent();
    const a = coreScore(event);
    const b = coreScore(event);
    const c = coreScore(structuredClone(event));
    expect(a).toEqual(b);
    expect(b).toEqual(c);
    expect(a.scorer).toBe("rules_v0");
  });

  it("scores the same injection envelope identically three times", () => {
    const event = injectionEvent();
    const a = coreScore(event);
    const b = coreScore(event);
    const c = coreScore(structuredClone(event));
    expect(a).toEqual(b);
    expect(b).toEqual(c);
    expect(a.intentLabel).toBe("prompt_injection_or_policy_bypass");
  });
});

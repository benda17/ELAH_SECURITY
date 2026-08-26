import { describe, expect, it } from "vitest";
import {
  ambiguousEvent,
  asScore,
  expectRecommendationNeverEnforces,
  injectionEvent,
  invokeHandleScore,
  round3,
  scoreValidEvent,
  transferEvent,
  wrapScoreRequest,
} from "./fixtures";

describe("mock scorer (rules_v0)", () => {
  it("scores prompt injection low with high confidence and review, never deny/allow/block/confirm", async () => {
    const { status, body } = await scoreValidEvent(injectionEvent());
    expect(status).toBe(200);
    expect(body.status).toBe("scored");
    const score = asScore(body);
    expect(score.elahScore).toBeCloseTo(0.08, 1);
    expect(score.confidence).toBeGreaterThanOrEqual(0.7);
    expect(score.intentLabel).toBe("prompt_injection_or_policy_bypass");
    expect(score.policyHook.recommendation).toBe("review");
    expectRecommendationNeverEnforces(score.policyHook.recommendation);
    expect(score.uncertainty).toBeCloseTo(round3(1 - score.confidence), 3);
    expect(Math.abs(score.uncertainty - round3(1 - score.confidence))).toBeLessThanOrEqual(
      0.001,
    );
  });

  it("scores external transfer as genuine with watch or none, not deny", async () => {
    const { status, body } = await scoreValidEvent(transferEvent());
    expect(status).toBe(200);
    expect(body.status).toBe("scored");
    const score = asScore(body);
    expect(score.elahScore).toBeCloseTo(0.87, 1);
    expect(score.elahScore).toBeGreaterThanOrEqual(0.75);
    expect(score.intentLabel).toBe("external_transfer");
    expect(["watch", "none"]).toContain(score.policyHook.recommendation);
    expect(score.policyHook.recommendation).not.toBe("deny");
    expectRecommendationNeverEnforces(score.policyHook.recommendation);
    expect(Math.abs(score.uncertainty - round3(1 - score.confidence))).toBeLessThanOrEqual(
      0.001,
    );
  });

  it("abstains on an ambiguous short request with confidence < 0.40", async () => {
    const { status, body } = await scoreValidEvent(ambiguousEvent());
    expect(status).toBe(200);
    expect(body.status).toBe("abstained");
    const score = asScore(body);
    expect(score.confidence).toBeLessThan(0.4);
    expect(score.intentLabel).toBe("ambiguous_banking_request");
    expectRecommendationNeverEnforces(score.policyHook.recommendation);
    expect(Math.abs(score.uncertainty - round3(1 - score.confidence))).toBeLessThanOrEqual(
      0.001,
    );
  });

  it("sets uncertainty to round3(1 - confidence) on every mock path", async () => {
    for (const event of [injectionEvent(), transferEvent(), ambiguousEvent()]) {
      const { body } = await scoreValidEvent(event);
      const score = asScore(body);
      expect(score.uncertainty).toBe(round3(1 - score.confidence));
    }
  });

  it("does not put enforcement verbs on the score object", async () => {
    const request = wrapScoreRequest(injectionEvent());
    const { status, body } = await invokeHandleScore(
      {
        authorization: `Bearer ${process.env.ELAH_SERVICE_TOKEN}`,
        "content-type": "application/json",
      },
      JSON.stringify(request),
    );
    expect(status).toBe(200);
    const score = asScore(body);
    expect(score).not.toHaveProperty("decision");
    expect(score).not.toHaveProperty("allow");
    expect(score).not.toHaveProperty("deny");
    expect(score.policyHook).not.toHaveProperty("decision");
  });
});

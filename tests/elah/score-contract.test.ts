import { describe, expect, it } from "vitest";
import { ELAH_BANKING_INTENTS } from "@/lib/elah/types";
import {
  COORDINATE_KEYS,
  ELAH_SCORE_KEYS,
  EXPLANATION_KEYS,
  POLICY_HOOK_KEYS,
  POLICY_RECOMMENDATIONS,
  PROVENANCE_KEYS,
  SCORE_RESPONSE_KEYS,
  asScore,
  elahEventSample,
  expectAllowedKeys,
  expectRecommendationNeverEnforces,
  scoreValidEvent,
} from "./fixtures";

describe("ScoreResponse / ElahScore contract", () => {
  it("allows only the frozen top-level ScoreResponse keys", async () => {
    const { status, body } = await scoreValidEvent(elahEventSample("8.1"));
    expect(status).toBe(200);
    expectAllowedKeys(body, SCORE_RESPONSE_KEYS);
    expect(body.contractVersion).toBe("1.0");
    expect(body.status === "scored" || body.status === "abstained").toBe(true);
    expect(typeof body.scoredAt).toBe("string");
  });

  it("allows only the frozen ElahScore keys", async () => {
    const { body } = await scoreValidEvent(elahEventSample("8.1"));
    const score = asScore(body);
    expectAllowedKeys(score, ELAH_SCORE_KEYS);
    expect(score.elahScore).toBeGreaterThanOrEqual(0);
    expect(score.elahScore).toBeLessThanOrEqual(1);
    expect(score.confidence).toBeGreaterThanOrEqual(0);
    expect(score.confidence).toBeLessThanOrEqual(1);
    expect(score.uncertainty).toBeGreaterThanOrEqual(0);
    expect(score.uncertainty).toBeLessThanOrEqual(1);
    expect(ELAH_BANKING_INTENTS).toContain(score.intentLabel);
  });

  it("keeps policyHook.recommendation on the closed enum", async () => {
    const { body } = await scoreValidEvent(elahEventSample("8.1"));
    const score = asScore(body);
    expectAllowedKeys(score.policyHook, POLICY_HOOK_KEYS);
    expect(POLICY_RECOMMENDATIONS).toContain(score.policyHook.recommendation);
    expectRecommendationNeverEnforces(score.policyHook.recommendation);
    expect(Array.isArray(score.policyHook.reasons)).toBe(true);
  });

  it("keeps nested coordinate, explanation, and provenance objects closed", async () => {
    const { body } = await scoreValidEvent(elahEventSample("8.1"));
    const score = asScore(body);
    expectAllowedKeys(score.coordinates, COORDINATE_KEYS);
    expectAllowedKeys(score.explanation, EXPLANATION_KEYS, [
      "matchedSignals",
      "weakSignals",
      "negativeSignals",
    ]);
    expectAllowedKeys(score.provenance, PROVENANCE_KEYS);
    expect(Array.isArray(score.explanation.matchedSignals)).toBe(true);
    expect(Array.isArray(score.explanation.weakSignals)).toBe(true);
    expect(Array.isArray(score.explanation.negativeSignals)).toBe(true);
  });

  it("does not put elahScore on the envelope", async () => {
    const { body } = await scoreValidEvent(elahEventSample("8.1"));
    expect(body).not.toHaveProperty("elahScore");
    expect(body).not.toHaveProperty("policyHook");
    expect(asScore(body).elahScore).toEqual(expect.any(Number));
  });
});

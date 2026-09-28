import { describe, expect, it } from "vitest";
import { extractBaselineFeatures } from "@/lib/elah/baseline";
import {
  ambiguousEvent,
  elahEventSample,
  injectionEvent,
  transferEvent,
} from "./fixtures";

describe("extractBaselineFeatures", () => {
  it("extracts risk, agent, and chain features from the P0 transfer fixture", () => {
    const features = extractBaselineFeatures(transferEvent());
    expect(features.amountBucket).toBe("medium_500_1999");
    expect(features.recipientType).toBe("person_name");
    expect(features.policyDecision).toBe("needs_confirmation");
    expect(features.confirmationRequired).toBe(true);
    expect(features.highValue).toBe(false);
    expect(features.injectionLikely).toBe(false);
    expect(features.policyDenied).toBe(false);
    expect(features.source).toBe("agent");
    expect(features.toolName).toBe("create_external_transfer");
    expect(features.executionState).toBe("pre_tool");
    expect(features.hasPlannedTool).toBe(true);
    expect(features.outcome).toBe("pending_confirmation");
    expect(features.noTool).toBe(false);
    expect(features.actionType).toBe("external_transfer");
    expect(features.accountContext).toBe("checking");
    expect(features.customerTier).toBe("premium");
    expect(features.actorType).toBe("customer");
    expect(features.currency).toBe("ILS");
    expect(features.conversationPresent).toBe(true);
    expect(features.intentToolMismatch).toBe(false);
    expect(features.firstPayeeHint).toBe(true);
    expect(features.oddHours).toBe(false);
  });

  it("flags injectionLikely and policyDenied on the injection fixture", () => {
    const features = extractBaselineFeatures(injectionEvent());
    expect(features.injectionLikely).toBe(true);
    expect(features.policyDenied).toBe(true);
    expect(features.policyDecision).toBe("deny");
    expect(features.hasPlannedTool).toBe(false);
    expect(features.noTool).toBe(true);
    expect(features.toolName).toBeNull();
    expect(features.highValue).toBe(false);
    expect(features.actionType).toBe("prompt_injection");
  });

  it("flags short utterance, question mark, and no-tool on the ambiguous fixture", () => {
    const features = extractBaselineFeatures(ambiguousEvent());
    expect(features.utteranceLength).toBe("pay?".length);
    expect(features.shortUtterance).toBe(true);
    expect(features.questionMark).toBe(true);
    expect(features.noTool).toBe(true);
    expect(features.hasPlannedTool).toBe(false);
    expect(features.amountBucket).toBe("none");
    expect(features.recipientType).toBe("none");
    expect(features.firstPayeeHint).toBe(false);
    expect(features.policyDecision).toBe("not_applicable");
    expect(features.conversationPresent).toBe(true);
  });

  it("sets policyDecision missing when policy is absent", () => {
    const event = elahEventSample("8.5");
    const features = extractBaselineFeatures(event);
    expect(event.policy).toBeUndefined();
    expect(features.policyDecision).toBe("missing");
    expect(features.confirmationRequired).toBe(false);
    expect(features.conversationPresent).toBe(false);
    expect(features.utteranceLength).toBe(0);
    expect(features.shortUtterance).toBe(true);
    expect(features.mfaStatus).toBe("missing");
  });

  it("flags highValue only for large and very-large amount buckets", () => {
    const medium = extractBaselineFeatures(transferEvent());
    expect(medium.highValue).toBe(false);

    const large = transferEvent();
    large.action.amountBucket = "large_2000_9999";
    large.action.amount = 2500;
    expect(extractBaselineFeatures(large).highValue).toBe(true);

    const huge = transferEvent();
    huge.action.amountBucket = "very_large_10000_plus";
    huge.action.amount = 15000;
    expect(extractBaselineFeatures(huge).highValue).toBe(true);
  });

  it("flags oddHours from occurredAt UTC hour", () => {
    const night = transferEvent();
    night.occurredAt = "2026-08-17T23:15:00.000Z";
    expect(extractBaselineFeatures(night).oddHours).toBe(true);

    const dawn = transferEvent();
    dawn.occurredAt = "2026-08-17T05:59:00.000Z";
    expect(extractBaselineFeatures(dawn).oddHours).toBe(true);

    const morning = transferEvent();
    morning.occurredAt = "2026-08-17T06:00:00.000Z";
    expect(extractBaselineFeatures(morning).oddHours).toBe(false);
  });

  it("flags intentToolMismatch when detectedIntent disagrees with toolName", () => {
    const event = transferEvent();
    event.detectedIntent = "balance_awareness";
    event.action.toolName = "create_external_transfer";
    expect(extractBaselineFeatures(event).intentToolMismatch).toBe(true);

    const matched = transferEvent();
    expect(extractBaselineFeatures(matched).intentToolMismatch).toBe(false);
  });

  it("does not treat a typo utterance as injectionLikely", () => {
    const event = transferEvent();
    event.conversation = {
      ...event.conversation!,
      utterance: "Trasfer 500 shekels to Danile please",
    };
    event.policy = {
      decision: "needs_confirmation",
      reasons: [],
      confirmationRequired: true,
    };
    event.detectedIntent = "external_transfer";
    const features = extractBaselineFeatures(event);
    expect(features.injectionLikely).toBe(false);
    expect(features.policyDenied).toBe(false);
  });

  it("returns identical features for identical input", () => {
    const event = transferEvent();
    expect(extractBaselineFeatures(event)).toEqual(extractBaselineFeatures(event));
  });
});

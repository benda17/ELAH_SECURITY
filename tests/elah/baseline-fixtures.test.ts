import { describe, expect, it } from "vitest";
import type { ElahEvent } from "@/lib/elah";
import {
  RC_HIGH_VALUE,
  RC_NON_BANKING,
  RC_P0_BILL_PAYMENT,
  RC_P0_INTERNAL_TRANSFER,
  scoreElahEvent,
} from "@/lib/elah/baseline";
import {
  ambiguousEvent,
  elahEventSample,
  expectRecommendationNeverEnforces,
  injectionEvent,
  transferEvent,
} from "./fixtures";

function withAction(
  event: ElahEvent,
  patch: Partial<ElahEvent> & { action?: Partial<ElahEvent["action"]> },
): ElahEvent {
  const { action, ...rest } = patch;
  return {
    ...event,
    ...rest,
    action: { ...event.action, ...action },
  };
}

describe("baseline fixtures (critical-path bands)", () => {
  it("injection (8.3): prompt_injection_or_policy_bypass, score < 0.20, review", () => {
    const { status, score } = scoreElahEvent(injectionEvent());
    expect(status).toBe("scored");
    expect(score.intentLabel).toBe("prompt_injection_or_policy_bypass");
    expect(score.elahScore).toBe(0.08);
    expect(score.confidence).toBe(0.91);
    expect(score.policyHook.recommendation).toBe("review");
    expectRecommendationNeverEnforces(score.policyHook.recommendation);
  });

  it("external transfer (8.1): genuine, watch or none", () => {
    const { status, score } = scoreElahEvent(transferEvent());
    expect(status).toBe("scored");
    expect(score.intentLabel).toBe("external_transfer");
    expect(score.elahScore).toBe(0.87);
    expect(score.confidence).toBe(0.82);
    expect(["watch", "none"]).toContain(score.policyHook.recommendation);
  });

  it("internal transfer: genuine P0, never deny", () => {
    const event = withAction(transferEvent(), {
      actionType: "internal_transfer",
      detectedIntent: "internal_transfer",
      action: {
        toolName: "create_internal_transfer",
        recipientType: "self",
      },
      conversation: {
        conversationId: "clxconvexample0001",
        messageId: "clxmsgexample0011",
        utterance: "Move 500 shekels to my savings",
      },
    });
    const { status, score } = scoreElahEvent(event);
    expect(status).toBe("scored");
    expect(score.intentLabel).toBe("internal_transfer");
    expect(score.elahScore).toBeGreaterThanOrEqual(0.75);
    expect(score.policyHook.reasons).toContain(RC_P0_INTERNAL_TRANSFER);
    expectRecommendationNeverEnforces(score.policyHook.recommendation);
  });

  it("bill payment: genuine P0", () => {
    const event = withAction(transferEvent(), {
      actionType: "bill_payment",
      detectedIntent: "bill_payment",
      action: {
        toolName: "pay_bill",
        recipientType: "utility",
      },
      conversation: {
        conversationId: "clxconvexample0001",
        messageId: "clxmsgexample0012",
        utterance: "Pay my electric bill 500 shekels",
      },
    });
    const { status, score } = scoreElahEvent(event);
    expect(status).toBe("scored");
    expect(score.intentLabel).toBe("bill_payment");
    expect(score.elahScore).toBeGreaterThanOrEqual(0.75);
    expect(score.policyHook.reasons).toContain(RC_P0_BILL_PAYMENT);
    expectRecommendationNeverEnforces(score.policyHook.recommendation);
  });

  it("statement download (8.2): genuine read/export", () => {
    const { status, score } = scoreElahEvent(elahEventSample("8.2"));
    expect(status).toBe("scored");
    expect(score.intentLabel).toBe("statement_download");
    expect(score.elahScore).toBe(0.81);
    expect(score.confidence).toBe(0.88);
    expect(score.policyHook.recommendation).toBe("none");
  });

  it("card freeze: genuine with elevated emotional urgency vs atlas", () => {
    const event = withAction(elahEventSample("8.2"), {
      actionType: "card_freeze",
      detectedIntent: "card_freeze",
      action: {
        toolName: "freeze_card",
        amount: null,
        amountBucket: "none",
        recipientType: "none",
      },
      conversation: {
        conversationId: "clxconvexample0001",
        messageId: "clxmsgexample0013",
        utterance: "Freeze my debit card now",
      },
    });
    const { status, score } = scoreElahEvent(event);
    expect(status).toBe("scored");
    expect(score.intentLabel).toBe("card_freeze");
    expect(score.elahScore).toBeGreaterThanOrEqual(0.75);
    expect(score.coordinates.emotionalUrgency).toBeGreaterThan(0.55);
    expectRecommendationNeverEnforces(score.policyHook.recommendation);
  });

  it("balance awareness: genuine read", () => {
    const event = withAction(elahEventSample("8.2"), {
      actionType: "account_balance_read",
      detectedIntent: "balance_awareness",
      action: {
        toolName: "get_account_balance",
        amount: null,
        amountBucket: "none",
        recipientType: "none",
      },
      conversation: {
        conversationId: "clxconvexample0001",
        messageId: "clxmsgexample0014",
        utterance: "What is my account balance?",
      },
    });
    const { status, score } = scoreElahEvent(event);
    expect(status).toBe("scored");
    expect(score.intentLabel).toBe("balance_awareness");
    expect(score.elahScore).toBeGreaterThanOrEqual(0.75);
    expect(score.policyHook.recommendation).toBe("none");
  });

  it("ambiguous short payment-ish request: abstain", () => {
    const { status, score } = scoreElahEvent(ambiguousEvent());
    expect(status).toBe("abstained");
    expect(score.intentLabel).toBe("ambiguous_banking_request");
    expect(score.confidence).toBeLessThan(0.4);
    expect(score.elahScore).toBe(0.48);
  });

  it("non-banking greeting: off-intent, not injection", () => {
    const event = withAction(ambiguousEvent(), {
      detectedIntent: "non_banking_request",
      conversation: {
        conversationId: "clxconvexample0001",
        messageId: "clxmsgexample0015",
        utterance: "hello",
      },
    });
    const { status, score } = scoreElahEvent(event);
    expect(status).toBe("scored");
    expect(score.intentLabel).toBe("non_banking_request");
    expect(score.elahScore).toBeLessThanOrEqual(0.35);
    expect(score.elahScore).toBeGreaterThanOrEqual(0.05);
    expect(score.policyHook.reasons).toContain(RC_NON_BANKING);
    expectRecommendationNeverEnforces(score.policyHook.recommendation);
  });

  it("high-value genuine transfer stays genuine with RC_HIGH_VALUE", () => {
    const event = withAction(transferEvent(), {
      action: {
        amount: 12000,
        amountBucket: "very_large_10000_plus",
      },
    });
    const { status, score } = scoreElahEvent(event);
    expect(status).toBe("scored");
    expect(score.intentLabel).toBe("external_transfer");
    expect(score.elahScore).toBeGreaterThanOrEqual(0.75);
    expect(score.policyHook.reasons).toContain(RC_HIGH_VALUE);
    expect(score.coordinates.financialRisk).toBeGreaterThan(0.78);
    expect(["watch", "none"]).toContain(score.policyHook.recommendation);
  });

  it("mistaken-user / typo utterance is not prompt_injection", () => {
    const event = withAction(transferEvent(), {
      detectedIntent: "external_transfer",
      policy: {
        decision: "needs_confirmation",
        reasons: [],
        confirmationRequired: true,
      },
      conversation: {
        conversationId: "clxconvexample0001",
        messageId: "clxmsgexample0016",
        utterance: "Trasfer 500 shekels to Danile plz",
      },
    });
    const { status, score } = scoreElahEvent(event);
    expect(score.intentLabel).not.toBe("prompt_injection_or_policy_bypass");
    expect(score.intentLabel).toBe("external_transfer");
    expect(status).toBe("scored");
    expect(score.elahScore).toBeGreaterThanOrEqual(0.75);
    expectRecommendationNeverEnforces(score.policyHook.recommendation);
  });
});

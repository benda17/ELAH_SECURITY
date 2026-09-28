import { describe, expect, it } from "vitest";
import {
  OUTCOME_ATTRIBUTION,
  POLICY_ATTRIBUTION,
  SCORE_ATTRIBUTION,
  buildActionChain,
  outcomeTone,
  policyTone,
  type ActionChainCorrelation,
  type ActionChainEvent,
} from "@/components/elah-analyst/detail/action-chain";
import type { CorrelatedHop } from "@/lib/elah/correlate";
import type { ElahScoreSnapshot } from "@/lib/elah/score-read";

function agentEvent(overrides: Partial<ActionChainEvent> = {}): ActionChainEvent {
  return {
    source: "agent",
    outcome: "executed",
    executionState: "post_tool",
    occurredAt: "2026-09-01T10:00:00.000Z",
    action: {
      toolName: "transfer_between_accounts" as ActionChainEvent["action"]["toolName"],
      args: {},
      amountBucket: "small_100_499",
      accountContext: "checking_and_savings",
      recipientType: "self",
    },
    policy: { decision: "needs_confirmation", reasons: ["amount_over_limit"], confirmationRequired: true },
    conversation: { conversationId: "conv_1", messageId: "msg_1" },
    ...overrides,
  };
}

function hop(eventType: string, timestamp: string, extra: Partial<CorrelatedHop> = {}): CorrelatedHop {
  return {
    eventType,
    toolName: null,
    eventId: "evt_1",
    timestamp,
    userMessage: null,
    assistantMessage: null,
    resultSummary: null,
    policyDecision: null,
    ...extra,
  };
}

const scored: ElahScoreSnapshot = {
  kind: "scored",
  eventType: "elah_scored",
  status: "scored",
  elahScore: 0.82,
  confidence: 0.71,
  uncertainty: 0.29,
  intentLabel: "internal_transfer",
  coordinates: { humanAgency: 0.7, financialRisk: 0.6, emotionalUrgency: 0.2 },
  explanation: { matchedSignals: [], weakSignals: [], negativeSignals: [], summary: null },
  policyHook: { recommendation: "none", reasons: [] },
  requestId: "req_1",
  scoredAt: "2026-09-01T10:00:01.000Z",
  provenanceScorer: "rules_v0",
  provenanceModelVersion: null,
};

describe("buildActionChain", () => {
  it("always returns the five stages in pre-tool order", () => {
    const steps = buildActionChain({ event: agentEvent(), correlated: null, snapshot: null });
    expect(steps.map((s) => s.stage)).toEqual(["request", "plan", "policy", "score", "outcome"]);
  });

  it("attributes the decision to bank policy and keeps ELAH score-only", () => {
    const steps = buildActionChain({ event: agentEvent(), correlated: null, snapshot: scored });
    const policy = steps.find((s) => s.stage === "policy")!;
    const score = steps.find((s) => s.stage === "score")!;
    expect(policy.actor).toBe("Bank policy");
    expect(policy.note).toBe(POLICY_ATTRIBUTION);
    expect(policy.tone).toBe("warning");
    expect(policy.facts).toContainEqual({ label: "Confirmation required", value: "yes" });
    expect(score.actor).toBe("ELAH (score only)");
    expect(score.note).toBe(SCORE_ATTRIBUTION);
    expect(steps.find((s) => s.stage === "outcome")!.note).toBe(OUTCOME_ATTRIBUTION);
    for (const step of steps) {
      if (step.stage === "policy" || step.stage === "outcome") continue;
      expect(`${step.title} ${step.note ?? ""}`).not.toMatch(/ELAH (allowed|blocked|approved|denied)/i);
    }
  });

  it("uses correlated hops, planner output, and marks untrusted text", () => {
    const correlated: ActionChainCorrelation = {
      utterance: "Move 200 to savings please",
      modelOutput: {
        usedFallback: false,
        plannedTool: "transfer_between_accounts",
        intent: "internal_transfer",
        refuse: false,
        explanation: "User asked to move money",
        result: null,
      },
      policyDecision: "needs_confirmation",
      resultSummary: "Transferred 200",
      hops: [
        hop("user_message_received", "2026-09-01T10:00:00.000Z"),
        hop("tool_call_requested", "2026-09-01T10:00:02.000Z", { toolName: "transfer_between_accounts" }),
        hop("confirmation_required", "2026-09-01T10:00:03.000Z"),
        hop("action_confirmed", "2026-09-01T10:00:05.000Z"),
        hop("elah_scored", "2026-09-01T10:00:02.500Z"),
        hop("tool_call_executed", "2026-09-01T10:00:06.000Z", { toolName: "transfer_between_accounts" }),
      ],
    };
    const [request, plan, policy, score, outcome] = buildActionChain({
      event: agentEvent(),
      correlated,
      snapshot: scored,
    });
    expect(request.untrusted?.text).toBe("Move 200 to savings please");
    expect(request.at).toBe("2026-09-01T10:00:00.000Z");
    expect(plan.title).toBe("Planned transfer between accounts");
    expect(plan.facts).toContainEqual({ label: "Planner", value: "language model" });
    expect(plan.untrusted?.text).toBe("User asked to move money");
    expect(policy.hopTypes).toEqual(["confirmation_required", "action_confirmed"]);
    expect(policy.facts).toContainEqual({ label: "Customer confirmation", value: "confirmed" });
    expect(policy.at).toBe("2026-09-01T10:00:03.000Z");
    expect(score.hopTypes).toEqual(["elah_scored"]);
    expect(score.facts).toContainEqual({ label: "elahScore", value: "0.820" });
    expect(outcome.facts).toContainEqual({ label: "Executed tool", value: "transfer_between_accounts" });
    expect(outcome.untrusted?.text).toBe("Transferred 200");
    expect(outcome.tone).toBe("positive");
  });

  it("marks missing data instead of inventing it", () => {
    const [request, plan, policy, score] = buildActionChain({
      event: agentEvent({ policy: undefined, action: { ...agentEvent().action, toolName: null } }),
      correlated: null,
      snapshot: null,
    });
    expect(request.status).toBe("missing");
    expect(request.untrusted).toBeNull();
    expect(plan.status).toBe("missing");
    expect(plan.title).toBe("No tool planned");
    expect(policy.status).toBe("missing");
    expect(policy.facts).toContainEqual({ label: "Bank policy decision", value: "—" });
    expect(score.status).toBe("missing");
    expect(score.title).toBe("Not scored");
    expect(score.facts).toEqual([]);
  });

  it("handles unavailable and abstained scores without a number", () => {
    const unavailable: ElahScoreSnapshot = {
      kind: "unavailable",
      eventType: "elah_scoring_unavailable",
      status: "unavailable",
      reason: "timeout",
      requestId: null,
      httpStatus: null,
      errorCode: null,
    };
    const u = buildActionChain({ event: agentEvent(), correlated: null, snapshot: unavailable })[3];
    expect(u.title).toBe("Score unavailable");
    expect(u.facts).toEqual([{ label: "Reason", value: "timeout" }]);
    const a = buildActionChain({
      event: agentEvent(),
      correlated: null,
      snapshot: { ...scored, status: "abstained" },
    })[3];
    expect(a.title).toBe("ELAH abstained");
    expect(a.tone).toBe("warning");
  });

  it("treats website events as a request without chat", () => {
    const [request] = buildActionChain({
      event: agentEvent({ source: "ui", conversation: undefined, action: { ...agentEvent().action, page: "/transfer" } }),
      correlated: null,
      snapshot: null,
    });
    expect(request.title).toBe("Website action");
    expect(request.status).toBe("present");
    expect(request.facts).toContainEqual({ label: "Page", value: "/transfer" });
    expect(request.at).toBe("2026-09-01T10:00:00.000Z");
  });
});

describe("tones", () => {
  it("maps policy decisions", () => {
    expect(policyTone("allow")).toBe("positive");
    expect(policyTone("deny")).toBe("negative");
    expect(policyTone("needs_confirmation")).toBe("warning");
    expect(policyTone(null)).toBe("neutral");
  });
  it("maps outcomes", () => {
    expect(outcomeTone("executed")).toBe("positive");
    expect(outcomeTone("blocked")).toBe("negative");
    expect(outcomeTone("pending_confirmation")).toBe("warning");
    expect(outcomeTone("conversational")).toBe("neutral");
  });
});

import { describe, expect, it } from "vitest";
import {
  evaluateRecords,
  trainingEventToElahEvent,
} from "@/lib/elah/baseline/evaluate";
import { classifyMetricHooks } from "@/lib/elah/baseline/metrics";
import { ELAH_BANKING_INTENTS } from "@/lib/elah/types";
import type { ElahTrainingRecord, TrainingEventPayload } from "@/lib/elah/dataset/schema";

const INTENT_SET = new Set<string>(ELAH_BANKING_INTENTS);

function tinyRecord(overrides: {
  scenarioId: string;
  pack: string;
  intent: ElahTrainingRecord["labels"]["intentLabel"];
  actionType?: string;
  toolName?: string | null;
  outcome?: string;
  detectedIntent?: ElahTrainingRecord["labels"]["intentLabel"];
}): ElahTrainingRecord {
  const event: TrainingEventPayload = {
    schemaVersion: "1.0",
    eventId: `evt_${overrides.scenarioId}_eval`,
    occurredAt: "2026-08-26T12:00:00.000Z",
    appId: "elah-banking-demo",
    source: "agent",
    actionType: overrides.actionType ?? "external_transfer",
    outcome: overrides.outcome ?? "pending_confirmation",
    executionState: "pre_tool",
    actor: {
      userIdHash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      sessionId: `ses_${overrides.scenarioId}`,
      actorType: "customer",
      role: null,
      customerTier: "basic",
    },
    action: {
      toolName: overrides.toolName === undefined ? "create_external_transfer" : overrides.toolName,
      page: "/assistant",
      args: { amount: 500, recipientName: "[recipient_redacted]" },
      amount: 500,
      currency: "ILS",
      amountBucket: "medium_500_1999",
      accountContext: "checking",
      recipientType: "saved_payee",
    },
    policy: {
      decision: "needs_confirmation",
      reasons: ["bank confirmation required for outbound transfer"],
      confirmationRequired: true,
    },
    conversation: {
      conversationId: `conv_${overrides.scenarioId}`,
      messageId: `msg_${overrides.scenarioId}`,
      utterance: "Send 500 ILS to my saved payee",
    },
    mfaStatus: "unknown",
    detectedIntent: overrides.detectedIntent ?? overrides.intent,
  };

  return {
    schemaVersion: "1.0",
    datasetVersion: "v1.0",
    split: "holdout",
    pack: overrides.pack,
    scenarioId: overrides.scenarioId,
    sequenceId: null,
    stepIndex: null,
    twinGroupId: null,
    event,
    labels: {
      intentLabel: overrides.intent,
      annotatorConfidence: "high",
      annotatorConfidenceNumeric: 0.9,
      humanAgency: 0.82,
      financialRisk: 0.78,
      emotionalUrgency: 0.22,
      contextualRiskTags: [],
      matchedSignals: ["transfer_or_payment_verb"],
      weakSignals: [],
      negativeSignals: [],
      reviewNotes: "tiny inline eval fixture",
    },
    provenance: {
      source: "synthetic_generator",
      generatorVersion: "1.0",
      taxonomyVersion: "1.0",
      annotatorId: "synthetic",
      createdAt: "2026-08-26T12:00:00.000Z",
    },
  };
}

describe("Phase 5 baseline evaluate (tiny inline record)", () => {
  const legit = tinyRecord({
    scenarioId: "eval-legit-001",
    pack: "legitimate",
    intent: "external_transfer",
  });

  it("maps TrainingEventPayload to ElahEvent without attaching scores", () => {
    const mapped = trainingEventToElahEvent(legit.event);
    expect(mapped.ok).toBe(true);
    if (!mapped.ok) return;
    expect(mapped.event).not.toHaveProperty("elahScore");
    expect(mapped.event).not.toHaveProperty("confidence");
    expect(mapped.event.actionType).toBe("external_transfer");
    expect(mapped.event.action.toolName).toBe("create_external_transfer");
    expect(mapped.event.detectedIntent).toBe("external_transfer");
    expect(mapped.event.schemaVersion).toBe("1.0");
  });

  it("classifies legitimate vs injection metric hooks", () => {
    expect(
      classifyMetricHooks({
        goldPack: legit.pack,
        goldIntent: legit.labels.intentLabel,
      }),
    ).toEqual(["intent_accuracy", "legitimate_false_positive"]);

    const inj = tinyRecord({
      scenarioId: "eval-inj-001",
      pack: "prompt_injection",
      intent: "prompt_injection_or_policy_bypass",
      actionType: "prompt_injection",
      toolName: null,
      outcome: "refused",
      detectedIntent: "prompt_injection_or_policy_bypass",
    });
    expect(
      classifyMetricHooks({
        goldPack: inj.pack,
        goldIntent: inj.labels.intentLabel,
      }),
    ).toEqual(["intent_accuracy", "injection_catch"]);
  });

  it("scores a tiny record and keeps gold scores off the event", () => {
    const report = evaluateRecords([legit], [], { measureLatency: false });
    expect(report.n).toBe(1);
    expect(report.skipped).toEqual([]);
    expect(report.scorer).toBe("rules_v0");
    expect(report.calibration.uncalibrated).toBe(true);
    const row = report.predictions[0];
    expect(row.scenarioId).toBe("eval-legit-001");
    expect(row.pack).toBe("legitimate");
    expect(row.goldIntent).toBe("external_transfer");
    expect(INTENT_SET.has(row.predIntent)).toBe(true);
    expect(row.hooks).toEqual(["intent_accuracy", "legitimate_false_positive"]);
    expect(legit.event).not.toHaveProperty("elahScore");
  });

  it("holdout scoring drops gold detectedIntent by default (feature+rules, not hint echo)", () => {
    const mismatched = tinyRecord({
      scenarioId: "eval-blind-001",
      pack: "legitimate",
      intent: "external_transfer",
      detectedIntent: "balance_awareness",
    });
    const report = evaluateRecords([mismatched], [], { measureLatency: false });
    expect(report.blindedDetectedIntent).toBe(true);
    expect(report.predictions[0]?.predIntent).toBe("external_transfer");
    expect(report.predictions[0]?.goldIntent).toBe("external_transfer");
  });

  it("records unmappable rows under skipped instead of throwing", () => {
    const bad = tinyRecord({
      scenarioId: "eval-skip-atm",
      pack: "legitimate",
      intent: "external_transfer",
      actionType: "atm_withdrawal",
    });
    const report = evaluateRecords([bad], [], { measureLatency: false });
    expect(report.n).toBe(0);
    expect(report.predictions).toEqual([]);
    expect(report.skipped).toEqual([
      { scenarioId: "eval-skip-atm", reason: "unknown actionType 'atm_withdrawal'" },
    ]);
  });
});

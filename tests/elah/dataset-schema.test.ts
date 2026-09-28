import { describe, expect, it } from "vitest";
import {
  CONTEXTUAL_RISK_TAGS,
  ELAH_BANKING_INTENTS,
  validateEvalRecord,
  validateTrainingRecord,
} from "@/lib/elah/dataset/schema";
import {
  compileScenarioToTrainingRecord,
  eventIdFromScenarioId,
  fakeUserIdHash,
  type ElahScenarioTemplate,
} from "@/lib/elah/dataset/template";

const TEMPLATE: ElahScenarioTemplate = {
  id: "legit-ext-transfer-001",
  pack: "legitimate",
  actorTier: "premium",
  channel: "agent",
  utterance: "Send 500 ILS to my saved payee",
  plannedTool: "create_external_transfer",
  expectedActionType: "external_transfer",
  expectedIntentLabel: "external_transfer",
  expectedOutcome: "pending_confirmation",
  policy: {
    decision: "needs_confirmation",
    reasons: ["tool 'create_external_transfer' requires explicit user confirmation"],
    confirmationRequired: true,
  },
  coordinates: {
    humanAgency: 0.82,
    financialRisk: 0.78,
    emotionalUrgency: 0.22,
  },
  args: { amount: 500, recipientName: "Daniel" },
  amount: 500,
  recipientType: "saved_payee",
  annotatorConfidence: "high",
  annotatorConfidenceNumeric: 0.9,
  matchedSignals: ["transfer_or_payment_verb", "amount_detected"],
  reviewNotes: "Genuine outbound transfer; bank confirmation still required.",
  goldScore: { elahScore: 0.87, confidence: 0.82 },
};

function validRecord() {
  return compileScenarioToTrainingRecord(TEMPLATE);
}

describe("ElahTrainingRecord schema", () => {
  it("accepts a valid compiled training record", () => {
    const record = validRecord();
    const result = validateTrainingRecord(record);
    expect(result.ok).toBe(true);
    expect(record.schemaVersion).toBe("1.0");
    expect(record.event.schemaVersion).toBe("1.0");
    expect(record.event.appId).toBe("elah-banking-demo");
    expect(record.event.source).toBe("agent");
    expect(record.event.eventId).toBe(eventIdFromScenarioId(TEMPLATE.id));
    expect(record.event.actor.userIdHash).toBe(fakeUserIdHash(TEMPLATE.id));
    expect(record.event.actor.userIdHash).toMatch(/^[0-9a-f]{32}$/);
    expect(record.event.action.args).not.toHaveProperty("userId");
    expect(record.event.action.args.recipientName).toBe("[recipient_redacted]");
    expect(record.goldScore).toEqual({ elahScore: 0.87, confidence: 0.82 });
    expect(record.event).not.toHaveProperty("elahScore");
    expect(ELAH_BANKING_INTENTS).toEqual([
      "balance_awareness",
      "recent_transactions",
      "spending_summary",
      "internal_transfer",
      "external_transfer",
      "bill_payment",
      "scheduled_payment",
      "statement_download",
      "card_freeze",
      "card_unfreeze",
      "fraud_report",
      "dispute_chargeback",
      "fee_or_overdraft_question",
      "loan_inquiry",
      "loan_application",
      "savings_optimization",
      "profile_update",
      "support_escalation",
      "ambiguous_banking_request",
      "non_banking_request",
      "prompt_injection_or_policy_bypass",
    ]);
    expect(CONTEXTUAL_RISK_TAGS).toContain("accidental_error");
  });

  it("rejects an unknown intentLabel", () => {
    const record = validRecord();
    const broken = {
      ...record,
      labels: { ...record.labels, intentLabel: "atm_withdrawal" },
    };
    const result = validateTrainingRecord(broken);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes("unknown intentLabel"))).toBe(true);
    }
  });

  it("rejects an extra taxonomy label outside the closed 22", () => {
    const record = validRecord();
    const broken = {
      ...record,
      labels: { ...record.labels, intentLabel: "mistaken_user" },
    };
    const result = validateTrainingRecord(broken);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes("mistaken_user"))).toBe(true);
    }
  });

  it("rejects an unknown contextual risk tag", () => {
    const record = validRecord();
    const broken = {
      ...record,
      labels: {
        ...record.labels,
        contextualRiskTags: ["high_value", "device_change"],
      },
    };
    const result = validateTrainingRecord(broken);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes("unknown contextual risk tag"))).toBe(
        true,
      );
    }
  });

  it("rejects a record with missing provenance", () => {
    const record = validRecord();
    const { provenance: _dropped, ...broken } = record;
    void _dropped;
    const result = validateTrainingRecord(broken);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes("provenance is required"))).toBe(true);
    }
  });

  it("compiles UI channel with source ui and null toolName", () => {
    const record = compileScenarioToTrainingRecord({
      ...TEMPLATE,
      id: "legit-ext-transfer-001-ui",
      channel: "ui",
      plannedTool: "create_external_transfer",
      twinGroupId: "twin-ext-001",
    });
    expect(record.event.source).toBe("ui");
    expect(record.event.action.toolName).toBeNull();
    expect(record.event.conversation).toBeUndefined();
    expect(validateTrainingRecord(record).ok).toBe(true);
  });

  it("requires holdout split and metricHooks on eval records", () => {
    const record = compileScenarioToTrainingRecord(TEMPLATE, { split: "holdout" });
    const evalRecord = {
      ...record,
      metricHooks: ["intent_accuracy", "legitimate_false_positive"],
    };
    expect(validateEvalRecord(evalRecord).ok).toBe(true);
    expect(validateEvalRecord(record).ok).toBe(false);
  });
});

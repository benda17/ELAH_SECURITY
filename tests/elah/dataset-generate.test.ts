import { describe, expect, it } from "vitest";
import { ELAH_BANKING_INTENTS } from "@/lib/elah/types";
import {
  INTENT_SET,
  PACK_MINIMUMS,
  PHASE4_SEED,
  generatePhase4Dataset,
  packCounts,
  recordsByPack,
  sanitizePhase4Args,
} from "@/lib/elah/dataset/generate";
import { requireProvenance } from "@/lib/elah/dataset/provenance";

const INTENT_LIST = new Set<string>(ELAH_BANKING_INTENTS);

describe("phase4 dataset generate", () => {
  const records = generatePhase4Dataset(PHASE4_SEED);
  const byPack = recordsByPack(records);
  const counts = packCounts(records);

  it("emits at least 200 legitimate gold rows", () => {
    expect(byPack.legitimate.length).toBeGreaterThanOrEqual(PACK_MINIMUMS.legitimate);
    expect(counts.legitimate).toBeGreaterThanOrEqual(200);
  });

  it("uses only the closed 22-intent set", () => {
    for (const row of records) {
      expect(INTENT_LIST.has(row.labels.intentLabel)).toBe(true);
      expect(INTENT_SET.has(row.labels.intentLabel)).toBe(true);
    }
  });

  it("labels transfer-shaped injection as prompt_injection_or_policy_bypass", () => {
    const transferShapedInjection = records.filter((row) => {
      const utterance = row.event.conversation?.utterance ?? "";
      const looksLikeTransfer =
        row.event.actionType === "external_transfer" ||
        /transfer/i.test(utterance);
      const injectionLanguage = /ignore previous instructions|disregard policy|developer mode|override/i.test(
        utterance,
      );
      return looksLikeTransfer && injectionLanguage;
    });
    expect(transferShapedInjection.length).toBeGreaterThan(0);
    for (const row of transferShapedInjection) {
      expect(row.labels.intentLabel).toBe("prompt_injection_or_policy_bypass");
    }
  });

  it("never emits device_change actionType", () => {
    for (const row of records) {
      expect(row.event.actionType).not.toBe("device_change");
    }
  });

  it("strips accountId and other forbidden keys from args", () => {
    for (const row of records) {
      expect(row.event.action.args).not.toHaveProperty("accountId");
      expect(row.event.action.args).not.toHaveProperty("userId");
      expect(row.event.action.args).not.toHaveProperty("fromAccountId");
      expect(row.event.action.args).not.toHaveProperty("toAccountId");
      expect(row.event.action.args).not.toHaveProperty("cardId");
      expect(row.event.action.args).not.toHaveProperty("password");
      expect(row.event.action.args).not.toHaveProperty("token");
    }
    const dirty = sanitizePhase4Args({
      accountId: "acc_should_not_survive",
      amount: 50,
      recipientName: "Real Name",
    });
    expect(dirty).not.toHaveProperty("accountId");
    expect(dirty.recipientName).toBe("[recipient_redacted]");
    expect(dirty.amount).toBe(50);
  });

  it("keeps generator split null and requires provenance", () => {
    for (const row of records) {
      expect(row.split).toBeNull();
      requireProvenance(row);
      expect(row.provenance.source).toBe("synthetic_generator");
    }
  });

  it("covers P0/P1 classes and twin groups in legitimate", () => {
    const intents = byPack.legitimate.map((row) => row.labels.intentLabel);
    const actionTypes = byPack.legitimate.map((row) => row.event.actionType);
    const commonIntents = [
      "internal_transfer",
      "external_transfer",
      "bill_payment",
      "card_freeze",
      "card_unfreeze",
      "statement_download",
      "balance_awareness",
      "recent_transactions",
      "spending_summary",
      "support_escalation",
    ] as const;
    for (const intent of commonIntents) {
      expect(intents.filter((value) => value === intent).length).toBeGreaterThanOrEqual(10);
    }
    const commonActions = [
      "account_balance_read",
      "transactions_read",
      "transaction_lookup",
      "spending_summary",
      "cards_read",
      "recipients_read",
      "support_case_created",
    ];
    for (const actionType of commonActions) {
      expect(actionTypes.filter((value) => value === actionType).length).toBeGreaterThanOrEqual(10);
    }
    const twinExt = new Set(
      byPack.legitimate.filter((row) => row.twinGroupId?.startsWith("twin-ext-")).map((row) => row.twinGroupId),
    );
    const twinStmt = new Set(
      byPack.legitimate.filter((row) => row.twinGroupId?.startsWith("twin-stmt-")).map((row) => row.twinGroupId),
    );
    expect(twinExt.size).toBeGreaterThanOrEqual(12);
    expect(twinStmt.size).toBeGreaterThanOrEqual(12);
  });

  it("meets pack minima including multi_step sequences", () => {
    expect(counts.multi_step_sequences).toBeGreaterThanOrEqual(PACK_MINIMUMS.multi_step);
    expect(byPack.suspicious.length).toBeGreaterThanOrEqual(PACK_MINIMUMS.suspicious);
    expect(byPack.malicious.length).toBeGreaterThanOrEqual(PACK_MINIMUMS.malicious);
    expect(byPack.ambiguous.length).toBeGreaterThanOrEqual(PACK_MINIMUMS.ambiguous);
    expect(byPack.prompt_injection.length).toBeGreaterThanOrEqual(PACK_MINIMUMS.prompt_injection);
    expect(byPack.indirect_injection.length).toBeGreaterThanOrEqual(PACK_MINIMUMS.indirect_injection);
    expect(byPack.compromised_tool.length).toBeGreaterThanOrEqual(PACK_MINIMUMS.compromised_tool);
    expect(byPack.excessive_permission.length).toBeGreaterThanOrEqual(PACK_MINIMUMS.excessive_permission);
    expect(byPack.mistaken_user.length).toBeGreaterThanOrEqual(PACK_MINIMUMS.mistaken_user);
    expect(byPack.conflicting_instruction.length).toBeGreaterThanOrEqual(PACK_MINIMUMS.conflicting_instruction);
    expect(byPack.authorization_boundary.length).toBeGreaterThanOrEqual(PACK_MINIMUMS.authorization_boundary);
    expect(byPack.data_exfiltration.length).toBeGreaterThanOrEqual(PACK_MINIMUMS.data_exfiltration);
    expect(byPack.high_value_transfer.length).toBeGreaterThanOrEqual(PACK_MINIMUMS.high_value_transfer);
    expect(byPack.unusual_device.length).toBeGreaterThanOrEqual(PACK_MINIMUMS.unusual_device);
    expect(byPack.unusual_location.length).toBeGreaterThanOrEqual(PACK_MINIMUMS.unusual_location);
    expect(byPack.behavior_drift.length).toBeGreaterThanOrEqual(PACK_MINIMUMS.behavior_drift);
  });
});

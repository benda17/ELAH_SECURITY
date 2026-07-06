import { describe, expect, it } from "vitest";
import { isConfirmMessage } from "@/lib/agent/intent";
import {
  datasetActionToAssistantMessage,
  getAssistantPhraseBank,
  pickConfirmPhrase,
} from "../../scripts/lib/assistant-phrase-bank";

describe("assistant phrase bank", () => {
  it("returns different wording for the same action when seed keys differ", () => {
    const messages = new Set(
      Array.from({ length: 20 }, (_, i) =>
        datasetActionToAssistantMessage({
          actionType: "account_balance_viewed",
          seedKey: `log-${i}`,
        }),
      ),
    );
    expect(messages.size).toBeGreaterThan(1);
  });

  it("fills transfer templates with amount and recipient", () => {
    const message = datasetActionToAssistantMessage({
      actionType: "external_transfer",
      amountIls: 250,
      seedKey: "transfer-1",
      inputDataSummary: { merchantOrRecipient: "David Cohen" },
    });
    expect(message).toMatch(/250/);
    expect(message).toMatch(/David Cohen/);
  });

  it("uses stable phrase selection for the same seed key", () => {
    const a = datasetActionToAssistantMessage({
      actionType: "transactions_viewed",
      seedKey: "stable-key",
    });
    const b = datasetActionToAssistantMessage({
      actionType: "transactions_viewed",
      seedKey: "stable-key",
    });
    expect(a).toBe(b);
  });

  it("recognizes every confirm phrase variant", () => {
    for (const phrase of getAssistantPhraseBank().confirm_action) {
      expect(isConfirmMessage(phrase)).toBe(true);
    }
  });

  it("varies confirm phrases by seed key", () => {
    const phrases = new Set(
      Array.from({ length: 20 }, (_, i) => pickConfirmPhrase(`confirm-${i}`)),
    );
    expect(phrases.size).toBeGreaterThan(1);
  });
});

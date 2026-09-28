import { describe, expect, it } from "vitest";
import { ELAH_BANKING_INTENTS } from "@/lib/elah/types";
import {
  assertIsoTimestamp,
  assertSequenceOrder,
  completenessGold,
  findDuplicateKeys,
  piiLint,
} from "@/lib/elah/dataset/normalize";

describe("findDuplicateKeys", () => {
  it("returns ids that appear more than once", () => {
    expect(findDuplicateKeys(["a", "b", "a", "c"])).toEqual(new Set(["a"]));
    expect(findDuplicateKeys(["evt-1", "evt-2", "evt-3"])).toEqual(new Set());
    expect(findDuplicateKeys(["x", "x", "y", "y"])).toEqual(new Set(["x", "y"]));
  });
});

describe("assertIsoTimestamp", () => {
  it("accepts valid ISO-8601 UTC", () => {
    expect(assertIsoTimestamp("2026-08-26T07:53:00.000Z")).toBe(true);
    expect(assertIsoTimestamp("2026-08-26T07:53:00Z")).toBe(true);
  });

  it("rejects non-UTC and non-ISO values", () => {
    expect(assertIsoTimestamp("2026-08-26 07:53:00")).toBe(false);
    expect(assertIsoTimestamp("not-a-date")).toBe(false);
    expect(assertIsoTimestamp("2026-08-26T07:53:00+03:00")).toBe(false);
  });
});

describe("assertSequenceOrder", () => {
  it("fails inverted sequence timestamps", () => {
    const result = assertSequenceOrder([
      {
        sequenceId: "seq-transfer",
        stepIndex: 0,
        occurredAt: "2026-08-26T12:00:01.000Z",
      },
      {
        sequenceId: "seq-transfer",
        stepIndex: 1,
        occurredAt: "2026-08-26T12:00:00.000Z",
      },
    ]);
    expect(result.ok).toBe(false);
    expect(result.badSequenceIds).toEqual(["seq-transfer"]);
  });

  it("passes non-decreasing order", () => {
    const result = assertSequenceOrder([
      {
        sequenceId: "seq-ok",
        stepIndex: 0,
        occurredAt: "2026-08-26T12:00:00.000Z",
      },
      {
        sequenceId: "seq-ok",
        stepIndex: 1,
        occurredAt: "2026-08-26T12:00:00.000Z",
      },
      {
        sequenceId: "seq-ok",
        stepIndex: 2,
        occurredAt: "2026-08-26T12:00:05.000Z",
      },
    ]);
    expect(result.ok).toBe(true);
    expect(result.badSequenceIds).toEqual([]);
  });
});

describe("completenessGold", () => {
  it("fails when intentLabel is missing", () => {
    const result = completenessGold(
      {
        labels: {},
        provenance: { source: "synthetic_generator" },
        event: {
          eventId: "evt_gold_missing_label",
          actionType: "external_transfer",
          source: "agent",
        },
      },
      ELAH_BANKING_INTENTS,
    );
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain("missing_intent_label");
  });
});

describe("piiLint", () => {
  it("catches accountId and a 16-digit PAN-like string", () => {
    const findings = piiLint({
      action: {
        args: {
          accountId: "acc_live_should_not_appear",
          pan: "4111111111111111",
        },
      },
    });
    expect(findings.some((line) => line.includes("accountId"))).toBe(true);
    expect(findings.some((line) => line.includes("digit_run"))).toBe(true);
  });
});

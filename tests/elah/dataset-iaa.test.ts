import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { agreementReport, cohenKappa } from "@/lib/elah/dataset/iaa";

type OverlapItem = {
  scenarioId: string;
  annotatorA: string;
  annotatorB: string;
};

function loadOverlapItems(): OverlapItem[] {
  const raw = JSON.parse(
    readFileSync(
      path.join(process.cwd(), "data/phase4/iaa-overlap.json"),
      "utf8",
    ),
  ) as { items?: OverlapItem[] } | OverlapItem[];
  return Array.isArray(raw) ? raw : (raw.items ?? []);
}

describe("Phase 4 IAA (Cohen's kappa)", () => {
  it("perfect agreement kappa = 1", () => {
    const pairs = [
      { a: "external_transfer", b: "external_transfer" },
      { a: "balance_awareness", b: "balance_awareness" },
      { a: "fraud_report", b: "fraud_report" },
      { a: "card_freeze", b: "card_freeze" },
    ];
    const result = cohenKappa(pairs);
    expect(result.n).toBe(4);
    expect(result.percentAgreement).toBe(1);
    expect(result.kappa).toBe(1);
  });

  it("overlap fixture computes finite kappa", () => {
    const items = loadOverlapItems();
    expect(items.length).toBe(30);
    const report = agreementReport(
      items.map((row) => row.annotatorA),
      items.map((row) => row.annotatorB),
    );
    expect(Number.isFinite(report.kappa)).toBe(true);
    expect(report.n).toBe(30);
    expect(report.kappa).not.toBe(1);
    expect(report.disagreements.length).toBeGreaterThan(0);
  });

  it("percent agreement between 0 and 1", () => {
    const items = loadOverlapItems();
    const result = cohenKappa(
      items.map((row) => ({ a: row.annotatorA, b: row.annotatorB })),
    );
    expect(result.percentAgreement).toBeGreaterThanOrEqual(0);
    expect(result.percentAgreement).toBeLessThanOrEqual(1);
  });
});

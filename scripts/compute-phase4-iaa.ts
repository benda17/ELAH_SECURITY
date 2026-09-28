/**
 * Compute Cohen's kappa from the Phase 4 two-annotator overlap fixture.
 *
 *   npx tsx scripts/compute-phase4-iaa.ts
 *   npm run dataset:iaa
 *
 * Writes data/phase4/iaa-report.json and prints the same JSON to stdout.
 * Live human kappa is BLOCKED until founder + second reviewer label the 30 overlap ids.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { agreementReport, cohenKappa } from "../lib/elah/dataset/iaa";

type OverlapItem = {
  scenarioId: string;
  annotatorA: string;
  annotatorB: string;
};

type OverlapFile = {
  version?: string;
  items?: OverlapItem[];
};

function loadOverlap(filePath: string): OverlapItem[] {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as
    | OverlapFile
    | OverlapItem[];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.items)) return raw.items;
  throw new Error(`No overlap items in ${filePath}`);
}

function main() {
  const root = process.cwd();
  const overlapPath = path.join(root, "data/phase4/iaa-overlap.json");
  const reportPath = path.join(root, "data/phase4/iaa-report.json");

  if (!existsSync(overlapPath)) {
    throw new Error(`Missing overlap fixture: ${overlapPath}`);
  }

  const items = loadOverlap(overlapPath);
  const pairs = items.map((row) => ({ a: row.annotatorA, b: row.annotatorB }));
  const kappa = cohenKappa(pairs);
  const report = agreementReport(
    items.map((row) => row.annotatorA),
    items.map((row) => row.annotatorB),
  );

  const out = {
    version: "1.0",
    computedAt: new Date().toISOString(),
    source: "data/phase4/iaa-overlap.json",
    n: kappa.n,
    percentAgreement: kappa.percentAgreement,
    kappa: kappa.kappa,
    disagreementCount: report.disagreements.length,
    disagreements: report.disagreements.map((row) => ({
      index: row.index,
      scenarioId: items[row.index]?.scenarioId ?? null,
      annotatorA: row.a,
      annotatorB: row.b,
    })),
    liveHumanKappa: "BLOCKED",
    note: "Fixture IAA only. Live human kappa is BLOCKED until founder + second reviewer label the same 30 overlap ids, then re-run this script.",
  };

  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(out, null, 2));
}

main();

/**
 * Run rules_v0 over Phase 4 holdout and write data/phase5/v1.0/eval-report.json.
 *
 *   npx tsx --require ./scripts/lib/preload-server-only.cjs scripts/evaluate-phase5-baseline.ts
 *   npm run baseline:eval
 *
 * Eval does not change bank policy. Do not treat the report as a trained model.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  DEFAULT_HOLDOUT_PATH,
  DEFAULT_REPORT_PATH,
  PHASE0_P50_BUDGET_MS,
  PHASE0_P95_BUDGET_MS,
  evaluateHoldout,
} from "../lib/elah/baseline/evaluate";

function main() {
  const root = process.cwd();
  const holdoutPath = path.join(root, DEFAULT_HOLDOUT_PATH);
  const reportPath = path.join(root, DEFAULT_REPORT_PATH);

  const report = evaluateHoldout(holdoutPath);

  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const p50ok = report.latencyMs.p50 <= PHASE0_P50_BUDGET_MS;
  const p95ok = report.latencyMs.p95 <= PHASE0_P95_BUDGET_MS;

  console.log(
    JSON.stringify(
      {
        wrote: reportPath,
        n: report.n,
        skipped: report.skipped.length,
        intentAccuracy: report.intentAccuracy,
        macroF1: report.macroF1,
        falsePositives: report.falsePositives,
        falseNegatives: report.falseNegatives,
        ece: report.calibration.ece,
        uncalibrated: report.calibration.uncalibrated,
        latencyMs: report.latencyMs,
        phase0BudgetsInformational: {
          p50: { budgetMs: PHASE0_P50_BUDGET_MS, within: p50ok },
          p95: { budgetMs: PHASE0_P95_BUDGET_MS, within: p95ok },
        },
      },
      null,
      2,
    ),
  );
}

main();

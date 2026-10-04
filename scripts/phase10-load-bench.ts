/**
 * Phase 10 in-process load bench. Not HTTP, not a production RPS claim.
 *
 *   npx tsx --require ./scripts/lib/preload-server-only.cjs scripts/phase10-load-bench.ts
 *
 * Writes data/phase10/load-report.json.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { scoreElahEvent } from "../lib/elah/baseline/score";
import type { ElahEvent } from "../lib/elah/envelope";
import { readFileSync } from "node:fs";

const samples = JSON.parse(
  readFileSync(
    path.join(process.cwd(), "tests/events/fixtures/elah-event-samples.json"),
    "utf8",
  ),
) as Record<string, ElahEvent>;

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx]!;
}

function main() {
  const events = [structuredClone(samples["8.1"]!), structuredClone(samples["8.3"]!)];
  for (const event of events) scoreElahEvent(event);

  const samplesMs: number[] = [];
  const iterations = 400;
  const tAll = performance.now();
  for (let i = 0; i < iterations; i++) {
    const event = events[i % events.length]!;
    const t0 = performance.now();
    scoreElahEvent(event);
    samplesMs.push(performance.now() - t0);
  }
  const wallMs = performance.now() - tAll;
  samplesMs.sort((a, b) => a - b);
  const p50 = percentile(samplesMs, 50);
  const p95 = percentile(samplesMs, 95);
  const eventsPerSec = iterations / (wallMs / 1000);

  const report = {
    schemaVersion: "1.0",
    kind: "in_process_extract_predict",
    notHttp: true,
    notProductionRps: true,
    scorer: "rules_v0",
    iterations,
    p50Ms: Number(p50.toFixed(4)),
    p95Ms: Number(p95.toFixed(4)),
    eventsPerSec: Number(eventsPerSec.toFixed(1)),
    clientFailOpenMs: 250,
    serverP95BudgetMs: 200,
    generatedAt: new Date().toISOString(),
    environment: `${process.platform} ${process.arch}`,
  };

  const outDir = path.join(process.cwd(), "data/phase10");
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "load-report.json");
  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  console.log(`wrote ${outPath}`);
}

main();

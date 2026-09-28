/**
 * Write Phase 4 synthetic packs, splits, and manifest.
 *
 *   npx tsx scripts/generate-phase4-dataset.ts
 *
 * Restore: rerun with the same PHASE4_SEED. Do not prisma db push.
 * Does not implement live tool sabotage.
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  PHASE4_CREATED_AT,
  PHASE4_DATASET_VERSION,
  PHASE4_PACKS,
  PHASE4_SEED,
  PHASE4_TAXONOMY_VERSION,
  generatePhase4Dataset,
  packCounts,
  recordsByPack,
  type Phase4Pack,
} from "@/lib/elah/dataset/generate";
import { toJsonl, writeSplits } from "@/lib/elah/dataset/split";
import { assertNoLeakage } from "@/lib/elah/dataset/leakage";
import { assertGoldProvenance } from "@/lib/elah/dataset/provenance";

const ROOT = path.join(process.cwd(), "data", "phase4", "v1.0");
const PACKS_DIR = path.join(ROOT, "packs");
const SPLITS_DIR = path.join(ROOT, "splits");

function sha256(contents: string): string {
  return createHash("sha256").update(contents, "utf8").digest("hex");
}

function relativeFromRepo(filePath: string): string {
  return path.relative(process.cwd(), filePath).split(path.sep).join("/");
}

function main(): void {
  mkdirSync(PACKS_DIR, { recursive: true });
  mkdirSync(SPLITS_DIR, { recursive: true });

  const records = generatePhase4Dataset(PHASE4_SEED);
  assertGoldProvenance(records);
  const byPack = recordsByPack(records);
  const counts = packCounts(records);

  const files: Array<{ path: string; sha256: string; records: number }> = [];

  for (const pack of PHASE4_PACKS) {
    const rows = byPack[pack as Phase4Pack];
    const filePath = path.join(PACKS_DIR, `${pack}.jsonl`);
    const body = toJsonl(rows);
    writeFileSync(filePath, body, "utf8");
    files.push({ path: relativeFromRepo(filePath), sha256: sha256(body), records: rows.length });
  }

  const splitResult = writeSplits(records, SPLITS_DIR, PHASE4_SEED);
  assertNoLeakage(splitResult.train, splitResult.val, splitResult.holdout);

  for (const name of ["train", "val", "holdout"] as const) {
    const filePath = path.join(SPLITS_DIR, `${name}.jsonl`);
    const body = toJsonl(splitResult[name]);
    files.push({ path: relativeFromRepo(filePath), sha256: sha256(body), records: splitResult[name].length });
  }

  const packCountsOnly: Record<string, number> = {};
  for (const pack of PHASE4_PACKS) {
    packCountsOnly[pack] = counts[pack] ?? 0;
  }

  const manifest = {
    datasetVersion: PHASE4_DATASET_VERSION,
    taxonomyVersion: PHASE4_TAXONOMY_VERSION,
    seed: PHASE4_SEED,
    counts: {
      packs: packCountsOnly,
      multi_step_sequences: counts.multi_step_sequences ?? 0,
      total: records.length,
      splits: splitResult.counts,
    },
    generatedAt: PHASE4_CREATED_AT,
    files,
    changelog: ["initial synthetic cut 26 Aug 2026"],
  };

  const manifestPath = path.join(ROOT, "manifest.json");
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  process.stderr.write(
    `phase4 dataset v1.0 rows=${records.length} packs=${PHASE4_PACKS.length} ` +
      `train=${splitResult.counts.train} val=${splitResult.counts.val} ` +
      `holdout=${splitResult.counts.holdout} out=${ROOT}\n`,
  );
}

main();

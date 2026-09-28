/**
 * Deterministic 70/15/15 split. Groups by sequenceId OR twinGroupId OR scenarioId
 * so twins and multi-step sequences never cross splits. Stratifies by pack.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  PHASE4_SEED,
  type DatasetSplit,
  type GoldTrainingRecord,
  type Phase4Pack,
} from "./generate";

export { PHASE4_SEED };

export type SplitName = Exclude<DatasetSplit, null>;

export interface SplitResult {
  train: GoldTrainingRecord[];
  val: GoldTrainingRecord[];
  holdout: GoldTrainingRecord[];
}

export function createSeededRng(seed: number): { next: () => number; int: (max: number) => number } {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int(max: number): number {
      if (max <= 0) return 0;
      return Math.floor(next() * max);
    },
  };
}

export function groupKey(record: GoldTrainingRecord): string {
  if (record.sequenceId) return `seq:${record.sequenceId}`;
  if (record.twinGroupId) return `twin:${record.twinGroupId}`;
  return `scen:${record.scenarioId}`;
}

function shuffleInPlace<T>(items: T[], rng: { int: (max: number) => number }): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    const tmp = items[i];
    items[i] = items[j];
    items[j] = tmp;
  }
  return items;
}

function assignGroupSplit(index: number, total: number): SplitName {
  const nTrain = Math.floor(total * 0.7);
  const nVal = Math.floor(total * 0.15);
  if (index < nTrain) return "train";
  if (index < nTrain + nVal) return "val";
  return "holdout";
}

export function assignSplits(
  records: GoldTrainingRecord[],
  seed: number = PHASE4_SEED,
): GoldTrainingRecord[] {
  const rng = createSeededRng(seed);
  const byPack = new Map<Phase4Pack, Map<string, GoldTrainingRecord[]>>();

  for (const record of records) {
    let packGroups = byPack.get(record.pack);
    if (!packGroups) {
      packGroups = new Map();
      byPack.set(record.pack, packGroups);
    }
    const key = groupKey(record);
    const group = packGroups.get(key) ?? [];
    group.push(record);
    packGroups.set(key, group);
  }

  const splitByKey = new Map<string, SplitName>();
  const packNames = [...byPack.keys()].sort();
  for (const pack of packNames) {
    const packGroups = byPack.get(pack);
    if (!packGroups) continue;
    const keys = shuffleInPlace([...packGroups.keys()].sort(), rng);
    keys.forEach((key, index) => {
      splitByKey.set(key, assignGroupSplit(index, keys.length));
    });
  }

  return records.map((record) => {
    const split = splitByKey.get(groupKey(record)) ?? "train";
    return { ...record, split };
  });
}

export function partitionBySplit(records: GoldTrainingRecord[]): SplitResult {
  const train: GoldTrainingRecord[] = [];
  const val: GoldTrainingRecord[] = [];
  const holdout: GoldTrainingRecord[] = [];
  for (const record of records) {
    if (record.split === "val") val.push(record);
    else if (record.split === "holdout") holdout.push(record);
    else train.push(record);
  }
  return { train, val, holdout };
}

export function toJsonl(records: GoldTrainingRecord[]): string {
  return records.map((row) => JSON.stringify(row)).join("\n") + (records.length ? "\n" : "");
}

export function writeSplits(
  records: GoldTrainingRecord[],
  outDir: string,
  seed: number = PHASE4_SEED,
): SplitResult & { counts: Record<SplitName, number> } {
  const splitRecords = assignSplits(records, seed);
  const parts = partitionBySplit(splitRecords);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "train.jsonl"), toJsonl(parts.train), "utf8");
  writeFileSync(path.join(outDir, "val.jsonl"), toJsonl(parts.val), "utf8");
  writeFileSync(path.join(outDir, "holdout.jsonl"), toJsonl(parts.holdout), "utf8");
  return {
    ...parts,
    counts: {
      train: parts.train.length,
      val: parts.val.length,
      holdout: parts.holdout.length,
    },
  };
}

import { describe, expect, it } from "vitest";
import {
  PHASE4_SEED,
  generatePhase4Dataset,
  type GoldTrainingRecord,
} from "@/lib/elah/dataset/generate";
import { assignSplits, groupKey, partitionBySplit } from "@/lib/elah/dataset/split";
import { assertNoLeakage } from "@/lib/elah/dataset/leakage";

function clone(record: GoldTrainingRecord, overrides: Partial<GoldTrainingRecord>): GoldTrainingRecord {
  return {
    ...record,
    ...overrides,
    event: { ...record.event, ...(overrides.event ?? {}) },
    labels: { ...record.labels, ...(overrides.labels ?? {}) },
    provenance: { ...record.provenance, ...(overrides.provenance ?? {}) },
  };
}

describe("phase4 dataset split", () => {
  const generated = generatePhase4Dataset(PHASE4_SEED);

  it("is deterministic: two runs yield equal event ids per split", () => {
    const a = partitionBySplit(assignSplits(generated, PHASE4_SEED));
    const b = partitionBySplit(assignSplits(generated, PHASE4_SEED));
    const ids = (rows: GoldTrainingRecord[]) => rows.map((row) => row.event.eventId).sort();
    expect(ids(a.train)).toEqual(ids(b.train));
    expect(ids(a.val)).toEqual(ids(b.val));
    expect(ids(a.holdout)).toEqual(ids(b.holdout));
  });

  it("does not leak sequenceId or twinGroupId across splits", () => {
    const parts = partitionBySplit(assignSplits(generated, PHASE4_SEED));
    expect(() => assertNoLeakage(parts.train, parts.val, parts.holdout)).not.toThrow();
  });

  it("keeps twin groups and sequences in a single split", () => {
    const splitRecords = assignSplits(generated, PHASE4_SEED);
    const byGroup = new Map<string, Set<string>>();
    for (const row of splitRecords) {
      const key = groupKey(row);
      const splits = byGroup.get(key) ?? new Set();
      splits.add(String(row.split));
      byGroup.set(key, splits);
    }
    for (const splits of byGroup.values()) {
      expect(splits.size).toBe(1);
    }
  });

  it("catches a planted twinGroupId leak across splits", () => {
    const parts = partitionBySplit(assignSplits(generated, PHASE4_SEED));
    const twinId = "twin-leak-plant";
    const trainPlant = clone(parts.train[0], {
      scenarioId: "leak-plant-train-0001",
      twinGroupId: twinId,
      sequenceId: null,
    });
    const valPlant = clone(parts.val[0], {
      scenarioId: "leak-plant-val-0001",
      twinGroupId: twinId,
      sequenceId: null,
    });
    expect(() => assertNoLeakage([trainPlant], [valPlant], parts.holdout)).toThrow(
      /Leakage: twinGroupId twin-leak-plant appears in train and val/,
    );
  });

  it("catches a planted sequenceId leak across splits", () => {
    const parts = partitionBySplit(assignSplits(generated, PHASE4_SEED));
    const sequenceId = "seq-leak-plant";
    const trainPlant = clone(parts.train[0], {
      scenarioId: "leak-plant-seq-train",
      sequenceId,
      twinGroupId: null,
    });
    const holdoutPlant = clone(parts.holdout[0], {
      scenarioId: "leak-plant-seq-holdout",
      sequenceId,
      twinGroupId: null,
    });
    expect(() => assertNoLeakage([trainPlant], parts.val, [holdoutPlant])).toThrow(
      /Leakage: sequenceId seq-leak-plant appears in train and holdout/,
    );
  });
});

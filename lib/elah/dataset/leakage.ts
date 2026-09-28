import type { GoldTrainingRecord } from "./generate";

function collectKeys(
  records: GoldTrainingRecord[],
  field: "sequenceId" | "twinGroupId",
): Set<string> {
  const keys = new Set<string>();
  for (const record of records) {
    const value = record[field];
    if (typeof value === "string" && value.length > 0) keys.add(value);
  }
  return keys;
}

function intersect(a: Set<string>, b: Set<string>): string[] {
  return [...a].filter((key) => b.has(key)).sort();
}

/**
 * Throws if a sequenceId or twinGroupId appears in more than one of train/val/holdout.
 */
export function assertNoLeakage(
  train: GoldTrainingRecord[],
  val: GoldTrainingRecord[],
  holdout: GoldTrainingRecord[],
): void {
  const splits: Array<["train" | "val" | "holdout", GoldTrainingRecord[]]> = [
    ["train", train],
    ["val", val],
    ["holdout", holdout],
  ];

  for (const field of ["sequenceId", "twinGroupId"] as const) {
    const keyed = splits.map(([name, rows]) => [name, collectKeys(rows, field)] as const);
    for (let i = 0; i < keyed.length; i++) {
      for (let j = i + 1; j < keyed.length; j++) {
        const leaked = intersect(keyed[i][1], keyed[j][1]);
        if (leaked.length > 0) {
          throw new Error(
            `Leakage: ${field} ${leaked.join(", ")} appears in ${keyed[i][0]} and ${keyed[j][0]}`,
          );
        }
      }
    }
  }
}

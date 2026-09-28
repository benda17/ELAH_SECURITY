import type { GoldTrainingRecord, RecordProvenance } from "./generate";
import type { ElahTrainingRecord } from "./schema";

const REQUIRED_PROVENANCE_FIELDS = [
  "source",
  "generatorVersion",
  "taxonomyVersion",
  "annotatorId",
  "createdAt",
] as const;

export function requireProvenance(
  record: unknown,
): asserts record is ElahTrainingRecord & { provenance: RecordProvenance } {
  if (!record || typeof record !== "object") {
    throw new Error("Provenance missing: record is not an object");
  }
  const provenance = (record as { provenance?: unknown }).provenance;
  if (!provenance || typeof provenance !== "object") {
    throw new Error("Provenance missing: provenance object required");
  }
  const row = provenance as Record<string, unknown>;
  for (const field of REQUIRED_PROVENANCE_FIELDS) {
    if (typeof row[field] !== "string" || !row[field]) {
      throw new Error(`Provenance missing field ${field}`);
    }
  }
}

export function summarizeBySource(
  records: Array<{ provenance?: { source?: string } }>,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const record of records) {
    const source = record.provenance?.source ?? "unknown";
    counts[source] = (counts[source] ?? 0) + 1;
  }
  return counts;
}

export function assertGoldProvenance(records: GoldTrainingRecord[]): void {
  for (const record of records) requireProvenance(record);
}

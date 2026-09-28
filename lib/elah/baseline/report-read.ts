/**
 * Read Phase 5 baseline eval-report.json from disk.
 *
 * Returns a typed object with nullable fields, or null if the file is missing
 * or unreadable. Does not throw on a missing file and does not invent zeros.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export const EVAL_REPORT_RELATIVE = "data/phase5/v1.0/eval-report.json";

export type ElahEvalCountRate = {
  count: number | null;
  rate: number | null;
  scenarioIds: string[];
};

export type ElahEvalPerLabel = {
  intent: string;
  support: number | null;
  precision: number | null;
  recall: number | null;
  f1: number | null;
};

export type ElahEvalCalibration = {
  ece: number | null;
  uncalibrated: boolean;
  bins: unknown[];
};

export type ElahEvalLatency = {
  p50: number | null;
  p95: number | null;
  p99: number | null;
  iterations: number | null;
  environment: string | null;
};

export type ElahEvalSkipped = {
  scenarioId: string | null;
  reason: string | null;
};

export type ElahEvalReport = {
  schemaVersion: string | null;
  datasetVersion: string | null;
  split: string | null;
  n: number | null;
  scorer: string | null;
  generatedAt: string | null;
  intentAccuracy: number | null;
  macroF1: number | null;
  falsePositives: ElahEvalCountRate;
  falseNegatives: ElahEvalCountRate;
  perLabel: ElahEvalPerLabel[];
  zeroSupportLabels: string[];
  calibration: ElahEvalCalibration;
  latencyMs: ElahEvalLatency;
  skipped: ElahEvalSkipped[];
  blindedDetectedIntent: boolean | null;
};

function asBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  return null;
}

export function evalReportPath(root = process.cwd()): string {
  return path.join(root, EVAL_REPORT_RELATIVE);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function firstPresent(
  obj: Record<string, unknown>,
  keys: string[],
): unknown {
  for (const key of keys) {
    if (key in obj && obj[key] !== undefined && obj[key] !== null) {
      return obj[key];
    }
  }
  return undefined;
}

function emptyCountRate(): ElahEvalCountRate {
  return { count: null, rate: null, scenarioIds: [] };
}

function parseCountRate(raw: unknown): ElahEvalCountRate {
  const obj = asRecord(raw);
  if (!obj) return emptyCountRate();
  return {
    count: asNumber(firstPresent(obj, ["count", "n"])),
    rate: asNumber(firstPresent(obj, ["rate"])),
    scenarioIds: asStringArray(
      firstPresent(obj, ["scenarioIds", "ids", "scenarios"]),
    ),
  };
}

function parsePerLabelRow(raw: unknown): ElahEvalPerLabel | null {
  const obj = asRecord(raw);
  if (!obj) return null;
  const intent =
    asString(firstPresent(obj, ["intent", "intentLabel", "label"])) ?? "";
  if (!intent) return null;
  return {
    intent,
    support: asNumber(firstPresent(obj, ["support", "n"])),
    precision: asNumber(firstPresent(obj, ["precision", "p", "P"])),
    recall: asNumber(firstPresent(obj, ["recall", "r", "R"])),
    f1: asNumber(firstPresent(obj, ["f1", "F1", "f1Score"])),
  };
}

function parseCalibration(raw: unknown, fallbackEce: unknown): ElahEvalCalibration {
  const obj = asRecord(raw) ?? {};
  const uncalibratedRaw = obj.uncalibrated;
  return {
    ece: asNumber(firstPresent(obj, ["ece", "ECE"])) ?? asNumber(fallbackEce),
    uncalibrated: uncalibratedRaw !== false,
    bins: Array.isArray(obj.bins) ? obj.bins : [],
  };
}

function parseLatency(raw: unknown): ElahEvalLatency {
  const obj = asRecord(raw);
  if (!obj) {
    return {
      p50: null,
      p95: null,
      p99: null,
      iterations: null,
      environment: null,
    };
  }
  return {
    p50: asNumber(firstPresent(obj, ["p50", "P50"])),
    p95: asNumber(firstPresent(obj, ["p95", "P95"])),
    p99: asNumber(firstPresent(obj, ["p99", "P99"])),
    iterations: asNumber(firstPresent(obj, ["iterations", "loops", "repeats"])),
    environment: asString(firstPresent(obj, ["environment", "env", "cpu"])),
  };
}

function parseSkipped(raw: unknown): ElahEvalSkipped[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (typeof item === "string") {
      return { scenarioId: item, reason: null };
    }
    const obj = asRecord(item);
    if (!obj) return { scenarioId: null, reason: null };
    return {
      scenarioId: asString(firstPresent(obj, ["scenarioId", "id"])),
      reason: asString(firstPresent(obj, ["reason"])),
    };
  });
}

function parseReport(raw: unknown): ElahEvalReport | null {
  const obj = asRecord(raw);
  if (!obj) return null;

  const fpRaw = firstPresent(obj, ["falsePositives", "fp", "FP"]);
  const fnRaw = firstPresent(obj, ["falseNegatives", "fn", "FN"]);
  const perLabelRaw = firstPresent(obj, ["perLabel", "per_label", "labels"]);
  const perLabel = Array.isArray(perLabelRaw)
    ? perLabelRaw
        .map(parsePerLabelRow)
        .filter((row): row is ElahEvalPerLabel => row != null)
    : [];

  return {
    schemaVersion: asString(firstPresent(obj, ["schemaVersion", "version"])),
    datasetVersion: asString(firstPresent(obj, ["datasetVersion"])),
    split: asString(firstPresent(obj, ["split"])),
    n: asNumber(firstPresent(obj, ["n", "sampleSize"])),
    scorer: asString(firstPresent(obj, ["scorer", "provenanceScorer"])),
    generatedAt: asString(firstPresent(obj, ["generatedAt", "createdAt"])),
    intentAccuracy: asNumber(
      firstPresent(obj, ["intentAccuracy", "accuracy"]),
    ),
    macroF1: asNumber(firstPresent(obj, ["macroF1", "macro_f1"])),
    falsePositives: parseCountRate(fpRaw),
    falseNegatives: parseCountRate(fnRaw),
    perLabel,
    zeroSupportLabels: asStringArray(
      firstPresent(obj, ["zeroSupportLabels", "zeroSupport"]),
    ),
    calibration: parseCalibration(
      firstPresent(obj, ["calibration"]),
      firstPresent(obj, ["ece", "ECE"]),
    ),
    latencyMs: parseLatency(firstPresent(obj, ["latencyMs", "latency"])),
    skipped: parseSkipped(firstPresent(obj, ["skipped"])),
    blindedDetectedIntent: asBoolean(
      firstPresent(obj, ["blindedDetectedIntent"]),
    ),
  };
}

/**
 * Load the Phase 5 eval report. Returns null when the file is absent,
 * unreadable, or not JSON — never throws for those cases.
 */
export function loadEvalReport(root = process.cwd()): ElahEvalReport | null {
  const filePath = evalReportPath(root);
  try {
    if (!existsSync(filePath)) return null;
    const text = readFileSync(filePath, "utf8");
    if (!text.trim()) return null;
    return parseReport(JSON.parse(text) as unknown);
  } catch {
    return null;
  }
}

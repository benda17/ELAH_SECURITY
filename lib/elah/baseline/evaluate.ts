/**
 * Phase 5 holdout evaluation of the live `scoreElahEvent` baseline (rules_v0
 * today; picks up a feature-based scorer if that module is swapped in).
 *
 * Maps TrainingEventPayload → ElahEvent without attaching scores.
 * Eval does not change bank policy. ELAH never allows, blocks, or executes.
 */

import { readFileSync } from "node:fs";
import os from "node:os";
import {
  ELAH_ACTION_TYPES,
  ELAH_TOOL_NAMES,
  type ElahActionType,
  type ElahEvent,
  type ElahToolName,
} from "@/lib/elah/envelope";
import {
  isElahBankingIntent,
  type ElahTrainingRecord,
  type EvalMetricHook,
  type TrainingEventPayload,
} from "@/lib/elah/dataset/schema";
import type { ElahBankingIntent } from "@/lib/elah/types";
import { scoreElahEvent } from "@/lib/elah/service/mock-scorer";
import type { ScoreStatus } from "@/lib/elah/service/types";
import {
  calibrationReport,
  classifyMetricHooks,
  intentAccuracy,
  isFalseNegative,
  isFalsePositive,
  percentile,
  perLabelMetrics,
  type CalibrationBin,
} from "./metrics";

export const PHASE5_EVAL_SCHEMA_VERSION = "1.0" as const;
export const PHASE5_SCORER = "rules_v0" as const;
export const DEFAULT_HOLDOUT_PATH = "data/phase4/v1.0/splits/holdout.jsonl";
export const DEFAULT_REPORT_PATH = "data/phase5/v1.0/eval-report.json";
/** Repeat in-process scoring so n=100 still yields stable p50/p95. */
export const DEFAULT_LATENCY_LOOPS = 10;
/** Phase 0 informational budgets (in-process score only; no HTTP/auth). */
export const PHASE0_P50_BUDGET_MS = 80;
export const PHASE0_P95_BUDGET_MS = 200;

const ACTION_TYPE_SET = new Set<string>(ELAH_ACTION_TYPES);
const TOOL_NAME_SET = new Set<string>(ELAH_TOOL_NAMES);
const SOURCE_SET = new Set(["ui", "agent", "system"]);
const OUTCOME_SET = new Set([
  "executed",
  "blocked",
  "cancelled",
  "failed",
  "pending_confirmation",
  "conversational",
  "refused",
  "session",
]);
const EXECUTION_STATE_SET = new Set(["pre_tool", "post_tool", "no_tool"]);
const ACTOR_TYPE_SET = new Set(["customer", "manager", "admin", "ai_agent", "anonymous"]);
const TIER_SET = new Set(["basic", "premium", "vip", "not_applicable"]);
const AMOUNT_BUCKET_SET = new Set([
  "none",
  "micro_1_99",
  "small_100_499",
  "medium_500_1999",
  "large_2000_9999",
  "very_large_10000_plus",
]);
const ACCOUNT_CONTEXT_SET = new Set([
  "checking",
  "savings",
  "investment",
  "checking_and_savings",
  "all",
  "unspecified",
]);
const RECIPIENT_TYPE_SET = new Set([
  "none",
  "self",
  "utility",
  "person_name",
  "business",
  "saved_payee",
]);
const POLICY_DECISION_SET = new Set(["allow", "deny", "needs_confirmation", "not_applicable"]);
const MFA_SET = new Set(["unknown", "not_enabled", "passed", "failed", "skipped"]);

export type MapEventResult =
  | { ok: true; event: ElahEvent }
  | { ok: false; reason: string };

export type EvalPredictionRow = {
  scenarioId: string;
  pack: string;
  goldIntent: ElahBankingIntent;
  predIntent: ElahBankingIntent;
  elahScore: number;
  confidence: number;
  status: ScoreStatus;
  hooks: EvalMetricHook[];
};

export type EvalSkippedRow = {
  scenarioId: string;
  reason: string;
};

export type EvalReport = {
  schemaVersion: typeof PHASE5_EVAL_SCHEMA_VERSION;
  datasetVersion: string;
  split: "holdout";
  n: number;
  scorer: typeof PHASE5_SCORER;
  generatedAt: string;
  intentAccuracy: number;
  macroF1: number;
  falsePositives: { count: number; rate: number; scenarioIds: string[] };
  falseNegatives: { count: number; rate: number; scenarioIds: string[] };
  perLabel: Array<{
    intent: ElahBankingIntent;
    support: number;
    precision: number | "n/a";
    recall: number | "n/a";
    f1: number | "n/a";
  }>;
  zeroSupportLabels: ElahBankingIntent[];
  calibration: { ece: number; bins: CalibrationBin[]; uncalibrated: true };
  latencyMs: {
    p50: number;
    p95: number;
    p99: number;
    iterations: number;
    environment: string;
  };
  skipped: EvalSkippedRow[];
  predictions: EvalPredictionRow[];
  /** True when gold `detectedIntent` was stripped before scoring. */
  blindedDetectedIntent: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function inSet<T extends string>(value: unknown, set: Set<string>): value is T {
  return typeof value === "string" && set.has(value);
}

/**
 * Field-by-field map. Casts actionType / toolName / closed enums.
 * Does not copy elahScore or other live score fields onto the event.
 */
export function trainingEventToElahEvent(payload: TrainingEventPayload): MapEventResult {
  if (!isRecord(payload)) {
    return { ok: false, reason: "event is not an object" };
  }
  if (payload.schemaVersion !== "1.0") {
    return { ok: false, reason: `unsupported event.schemaVersion ${String(payload.schemaVersion)}` };
  }
  if (!inSet<ElahActionType>(payload.actionType, ACTION_TYPE_SET)) {
    return { ok: false, reason: `unknown actionType '${String(payload.actionType)}'` };
  }
  if (!inSet(payload.source, SOURCE_SET)) {
    return { ok: false, reason: `invalid source '${String(payload.source)}'` };
  }
  if (!inSet(payload.outcome, OUTCOME_SET)) {
    return { ok: false, reason: `invalid outcome '${String(payload.outcome)}'` };
  }
  if (!inSet(payload.executionState, EXECUTION_STATE_SET)) {
    return { ok: false, reason: `invalid executionState '${String(payload.executionState)}'` };
  }
  if (typeof payload.eventId !== "string" || payload.eventId.length === 0) {
    return { ok: false, reason: "missing eventId" };
  }
  if (typeof payload.occurredAt !== "string" || payload.occurredAt.length === 0) {
    return { ok: false, reason: "missing occurredAt" };
  }
  if (typeof payload.appId !== "string" || payload.appId.length === 0) {
    return { ok: false, reason: "missing appId" };
  }

  const actor = payload.actor;
  if (!isRecord(actor) || !inSet(actor.actorType, ACTOR_TYPE_SET)) {
    return { ok: false, reason: "invalid actor.actorType" };
  }
  if (actor.customerTier != null && !inSet(actor.customerTier, TIER_SET)) {
    return { ok: false, reason: `invalid actor.customerTier '${String(actor.customerTier)}'` };
  }

  const action = payload.action;
  if (!isRecord(action)) {
    return { ok: false, reason: "missing action" };
  }
  let toolName: ElahToolName | null = null;
  if (action.toolName != null) {
    if (!inSet<ElahToolName>(action.toolName, TOOL_NAME_SET)) {
      return { ok: false, reason: `unknown toolName '${String(action.toolName)}'` };
    }
    toolName = action.toolName;
  }
  if (!inSet(action.amountBucket, AMOUNT_BUCKET_SET)) {
    return { ok: false, reason: `invalid amountBucket '${String(action.amountBucket)}'` };
  }
  if (!inSet(action.accountContext, ACCOUNT_CONTEXT_SET)) {
    return { ok: false, reason: `invalid accountContext '${String(action.accountContext)}'` };
  }
  if (!inSet(action.recipientType, RECIPIENT_TYPE_SET)) {
    return { ok: false, reason: `invalid recipientType '${String(action.recipientType)}'` };
  }
  if (action.currency != null && action.currency !== "ILS") {
    return { ok: false, reason: `invalid currency '${String(action.currency)}'` };
  }
  if (!isRecord(action.args)) {
    return { ok: false, reason: "action.args must be an object" };
  }

  if (payload.detectedIntent != null && !isElahBankingIntent(payload.detectedIntent)) {
    return { ok: false, reason: `unknown detectedIntent '${String(payload.detectedIntent)}'` };
  }

  const event: ElahEvent = {
    schemaVersion: "1.0",
    eventId: payload.eventId,
    occurredAt: payload.occurredAt,
    appId: payload.appId,
    source: payload.source,
    actionType: payload.actionType,
    outcome: payload.outcome as ElahEvent["outcome"],
    executionState: payload.executionState,
    actor: {
      sessionId: actor.sessionId ?? null,
      actorType: actor.actorType,
    },
    action: {
      toolName,
      args: { ...action.args },
      amountBucket: action.amountBucket as ElahEvent["action"]["amountBucket"],
      accountContext: action.accountContext as ElahEvent["action"]["accountContext"],
      recipientType: action.recipientType as ElahEvent["action"]["recipientType"],
    },
  };

  if (actor.userIdHash !== undefined) event.actor.userIdHash = actor.userIdHash;
  if (actor.role !== undefined) event.actor.role = actor.role;
  if (actor.customerTier !== undefined) event.actor.customerTier = actor.customerTier;

  if (action.page !== undefined) event.action.page = action.page;
  if (action.amount !== undefined) event.action.amount = action.amount;
  if (action.currency !== undefined) event.action.currency = action.currency;

  if (payload.client) {
    event.client = {
      ipAddress: payload.client.ipAddress,
      userAgent: payload.client.userAgent,
    };
  }

  if (payload.policy) {
    if (!inSet(payload.policy.decision, POLICY_DECISION_SET)) {
      return { ok: false, reason: `invalid policy.decision '${String(payload.policy.decision)}'` };
    }
    event.policy = {
      decision: payload.policy.decision,
      reasons: [...payload.policy.reasons],
      confirmationRequired: payload.policy.confirmationRequired,
    };
  }

  if (payload.conversation) {
    event.conversation = {
      conversationId: payload.conversation.conversationId,
      messageId: payload.conversation.messageId,
    };
    if (payload.conversation.utterance !== undefined) {
      event.conversation.utterance = payload.conversation.utterance;
    }
  }

  if (payload.mfaStatus != null) {
    if (!inSet(payload.mfaStatus, MFA_SET)) {
      return { ok: false, reason: `invalid mfaStatus '${String(payload.mfaStatus)}'` };
    }
    event.mfaStatus = payload.mfaStatus;
  }

  if (payload.detectedIntent != null) {
    event.detectedIntent = payload.detectedIntent;
  }

  return { ok: true, event };
}

export function loadTrainingJsonl(filePath: string): {
  records: ElahTrainingRecord[];
  skipped: EvalSkippedRow[];
} {
  const text = readFileSync(filePath, "utf8");
  const records: ElahTrainingRecord[] = [];
  const skipped: EvalSkippedRow[] = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed) as unknown;
    } catch {
      skipped.push({ scenarioId: `line:${i + 1}`, reason: "invalid json" });
      continue;
    }
    if (!isRecord(parsed)) {
      skipped.push({ scenarioId: `line:${i + 1}`, reason: "record is not an object" });
      continue;
    }
    const scenarioId =
      typeof parsed.scenarioId === "string" && parsed.scenarioId.length > 0
        ? parsed.scenarioId
        : `line:${i + 1}`;
    if (parsed.split != null && parsed.split !== "holdout") {
      skipped.push({ scenarioId, reason: `split is '${String(parsed.split)}', expected holdout` });
      continue;
    }
    if (!isRecord(parsed.event) || !isRecord(parsed.labels)) {
      skipped.push({ scenarioId, reason: "missing event or labels" });
      continue;
    }
    if (!isElahBankingIntent(parsed.labels.intentLabel)) {
      skipped.push({
        scenarioId,
        reason: `unknown gold intentLabel '${String(parsed.labels.intentLabel)}'`,
      });
      continue;
    }
    records.push(parsed as unknown as ElahTrainingRecord);
  }
  return { records, skipped };
}

export function latencyEnvironment(): string {
  return os.cpus()[0]?.model?.trim() || "darwin";
}

function roundMs(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function measureScoreLatency(events: ElahEvent[], loops: number): number[] {
  const samples: number[] = [];
  if (events.length === 0 || loops <= 0) return samples;
  for (const event of events) {
    scoreElahEvent(event);
  }
  for (let i = 0; i < loops; i += 1) {
    for (const event of events) {
      const started = performance.now();
      scoreElahEvent(event);
      samples.push(performance.now() - started);
    }
  }
  return samples;
}

export type EvaluateOptions = {
  generatedAt?: string;
  datasetVersion?: string;
  latencyLoops?: number;
  measureLatency?: boolean;
  /**
   * When true (default), drop gold `detectedIntent` before scoring so holdout
   * measures feature+rules recovery, not echo of the generator's hint.
   * Live POST /v1/score still uses detectedIntent when the envelope has it.
   */
  omitDetectedIntent?: boolean;
};

export function evaluateRecords(
  records: ElahTrainingRecord[],
  preloadSkipped: EvalSkippedRow[] = [],
  options: EvaluateOptions = {},
): EvalReport {
  const skipped: EvalSkippedRow[] = [...preloadSkipped];
  const predictions: EvalPredictionRow[] = [];
  const scoredEvents: ElahEvent[] = [];

  for (const record of records) {
    const mapped = trainingEventToElahEvent(record.event);
    if (!mapped.ok) {
      skipped.push({ scenarioId: record.scenarioId, reason: mapped.reason });
      continue;
    }
    const omitHint = options.omitDetectedIntent !== false;
    const eventForScore: ElahEvent = omitHint
      ? { ...mapped.event }
      : mapped.event;
    if (omitHint) {
      delete eventForScore.detectedIntent;
    }
    try {
      const { status, score } = scoreElahEvent(eventForScore);
      const goldIntent = record.labels.intentLabel;
      const predIntent = score.intentLabel;
      predictions.push({
        scenarioId: record.scenarioId,
        pack: record.pack,
        goldIntent,
        predIntent,
        elahScore: score.elahScore,
        confidence: score.confidence,
        status,
        hooks: classifyMetricHooks({ goldPack: record.pack, goldIntent }),
      });
      scoredEvents.push(eventForScore);
    } catch (err) {
      skipped.push({
        scenarioId: record.scenarioId,
        reason: `scorer threw: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  const n = predictions.length;
  const pairs = predictions.map((row) => ({ gold: row.goldIntent, pred: row.predIntent }));
  const { perLabel, zeroSupportLabels, macroF1 } = perLabelMetrics(pairs);

  const fpIds: string[] = [];
  const fnIds: string[] = [];
  for (const row of predictions) {
    if (
      isFalsePositive({
        goldPack: row.pack,
        goldIntent: row.goldIntent,
        predIntent: row.predIntent,
      })
    ) {
      fpIds.push(row.scenarioId);
    }
    if (isFalseNegative({ goldIntent: row.goldIntent, predIntent: row.predIntent })) {
      fnIds.push(row.scenarioId);
    }
  }

  const cal = calibrationReport(
    predictions.map((row) => ({
      confidence: row.confidence,
      correct: row.goldIntent === row.predIntent,
    })),
  );

  const loops = options.latencyLoops ?? DEFAULT_LATENCY_LOOPS;
  const samples =
    options.measureLatency === false ? [] : measureScoreLatency(scoredEvents, loops);

  const datasetVersion =
    options.datasetVersion ??
    records.find((row) => typeof row.datasetVersion === "string")?.datasetVersion ??
    "v1.0";

  return {
    schemaVersion: PHASE5_EVAL_SCHEMA_VERSION,
    datasetVersion,
    split: "holdout",
    n,
    scorer: PHASE5_SCORER,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    intentAccuracy: intentAccuracy(pairs),
    macroF1,
    falsePositives: {
      count: fpIds.length,
      rate: n === 0 ? 0 : fpIds.length / n,
      scenarioIds: fpIds,
    },
    falseNegatives: {
      count: fnIds.length,
      rate: n === 0 ? 0 : fnIds.length / n,
      scenarioIds: fnIds,
    },
    perLabel,
    zeroSupportLabels,
    calibration: cal,
    latencyMs: {
      p50: roundMs(percentile(samples, 50)),
      p95: roundMs(percentile(samples, 95)),
      p99: roundMs(percentile(samples, 99)),
      iterations: options.measureLatency === false ? 0 : loops,
      environment: latencyEnvironment(),
    },
    skipped,
    predictions,
    blindedDetectedIntent: options.omitDetectedIntent !== false,
  };
}

export function evaluateHoldout(
  holdoutPath: string = DEFAULT_HOLDOUT_PATH,
  options: EvaluateOptions = {},
): EvalReport {
  const { records, skipped } = loadTrainingJsonl(holdoutPath);
  return evaluateRecords(records, skipped, options);
}

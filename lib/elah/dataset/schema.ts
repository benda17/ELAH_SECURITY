/**
 * Phase 4 gold training / eval JSONL schema.
 *
 * Distinct from Prisma `ElahTrainingEvent` (live assistant-turn store).
 * Distinct from `ScoreResponse` (live scorer output).
 *
 * Do not import `lib/elah/envelope.ts` here — that module is `server-only`.
 * `TrainingEventPayload` mirrors ElahEvent 1.0 required fields for gold files.
 */

import {
  ELAH_BANKING_INTENTS,
  type ElahBankingIntent,
} from "../types";

export { ELAH_BANKING_INTENTS };
export type { ElahBankingIntent };

export const ELAH_TRAINING_SCHEMA_VERSION = "1.0" as const;
export const ELAH_TRAINING_APP_ID = "elah-banking-demo";
export const ELAH_TAXONOMY_VERSION = "1.0";

export type AnnotatorConfidence = "high" | "medium" | "low";

export const ANNOTATOR_CONFIDENCE_BANDS = {
  highMin: 0.75,
  mediumMin: 0.4,
} as const;

export const CONTEXTUAL_RISK_TAGS = [
  "high_value",
  "unusual_device",
  "unusual_location",
  "behavior_drift",
  "accidental_error",
  "excessive_permission",
  "authz_boundary",
  "exfiltration",
  "first_payee",
  "unusual_amount",
  "odd_hours",
  "conflict",
  "tool_result_untrusted",
] as const;

export type ContextualRiskTag = (typeof CONTEXTUAL_RISK_TAGS)[number];

export const DATASET_SPLITS = ["train", "val", "holdout"] as const;
export type DatasetSplit = (typeof DATASET_SPLITS)[number] | null;

export const TRAINING_PROVENANCE_SOURCES = [
  "synthetic_generator",
  "simulator_export",
  "manual_label",
] as const;
export type TrainingProvenanceSource = (typeof TRAINING_PROVENANCE_SOURCES)[number];

export const EVAL_METRIC_HOOKS = [
  "intent_accuracy",
  "injection_catch",
  "legitimate_false_positive",
] as const;
export type EvalMetricHook = (typeof EVAL_METRIC_HOOKS)[number];

/** Same forbidden arg keys as ElahEvent 1.0 §6 / envelope.ts (duplicated; do not import envelope). */
export const TRAINING_FORBIDDEN_ARG_KEYS = [
  "userId",
  "customerProfileId",
  "profileId",
  "actorId",
  "sessionId",
  "accountId",
  "fromAccountId",
  "toAccountId",
  "ownerId",
  "targetUserId",
  "password",
  "token",
  "role",
  "cardId",
] as const;

const INTENT_SET = new Set<string>(ELAH_BANKING_INTENTS);
const TAG_SET = new Set<string>(CONTEXTUAL_RISK_TAGS);
const SPLIT_SET = new Set<string>(DATASET_SPLITS);
const PROVENANCE_SOURCE_SET = new Set<string>(TRAINING_PROVENANCE_SOURCES);
const METRIC_HOOK_SET = new Set<string>(EVAL_METRIC_HOOKS);
const FORBIDDEN_ARG_SET = new Set<string>(TRAINING_FORBIDDEN_ARG_KEYS);

const EVENT_SCORE_KEYS = [
  "elahScore",
  "confidence",
  "uncertainty",
  "coordinates",
  "explanation",
  "policyHook",
] as const;

export type TrainingEventPayload = {
  schemaVersion: "1.0";
  eventId: string;
  occurredAt: string;
  appId: string;
  source: "ui" | "agent" | "system";
  actionType: string;
  outcome: string;
  executionState: "pre_tool" | "post_tool" | "no_tool";
  actor: {
    userIdHash?: string | null;
    sessionId: string | null;
    actorType: "customer" | "manager" | "admin" | "ai_agent" | "anonymous";
    role?: string | null;
    customerTier?: "basic" | "premium" | "vip" | "not_applicable" | null;
  };
  client?: {
    ipAddress?: string | null;
    userAgent?: string | null;
  };
  action: {
    toolName: string | null;
    page?: string | null;
    args: Record<string, unknown>;
    amount?: number | null;
    currency?: "ILS" | null;
    amountBucket: string;
    accountContext: string;
    recipientType: string;
  };
  policy?: {
    decision: "allow" | "deny" | "needs_confirmation" | "not_applicable";
    reasons: string[];
    confirmationRequired: boolean;
  };
  conversation?: {
    conversationId: string;
    messageId: string;
    utterance?: string | null;
  };
  mfaStatus?: "unknown" | "not_enabled" | "passed" | "failed" | "skipped";
  detectedIntent?: ElahBankingIntent;
};

export type ElahTrainingLabels = {
  intentLabel: ElahBankingIntent;
  annotatorConfidence: AnnotatorConfidence;
  annotatorConfidenceNumeric: number;
  humanAgency: number;
  financialRisk: number;
  emotionalUrgency: number;
  contextualRiskTags: ContextualRiskTag[];
  matchedSignals: string[];
  weakSignals: string[];
  negativeSignals: string[];
  reviewNotes: string;
};

export type ElahGoldScore = {
  elahScore: number;
  confidence: number;
};

export type ElahTrainingProvenance = {
  source: TrainingProvenanceSource;
  generatorVersion: string;
  taxonomyVersion: string;
  annotatorId: string;
  createdAt: string;
};

export type ElahTrainingRecord = {
  schemaVersion: "1.0";
  datasetVersion: string;
  split: DatasetSplit;
  pack: string;
  scenarioId: string;
  sequenceId?: string | null;
  stepIndex?: number | null;
  twinGroupId?: string | null;
  event: TrainingEventPayload;
  labels: ElahTrainingLabels;
  goldScore?: ElahGoldScore;
  provenance: ElahTrainingProvenance;
};

export type ElahEvalRecord = ElahTrainingRecord & {
  split: "holdout";
  metricHooks: EvalMetricHook[];
};

export type TrainingValidationResult =
  | { ok: true; record: ElahTrainingRecord }
  | { ok: false; errors: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function inUnitInterval(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0 && value <= 1;
}

export function isElahBankingIntent(value: unknown): value is ElahBankingIntent {
  return typeof value === "string" && INTENT_SET.has(value);
}

export function isContextualRiskTag(value: unknown): value is ContextualRiskTag {
  return typeof value === "string" && TAG_SET.has(value);
}

export function annotatorBandFromNumeric(value: number): AnnotatorConfidence {
  if (value >= ANNOTATOR_CONFIDENCE_BANDS.highMin) return "high";
  if (value >= ANNOTATOR_CONFIDENCE_BANDS.mediumMin) return "medium";
  return "low";
}

function pushForbiddenArgs(args: unknown, errors: string[], path: string): void {
  if (!isRecord(args)) {
    errors.push(`${path} must be an object`);
    return;
  }
  for (const key of Object.keys(args)) {
    if (FORBIDDEN_ARG_SET.has(key)) {
      errors.push(`${path} contains forbidden key '${key}'`);
    }
  }
}

function validateEvent(event: unknown, errors: string[]): void {
  if (!isRecord(event)) {
    errors.push("event is required");
    return;
  }
  for (const key of EVENT_SCORE_KEYS) {
    if (key in event) {
      errors.push(`event must not include live score field '${key}'`);
    }
  }
  if (event.schemaVersion !== "1.0") {
    errors.push("event.schemaVersion must be \"1.0\"");
  }
  if (!isNonEmptyString(event.eventId)) errors.push("event.eventId is required");
  if (!isNonEmptyString(event.occurredAt)) errors.push("event.occurredAt is required");
  if (!isNonEmptyString(event.appId)) errors.push("event.appId is required");
  if (event.source !== "ui" && event.source !== "agent" && event.source !== "system") {
    errors.push("event.source must be ui | agent | system");
  }
  if (!isNonEmptyString(event.actionType)) errors.push("event.actionType is required");
  if (!isNonEmptyString(event.outcome)) errors.push("event.outcome is required");
  if (
    event.executionState !== "pre_tool" &&
    event.executionState !== "post_tool" &&
    event.executionState !== "no_tool"
  ) {
    errors.push("event.executionState must be pre_tool | post_tool | no_tool");
  }
  if (!isRecord(event.actor)) {
    errors.push("event.actor is required");
  } else {
    if (event.actor.userIdHash != null) {
      if (
        typeof event.actor.userIdHash !== "string" ||
        !/^[0-9a-f]{32}$/i.test(event.actor.userIdHash)
      ) {
        errors.push("event.actor.userIdHash must be 32 hex characters when present");
      }
    }
    if (!("sessionId" in event.actor)) {
      errors.push("event.actor.sessionId is required (nullable)");
    }
    if (!isNonEmptyString(event.actor.actorType)) {
      errors.push("event.actor.actorType is required");
    }
  }
  if (!isRecord(event.action)) {
    errors.push("event.action is required");
  } else {
    if (!("toolName" in event.action)) errors.push("event.action.toolName is required (nullable)");
    if (!("args" in event.action)) errors.push("event.action.args is required");
    else pushForbiddenArgs(event.action.args, errors, "event.action.args");
    if (!isNonEmptyString(event.action.amountBucket)) {
      errors.push("event.action.amountBucket is required");
    }
    if (!isNonEmptyString(event.action.accountContext)) {
      errors.push("event.action.accountContext is required");
    }
    if (!isNonEmptyString(event.action.recipientType)) {
      errors.push("event.action.recipientType is required");
    }
  }
  if (event.detectedIntent != null && !isElahBankingIntent(event.detectedIntent)) {
    errors.push(`event.detectedIntent is not a canonical intent: ${String(event.detectedIntent)}`);
  }
}

function validateLabels(labels: unknown, errors: string[]): void {
  if (!isRecord(labels)) {
    errors.push("labels are required");
    return;
  }
  if (!("intentLabel" in labels)) {
    errors.push("labels.intentLabel is required");
  } else if (!isElahBankingIntent(labels.intentLabel)) {
    errors.push(`unknown intentLabel (not in closed 22): ${String(labels.intentLabel)}`);
  }
  if (
    labels.annotatorConfidence !== "high" &&
    labels.annotatorConfidence !== "medium" &&
    labels.annotatorConfidence !== "low"
  ) {
    errors.push("labels.annotatorConfidence must be high | medium | low");
  }
  if (!inUnitInterval(labels.annotatorConfidenceNumeric)) {
    errors.push("labels.annotatorConfidenceNumeric must be in [0, 1]");
  }
  if (!inUnitInterval(labels.humanAgency)) {
    errors.push("labels.humanAgency must be in [0, 1]");
  }
  if (!inUnitInterval(labels.financialRisk)) {
    errors.push("labels.financialRisk must be in [0, 1]");
  }
  if (!inUnitInterval(labels.emotionalUrgency)) {
    errors.push("labels.emotionalUrgency must be in [0, 1]");
  }
  if (!Array.isArray(labels.contextualRiskTags)) {
    errors.push("labels.contextualRiskTags must be an array");
  } else {
    for (const tag of labels.contextualRiskTags) {
      if (!isContextualRiskTag(tag)) {
        errors.push(`unknown contextual risk tag: ${String(tag)}`);
      }
    }
  }
  for (const key of ["matchedSignals", "weakSignals", "negativeSignals"] as const) {
    if (!Array.isArray(labels[key])) {
      errors.push(`labels.${key} must be an array of signal ids`);
    }
  }
  if (typeof labels.reviewNotes !== "string") {
    errors.push("labels.reviewNotes is required (string; may be empty except where guidelines require notes)");
  }
}

function validateProvenance(provenance: unknown, errors: string[]): void {
  if (provenance == null) {
    errors.push("provenance is required");
    return;
  }
  if (!isRecord(provenance)) {
    errors.push("provenance must be an object");
    return;
  }
  if (!PROVENANCE_SOURCE_SET.has(String(provenance.source))) {
    errors.push(
      "provenance.source must be synthetic_generator | simulator_export | manual_label",
    );
  }
  if (!isNonEmptyString(provenance.generatorVersion)) {
    errors.push("provenance.generatorVersion is required");
  }
  if (!isNonEmptyString(provenance.taxonomyVersion)) {
    errors.push("provenance.taxonomyVersion is required");
  }
  if (!isNonEmptyString(provenance.annotatorId)) {
    errors.push("provenance.annotatorId is required");
  }
  if (!isNonEmptyString(provenance.createdAt)) {
    errors.push("provenance.createdAt is required");
  }
}

function validateGoldScore(goldScore: unknown, errors: string[]): void {
  if (goldScore == null) return;
  if (!isRecord(goldScore)) {
    errors.push("goldScore must be an object when present");
    return;
  }
  if (!inUnitInterval(goldScore.elahScore)) {
    errors.push("goldScore.elahScore must be in [0, 1]");
  }
  if (!inUnitInterval(goldScore.confidence)) {
    errors.push("goldScore.confidence must be in [0, 1]");
  }
}

export function validateTrainingRecord(value: unknown): TrainingValidationResult {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { ok: false, errors: ["record must be an object"] };
  }
  if (value.schemaVersion !== "1.0") {
    errors.push("schemaVersion must be \"1.0\"");
  }
  if (!isNonEmptyString(value.datasetVersion)) {
    errors.push("datasetVersion is required");
  }
  if (value.split != null && !SPLIT_SET.has(String(value.split))) {
    errors.push("split must be train | val | holdout | null");
  }
  if (!isNonEmptyString(value.pack)) errors.push("pack is required");
  if (!isNonEmptyString(value.scenarioId)) errors.push("scenarioId is required");
  validateEvent(value.event, errors);
  validateLabels(value.labels, errors);
  validateProvenance(value.provenance, errors);
  validateGoldScore(value.goldScore, errors);
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, record: value as ElahTrainingRecord };
}

export function validateEvalRecord(value: unknown): TrainingValidationResult {
  const base = validateTrainingRecord(value);
  if (!base.ok) return base;
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { ok: false, errors: ["record must be an object"] };
  }
  if (value.split !== "holdout") {
    errors.push("eval record split must be holdout");
  }
  if (!Array.isArray(value.metricHooks) || value.metricHooks.length === 0) {
    errors.push("metricHooks is required on eval records");
  } else {
    for (const hook of value.metricHooks) {
      if (!METRIC_HOOK_SET.has(String(hook))) {
        errors.push(`unknown metricHook: ${String(hook)}`);
      }
    }
  }
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, record: value as ElahTrainingRecord };
}

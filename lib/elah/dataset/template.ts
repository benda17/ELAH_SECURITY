import { createHash } from "node:crypto";
import { sanitizeToolArgs } from "../helpers";
import {
  ELAH_TAXONOMY_VERSION,
  ELAH_TRAINING_APP_ID,
  ELAH_TRAINING_SCHEMA_VERSION,
  TRAINING_FORBIDDEN_ARG_KEYS,
  type AnnotatorConfidence,
  type ContextualRiskTag,
  type DatasetSplit,
  type ElahBankingIntent,
  type ElahGoldScore,
  type ElahTrainingLabels,
  type ElahTrainingRecord,
  type TrainingEventPayload,
  type TrainingProvenanceSource,
  annotatorBandFromNumeric,
} from "./schema";

const FORBIDDEN_ARG_SET = new Set<string>(TRAINING_FORBIDDEN_ARG_KEYS);

export type ElahScenarioTemplate = {
  id: string;
  pack: string;
  actorTier: "basic" | "premium" | "vip";
  channel: "ui" | "agent";
  utterance?: string | null;
  plannedTool?: string | null;
  expectedActionType: string;
  expectedIntentLabel: ElahBankingIntent;
  expectedOutcome: string;
  executionState?: TrainingEventPayload["executionState"];
  policy?: TrainingEventPayload["policy"];
  coordinates: {
    humanAgency: number;
    financialRisk: number;
    emotionalUrgency: number;
  };
  tags?: ContextualRiskTag[];
  sequenceId?: string | null;
  stepIndex?: number | null;
  twinGroupId?: string | null;
  args?: Record<string, unknown>;
  amount?: number | null;
  currency?: "ILS" | null;
  amountBucket?: string;
  accountContext?: string;
  recipientType?: string;
  page?: string | null;
  annotatorConfidence?: AnnotatorConfidence;
  annotatorConfidenceNumeric?: number;
  matchedSignals?: string[];
  weakSignals?: string[];
  negativeSignals?: string[];
  reviewNotes?: string;
  goldScore?: ElahGoldScore;
  datasetVersion?: string;
  split?: DatasetSplit;
  occurredAt?: string;
  client?: TrainingEventPayload["client"];
  mfaStatus?: TrainingEventPayload["mfaStatus"];
};

export type CompileScenarioOverrides = {
  datasetVersion?: string;
  split?: DatasetSplit;
  sequenceId?: string | null;
  stepIndex?: number | null;
  twinGroupId?: string | null;
  goldScore?: ElahGoldScore;
  labels?: Partial<ElahTrainingLabels>;
  provenance?: {
    source?: TrainingProvenanceSource;
    generatorVersion?: string;
    taxonomyVersion?: string;
    annotatorId?: string;
    createdAt?: string;
  };
  event?: Partial<TrainingEventPayload>;
};

function sha256Hex(input: string, length: number): string {
  return createHash("sha256").update(input).digest("hex").slice(0, length);
}

export function eventIdFromScenarioId(scenarioId: string): string {
  return `evt_${sha256Hex(`elah.scenario:${scenarioId}`, 24)}`;
}

export function fakeUserIdHash(scenarioId: string): string {
  return sha256Hex(`elah.synthetic.actor:${scenarioId}`, 32);
}

function amountBucketFromAmount(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount) || amount <= 0) return "none";
  if (amount < 100) return "micro_1_99";
  if (amount < 500) return "small_100_499";
  if (amount < 2000) return "medium_500_1999";
  if (amount < 10000) return "large_2000_9999";
  return "very_large_10000_plus";
}

function sanitizeArgs(args: Record<string, unknown> | undefined): Record<string, unknown> {
  const stripped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args ?? {})) {
    if (FORBIDDEN_ARG_SET.has(key)) continue;
    stripped[key] = value;
  }
  return sanitizeToolArgs(stripped);
}

function actorRole(tier: ElahScenarioTemplate["actorTier"]): string {
  if (tier === "premium") return "premium_customer";
  if (tier === "vip") return "vip_customer";
  return "regular_customer";
}

function defaultPage(template: ElahScenarioTemplate): string {
  if (template.page) return template.page;
  if (template.channel === "agent") return "/assistant";
  if (template.expectedActionType === "statement_download") return "/documents";
  if (template.expectedActionType === "profile_update") return "/profile";
  if (template.expectedActionType.includes("card")) return "/cards";
  if (template.expectedActionType === "bill_payment") return "/payments";
  return "/transfer";
}

/**
 * Compile a scenario template into a schemaVersion 1.0 gold training record.
 * eventId and actor.userIdHash are deterministic hashes of scenarioId.
 */
export function compileScenarioToTrainingRecord(
  template: ElahScenarioTemplate,
  overrides: CompileScenarioOverrides = {},
): ElahTrainingRecord {
  const scenarioId = template.id;
  const source = template.channel;
  const toolName =
    source === "ui" ? null : (template.plannedTool ?? null);
  const executionState =
    template.executionState ??
    (source === "agent" && toolName ? "pre_tool" : "no_tool");
  const args = sanitizeArgs(overrides.event?.action?.args ?? template.args);
  const amount = template.amount ?? null;
  const numericConfidence = template.annotatorConfidenceNumeric ?? 0.9;
  const annotatorConfidence =
    template.annotatorConfidence ?? annotatorBandFromNumeric(numericConfidence);
  const occurredAt =
    overrides.event?.occurredAt ?? template.occurredAt ?? "2026-08-26T12:00:00.000Z";
  const eventId = overrides.event?.eventId ?? eventIdFromScenarioId(scenarioId);
  const sessionId = `ses_${sha256Hex(`elah.session:${scenarioId}`, 24)}`;

  const event: TrainingEventPayload = {
    schemaVersion: "1.0",
    eventId,
    occurredAt,
    appId: ELAH_TRAINING_APP_ID,
    source,
    actionType: template.expectedActionType,
    outcome: template.expectedOutcome,
    executionState,
    actor: {
      userIdHash: fakeUserIdHash(scenarioId),
      sessionId,
      actorType: "customer",
      role: actorRole(template.actorTier),
      customerTier: template.actorTier,
      ...overrides.event?.actor,
    },
    action: {
      page: defaultPage(template),
      amount,
      currency: amount != null ? (template.currency ?? "ILS") : null,
      amountBucket: template.amountBucket ?? amountBucketFromAmount(amount),
      accountContext: template.accountContext ?? "checking",
      recipientType: template.recipientType ?? "none",
      ...overrides.event?.action,
      args: sanitizeArgs(overrides.event?.action?.args ?? args),
      toolName: overrides.event?.action?.toolName ?? toolName,
    },
    mfaStatus: template.mfaStatus ?? "unknown",
    detectedIntent: template.expectedIntentLabel,
  };

  if (template.client) event.client = template.client;
  if (overrides.event?.client) event.client = overrides.event.client;

  if (template.policy) event.policy = template.policy;
  if (overrides.event?.policy) event.policy = overrides.event.policy;

  if (source === "agent") {
    event.conversation = {
      conversationId: `cnv_${sha256Hex(`elah.conv:${scenarioId}`, 24)}`,
      messageId: `msg_${sha256Hex(`elah.msg:${scenarioId}`, 24)}`,
      utterance: template.utterance ?? null,
      ...overrides.event?.conversation,
    };
  }

  const labels: ElahTrainingLabels = {
    intentLabel: template.expectedIntentLabel,
    annotatorConfidence,
    annotatorConfidenceNumeric: numericConfidence,
    humanAgency: template.coordinates.humanAgency,
    financialRisk: template.coordinates.financialRisk,
    emotionalUrgency: template.coordinates.emotionalUrgency,
    contextualRiskTags: template.tags ?? [],
    matchedSignals: template.matchedSignals ?? [],
    weakSignals: template.weakSignals ?? [],
    negativeSignals: template.negativeSignals ?? [],
    reviewNotes: template.reviewNotes ?? "",
    ...overrides.labels,
  };

  const provenanceSource =
    overrides.provenance?.source ?? "synthetic_generator";
  const createdAt =
    overrides.provenance?.createdAt ?? "2026-08-26T12:00:00.000Z";

  const record: ElahTrainingRecord = {
    schemaVersion: ELAH_TRAINING_SCHEMA_VERSION,
    datasetVersion: overrides.datasetVersion ?? template.datasetVersion ?? "v1.0",
    split: overrides.split ?? template.split ?? null,
    pack: template.pack,
    scenarioId,
    sequenceId: overrides.sequenceId ?? template.sequenceId ?? null,
    stepIndex: overrides.stepIndex ?? template.stepIndex ?? null,
    twinGroupId: overrides.twinGroupId ?? template.twinGroupId ?? null,
    event,
    labels,
    provenance: {
      source: provenanceSource,
      generatorVersion: overrides.provenance?.generatorVersion ?? "1.0",
      taxonomyVersion: overrides.provenance?.taxonomyVersion ?? ELAH_TAXONOMY_VERSION,
      annotatorId: overrides.provenance?.annotatorId ?? "synthetic",
      createdAt,
    },
  };

  const goldScore = overrides.goldScore ?? template.goldScore;
  if (goldScore) record.goldScore = goldScore;

  return record;
}

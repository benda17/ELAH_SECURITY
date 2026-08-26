import "server-only";
import { prisma } from "@/lib/db";

/**
 * Read the latest Phase 3 ELAH score snapshot for an ElahEvent.
 * Scores live on AgentEventLog metadata (`elah_scored` / `elah_scoring_unavailable`).
 * They are NOT fields of ElahEvent and MUST NOT be merged onto envelope JSON.
 */

export const ELAH_SCORE_LOG_TYPES = [
  "elah_scored",
  "elah_scoring_unavailable",
] as const;

export type ElahScoreLogType = (typeof ELAH_SCORE_LOG_TYPES)[number];

export type ElahScoreCoordinates = {
  humanAgency: number | null;
  financialRisk: number | null;
  emotionalUrgency: number | null;
};

export type ElahScoreExplanation = {
  matchedSignals: string[];
  weakSignals: string[];
  negativeSignals: string[];
  summary: string | null;
};

export type ElahScorePolicyHook = {
  recommendation: string | null;
  reasons: string[];
};

export type ElahScoredSnapshot = {
  kind: "scored";
  eventType: "elah_scored";
  status: "scored" | "abstained";
  elahScore: number | null;
  confidence: number | null;
  uncertainty: number | null;
  intentLabel: string | null;
  coordinates: ElahScoreCoordinates | null;
  explanation: ElahScoreExplanation;
  policyHook: ElahScorePolicyHook;
  requestId: string | null;
  scoredAt: string | null;
  provenanceScorer: string | null;
};

export type ElahUnavailableSnapshot = {
  kind: "unavailable";
  eventType: "elah_scoring_unavailable";
  status: "unavailable";
  reason: string;
  requestId: string | null;
  httpStatus: number | null;
  errorCode: string | null;
};

export type ElahScoreSnapshot = ElahScoredSnapshot | ElahUnavailableSnapshot;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function parseMetadataJson(
  raw: string | null | undefined,
): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return asRecord(parsed) ?? {};
  } catch {
    return {};
  }
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function asStatus(value: unknown): "scored" | "abstained" {
  return value === "abstained" ? "abstained" : "scored";
}

function coordinatesOf(raw: unknown): ElahScoreCoordinates | null {
  const obj = asRecord(raw);
  if (!obj) return null;
  return {
    humanAgency: asNumber(obj.humanAgency),
    financialRisk: asNumber(obj.financialRisk),
    emotionalUrgency: asNumber(obj.emotionalUrgency),
  };
}

function explanationOf(raw: unknown): ElahScoreExplanation {
  const obj = asRecord(raw);
  if (!obj) {
    return {
      matchedSignals: [],
      weakSignals: [],
      negativeSignals: [],
      summary: null,
    };
  }
  return {
    matchedSignals: asStringArray(obj.matchedSignals),
    weakSignals: asStringArray(obj.weakSignals),
    negativeSignals: asStringArray(obj.negativeSignals),
    summary: asString(obj.summary),
  };
}

function policyHookOf(raw: unknown): ElahScorePolicyHook {
  const obj = asRecord(raw);
  if (!obj) return { recommendation: null, reasons: [] };
  return {
    recommendation: asString(obj.recommendation),
    reasons: asStringArray(obj.reasons),
  };
}

function scoreObjectOf(meta: Record<string, unknown>): Record<string, unknown> {
  const nested =
    asRecord(meta.score) ??
    asRecord(asRecord(meta.scoreResponse)?.score) ??
    asRecord(asRecord(meta.response)?.score);
  return nested ?? meta;
}

function responseEnvelopeOf(
  meta: Record<string, unknown>,
): Record<string, unknown> {
  return asRecord(meta.scoreResponse) ?? asRecord(meta.response) ?? meta;
}

export function parseScoreSnapshot(
  eventType: string,
  metadata: Record<string, unknown>,
): ElahScoreSnapshot | null {
  if (eventType === "elah_scoring_unavailable") {
    const envelope = responseEnvelopeOf(metadata);
    const error = asRecord(envelope.error) ?? asRecord(metadata.error);
    const reason =
      asString(metadata.reason) ??
      asString(metadata.unavailableReason) ??
      asString(envelope.reason) ??
      asString(error?.message) ??
      "scoring_unavailable";
    return {
      kind: "unavailable",
      eventType: "elah_scoring_unavailable",
      status: "unavailable",
      reason,
      requestId:
        asString(metadata.requestId) ?? asString(envelope.requestId) ?? null,
      httpStatus:
        asNumber(metadata.httpStatus) ??
        asNumber(metadata.statusCode) ??
        asNumber(envelope.httpStatus),
      errorCode:
        asString(metadata.errorCode) ??
        asString(error?.code) ??
        asString(envelope.errorCode),
    };
  }

  if (eventType !== "elah_scored") return null;

  const envelope = responseEnvelopeOf(metadata);
  const score = scoreObjectOf(metadata);
  const provenance = asRecord(score.provenance) ?? asRecord(envelope.provenance);

  return {
    kind: "scored",
    eventType: "elah_scored",
    status: asStatus(envelope.status ?? metadata.status ?? score.status),
    elahScore: asNumber(score.elahScore) ?? asNumber(metadata.elahScore),
    confidence: asNumber(score.confidence) ?? asNumber(metadata.confidence),
    uncertainty: asNumber(score.uncertainty) ?? asNumber(metadata.uncertainty),
    intentLabel: asString(score.intentLabel) ?? asString(metadata.intentLabel),
    coordinates: coordinatesOf(score.coordinates ?? metadata.coordinates),
    explanation: explanationOf(score.explanation ?? metadata.explanation),
    policyHook: policyHookOf(score.policyHook ?? metadata.policyHook),
    requestId:
      asString(envelope.requestId) ?? asString(metadata.requestId) ?? null,
    scoredAt:
      asString(envelope.scoredAt) ?? asString(metadata.scoredAt) ?? null,
    provenanceScorer:
      asString(provenance?.scorer) ?? asString(metadata.scorer) ?? "rules_v0",
  };
}

export async function loadLatestScoreSnapshot(
  eventId: string,
): Promise<ElahScoreSnapshot | null> {
  if (!eventId) return null;
  const row = await prisma.agentEventLog.findFirst({
    where: {
      eventId,
      eventType: { in: [...ELAH_SCORE_LOG_TYPES] },
    },
    orderBy: { timestamp: "desc" },
  });
  if (!row) return null;
  return parseScoreSnapshot(row.eventType, parseMetadataJson(row.metadata));
}

export async function loadLatestScoreSnapshots(
  eventIds: string[],
): Promise<Map<string, ElahScoreSnapshot>> {
  const unique = [...new Set(eventIds.filter(Boolean))];
  const out = new Map<string, ElahScoreSnapshot>();
  if (unique.length === 0) return out;

  const rows = await prisma.agentEventLog.findMany({
    where: {
      eventId: { in: unique },
      eventType: { in: [...ELAH_SCORE_LOG_TYPES] },
    },
    orderBy: { timestamp: "desc" },
  });

  for (const row of rows) {
    if (!row.eventId || out.has(row.eventId)) continue;
    const snapshot = parseScoreSnapshot(
      row.eventType,
      parseMetadataJson(row.metadata),
    );
    if (snapshot) out.set(row.eventId, snapshot);
  }
  return out;
}

export function formatScoreNumber(value: number | null): string {
  if (value == null) return "—";
  return value.toFixed(3);
}

export function scoreListBadge(snapshot: ElahScoreSnapshot | null): {
  label: string;
  variant: "info" | "warning" | "default";
} | null {
  if (!snapshot) return null;
  if (snapshot.kind === "unavailable") {
    return { label: "unavailable", variant: "warning" };
  }
  if (snapshot.status === "abstained") {
    return { label: "abstained", variant: "warning" };
  }
  return {
    label: snapshot.elahScore != null ? formatScoreNumber(snapshot.elahScore) : "scored",
    variant: "info",
  };
}

import "server-only";
import { prisma } from "@/lib/db";
import { writeAgentEvent } from "@/lib/agent/logger";
import type { ElahLabelSource } from "./types";
import type { ElahScore } from "@/lib/elah/service";
import type { ScoreElahResult } from "./client";

const LABEL_SOURCES = new Set<string>([
  "rules_v0",
  "intent_matrix",
  "backfill",
  "manual",
]);

export type PersistElahScoreInput = {
  result: ScoreElahResult;
  eventId: string;
  userId: string;
  sessionId: string | null;
  conversationId: string;
  messageId: string;
  toolName?: string | null;
};

export function isElahLabelSource(value: unknown): value is ElahLabelSource {
  return typeof value === "string" && LABEL_SOURCES.has(value);
}

/** Map a scored ElahScore onto existing ElahTrainingEvent columns. */
export function trainingPatchFromElahScore(score: ElahScore): {
  elahScoreLabel: number;
  labelConfidence: number;
  humanAgency: number;
  financialRisk: number;
  emotionalUrgency: number;
  matchedSignals: string;
  weakSignals: string;
  negativeSignals: string;
  labelSource: ElahLabelSource;
} {
  const labelSource = isElahLabelSource(score.provenance?.labelSource)
    ? score.provenance.labelSource
    : "rules_v0";
  return {
    elahScoreLabel: score.elahScore,
    labelConfidence: score.confidence,
    humanAgency: score.coordinates.humanAgency,
    financialRisk: score.coordinates.financialRisk,
    emotionalUrgency: score.coordinates.emotionalUrgency,
    matchedSignals: JSON.stringify(score.explanation?.matchedSignals ?? []),
    weakSignals: JSON.stringify(score.explanation?.weakSignals ?? []),
    negativeSignals: JSON.stringify(score.explanation?.negativeSignals ?? []),
    labelSource,
  };
}

export function elahScoreFromAgentMetadata(
  raw: string | null | undefined,
): ElahScore | null {
  if (!raw) return null;
  try {
    const meta = JSON.parse(raw) as unknown;
    if (!meta || typeof meta !== "object") return null;
    const score = (meta as { score?: unknown }).score;
    if (!score || typeof score !== "object") return null;
    if (typeof (score as ElahScore).elahScore !== "number") return null;
    return score as ElahScore;
  } catch {
    return null;
  }
}

async function applyScoreToTrainingEvent(
  messageId: string,
  score: ElahScore,
): Promise<void> {
  const existing = await prisma.elahTrainingEvent.findUnique({
    where: { messageId },
    select: { id: true },
  });
  if (!existing) return;
  await prisma.elahTrainingEvent.update({
    where: { messageId },
    data: trainingPatchFromElahScore(score),
  });
}

/**
 * Persist ScoreResponse or scoring_unavailable against the originating eventId.
 * Never throws. Does not fabricate an ElahScore on unavailable.
 */
export async function persistElahScore(input: PersistElahScoreInput): Promise<void> {
  try {
    const { result, eventId } = input;
    if (result.kind === "scored") {
      const { response, latencyMs, requestId } = result;
      const score = response.score;
      await writeAgentEvent({
        eventType: "elah_scored",
        userId: input.userId,
        sessionId: input.sessionId,
        conversationId: input.conversationId,
        messageId: input.messageId,
        toolName: input.toolName ?? null,
        detectedIntent: score.intentLabel,
        resultSummary: `${response.status}: ${score.intentLabel}`,
        latencyMs,
        eventId,
        metadata: {
          ...response,
          requestId: response.requestId || requestId,
          eventId: response.eventId || eventId,
          latencyMs,
        },
      });
      await applyScoreToTrainingEvent(input.messageId, score);
      return;
    }

    await writeAgentEvent({
      eventType: "elah_scoring_unavailable",
      userId: input.userId,
      sessionId: input.sessionId,
      conversationId: input.conversationId,
      messageId: input.messageId,
      toolName: input.toolName ?? null,
      resultSummary: result.reason,
      latencyMs: result.latencyMs,
      eventId,
      metadata: {
        requestId: result.requestId,
        eventId,
        reason: result.reason,
        httpStatus: result.httpStatus ?? null,
        errorCode: result.errorCode ?? null,
        latencyMs: result.latencyMs,
      },
    });
  } catch (err) {
    console.error("[elah-score-persist] write failed", err);
  }
}
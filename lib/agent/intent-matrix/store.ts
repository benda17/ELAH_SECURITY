import "server-only";
import { prisma } from "@/lib/db";
import { sanitizeToolArgs } from "@/lib/agent/logger";
import { INTENT_MATRIX_BY_ID } from "./seed-data";
import { normalizeIntentMessage } from "./classifier";
import type {
  ClassifyAgentIntentResult,
  IntentActionStatus,
  RecordIntentEventInput,
} from "./types";

let seedPromise: Promise<void> | null = null;

function vectorJson(v: number[]) {
  return JSON.stringify(v);
}

function riskNumeric(level: string): number {
  switch (level) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}

function dateBucket(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export async function ensureIntentMatrixSeed() {
  if (!seedPromise) {
    seedPromise = (async () => {
      for (const row of INTENT_MATRIX_BY_ID.values()) {
        await prisma.intentMatrixSeed.upsert({
          where: { intentId: row.intentId },
          create: {
            intentId: row.intentId,
            label: row.label,
            examples: JSON.stringify(row.examples),
            hVector: vectorJson(row.H),
            bVector: vectorJson(row.B),
            sVector: vectorJson(row.S),
            x: row.x,
            y: row.y,
            z: row.z,
            baselineWeight: row.baselineWeight,
            requiresConfirmation: row.requiresConfirmation,
            allowedTools: JSON.stringify(row.allowedTools),
            policyAction: row.policyAction,
          },
          update: {
            label: row.label,
            examples: JSON.stringify(row.examples),
            hVector: vectorJson(row.H),
            bVector: vectorJson(row.B),
            sVector: vectorJson(row.S),
            x: row.x,
            y: row.y,
            z: row.z,
            baselineWeight: row.baselineWeight,
            requiresConfirmation: row.requiresConfirmation,
            allowedTools: JSON.stringify(row.allowedTools),
            policyAction: row.policyAction,
          },
        });
      }
    })();
  }
  await seedPromise;
}

async function bumpAggregate(
  intentId: string,
  userId: string,
  event: {
    x: number;
    y: number;
    z: number;
    confidence: number;
    riskLevel: string;
    actionStatus: string;
  },
  at: Date,
) {
  const bucket = dateBucket(at);
  const existing = await prisma.agentIntentAggregate.findUnique({
    where: {
      dateBucket_intentId_userId: {
        dateBucket: bucket,
        intentId,
        userId,
      },
    },
  });

  const risk = riskNumeric(event.riskLevel);
  const confirmedDelta = event.actionStatus === "confirmed" || event.actionStatus === "executed" ? 1 : 0;
  const blockedDelta = event.actionStatus === "blocked" ? 1 : 0;
  const failedDelta = event.actionStatus === "failed" ? 1 : 0;

  if (!existing) {
    await prisma.agentIntentAggregate.create({
      data: {
        dateBucket: bucket,
        intentId,
        userId,
        count: 1,
        avgX: event.x,
        avgY: event.y,
        avgZ: event.z,
        avgConfidence: event.confidence,
        avgRisk: risk,
        confirmedCount: confirmedDelta,
        blockedCount: blockedDelta,
        failedCount: failedDelta,
        lastSeenAt: at,
      },
    });
    return;
  }

  const nextCount = existing.count + 1;
  await prisma.agentIntentAggregate.update({
    where: { id: existing.id },
    data: {
      count: nextCount,
      avgX: (existing.avgX * existing.count + event.x) / nextCount,
      avgY: (existing.avgY * existing.count + event.y) / nextCount,
      avgZ: (existing.avgZ * existing.count + event.z) / nextCount,
      avgConfidence: (existing.avgConfidence * existing.count + event.confidence) / nextCount,
      avgRisk: (existing.avgRisk * existing.count + risk) / nextCount,
      confirmedCount: existing.confirmedCount + confirmedDelta,
      blockedCount: existing.blockedCount + blockedDelta,
      failedCount: existing.failedCount + failedDelta,
      lastSeenAt: at,
    },
  });
}

export async function recordIntentEvent(input: RecordIntentEventInput): Promise<string> {
  await ensureIntentMatrixSeed();
  const seed = INTENT_MATRIX_BY_ID.get(input.classification.intentId)!;
  const normalized = normalizeIntentMessage(input.rawUserMessage);
  const actionStatus = input.actionStatus ?? "classified";
  const at = new Date();

  const row = await prisma.agentIntentEvent.create({
    data: {
      userId: input.userId,
      sessionId: input.sessionId,
      conversationId: input.conversationId,
      messageId: input.messageId,
      rawUserMessage: input.rawUserMessage,
      normalizedMessage: normalized,
      intentId: input.classification.intentId,
      intentLabel: seed.label,
      confidence: input.classification.confidence,
      hVector: vectorJson(input.classification.H),
      bVector: vectorJson(input.classification.B),
      sVector: vectorJson(input.classification.S),
      x: input.classification.point.x,
      y: input.classification.point.y,
      z: input.classification.point.z,
      baselineWeight: seed.baselineWeight,
      riskLevel: input.classification.riskLevel,
      requiresConfirmation: input.classification.requiresConfirmation,
      toolName: input.toolName ?? null,
      toolArgsSanitized: input.toolArgsSanitized
        ? JSON.stringify(input.toolArgsSanitized)
        : null,
      policyDecision: input.policyDecision ?? null,
      actionStatus,
      suspiciousPatterns: JSON.stringify(input.classification.suspiciousPatterns),
      source: "ai_assistant",
      timestamp: at,
    },
  });

  await bumpAggregate(
    input.classification.intentId,
    "__global__",
    {
      x: input.classification.point.x,
      y: input.classification.point.y,
      z: input.classification.point.z,
      confidence: input.classification.confidence,
      riskLevel: input.classification.riskLevel,
      actionStatus,
    },
    at,
  );

  await bumpAggregate(
    input.classification.intentId,
    input.userId,
    {
      x: input.classification.point.x,
      y: input.classification.point.y,
      z: input.classification.point.z,
      confidence: input.classification.confidence,
      riskLevel: input.classification.riskLevel,
      actionStatus,
    },
    at,
  );

  return row.id;
}

export async function updateIntentEvent(
  eventId: string,
  patch: {
    toolName?: string | null;
    toolArgs?: Record<string, unknown> | null;
    policyDecision?: string | null;
    actionStatus?: IntentActionStatus;
    suspiciousPatterns?: string[];
  },
) {
  const existing = await prisma.agentIntentEvent.findUnique({ where: { id: eventId } });
  if (!existing) return;

  const prevStatus = existing.actionStatus;
  const nextStatus = patch.actionStatus ?? prevStatus;
  const sanitized =
    patch.toolArgs != null ? sanitizeToolArgs(patch.toolArgs) : undefined;

  await prisma.agentIntentEvent.update({
    where: { id: eventId },
    data: {
      ...(patch.toolName !== undefined ? { toolName: patch.toolName } : {}),
      ...(sanitized !== undefined
        ? { toolArgsSanitized: JSON.stringify(sanitized) }
        : {}),
      ...(patch.policyDecision !== undefined
        ? { policyDecision: patch.policyDecision }
        : {}),
      ...(patch.actionStatus ? { actionStatus: patch.actionStatus } : {}),
      ...(patch.suspiciousPatterns
        ? { suspiciousPatterns: JSON.stringify(patch.suspiciousPatterns) }
        : {}),
    },
  });

  if (patch.actionStatus && patch.actionStatus !== prevStatus) {
    const statusDelta =
      (patch.actionStatus === "confirmed" || patch.actionStatus === "executed") &&
      prevStatus !== "confirmed" &&
      prevStatus !== "executed"
        ? 1
        : 0;
    const blockedDelta =
      patch.actionStatus === "blocked" && prevStatus !== "blocked" ? 1 : 0;
    const failedDelta =
      patch.actionStatus === "failed" && prevStatus !== "failed" ? 1 : 0;

    if (statusDelta || blockedDelta || failedDelta) {
      for (const userId of ["__global__", existing.userId] as const) {
        const agg = await prisma.agentIntentAggregate.findUnique({
          where: {
            dateBucket_intentId_userId: {
              dateBucket: dateBucket(existing.timestamp),
              intentId: existing.intentId,
              userId,
            },
          },
        });
        if (!agg) continue;
        await prisma.agentIntentAggregate.update({
          where: { id: agg.id },
          data: {
            confirmedCount: agg.confirmedCount + statusDelta,
            blockedCount: agg.blockedCount + blockedDelta,
            failedCount: agg.failedCount + failedDelta,
          },
        });
      }
    }
  }
}

export function classificationFromSeed(intentId: string): ClassifyAgentIntentResult {
  const seed = INTENT_MATRIX_BY_ID.get(intentId)!;
  return {
    intentId,
    confidence: 0.99,
    H: seed.H,
    B: seed.B,
    S: seed.S,
    point: { x: seed.x, y: seed.y, z: seed.z },
    requiresConfirmation: seed.requiresConfirmation,
    riskLevel:
      intentId === "unsafe_prompt_injection"
        ? "critical"
        : seed.y >= 0.52
          ? "high"
          : seed.y >= 0.32
            ? "medium"
            : "low",
    explanation: `Forced classification: ${seed.label}`,
    matchedSignals: ["policy_block"],
    suspiciousPatterns: intentId === "unsafe_prompt_injection" ? ["policy_block"] : [],
  };
}

import "server-only";
import { prisma } from "@/lib/db";
import type { ClassifyAgentIntentResult } from "@/lib/agent/intent-matrix/types";
import {
  calculateInitialCoordinates,
  calculateInitialElahScore,
  detectAccountContext,
  detectAmountBucket,
  detectInitialIntent,
  detectRecipientType,
  extractExplanationSignals,
  hashUserId,
  sanitizeToolArgs,
} from "./helpers";
import type {
  AssistantInteractionInput,
  ElahActionOutcome,
  ElahLabelSource,
} from "./types";
import { currentEventId } from "./event-context";
import {
  elahScoreFromAgentMetadata,
  trainingPatchFromElahScore,
} from "./score-persist";

const DEFAULT_APP_ID = process.env.ELAH_APP_ID ?? "elah-banking-demo";

export async function createElahTrainingEventFromAssistantInteraction(
  interaction: AssistantInteractionInput & { eventId?: string | null },
): Promise<{ created: boolean; id: string }> {
  const existing = await prisma.elahTrainingEvent.findUnique({
    where: { messageId: interaction.messageId },
    select: { id: true },
  });
  if (existing) {
    return { created: false, id: existing.id };
  }

  const sanitizedArgs = sanitizeToolArgs(interaction.toolArgs ?? null);
  const trainingContext = {
    message: interaction.userQuestion,
    plannedTool: interaction.plannedTool ?? null,
    toolArgs: sanitizedArgs,
    matrixIntentId: interaction.matrixIntentId ?? null,
    matrixConfidence: interaction.matrixConfidence ?? null,
    matrixMatchedSignals: interaction.matrixMatchedSignals ?? [],
    matrixSuspiciousPatterns: interaction.matrixSuspiciousPatterns ?? [],
    actionOutcome: interaction.actionOutcome,
    matrixCoordinates: interaction.matrixCoordinates ?? null,
  };

  const finalIntent = detectInitialIntent(
    interaction.userQuestion,
    interaction.plannedTool ?? interaction.executedTool ?? null,
    interaction.matrixIntentId ?? null,
  );
  const coordinates = calculateInitialCoordinates(finalIntent, trainingContext);
  const elahScoreLabel = calculateInitialElahScore(finalIntent, trainingContext);
  const explanation = extractExplanationSignals(
    interaction.userQuestion,
    interaction.plannedTool ?? interaction.executedTool ?? null,
    trainingContext,
  );

  const scoredLog = await prisma.agentEventLog.findFirst({
    where: { messageId: interaction.messageId, eventType: "elah_scored" },
    orderBy: { timestamp: "desc" },
    select: { metadata: true },
  });
  const scored = elahScoreFromAgentMetadata(scoredLog?.metadata);
  const fromScore = scored ? trainingPatchFromElahScore(scored) : null;

  const row = await prisma.elahTrainingEvent.create({
    data: {
      appId: interaction.appId ?? DEFAULT_APP_ID,
      userIdHash: hashUserId(interaction.userId),
      sessionId: interaction.sessionId ?? null,
      conversationId: interaction.conversationId,
      messageId: interaction.messageId,
      userQuestion: interaction.userQuestion,
      assistantAnswer: interaction.assistantAnswer,
      previousUserMessages: JSON.stringify(interaction.previousUserMessages ?? []),
      previousAssistantMessages: JSON.stringify(
        interaction.previousAssistantMessages ?? [],
      ),
      plannedTool: interaction.plannedTool ?? null,
      executedTool: interaction.executedTool ?? null,
      toolArgsSanitized: JSON.stringify(sanitizedArgs),
      toolResultSummary: interaction.toolResultSummary ?? null,
      actionOutcome: interaction.actionOutcome,
      amountBucket: detectAmountBucket(interaction.userQuestion, sanitizedArgs),
      recipientType: detectRecipientType(interaction.userQuestion, sanitizedArgs),
      accountContext: detectAccountContext(interaction.userQuestion, sanitizedArgs),
      userHadActiveSession: interaction.userHadActiveSession ?? !!interaction.sessionId,
      mfaStatus: interaction.mfaStatus ?? "unknown",
      finalIntent,
      elahScoreLabel: fromScore?.elahScoreLabel ?? elahScoreLabel,
      humanAgency: fromScore?.humanAgency ?? coordinates.humanAgency,
      financialRisk: fromScore?.financialRisk ?? coordinates.financialRisk,
      emotionalUrgency: fromScore?.emotionalUrgency ?? coordinates.emotionalUrgency,
      labelSource: fromScore?.labelSource ?? interaction.labelSource ?? "rules_v0",
      labelConfidence:
        fromScore?.labelConfidence ?? interaction.matrixConfidence ?? elahScoreLabel,
      matchedSignals: fromScore?.matchedSignals ?? JSON.stringify(explanation.matchedSignals),
      weakSignals: fromScore?.weakSignals ?? JSON.stringify(explanation.weakSignals),
      negativeSignals:
        fromScore?.negativeSignals ?? JSON.stringify(explanation.negativeSignals),
      notes: interaction.notes ?? null,
      eventId: interaction.eventId ?? currentEventId() ?? null,
      ...(interaction.createdAt ? { createdAt: interaction.createdAt, updatedAt: interaction.createdAt } : {}),
    },
  });

  return { created: true, id: row.id };
}

export interface RecordElahTurnInput {
  userId: string;
  sessionId: string | null;
  conversationId: string;
  userMessageId: string;
  userQuestion: string;
  assistantAnswer: string;
  plannedTool?: string | null;
  executedTool?: string | null;
  toolArgs?: Record<string, unknown> | null;
  toolResultSummary?: string | null;
  actionOutcome: ElahActionOutcome;
  matrixClassification?: ClassifyAgentIntentResult | null;
  labelSource?: ElahLabelSource;
  eventId?: string | null;
}

export async function recordElahTrainingEventForTurn(
  input: RecordElahTurnInput,
): Promise<void> {
  const anchor = await prisma.agentMessage.findUnique({
    where: { id: input.userMessageId },
    select: { createdAt: true },
  });
  const prior = await prisma.agentMessage.findMany({
    where: {
      conversationId: input.conversationId,
      ...(anchor ? { createdAt: { lt: anchor.createdAt } } : {}),
      role: { in: ["user", "assistant"] },
    },
    orderBy: { createdAt: "asc" },
    take: 10,
    select: { role: true, content: true },
  });
  const previousUserMessages = prior
    .filter((m) => m.role === "user")
    .slice(-5)
    .map((m) => m.content);
  const previousAssistantMessages = prior
    .filter((m) => m.role === "assistant")
    .slice(-5)
    .map((m) => m.content);

  await createElahTrainingEventFromAssistantInteraction({
    userId: input.userId,
    sessionId: input.sessionId,
    conversationId: input.conversationId,
    messageId: input.userMessageId,
    userQuestion: input.userQuestion,
    assistantAnswer: input.assistantAnswer,
    previousUserMessages,
    previousAssistantMessages,
    plannedTool: input.plannedTool ?? null,
    executedTool: input.executedTool ?? null,
    toolArgs: input.toolArgs ?? null,
    toolResultSummary: input.toolResultSummary ?? null,
    actionOutcome: input.actionOutcome,
    userHadActiveSession: !!input.sessionId,
    matrixIntentId: input.matrixClassification?.intentId ?? null,
    matrixConfidence: input.matrixClassification?.confidence ?? null,
    matrixCoordinates: input.matrixClassification?.point ?? null,
    matrixMatchedSignals: input.matrixClassification?.matchedSignals ?? [],
    matrixSuspiciousPatterns: input.matrixClassification?.suspiciousPatterns ?? [],
    labelSource: input.labelSource ?? "rules_v0",
    eventId: input.eventId ?? currentEventId() ?? null,
  });
}

export async function backfillElahTrainingEvents(options?: {
  limit?: number;
  dryRun?: boolean;
}): Promise<{ scanned: number; created: number; skipped: number }> {
  const limit = options?.limit ?? 5000;
  const dryRun = options?.dryRun ?? false;

  const userMessages = await prisma.agentMessage.findMany({
    where: { role: "user" },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: {
      id: true,
      conversationId: true,
      content: true,
      createdAt: true,
      conversation: { select: { userId: true } },
    },
  });

  let created = 0;
  let skipped = 0;

  for (const userMsg of userMessages) {
    const exists = await prisma.elahTrainingEvent.findUnique({
      where: { messageId: userMsg.id },
      select: { id: true },
    });
    if (exists) {
      skipped += 1;
      continue;
    }

    const assistantMsg = await prisma.agentMessage.findFirst({
      where: {
        conversationId: userMsg.conversationId,
        role: "assistant",
        createdAt: { gte: userMsg.createdAt },
      },
      orderBy: { createdAt: "asc" },
    });

    const intentEvent = await prisma.agentIntentEvent.findFirst({
      where: { messageId: userMsg.id },
    });

    const toolEvent = await prisma.agentEventLog.findFirst({
      where: {
        conversationId: userMsg.conversationId,
        OR: [{ messageId: assistantMsg?.id }, { userMessage: userMsg.content }],
      },
      orderBy: { timestamp: "desc" },
    });

    const actionOutcome = mapActionOutcome(intentEvent?.actionStatus, toolEvent?.eventType);
    const toolArgs = parseJsonRecord(intentEvent?.toolArgsSanitized ?? toolEvent?.toolArgsSanitized);

    if (dryRun) {
      created += 1;
      continue;
    }

    const result = await createElahTrainingEventFromAssistantInteraction({
      appId: DEFAULT_APP_ID,
      userId: userMsg.conversation.userId,
      sessionId: intentEvent?.sessionId ?? toolEvent?.sessionId ?? null,
      conversationId: userMsg.conversationId,
      messageId: userMsg.id,
      userQuestion: userMsg.content,
      assistantAnswer: assistantMsg?.content ?? toolEvent?.assistantMessage ?? "",
      plannedTool: intentEvent?.toolName ?? toolEvent?.toolName ?? assistantMsg?.toolName ?? null,
      executedTool:
        actionOutcome === "executed"
          ? intentEvent?.toolName ?? toolEvent?.toolName ?? assistantMsg?.toolName ?? null
          : null,
      toolArgs,
      toolResultSummary: toolEvent?.resultSummary ?? assistantMsg?.toolResult ?? null,
      actionOutcome,
      matrixIntentId: intentEvent?.intentId ?? null,
      matrixConfidence: intentEvent?.confidence ?? null,
      matrixCoordinates: intentEvent
        ? { x: intentEvent.x, y: intentEvent.y, z: intentEvent.z }
        : null,
      matrixMatchedSignals: parseJsonArray(intentEvent?.suspiciousPatterns),
      matrixSuspiciousPatterns: parseJsonArray(intentEvent?.suspiciousPatterns),
      labelSource: "backfill",
      createdAt: userMsg.createdAt,
    });

    if (result.created) created += 1;
    else skipped += 1;
  }

  return { scanned: userMessages.length, created, skipped };
}

function mapActionOutcome(
  actionStatus?: string | null,
  eventType?: string | null,
): ElahActionOutcome {
  if (actionStatus === "executed") return "executed";
  if (actionStatus === "blocked") return "blocked";
  if (actionStatus === "cancelled") return "cancelled";
  if (actionStatus === "failed") return "failed";
  if (actionStatus === "pending_confirmation") return "pending_confirmation";
  if (eventType === "suspicious_prompt_detected") return "blocked";
  if (eventType === "policy_check_failed") return "refused";
  if (eventType === "confirmation_required") return "pending_confirmation";
  if (eventType === "tool_call_executed") return "executed";
  if (eventType === "tool_call_failed") return "failed";
  return "conversational";
}

function parseJsonRecord(raw?: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function parseJsonArray(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

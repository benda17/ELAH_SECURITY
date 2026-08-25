import type { Prisma } from "@prisma/client";
import "server-only";
import { prisma } from "@/lib/db";

const UTTERANCE_CAP = 2000;

const SCORING_HOP_TYPES = new Set([
  "tool_call_requested",
  "confirmation_required",
  "policy_check_passed",
  "policy_check_failed",
  "tool_call_executed",
  "suspicious_prompt_detected",
]);

export type CorrelatedHop = {
  eventType: string;
  toolName: string | null;
  sequence?: number;
  eventId: string | null;
  timestamp: string;
  userMessage: string | null;
  assistantMessage: string | null;
  resultSummary: string | null;
  policyDecision: string | null;
};

export type CorrelatedMessage = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
};

export type ModelOutputSummary = {
  usedFallback: boolean | null;
  plannedTool: string | null;
  intent: string | null;
  refuse: boolean | null;
  explanation: string | null;
  result: string | null;
};

export type CorrelateTurnResult = {
  utterance: string | null;
  assistantReply: string | null;
  messages: CorrelatedMessage[];
  modelOutput: ModelOutputSummary | null;
  policyDecision: string | null;
  resultSummary: string | null;
  intent: { intentId: string; intentLabel: string; confidence: number } | null;
  hops: CorrelatedHop[];
  eventId: string | null;
};

function parseMetadata(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // ignore malformed metadata
  }
  return {};
}

function sequenceOf(metadata: Record<string, unknown>): number | undefined {
  const value = metadata.sequence;
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function capUtterance(text: string | null | undefined): string | null {
  if (!text) return null;
  return text.length > UTTERANCE_CAP ? text.slice(0, UTTERANCE_CAP) : text;
}

function modelOutputOf(
  metadata: Record<string, unknown>,
): ModelOutputSummary | null {
  const raw = metadata.modelOutput;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  return {
    usedFallback: typeof o.usedFallback === "boolean" ? o.usedFallback : null,
    plannedTool: typeof o.plannedTool === "string" ? o.plannedTool : null,
    intent: typeof o.intent === "string" ? o.intent : null,
    refuse: typeof o.refuse === "boolean" ? o.refuse : null,
    explanation: typeof o.explanation === "string" ? o.explanation : null,
    result: typeof o.result === "string" ? o.result : null,
  };
}

function mergeModelOutputs(
  items: ModelOutputSummary[],
): ModelOutputSummary | null {
  if (items.length === 0) return null;
  const out: ModelOutputSummary = {
    usedFallback: null,
    plannedTool: null,
    intent: null,
    refuse: null,
    explanation: null,
    result: null,
  };
  for (const item of items) {
    if (item.usedFallback != null) out.usedFallback = item.usedFallback;
    if (item.plannedTool != null) out.plannedTool = item.plannedTool;
    if (item.intent != null) out.intent = item.intent;
    if (item.refuse != null) out.refuse = item.refuse;
    if (item.explanation) out.explanation = item.explanation;
    if (item.result) out.result = item.result;
  }
  return out;
}

function safeContainsId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "");
}

/**
 * Reconstruct one assistant turn: customer text, assistant reply,
 * classified intent, and AgentEventLog hops. Hops MAY share `eventId`
 * with the scoring unit; that is correlation, not a duplicate envelope.
 *
 * Assistant replies are stored on a different AgentMessage id than the
 * user turn, so we also match metadata.turnId and the conversation transcript.
 */
export async function correlateTurn(input: {
  conversationId: string;
  messageId: string;
  eventId?: string | null;
}): Promise<CorrelateTurnResult> {
  const turnId = safeContainsId(input.messageId);
  const eventIdFilter = input.eventId ? safeContainsId(input.eventId) : "";

  const hopOr: Prisma.AgentEventLogWhereInput[] = [
    { messageId: input.messageId },
  ];
  if (turnId) {
    hopOr.push({ metadata: { contains: `"turnId":"${turnId}"` } });
  }
  if (eventIdFilter) {
    hopOr.push({ eventId: eventIdFilter });
  }

  const [rows, intentRow, transcript] = await Promise.all([
    prisma.agentEventLog.findMany({
      where: {
        conversationId: input.conversationId,
        OR: hopOr,
      },
    }),
    prisma.agentIntentEvent.findFirst({
      where: { messageId: input.messageId },
      orderBy: { timestamp: "desc" },
    }),
    prisma.agentMessage.findMany({
      where: { conversationId: input.conversationId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const decorated = rows.map((row) => {
    const metadata = parseMetadata(row.metadata);
    const sequence = sequenceOf(metadata);
    return { row, sequence, metadata };
  });

  decorated.sort((a, b) => {
    const sa = a.sequence ?? Number.POSITIVE_INFINITY;
    const sb = b.sequence ?? Number.POSITIVE_INFINITY;
    if (sa !== sb) return sa - sb;
    return a.row.timestamp.getTime() - b.row.timestamp.getTime();
  });

  const hops: CorrelatedHop[] = decorated.map(({ row, sequence }) => {
    const hop: CorrelatedHop = {
      eventType: row.eventType,
      toolName: row.toolName ?? null,
      eventId: row.eventId ?? null,
      timestamp: row.timestamp.toISOString(),
      userMessage: capUtterance(row.userMessage),
      assistantMessage: capUtterance(row.assistantMessage),
      resultSummary: row.resultSummary ?? null,
      policyDecision: row.policyDecision ?? null,
    };
    if (sequence != null) hop.sequence = sequence;
    return hop;
  });

  const userIndex = transcript.findIndex((m) => m.id === input.messageId);
  const turnMessages =
    userIndex >= 0
      ? (() => {
          const nextUser = transcript.findIndex(
            (m, i) => i > userIndex && m.role === "user",
          );
          return transcript.slice(
            userIndex,
            nextUser === -1 ? undefined : nextUser,
          );
        })()
      : [];

  const messages: CorrelatedMessage[] = turnMessages.map((m) => ({
    id: m.id,
    role: m.role,
    content: capUtterance(m.content) ?? "",
    createdAt: m.createdAt.toISOString(),
  }));

  const utteranceFromTranscript =
    turnMessages.find((m) => m.role === "user")?.content ?? null;
  const replyFromTranscript =
    [...turnMessages].reverse().find((m) => m.role === "assistant")?.content ??
    null;

  const utteranceRow =
    decorated.find(
      (d) => d.row.eventType === "user_message_received" && d.row.userMessage,
    )?.row ?? decorated.find((d) => d.row.userMessage)?.row;

  const replyRow =
    decorated.find((d) => d.row.assistantMessage)?.row ??
    [...decorated].reverse().find((d) => d.row.assistantMessage)?.row;

  const scoringHop =
    decorated.find((d) => SCORING_HOP_TYPES.has(d.row.eventType) && d.row.eventId)
      ?.row ?? decorated.find((d) => d.row.eventId)?.row;

  const modelOutput = mergeModelOutputs(
    decorated
      .map((d) => modelOutputOf(d.metadata))
      .filter((m): m is ModelOutputSummary => m != null),
  );

  const policyRow = [...decorated]
    .reverse()
    .find((d) => d.row.policyDecision)?.row;

  const resultRow = [...decorated]
    .reverse()
    .find((d) => d.row.resultSummary)?.row;

  return {
    utterance: capUtterance(utteranceFromTranscript ?? utteranceRow?.userMessage),
    assistantReply: capUtterance(
      replyFromTranscript ?? replyRow?.assistantMessage,
    ),
    messages,
    modelOutput,
    policyDecision: policyRow?.policyDecision ?? null,
    resultSummary: resultRow?.resultSummary ?? null,
    intent: intentRow
      ? {
          intentId: intentRow.intentId,
          intentLabel: intentRow.intentLabel,
          confidence: intentRow.confidence,
        }
      : null,
    hops,
    eventId: scoringHop?.eventId ?? input.eventId ?? null,
  };
}

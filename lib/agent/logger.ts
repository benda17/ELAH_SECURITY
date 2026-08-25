import "server-only";
import { prisma } from "@/lib/db";
import { currentEventId, mintEventId } from "@/lib/elah/event-context";
import { FORBIDDEN_TOOL_ARG_KEYS } from "./sanitize";

export const MODEL_SNIPPET_CAP = 500;

/** Short, redacted text from the model or tool — never a token dump. */
export function capModelSnippet(text: string | null | undefined): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;
  const redacted = trimmed.replace(/\d{8,}/g, "[redacted_account_number]");
  if (redacted.length <= MODEL_SNIPPET_CAP) return redacted;
  return `${redacted.slice(0, MODEL_SNIPPET_CAP)}…`;
}

export type AgentEventType =
  | "user_message_received"
  | "agent_message_created"
  | "agent_intent_classified"
  | "tool_call_requested"
  | "policy_check_passed"
  | "policy_check_failed"
  | "confirmation_required"
  | "action_confirmed"
  | "action_cancelled"
  | "tool_call_executed"
  | "tool_call_failed"
  | "suspicious_prompt_detected"
  | "unauthorized_access_attempt"
  | "agent_error";

export interface WriteAgentEventInput {
  eventType: AgentEventType;
  userId?: string | null;
  sessionId?: string | null;
  conversationId?: string | null;
  messageId?: string | null;
  userMessage?: string | null;
  assistantMessage?: string | null;
  detectedIntent?: string | null;
  toolName?: string | null;
  toolArgsSanitized?: Record<string, unknown> | null;
  policyDecision?: "allow" | "deny" | "needs_confirmation" | null;
  policyReasons?: string[] | null;
  riskScore?: number | null;
  resultSummary?: string | null;
  latencyMs?: number | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  eventId?: string | null;
}

/**
 * Sanitize arbitrary tool args so we never persist secrets or oversized blobs.
 * Also strips known "identity smuggling" fields.
 */
export function sanitizeToolArgs(
  args: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!args) return {};
  const out: Record<string, unknown> = {};
  const forbidden = FORBIDDEN_TOOL_ARG_KEYS;
  for (const [k, v] of Object.entries(args)) {
    if (forbidden.has(k)) continue;
    if (v == null) {
      out[k] = null;
    } else if (typeof v === "string" && v.length > 400) {
      out[k] = v.slice(0, 400) + "…";
    } else {
      out[k] = v;
    }
  }
  return out;
}

/**
 * Next monotonic hop index for a conversation's AgentEventLog chain.
 * Stored in metadata.sequence (no Prisma column). Returns 1 when none exist
 * or conversationId is missing.
 */
export async function nextAgentSequence(
  conversationId: string | null | undefined,
): Promise<number> {
  if (!conversationId) return 1;
  const count = await prisma.agentEventLog.count({
    where: { conversationId },
  });
  return count + 1;
}

function resolveTurnId(input: WriteAgentEventInput): string | undefined {
  const fromMeta = input.metadata?.turnId;
  if (typeof fromMeta === "string" && fromMeta.length > 0) return fromMeta;
  if (typeof input.messageId === "string" && input.messageId.length > 0) {
    return input.messageId;
  }
  return undefined;
}

/**
 * Ops-only AgentEventLog metadata. schemaVersion here is the capture hop
 * contract, not ElahEvent 1.0 (that mapper lives elsewhere).
 */
export function mergeAgentEventMetadata(
  input: WriteAgentEventInput,
  sequence: number,
): Record<string, unknown> {
  const turnId = resolveTurnId(input);
  return {
    ...(input.metadata ?? {}),
    schemaVersion: "1.0",
    sequence,
    ...(turnId ? { turnId } : {}),
  };
}

export async function writeAgentEvent(input: WriteAgentEventInput) {
  try {
    const eventId = input.eventId ?? currentEventId() ?? mintEventId();
    const sequence = await nextAgentSequence(input.conversationId);
    const metadata = mergeAgentEventMetadata(input, sequence);
    return await prisma.agentEventLog.create({
      data: {
        eventType: input.eventType,
        userId: input.userId ?? null,
        sessionId: input.sessionId ?? null,
        conversationId: input.conversationId ?? null,
        messageId: input.messageId ?? null,
        userMessage: input.userMessage ?? null,
        assistantMessage: input.assistantMessage ?? null,
        detectedIntent: input.detectedIntent ?? null,
        toolName: input.toolName ?? null,
        toolArgsSanitized: input.toolArgsSanitized
          ? JSON.stringify(input.toolArgsSanitized)
          : null,
        policyDecision: input.policyDecision ?? null,
        policyReasons: input.policyReasons
          ? JSON.stringify(input.policyReasons)
          : null,
        riskScore: input.riskScore ?? null,
        resultSummary: input.resultSummary ?? null,
        latencyMs: input.latencyMs ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadata: JSON.stringify(metadata),
        eventId,
      },
    });
  } catch (err) {
    // Never let logging fail the request.
    console.error("[agent-event-log] write failed", err);
    return undefined;
  }
}

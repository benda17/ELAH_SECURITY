import "server-only";
import { prisma } from "@/lib/db";
import { FORBIDDEN_TOOL_ARG_KEYS } from "./sanitize";

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

export async function writeAgentEvent(input: WriteAgentEventInput) {
  try {
    await prisma.agentEventLog.create({
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
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });
  } catch (err) {
    // Never let logging fail the request.
    console.error("[agent-event-log] write failed", err);
  }
}

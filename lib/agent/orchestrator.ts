import "server-only";
import { prisma } from "@/lib/db";
import { tierPolicy, actorTypeFromRole, tierFromRole } from "@/lib/auth/roles";
import { runWithToolAuditContext } from "@/lib/logging/logger";
import type { SessionUser } from "@/lib/auth/session";
import { classifyIntent, isCancelMessage, isConfirmMessage } from "./intent";
import {
  classifyAgentIntent,
  recordIntentEvent,
  updateIntentEvent,
} from "./intent-matrix";
import { callLLM, type LLMMessage } from "./llm";
import { sanitizeToolArgs, writeAgentEvent } from "./logger";
import {
  detectPromptInjection,
  detectInjectionInHistory,
  validateToolCall,
  type PolicyDecision,
} from "./policy";
import { executeTool, summarizeTool } from "./tools";
import { recordElahTrainingEventForTurn } from "@/lib/elah/training-event";
import type { ElahActionOutcome } from "@/lib/elah/types";
import {
  filterToolArgs,
  sanitizeClientError,
  sanitizeClientToolData,
} from "./sanitize";
import type {
  AgentChatResponseBody,
  AgentIntent,
  AgentPendingActionView,
  ToolContext,
} from "./types";

const PENDING_TTL_MINUTES = 10;

function firstName(fullName: string) {
  return fullName.split(/\s+/)[0] || fullName;
}

function toolAuditDefaults(
  user: SessionUser,
  audit: { ipAddress: string; sessionCookieId: string | null },
) {
  return {
    actorType: actorTypeFromRole(user.role),
    actorId: user.id,
    actorName: user.name,
    role: user.role,
    customerTier: user.customerProfile?.tier ?? tierFromRole(user.role),
    sessionId: audit.sessionCookieId,
    ipAddress: audit.ipAddress,
  };
}

function riskScoreFor(decision: PolicyDecision, injection: boolean): number {
  if (injection) return 90;
  if (decision.decision === "deny") return 75;
  if (decision.decision === "needs_confirmation") return 35;
  return 10;
}

async function getOrCreateConversation(
  userId: string,
  conversationId: string | undefined,
  audit: { sessionId: string | null; ipAddress: string },
) {
  if (conversationId) {
    const existing = await prisma.agentConversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (existing) return existing;
    await writeAgentEvent({
      eventType: "unauthorized_access_attempt",
      userId,
      sessionId: audit.sessionId,
      metadata: { attemptedConversationId: conversationId },
      ipAddress: audit.ipAddress,
      resultSummary: "Client supplied a conversationId not owned by this user",
    });
  }
  return prisma.agentConversation.create({
    data: { userId, status: "active" },
  });
}

function parsePendingArgs(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function cancelOpenPendingActions(conversationId: string, userId: string) {
  await prisma.agentPendingAction.updateMany({
    where: { conversationId, userId, status: "pending" },
    data: { status: "cancelled" },
  });
}

function clientToolCallPayload(
  name: string,
  summary: string,
  ok: boolean,
  data?: unknown,
  error?: string,
) {
  return {
    name,
    summary,
    ok,
    data: data !== undefined ? sanitizeClientToolData(name, data) : undefined,
    error: sanitizeClientError(error),
  };
}

async function loadHistory(conversationId: string): Promise<LLMMessage[]> {
  const rows = await prisma.agentMessage.findMany({
    where: { conversationId, role: { in: ["user", "assistant"] } },
    orderBy: { createdAt: "asc" },
    take: 20,
  });
  return rows.map((r) => ({
    role: r.role as "user" | "assistant",
    content: r.content,
  }));
}

async function trackUserIntent(
  input: HandleAgentChatInput,
  conversationId: string,
  messageId: string,
  toolCallContext?: { toolName?: string | null; policyDecision?: string | null },
) {
  const history = await loadHistory(conversationId);
  const classification = classifyAgentIntent({
    message: input.message,
    conversationContext: {
      conversationId,
      recentMessages: history,
    },
    toolCallContext,
  });
  const eventId = await recordIntentEvent({
    userId: input.user.id,
    sessionId: input.sessionCookieId,
    conversationId,
    messageId,
    rawUserMessage: input.message,
    classification,
  });
  return { classification, eventId };
}

async function patchIntent(
  eventId: string | null,
  patch: Parameters<typeof updateIntentEvent>[1],
) {
  if (!eventId) return;
  await updateIntentEvent(eventId, patch);
}

async function pendingActionView(
  pending: Awaited<ReturnType<typeof prisma.agentPendingAction.findFirst>>,
): Promise<AgentPendingActionView | null> {
  if (!pending) return null;
  return {
    id: pending.id,
    actionType: pending.actionType,
    toolName: pending.toolName,
    summary: pending.summary,
    createdAt: pending.createdAt.toISOString(),
    expiresAt: pending.expiresAt.toISOString(),
    status: pending.status,
  };
}

async function expireStalePending(conversationId: string) {
  await prisma.agentPendingAction.updateMany({
    where: {
      conversationId,
      status: "pending",
      expiresAt: { lt: new Date() },
    },
    data: { status: "expired" },
  });
}

export interface HandleAgentChatInput {
  user: SessionUser;
  message: string;
  conversationId?: string;
  ipAddress: string;
  userAgent?: string;
  sessionCookieId: string | null;
}

export async function handleAgentChat(
  input: HandleAgentChatInput,
): Promise<AgentChatResponseBody> {
  const started = Date.now();
  const profile = input.user.customerProfile!;
  const profileId = profile.id;
  const tier = profile.tier as "basic" | "premium" | "vip";
  const policy = tierPolicy(tier);

  const conversation = await getOrCreateConversation(
    input.user.id,
    input.conversationId,
    { sessionId: input.sessionCookieId, ipAddress: input.ipAddress },
  );
  await expireStalePending(conversation.id);

  const userMsg = await prisma.agentMessage.create({
    data: {
      conversationId: conversation.id,
      role: "user",
      content: input.message.trim(),
    },
  });

  if (!conversation.title && input.message.trim()) {
    await prisma.agentConversation.update({
      where: { id: conversation.id },
      data: { title: input.message.trim().slice(0, 80) },
    });
  }

  await writeAgentEvent({
    eventType: "user_message_received",
    userId: input.user.id,
    sessionId: input.sessionCookieId,
    conversationId: conversation.id,
    messageId: userMsg.id,
    userMessage: input.message,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  const { classification: matrixIntent, eventId: intentEventId } =
    await trackUserIntent(input, conversation.id, userMsg.id);

  async function commitElahTurn(args: {
    assistantAnswer: string;
    plannedTool?: string | null;
    executedTool?: string | null;
    toolArgs?: Record<string, unknown> | null;
    toolResultSummary?: string | null;
    actionOutcome: ElahActionOutcome;
  }) {
    await recordElahTrainingEventForTurn({
      userId: input.user.id,
      sessionId: input.sessionCookieId,
      conversationId: conversation.id,
      userMessageId: userMsg.id,
      userQuestion: input.message,
      matrixClassification: matrixIntent,
      ...args,
    }).catch((err) => console.error("[elah-training]", err));
  }

  const injection = detectPromptInjection(input.message);
  const unsafeMatrixIntent = matrixIntent.intentId === "unsafe_prompt_injection";
  if (injection.matched || unsafeMatrixIntent) {
    const reply =
      "I can't help with that request. I'm only able to assist with your own banking tasks using approved channels.";
    const assistantMsg = await prisma.agentMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: reply,
        latencyMs: Date.now() - started,
      },
    });
    await patchIntent(intentEventId, {
      actionStatus: "blocked",
      policyDecision: "deny",
      suspiciousPatterns: [
        ...matrixIntent.suspiciousPatterns,
        ...injection.labels,
      ],
    });
    await writeAgentEvent({
      eventType: "suspicious_prompt_detected",
      userId: input.user.id,
      sessionId: input.sessionCookieId,
      conversationId: conversation.id,
      messageId: assistantMsg.id,
      userMessage: input.message,
      assistantMessage: reply,
      detectedIntent: "prompt_injection_attempt",
      policyDecision: "deny",
      policyReasons: injection.matched ? injection.labels : matrixIntent.matchedSignals,
      riskScore: 90,
      latencyMs: Date.now() - started,
      metadata: {
        patterns: injection.patterns,
        matrixIntent: matrixIntent.intentId,
      },
    });
    await prisma.agentConversation.update({
      where: { id: conversation.id },
      data: { status: "flagged", updatedAt: new Date() },
    });
    await commitElahTurn({
      assistantAnswer: reply,
      actionOutcome: "blocked",
    });
    return {
      ok: true,
      conversationId: conversation.id,
      messageId: assistantMsg.id,
      reply,
      intent: "prompt_injection_attempt",
      toolCalls: [],
      pendingAction: null,
      refused: true,
    };
  }

  const ctx: ToolContext = {
    user: input.user,
    profileId,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    sessionCookieId: input.sessionCookieId,
    conversationId: conversation.id,
  };

  // Handle confirm / cancel for pending sensitive actions
  const pending = await prisma.agentPendingAction.findFirst({
    where: {
      conversationId: conversation.id,
      userId: input.user.id,
      status: "pending",
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (pending && isCancelMessage(input.message)) {
    await prisma.agentPendingAction.update({
      where: { id: pending.id },
      data: { status: "cancelled" },
    });
    const reply = "Understood — I've cancelled that action.";
    const assistantMsg = await prisma.agentMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: reply,
        latencyMs: Date.now() - started,
      },
    });
    await writeAgentEvent({
      eventType: "action_cancelled",
      userId: input.user.id,
      sessionId: input.sessionCookieId,
      conversationId: conversation.id,
      messageId: assistantMsg.id,
      detectedIntent: "cancel",
      toolName: pending.toolName,
      toolArgsSanitized: JSON.parse(pending.toolArgs),
      resultSummary: reply,
      latencyMs: Date.now() - started,
    });
    await patchIntent(intentEventId, {
      toolName: pending.toolName,
      toolArgs: JSON.parse(pending.toolArgs) as Record<string, unknown>,
      actionStatus: "cancelled",
      policyDecision: "deny",
    });
    await commitElahTurn({
      assistantAnswer: reply,
      plannedTool: pending.toolName,
      toolArgs: JSON.parse(pending.toolArgs) as Record<string, unknown>,
      actionOutcome: "cancelled",
    });
    return {
      ok: true,
      conversationId: conversation.id,
      messageId: assistantMsg.id,
      reply,
      intent: "cancel",
      toolCalls: [],
      pendingAction: null,
      refused: false,
    };
  }

  if (pending && isConfirmMessage(input.message)) {
    const toolArgsRaw = parsePendingArgs(pending.toolArgs);
    if (!toolArgsRaw) {
      const reply = "That action can no longer be completed. Please start again.";
      await writeAgentEvent({
        eventType: "agent_error",
        userId: input.user.id,
        sessionId: input.sessionCookieId,
        conversationId: conversation.id,
        toolName: pending.toolName,
        resultSummary: "pending action args corrupt",
      });
      await commitElahTurn({
        assistantAnswer: reply,
        plannedTool: pending.toolName,
        actionOutcome: "refused",
      });
      return {
        ok: true,
        conversationId: conversation.id,
        messageId: userMsg.id,
        reply,
        intent: "confirm",
        toolCalls: [],
        pendingAction: null,
        refused: true,
      };
    }
    const toolArgs = filterToolArgs(pending.toolName, toolArgsRaw);
    const policyDecision = validateToolCall({
      toolName: pending.toolName,
      toolArgs,
      userMessageInjection: injection,
      tierApprovalAbove: policy.approvalRequiredAbove,
      isFollowUpFromConfirmedPending: true,
    });

    if (policyDecision.decision !== "allow") {
      const reply = "That action can no longer be completed. Please start again.";
      const assistantMsg = await prisma.agentMessage.create({
        data: {
          conversationId: conversation.id,
          role: "assistant",
          content: reply,
          latencyMs: Date.now() - started,
        },
      });
      await writeAgentEvent({
        eventType: "policy_check_failed",
        userId: input.user.id,
        sessionId: input.sessionCookieId,
        conversationId: conversation.id,
        messageId: assistantMsg.id,
        detectedIntent: "confirm",
        toolName: pending.toolName,
        toolArgsSanitized: sanitizeToolArgs(toolArgs),
        policyDecision: policyDecision.decision,
        policyReasons: policyDecision.reasons,
        latencyMs: Date.now() - started,
      });
      await patchIntent(intentEventId, {
        toolName: pending.toolName,
        toolArgs,
        policyDecision: policyDecision.decision,
        actionStatus: "failed",
      });
      await commitElahTurn({
        assistantAnswer: reply,
        plannedTool: pending.toolName,
        toolArgs,
        actionOutcome: "failed",
      });
      return {
        ok: true,
        conversationId: conversation.id,
        messageId: assistantMsg.id,
        reply,
        intent: "confirm",
        toolCalls: [],
        pendingAction: await pendingActionView(pending),
        refused: true,
      };
    }

    const claim = await prisma.agentPendingAction.updateMany({
      where: {
        id: pending.id,
        userId: input.user.id,
        status: "pending",
        expiresAt: { gt: new Date() },
      },
      data: { status: "confirmed" },
    });
    if (claim.count === 0) {
      const reply = "That confirmation has expired or was already handled.";
      await commitElahTurn({
        assistantAnswer: reply,
        plannedTool: pending.toolName,
        toolArgs,
        actionOutcome: "refused",
      });
      return {
        ok: true,
        conversationId: conversation.id,
        messageId: userMsg.id,
        reply,
        intent: "confirm",
        toolCalls: [],
        pendingAction: null,
        refused: true,
      };
    }

    await writeAgentEvent({
      eventType: "action_confirmed",
      userId: input.user.id,
      sessionId: input.sessionCookieId,
      conversationId: conversation.id,
      toolName: pending.toolName,
      toolArgsSanitized: sanitizeToolArgs(toolArgs),
    });

    const toolStarted = Date.now();
    const result = await runWithToolAuditContext(
      toolAuditDefaults(input.user, input),
      () => executeTool(pending.toolName, toolArgs, ctx),
    );
    await prisma.agentPendingAction.update({
      where: { id: pending.id },
      data: {
        status: result.ok ? "executed" : "cancelled",
        executedAt: new Date(),
        resultSummary: result.summary,
      },
    });

    const reply = result.ok
      ? result.summary
      : `I couldn't complete that: ${result.summary}`;

    const assistantMsg = await prisma.agentMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: reply,
        toolName: pending.toolName,
        toolResult: JSON.stringify({ ok: result.ok, summary: result.summary, data: result.data }),
        latencyMs: Date.now() - started,
      },
    });

    await writeAgentEvent({
      eventType: result.ok ? "tool_call_executed" : "tool_call_failed",
      userId: input.user.id,
      sessionId: input.sessionCookieId,
      conversationId: conversation.id,
      messageId: assistantMsg.id,
      assistantMessage: reply,
      detectedIntent: pending.actionType as AgentIntent,
      toolName: pending.toolName,
      toolArgsSanitized: sanitizeToolArgs(toolArgs),
      policyDecision: "allow",
      resultSummary: result.summary,
      latencyMs: Date.now() - toolStarted,
    });
    await patchIntent(intentEventId, {
      toolName: pending.toolName,
      toolArgs,
      policyDecision: "allow",
      actionStatus: result.ok ? "executed" : "failed",
    });
    await commitElahTurn({
      assistantAnswer: reply,
      plannedTool: pending.toolName,
      executedTool: pending.toolName,
      toolArgs,
      toolResultSummary: result.summary,
      actionOutcome: result.ok ? "executed" : "failed",
    });

    return {
      ok: true,
      conversationId: conversation.id,
      messageId: assistantMsg.id,
      reply,
      intent: pending.actionType as AgentIntent,
      toolCalls: [
        clientToolCallPayload(
          pending.toolName,
          result.summary,
          result.ok,
          result.data,
          result.error,
        ),
      ],
      pendingAction: null,
      refused: false,
    };
  }

  // Plan next step via LLM (or rules fallback)
  const history = await loadHistory(conversation.id);
  const historyInjection = detectInjectionInHistory(history);
  if (historyInjection.matched) {
    const reply =
      "I can't help with that request. I'm only able to assist with your own banking tasks using approved channels.";
    const assistantMsg = await prisma.agentMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: reply,
        latencyMs: Date.now() - started,
      },
    });
    await writeAgentEvent({
      eventType: "suspicious_prompt_detected",
      userId: input.user.id,
      sessionId: input.sessionCookieId,
      conversationId: conversation.id,
      messageId: assistantMsg.id,
      userMessage: input.message,
      assistantMessage: reply,
      detectedIntent: "prompt_injection_attempt",
      policyDecision: "deny",
      policyReasons: historyInjection.labels,
      riskScore: 90,
      latencyMs: Date.now() - started,
      metadata: { source: "conversation_history", patterns: historyInjection.patterns },
    });
    await patchIntent(intentEventId, {
      actionStatus: "blocked",
      policyDecision: "deny",
      suspiciousPatterns: historyInjection.labels,
    });
    await commitElahTurn({
      assistantAnswer: reply,
      actionOutcome: "blocked",
    });
    return {
      ok: true,
      conversationId: conversation.id,
      messageId: assistantMsg.id,
      reply,
      intent: "prompt_injection_attempt",
      toolCalls: [],
      pendingAction: null,
      refused: true,
    };
  }

  const plan = await callLLM(history, firstName(profile.fullName));

  await writeAgentEvent({
    eventType: "agent_intent_classified",
    userId: input.user.id,
    sessionId: input.sessionCookieId,
    conversationId: conversation.id,
    detectedIntent: plan.intent,
    metadata: { usedFallback: plan.usedFallback },
  });

  if (plan.refuse) {
    const assistantMsg = await prisma.agentMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: plan.reply,
        latencyMs: Date.now() - started,
      },
    });
    await writeAgentEvent({
      eventType: "policy_check_failed",
      userId: input.user.id,
      sessionId: input.sessionCookieId,
      conversationId: conversation.id,
      messageId: assistantMsg.id,
      assistantMessage: plan.reply,
      detectedIntent: plan.intent,
      policyDecision: "deny",
      riskScore: 70,
      latencyMs: Date.now() - started,
    });
    await patchIntent(intentEventId, {
      actionStatus: "blocked",
      policyDecision: "deny",
    });
    await commitElahTurn({
      assistantAnswer: plan.reply,
      actionOutcome: "refused",
    });
    return {
      ok: true,
      conversationId: conversation.id,
      messageId: assistantMsg.id,
      reply: plan.reply,
      intent: plan.intent,
      toolCalls: [],
      pendingAction: null,
      refused: true,
    };
  }

  if (!plan.toolCall) {
    const assistantMsg = await prisma.agentMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: plan.reply,
        latencyMs: Date.now() - started,
      },
    });
    await writeAgentEvent({
      eventType: "agent_message_created",
      userId: input.user.id,
      sessionId: input.sessionCookieId,
      conversationId: conversation.id,
      messageId: assistantMsg.id,
      assistantMessage: plan.reply,
      detectedIntent: plan.intent,
      latencyMs: Date.now() - started,
    });
    await commitElahTurn({
      assistantAnswer: plan.reply,
      actionOutcome: "conversational",
    });
    return {
      ok: true,
      conversationId: conversation.id,
      messageId: assistantMsg.id,
      reply: plan.reply,
      intent: plan.intent,
      toolCalls: [],
      pendingAction: null,
      refused: false,
    };
  }

  const { name: toolName, args: rawToolArgs } = plan.toolCall;
  const toolArgs = filterToolArgs(toolName, rawToolArgs);
  const sanitized = sanitizeToolArgs(toolArgs);

  await writeAgentEvent({
    eventType: "tool_call_requested",
    userId: input.user.id,
    sessionId: input.sessionCookieId,
    conversationId: conversation.id,
    detectedIntent: plan.intent,
    toolName,
    toolArgsSanitized: sanitized,
  });

  const policyDecision = validateToolCall({
    toolName,
    toolArgs,
    userMessageInjection: injection,
    tierApprovalAbove: policy.approvalRequiredAbove,
  });

  await writeAgentEvent({
    eventType:
      policyDecision.decision === "allow"
        ? "policy_check_passed"
        : "policy_check_failed",
    userId: input.user.id,
    sessionId: input.sessionCookieId,
    conversationId: conversation.id,
    detectedIntent: plan.intent,
    toolName,
    toolArgsSanitized: sanitized,
    policyDecision: policyDecision.decision,
    policyReasons:
      policyDecision.decision === "allow" ? [] : policyDecision.reasons,
    riskScore: riskScoreFor(policyDecision, false),
  });

  if (policyDecision.decision === "deny") {
    const reply =
      policyDecision.reasons.some((r) => r.includes("injection"))
        ? "I can't help with that request."
        : "I'm not able to perform that action. If you believe this is an error, please contact Support.";
    const assistantMsg = await prisma.agentMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: reply,
        latencyMs: Date.now() - started,
      },
    });
    await patchIntent(intentEventId, {
      toolName,
      toolArgs,
      policyDecision: policyDecision.decision,
      actionStatus: "blocked",
    });
    await commitElahTurn({
      assistantAnswer: reply,
      plannedTool: toolName,
      toolArgs,
      actionOutcome: "blocked",
    });
    return {
      ok: true,
      conversationId: conversation.id,
      messageId: assistantMsg.id,
      reply,
      intent: plan.intent,
      toolCalls: [],
      pendingAction: null,
      refused: true,
    };
  }

  if (policyDecision.decision === "needs_confirmation") {
    await cancelOpenPendingActions(conversation.id, input.user.id);
    const summary = await summarizeTool(toolName, toolArgs, ctx);
    const expiresAt = new Date(Date.now() + PENDING_TTL_MINUTES * 60 * 1000);
    const pendingRow = await prisma.agentPendingAction.create({
      data: {
        userId: input.user.id,
        conversationId: conversation.id,
        actionType: plan.intent,
        toolName,
        toolArgs: JSON.stringify(toolArgs),
        summary,
        expiresAt,
      },
    });
    const reply = `${summary}. Please confirm to proceed, or say "cancel" to abort.`;
    const assistantMsg = await prisma.agentMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: reply,
        latencyMs: Date.now() - started,
      },
    });
    await writeAgentEvent({
      eventType: "confirmation_required",
      userId: input.user.id,
      sessionId: input.sessionCookieId,
      conversationId: conversation.id,
      messageId: assistantMsg.id,
      assistantMessage: reply,
      detectedIntent: plan.intent,
      toolName,
      toolArgsSanitized: sanitized,
      policyDecision: "needs_confirmation",
      resultSummary: summary,
      latencyMs: Date.now() - started,
    });
    await patchIntent(intentEventId, {
      toolName,
      toolArgs,
      policyDecision: "needs_confirmation",
      actionStatus: "pending_confirmation",
    });
    await commitElahTurn({
      assistantAnswer: reply,
      plannedTool: toolName,
      toolArgs,
      toolResultSummary: summary,
      actionOutcome: "pending_confirmation",
    });
    return {
      ok: true,
      conversationId: conversation.id,
      messageId: assistantMsg.id,
      reply,
      intent: plan.intent,
      toolCalls: [],
      pendingAction: await pendingActionView(pendingRow),
      refused: false,
    };
  }

  // Safe read-only or auto-approved action — execute immediately
  const toolStarted = Date.now();
  const result = await runWithToolAuditContext(
    toolAuditDefaults(input.user, input),
    () => executeTool(toolName, toolArgs, ctx),
  );
  let reply = plan.reply;
  if (result.ok) {
    reply = result.summary;
    if (plan.intent === "card_management" && toolName === "get_cards" && result.data) {
      const cards = result.data as Array<{ cardId: string; status: string }>;
      const target = cards.find((c) => c.status === "active") ?? cards[0];
      if (target && /freeze/.test(input.message.toLowerCase())) {
        const freezeSummary = await summarizeTool(
          "freeze_card",
          { cardId: target.cardId },
          ctx,
        );
        await cancelOpenPendingActions(conversation.id, input.user.id);
        const freezePending = await prisma.agentPendingAction.create({
          data: {
            userId: input.user.id,
            conversationId: conversation.id,
            actionType: "card_management",
            toolName: "freeze_card",
            toolArgs: JSON.stringify({ cardId: target.cardId }),
            summary: freezeSummary,
            expiresAt: new Date(Date.now() + PENDING_TTL_MINUTES * 60 * 1000),
          },
        });
        reply = `${result.summary} ${freezeSummary}. Please confirm to proceed.`;
        const assistantMsg = await prisma.agentMessage.create({
          data: {
            conversationId: conversation.id,
            role: "assistant",
            content: reply,
            toolName: "get_cards",
            toolResult: JSON.stringify(result),
            latencyMs: Date.now() - started,
          },
        });
        await writeAgentEvent({
          eventType: "confirmation_required",
          userId: input.user.id,
          sessionId: input.sessionCookieId,
          conversationId: conversation.id,
          messageId: assistantMsg.id,
          detectedIntent: plan.intent,
          toolName: "freeze_card",
          toolArgsSanitized: sanitizeToolArgs({ cardId: target.cardId }),
          policyDecision: "needs_confirmation",
          resultSummary: freezeSummary,
          latencyMs: Date.now() - started,
        });
        await commitElahTurn({
          assistantAnswer: reply,
          plannedTool: "freeze_card",
          executedTool: "get_cards",
          toolArgs: { cardId: target.cardId },
          toolResultSummary: result.summary,
          actionOutcome: "pending_confirmation",
        });
        return {
          ok: true,
          conversationId: conversation.id,
          messageId: assistantMsg.id,
          reply,
          intent: plan.intent,
          toolCalls: [
            clientToolCallPayload("get_cards", result.summary, true, result.data),
          ],
          pendingAction: await pendingActionView(freezePending),
          refused: false,
        };
      }
    }
  } else {
    reply = result.summary;
  }

  const assistantMsg = await prisma.agentMessage.create({
    data: {
      conversationId: conversation.id,
      role: "assistant",
      content: reply,
      toolName,
      toolResult: JSON.stringify({ ok: result.ok, summary: result.summary, data: result.data }),
      latencyMs: Date.now() - started,
    },
  });

  await writeAgentEvent({
    eventType: result.ok ? "tool_call_executed" : "tool_call_failed",
    userId: input.user.id,
    sessionId: input.sessionCookieId,
    conversationId: conversation.id,
    messageId: assistantMsg.id,
    assistantMessage: reply,
    detectedIntent: plan.intent,
    toolName,
    toolArgsSanitized: sanitized,
    policyDecision: "allow",
    resultSummary: result.summary,
    latencyMs: Date.now() - toolStarted,
  });
  await patchIntent(intentEventId, {
    toolName,
    toolArgs,
    policyDecision: "allow",
    actionStatus: result.ok ? "executed" : "failed",
  });

  await prisma.agentConversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  await commitElahTurn({
    assistantAnswer: reply,
    plannedTool: toolName,
    executedTool: toolName,
    toolArgs,
    toolResultSummary: result.summary,
    actionOutcome: result.ok ? "executed" : "failed",
  });

  return {
    ok: true,
    conversationId: conversation.id,
    messageId: assistantMsg.id,
    reply,
    intent: plan.intent,
    toolCalls: [
      clientToolCallPayload(
        toolName,
        result.summary,
        result.ok,
        result.data,
        result.error,
      ),
    ],
    pendingAction: null,
    refused: false,
  };
}

export async function listConversationMessages(
  userId: string,
  conversationId: string,
) {
  const conv = await prisma.agentConversation.findFirst({
    where: { id: conversationId, userId },
  });
  if (!conv) return null;
  return prisma.agentMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      content: true,
      toolName: true,
      createdAt: true,
    },
  });
}

export async function listUserConversations(userId: string) {
  return prisma.agentConversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  });
}

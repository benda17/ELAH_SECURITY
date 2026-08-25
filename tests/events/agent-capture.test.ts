import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { callLLM, fallbackPlan } from "@/lib/agent/llm";
import {
  mergeAgentEventMetadata,
  nextAgentSequence,
  writeAgentEvent,
} from "@/lib/agent/logger";
import { AGENT_SYSTEM_PROMPT } from "@/lib/agent/system-prompt";
import {
  chat,
  clearAgentTables,
  seedTestFixtures,
  type TestFixtures,
} from "../agent/fixtures";

vi.mock("@/lib/agent/llm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/agent/llm")>();
  return {
    ...actual,
    callLLM: vi.fn(actual.callLLM),
  };
});

function parseMeta(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  return JSON.parse(raw) as Record<string, unknown>;
}

describe("Phase 2 agent capture completeness", () => {
  let fx: TestFixtures;

  beforeAll(async () => {
    fx = await seedTestFixtures();
  });

  beforeEach(async () => {
    await clearAgentTables();
    const { callLLM: realCallLLM } = await vi.importActual<
      typeof import("@/lib/agent/llm")
    >("@/lib/agent/llm");
    vi.mocked(callLLM).mockReset();
    vi.mocked(callLLM).mockImplementation(realCallLLM);
  });

  it("nextAgentSequence is 1 when empty and increments after a write", async () => {
    const conv = await prisma.agentConversation.create({
      data: { userId: fx.userA.id, status: "active" },
    });
    expect(await nextAgentSequence(conv.id)).toBe(1);
    expect(await nextAgentSequence(null)).toBe(1);

    await writeAgentEvent({
      eventType: "user_message_received",
      userId: fx.userA.id,
      conversationId: conv.id,
      messageId: "turn-msg-1",
    });
    expect(await nextAgentSequence(conv.id)).toBe(2);
  });

  it("mergeAgentEventMetadata stamps schemaVersion, sequence, and turnId", () => {
    const merged = mergeAgentEventMetadata(
      {
        eventType: "tool_call_requested",
        messageId: "user-turn",
        metadata: { extra: true },
      },
      4,
    );
    expect(merged.schemaVersion).toBe("1.0");
    expect(merged.sequence).toBe(4);
    expect(merged.turnId).toBe("user-turn");
    expect(merged.extra).toBe(true);
  });

  it("prefers explicit metadata.turnId over assistant messageId", () => {
    const merged = mergeAgentEventMetadata(
      {
        eventType: "agent_message_created",
        messageId: "assistant-msg",
        metadata: { turnId: "user-turn" },
      },
      2,
    );
    expect(merged.turnId).toBe("user-turn");
  });

  it("captures a Jane-like balance turn with chain, modelOutput, and AuditLog eventId", async () => {
    const res = await chat(fx.userA, "What's my balance?");
    expect(res.ok).toBe(true);
    expect(res.refused).toBe(false);
    expect(res.toolCalls[0]?.name).toBe("get_account_balance");

    const logs = await prisma.agentEventLog.findMany({
      where: { conversationId: res.conversationId },
      orderBy: { timestamp: "asc" },
    });
    const byType = Object.fromEntries(logs.map((l) => [l.eventType, l]));

    expect(byType.user_message_received).toBeTruthy();
    expect(byType.user_message_received.userMessage).toMatch(/balance/i);
    expect(byType.user_message_received.sessionId).toBe("test-session-id");
    expect(byType.user_message_received.conversationId).toBe(res.conversationId);

    const requested = byType.tool_call_requested;
    expect(requested).toBeTruthy();
    expect(requested.messageId).toBeTruthy();
    expect(requested.messageId).toBe(byType.user_message_received.messageId);
    expect(requested.sessionId).toBe("test-session-id");

    const requestMeta = parseMeta(requested.metadata);
    const modelOutput = requestMeta.modelOutput as Record<string, unknown>;
    expect(modelOutput.plannedTool).toBe("get_account_balance");
    expect(modelOutput.intent).toBe("balance_query");
    expect(modelOutput.refuse).toBe(false);
    expect(typeof modelOutput.usedFallback).toBe("boolean");
    expect(typeof modelOutput.explanation).toBe("string");
    expect(String(modelOutput.explanation).length).toBeGreaterThan(0);
    expect(String(modelOutput.explanation).length).toBeLessThanOrEqual(501);

    const policy = byType.policy_check_passed;
    const executed = byType.tool_call_executed;
    expect(policy).toBeTruthy();
    expect(policy.messageId).toBe(requested.messageId);
    expect(executed).toBeTruthy();
    expect(executed.toolName).toBe("get_account_balance");
    expect(executed.resultSummary).toBeTruthy();
    const execOut = parseMeta(executed.metadata).modelOutput as Record<
      string,
      unknown
    >;
    expect(typeof execOut.result).toBe("string");
    expect(String(execOut.result).length).toBeGreaterThan(0);

    const seq = (row: (typeof logs)[number]) =>
      Number(parseMeta(row.metadata).sequence);
    expect(seq(byType.user_message_received)).toBe(1);
    expect(seq(requested)).toBeGreaterThan(seq(byType.user_message_received));
    expect(seq(policy)).toBeGreaterThan(seq(requested));
    expect(seq(executed)).toBeGreaterThan(seq(policy));

    for (const log of logs) {
      const meta = parseMeta(log.metadata);
      expect(meta.schemaVersion).toBe("1.0");
      expect(meta.turnId).toBe(byType.user_message_received.messageId);
      const blob = JSON.stringify(meta);
      expect(blob).not.toContain(AGENT_SYSTEM_PROMPT.slice(0, 40));
      expect(blob).not.toMatch(/chat\.completions|tool_calls|system prompt/i);
    }

    expect(requested.eventId).toBe(executed.eventId);
    expect(policy.eventId).toBe(executed.eventId);

    const audit = await prisma.auditLog.findFirst({
      where: { eventId: executed.eventId! },
    });
    expect(audit).not.toBeNull();
    expect(audit?.createdByAgent).toBe(true);
    expect(audit?.actionType).toBe("agent_account_balance_read");
  });

  it("does not emit agent_error when fallback is used because no API key is set", async () => {
    expect(process.env.OPENAI_API_KEY).toBeUndefined();
    const res = await chat(fx.userA, "What's my balance?");
    const logs = await prisma.agentEventLog.findMany({
      where: { conversationId: res.conversationId },
    });
    expect(logs.some((l) => l.eventType === "agent_error")).toBe(false);
    const requested = logs.find((l) => l.eventType === "tool_call_requested");
    const modelOutput = parseMeta(requested?.metadata ?? null)
      .modelOutput as Record<string, unknown>;
    expect(modelOutput.usedFallback).toBe(true);
  });

  it("logs agent_error with provider_error_fallback then continues without retrying the tool", async () => {
    const fallback = fallbackPlan("What's my balance?", "Alice");
    vi.mocked(callLLM).mockResolvedValueOnce({
      ...fallback,
      degradedFromProvider: true,
    });

    const res = await chat(fx.userA, "What's my balance?");
    expect(res.toolCalls).toHaveLength(1);
    expect(res.toolCalls[0]?.name).toBe("get_account_balance");

    const logs = await prisma.agentEventLog.findMany({
      where: { conversationId: res.conversationId },
      orderBy: { timestamp: "asc" },
    });
    const errorLog = logs.find((l) => l.eventType === "agent_error");
    expect(errorLog).toBeTruthy();
    expect(parseMeta(errorLog!.metadata).reason).toBe("provider_error_fallback");
    expect(logs.filter((l) => l.eventType === "tool_call_executed")).toHaveLength(
      1,
    );
    expect(vi.mocked(callLLM)).toHaveBeenCalledTimes(1);
  });

  it("puts modelOutput on agent_message_created for a conversational plan", async () => {
    const res = await chat(fx.userA, "I want to transfer money");
    const created = await prisma.agentEventLog.findFirst({
      where: {
        conversationId: res.conversationId,
        eventType: "agent_message_created",
      },
    });
    expect(created).not.toBeNull();
    const modelOutput = parseMeta(created!.metadata)
      .modelOutput as Record<string, unknown>;
    expect(modelOutput.plannedTool).toBeNull();
    expect(modelOutput.intent).toBe("ambiguous_request");
    expect(modelOutput.refuse).toBe(false);
    expect(typeof modelOutput.explanation).toBe("string");
  });
});

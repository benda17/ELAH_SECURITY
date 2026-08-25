import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { hashUserId } from "@/lib/elah/helpers";
import {
  checkElahEvent,
  correlateTurn,
  findDuplicateEventIds,
  listIngestibleEvents,
  type ElahEvent,
} from "@/lib/elah";

const samples = JSON.parse(
  readFileSync(
    path.join(__dirname, "fixtures/elah-event-samples.json"),
    "utf8",
  ),
) as Record<string, ElahEvent>;

describe("ElahEvent quality rules", () => {
  it("passes schema samples 8.1–8.5", () => {
    for (const id of ["8.1", "8.2", "8.3", "8.4", "8.5"] as const) {
      const result = checkElahEvent(samples[id]!);
      expect(result.ok, `${id}: ${result.ruleIds.join(",")}`).toBe(true);
      expect(result.ruleIds).toEqual([]);
      expect(result.eventId).toBe(samples[id]!.eventId);
    }
  });

  it("flags missing source and user hash on sample 8.6", () => {
    const result = checkElahEvent(samples["8.6"]!);
    expect(result.ok).toBe(false);
    expect(result.ruleIds).toEqual(
      expect.arrayContaining(["missing_source", "missing_user_id_hash"]),
    );
  });

  it("flags unsanitized args on sample 8.7", () => {
    const result = checkElahEvent(samples["8.7"]!);
    expect(result.ok).toBe(false);
    expect(result.ruleIds).toContain("unsanitized_args");
  });

  it("flags page views and unknown types on sample 8.8", () => {
    const result = checkElahEvent(samples["8.8"]!);
    expect(result.ok).toBe(false);
    expect(result.ruleIds).toEqual(
      expect.arrayContaining(["unknown_action_type", "page_view_not_event"]),
    );
  });

  it("flags version, extra score field, and missing agent context on sample 8.9", () => {
    const result = checkElahEvent(samples["8.9"] as ElahEvent);
    expect(result.ok).toBe(false);
    expect(result.ruleIds).toEqual(
      expect.arrayContaining([
        "unknown_major_version",
        "extra_top_level_property",
        "missing_conversation",
        "missing_policy_agent",
      ]),
    );
  });

  it("flags missing schema version, session, and conversation", () => {
    const base = { ...samples["8.1"] } as ElahEvent & Record<string, unknown>;
    delete base.schemaVersion;
    expect(checkElahEvent(base as ElahEvent).ruleIds).toContain("missing_schema_version");

    const noSession = {
      ...samples["8.1"]!,
      actor: { ...samples["8.1"]!.actor, sessionId: null },
    };
    expect(checkElahEvent(noSession).ruleIds).toContain("missing_session_id");

    const noConversation = { ...samples["8.1"]! };
    delete (noConversation as { conversation?: unknown }).conversation;
    expect(checkElahEvent(noConversation).ruleIds).toContain("missing_conversation");
  });

  it("finds duplicate ingestible event ids", () => {
    const a = samples["8.1"]!;
    const b = { ...samples["8.4"]!, eventId: a.eventId };
    const c = samples["8.5"]!;
    expect(findDuplicateEventIds([a, b, c])).toEqual(new Set([a.eventId]));
    expect(findDuplicateEventIds([a, c])).toEqual(new Set());
  });
});

describe("listIngestibleEvents duplicate marking", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("marks the later duplicate envelope fail-closed for ingest", async () => {
    const eventId = "evt_dup_keep_earliest";
    const userIdHash = hashUserId("actor-dup");
    const earlier = {
      id: "audit_dup_early",
      timestamp: new Date("2026-08-17T07:00:00.000Z"),
      actorType: "customer",
      actorId: "actor-dup",
      actorName: null,
      role: "premium_customer",
      customerTier: "premium",
      actionType: "login",
      page: "/login",
      toolOrFeatureUsed: "login_form",
      inputDataSummary: null,
      targetResource: null,
      amount: null,
      riskLevel: "low",
      requiresApproval: false,
      approvalStatus: "not_required",
      sessionId: "sess-dup",
      ipAddress: "127.0.0.1",
      userIntent: null,
      actionOutcome: "succeeded",
      reasonForFlagging: null,
      createdByAgent: false,
      eventId,
      userIdHash,
      source: "ui",
      userAgent: null,
    };
    const later = {
      ...earlier,
      id: "audit_dup_late",
      timestamp: new Date("2026-08-17T08:00:00.000Z"),
    };

    vi.spyOn(prisma.auditLog, "findMany").mockResolvedValue(
      [later, earlier] as never,
    );
    vi.spyOn(prisma.agentEventLog, "findMany").mockResolvedValue([]);

    const rows = await listIngestibleEvents({ eventId, take: 10 });
    expect(rows).toHaveLength(2);
    const keeper = rows.filter((row) => !row.quality.ruleIds.includes("duplicate_event_id"));
    const dupes = rows.filter((row) => row.quality.ruleIds.includes("duplicate_event_id"));
    expect(keeper).toHaveLength(1);
    expect(dupes).toHaveLength(1);
    expect(keeper[0]!.quality.ok).toBe(true);
    expect(dupes[0]!.quality.ok).toBe(false);
    expect(keeper[0]!.event.occurredAt <= dupes[0]!.event.occurredAt).toBe(true);
    expect(keeper[0]!.auditLogId).toBe("audit_dup_early");
  });
});

describe("correlateTurn", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("orders hops by metadata.sequence then timestamp and returns intent", async () => {
    const conversationId = "corr-conv-1";
    const messageId = "corr-msg-1";
    const eventId = "evt_corr_scoring_unit";
    const t1 = new Date("2026-08-17T07:16:00.000Z");
    const t2 = new Date("2026-08-17T07:16:01.000Z");
    const t3 = new Date("2026-08-17T07:16:02.000Z");

    vi.spyOn(prisma.agentEventLog, "findMany").mockResolvedValue(
      [
        {
          eventType: "tool_call_requested",
          conversationId,
          messageId,
          eventId,
          toolName: "create_external_transfer",
          metadata: JSON.stringify({
            sequence: 2,
            modelOutput: {
              plannedTool: "create_external_transfer",
              explanation: "I'll send ₪500.",
            },
          }),
          timestamp: t2,
          userMessage: null,
        },
        {
          eventType: "user_message_received",
          conversationId,
          messageId,
          eventId,
          toolName: null,
          metadata: JSON.stringify({ sequence: 1 }),
          timestamp: t1,
          userMessage: "Send 500 shekels to Daniel",
        },
        {
          eventType: "policy_check_passed",
          conversationId,
          messageId,
          eventId,
          toolName: "create_external_transfer",
          metadata: JSON.stringify({
            sequence: 3,
            modelOutput: { result: "Transfer pending confirmation." },
          }),
          timestamp: t3,
          userMessage: null,
        },
      ] as never,
    );
    vi.spyOn(prisma.agentIntentEvent, "findFirst").mockResolvedValue({
      intentId: "external_transfer",
      intentLabel: "External transfer",
      confidence: 0.91,
    } as never);
    vi.spyOn(prisma.agentMessage, "findMany").mockResolvedValue([
      {
        id: messageId,
        conversationId,
        role: "user",
        content: "Send 500 shekels to Daniel",
        createdAt: t1,
      },
      {
        id: "msg-assistant-1",
        conversationId,
        role: "assistant",
        content: "I'll prepare a transfer of ₪500.",
        createdAt: t2,
      },
    ] as never);

    const result = await correlateTurn({ conversationId, messageId });
    expect(result.utterance).toBe("Send 500 shekels to Daniel");
    expect(result.assistantReply).toBe("I'll prepare a transfer of ₪500.");
    expect(result.eventId).toBe(eventId);
    expect(result.intent).toEqual({
      intentId: "external_transfer",
      intentLabel: "External transfer",
      confidence: 0.91,
    });
    expect(result.hops.map((hop) => hop.eventType)).toEqual([
      "user_message_received",
      "tool_call_requested",
      "policy_check_passed",
    ]);
    expect(result.hops.every((hop) => hop.eventId === eventId)).toBe(true);
    expect(result.hops[0]?.sequence).toBe(1);
    expect(result.modelOutput?.explanation).toBe("I'll send ₪500.");
    expect(result.modelOutput?.result).toBe("Transfer pending confirmation.");
  });
});

import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { hashUserId } from "@/lib/elah/helpers";
import {
  ELAH_APP_ID,
  ELAH_EVENT_SCHEMA_VERSION,
  listIngestibleEvents,
  mapAuditLogToElahEvent,
  validateElahEvent,
  type AuditLogLike,
  type ElahEvent,
} from "@/lib/elah";

const samples = JSON.parse(
  readFileSync(
    path.join(__dirname, "fixtures/elah-event-samples.json"),
    "utf8",
  ),
) as Record<string, unknown>;

function like(overrides: Partial<AuditLogLike> & { actionType: string }): AuditLogLike {
  return {
    id: "audit_example_1",
    eventId: "evt_map_00000001",
    userIdHash: "a1b2c3d4e5f60718293a4b5c6d7e8f90",
    sessionId: "clxsessionexample0001",
    actorType: "customer",
    role: "premium_customer",
    customerTier: "premium",
    timestamp: "2026-08-17T07:18:11.000Z",
    ...overrides,
  };
}

function auditRow(
  overrides: Record<string, unknown> & { id: string; actionType: string },
) {
  return {
    timestamp: new Date("2026-08-17T07:18:11.000Z"),
    actorType: "customer",
    actorId: "actor-ui",
    actorName: null,
    role: "premium_customer",
    customerTier: "premium",
    page: "/transfer",
    toolOrFeatureUsed: null,
    inputDataSummary: JSON.stringify({ amount: 500 }),
    targetResource: null,
    amount: 500,
    riskLevel: "low",
    requiresApproval: false,
    approvalStatus: "not_required",
    sessionId: "sess-list-1",
    ipAddress: "127.0.0.1",
    userIntent: null,
    actionOutcome: "submitted",
    reasonForFlagging: null,
    createdByAgent: false,
    eventId: overrides.id.replace("audit", "evt"),
    userIdHash: hashUserId("actor-ui"),
    source: "ui",
    userAgent: null,
    ...overrides,
  };
}

describe("ElahEvent envelope", () => {
  it("exports schema version 1.0 and app id", () => {
    expect(ELAH_EVENT_SCHEMA_VERSION).toBe("1.0");
    expect(ELAH_APP_ID).toBe("elah-banking-demo");
  });

  it.each(["8.1", "8.2", "8.3", "8.4", "8.5"] as const)(
    "accepts schema sample %s",
    (id) => {
      const result = validateElahEvent(samples[id]);
      expect(result.errors, result.errors.join("; ")).toEqual([]);
      expect(result.ok).toBe(true);
    },
  );

  it.each(["8.6", "8.7", "8.8", "8.9"] as const)(
    "rejects schema sample %s",
    (id) => {
      const result = validateElahEvent(samples[id]);
      expect(result.ok).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    },
  );

  it("rejects a leaked elahScore field", () => {
    const valid = samples["8.1"] as ElahEvent;
    const result = validateElahEvent({ ...valid, elahScore: 0.87 });
    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => /elahScore/.test(error))).toBe(true);
  });

  it("maps login to session / no_tool and does not add elahScore", () => {
    const event = mapAuditLogToElahEvent(
      like({
        actionType: "login",
        actionOutcome: "succeeded",
        source: "ui",
        page: "/login",
        createdByAgent: false,
      }),
    );
    expect(event).not.toBeNull();
    expect(event!.actionType).toBe("login");
    expect(event!.outcome).toBe("session");
    expect(event!.executionState).toBe("no_tool");
    expect(event!.source).toBe("ui");
    expect(event!.action.toolName).toBeNull();
    expect(event!.conversation).toBeUndefined();
    expect(event!.schemaVersion).toBe("1.0");
    expect("elahScore" in event!).toBe(false);
    expect(validateElahEvent(event).ok).toBe(true);
  });

  it("maps password_reset_requested to password_reset", () => {
    const event = mapAuditLogToElahEvent(
      like({ actionType: "password_reset_requested", actionOutcome: "submitted" }),
    );
    expect(event?.actionType).toBe("password_reset");
    expect(event?.outcome).toBe("session");
  });

  it("maps UI transfer_submitted to external_transfer no_tool", () => {
    const event = mapAuditLogToElahEvent(
      like({
        actionType: "transfer_submitted",
        actionOutcome: "submitted",
        source: "ui",
        createdByAgent: false,
        page: "/transfer",
        amount: 500,
        inputDataSummary: { amount: 500, recipientName: "Daniel Cohen" },
      }),
    );
    expect(event?.actionType).toBe("external_transfer");
    expect(event?.source).toBe("ui");
    expect(event?.outcome).toBe("executed");
    expect(event?.executionState).toBe("no_tool");
    expect(event?.action.toolName).toBeNull();
    expect(event?.conversation).toBeUndefined();
    expect(event?.action.args.recipientName).toBe("[recipient_redacted]");
    expect(validateElahEvent(event).ok).toBe(true);
  });

  it("maps agent transfer_submitted with internal tool to internal_transfer pre_tool", () => {
    const event = mapAuditLogToElahEvent(
      like({
        actionType: "transfer_submitted",
        actionOutcome: "pending_confirmation",
        source: "agent",
        createdByAgent: true,
        toolOrFeatureUsed: "ai_assistant.create_internal_transfer",
        page: "/assistant",
        amount: 50,
        conversationId: "clxconvexample0001",
        messageId: "clxmsgexample0001",
        utterance: "Move 50 to savings",
      }),
    );
    expect(event?.actionType).toBe("internal_transfer");
    expect(event?.source).toBe("agent");
    expect(event?.executionState).toBe("pre_tool");
    expect(event?.action.toolName).toBe("create_internal_transfer");
    expect(event?.policy).toBeDefined();
    expect(event?.conversation?.conversationId).toBe("clxconvexample0001");
    expect(validateElahEvent(event).ok).toBe(true);
  });

  it("maps transfer_blocked to external_transfer by default", () => {
    const event = mapAuditLogToElahEvent(
      like({
        actionType: "transfer_blocked",
        actionOutcome: "blocked",
        createdByAgent: false,
        source: "ui",
        amount: 99_000,
      }),
    );
    expect(event?.actionType).toBe("external_transfer");
    expect(event?.outcome).toBe("blocked");
  });

  it("returns null for page views, manager approvals, and unknown types", () => {
    expect(mapAuditLogToElahEvent(like({ actionType: "dashboard_view" }))).toBeNull();
    expect(mapAuditLogToElahEvent(like({ actionType: "accounts_viewed" }))).toBeNull();
    expect(mapAuditLogToElahEvent(like({ actionType: "documents_opened" }))).toBeNull();
    expect(mapAuditLogToElahEvent(like({ actionType: "transactions_searched" }))).toBeNull();
    expect(
      mapAuditLogToElahEvent(like({ actionType: "unauthorized_route_access" })),
    ).toBeNull();
    expect(mapAuditLogToElahEvent(like({ actionType: "transfer_approved" }))).toBeNull();
    expect(mapAuditLogToElahEvent(like({ actionType: "loan_rejected" }))).toBeNull();
    expect(mapAuditLogToElahEvent(like({ actionType: "card_management" }))).toBeNull();
  });

  it("maps login_failed without requiring a user hash", () => {
    const event = mapAuditLogToElahEvent(
      like({
        actionType: "login_failed",
        actionOutcome: "failed",
        actorType: "anonymous",
        userIdHash: null,
        actorId: null,
        sessionId: null,
        role: null,
        customerTier: null,
      }),
    );
    expect(event?.actionType).toBe("login_failed");
    expect(event?.outcome).toBe("failed");
    expect(event?.actor.userIdHash).toBeUndefined();
    expect(event?.actor.sessionId).toBeNull();
    expect(validateElahEvent(event).ok).toBe(true);
  });

  it("hashes actorId when userIdHash is absent", () => {
    const event = mapAuditLogToElahEvent(
      like({
        actionType: "logout",
        userIdHash: null,
        actorId: "raw-user-id-xyz",
        actionOutcome: "succeeded",
      }),
    );
    expect(event?.actor.userIdHash).toBe(hashUserId("raw-user-id-xyz"));
  });
});

describe("listIngestibleEvents", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps recent audit rows, drops page views, and attaches agent conversation", async () => {
    const sharedId = "evt_list_shared_0001";
    const uiRow = auditRow({
      id: "audit_ui_1",
      eventId: "evt_list_ui_0001",
      actionType: "transfer_submitted",
    });
    const viewRow = auditRow({
      id: "audit_view_1",
      eventId: "evt_list_view_0001",
      actionType: "dashboard_view",
      amount: null,
      inputDataSummary: null,
    });
    const agentRow = auditRow({
      id: "audit_agent_1",
      eventId: sharedId,
      actionType: "external_transfer",
      createdByAgent: true,
      source: "agent",
      page: "/assistant",
      toolOrFeatureUsed: "create_external_transfer",
      actionOutcome: "pending_confirmation",
      actorId: "actor-agent",
      userIdHash: hashUserId("actor-agent"),
    });

    vi.spyOn(prisma.auditLog, "findMany").mockResolvedValue(
      [agentRow, uiRow, viewRow] as never,
    );
    vi.spyOn(prisma.agentEventLog, "findMany").mockResolvedValue([
      {
        id: "agent_1",
        timestamp: new Date("2026-08-17T07:12:04.120Z"),
        eventType: "tool_call_requested",
        eventId: sharedId,
        conversationId: "conv-list-1",
        messageId: "msg-list-1",
        userMessage: "Send 500 shekels to Daniel",
        toolName: "create_external_transfer",
        policyDecision: "needs_confirmation",
        policyReasons: JSON.stringify([
          "tool 'create_external_transfer' requires explicit user confirmation",
        ]),
      },
    ] as never);

    const rows = await listIngestibleEvents({ sessionId: "sess-list-1", take: 20 });
    expect(rows.every((row) => row.event.actionType !== "dashboard_view")).toBe(true);
    expect(rows.some((row) => row.event.eventId === "evt_list_view_0001")).toBe(false);

    const ui = rows.find((row) => row.event.eventId === "evt_list_ui_0001");
    expect(ui?.event.actionType).toBe("external_transfer");
    expect(ui?.event.source).toBe("ui");

    const agent = rows.find((row) => row.event.eventId === sharedId);
    expect(agent?.event.source).toBe("agent");
    expect(agent?.event.conversation?.conversationId).toBe("conv-list-1");
    expect(agent?.event.conversation?.utterance).toBe("Send 500 shekels to Daniel");
    expect(agent?.event.action.toolName).toBe("create_external_transfer");
    expect(validateElahEvent(agent!.event).ok).toBe(true);

    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([agentRow] as never);
    const onlyAgent = await listIngestibleEvents({
      eventId: sharedId,
      source: "agent",
      toolName: "create_external_transfer",
    });
    expect(onlyAgent).toHaveLength(1);
    expect(onlyAgent[0]!.auditLogId).toBe("audit_agent_1");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { hashUserId } from "@/lib/elah/helpers";
import { listIngestibleEvents, mapAuditLogToElahEvent } from "@/lib/elah/envelope";
import {
  ELAH_ANALYST_ACTION_TYPES,
  isAnalystActionType,
} from "@/lib/elah/analyst/constants";

const EVENT_ID = "evt_excl_shared_0001";
const ANALYST_TYPES = Object.values(ELAH_ANALYST_ACTION_TYPES);

function auditRow(overrides: Record<string, unknown> & { id: string; actionType: string }) {
  return {
    timestamp: new Date("2026-09-28T07:00:00.000Z"),
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
    sessionId: "sess-excl-1",
    ipAddress: "127.0.0.1",
    userIntent: null,
    actionOutcome: "submitted",
    reasonForFlagging: null,
    createdByAgent: false,
    eventId: EVENT_ID,
    userIdHash: hashUserId("actor-ui"),
    source: "ui",
    userAgent: null,
    ...overrides,
  };
}

describe("analyst rows are never ElahEvents", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("recognizes every analyst actionType", () => {
    expect(ANALYST_TYPES.length).toBeGreaterThanOrEqual(8);
    for (const type of ANALYST_TYPES) expect(isAnalystActionType(type)).toBe(true);
    expect(isAnalystActionType("external_transfer")).toBe(false);
    expect(isAnalystActionType(null)).toBe(false);
  });

  it.each(ANALYST_TYPES)("mapAuditLogToElahEvent(%s) is null", (actionType) => {
    for (const source of ["ui", "agent", "system"]) {
      expect(
        mapAuditLogToElahEvent({
          id: "audit_analyst",
          eventId: EVENT_ID,
          actionType,
          source,
          createdByAgent: source === "agent",
          toolOrFeatureUsed: "create_external_transfer",
          actionOutcome: "submitted",
          sessionId: "s1",
        }),
      ).toBeNull();
    }
  });

  it("listIngestibleEvents excludes analyst rows sharing the eventId and filters them in SQL", async () => {
    const ingest = auditRow({ id: "audit_ingest", actionType: "transfer_submitted" });
    const analystRows = ANALYST_TYPES.map((actionType, i) =>
      auditRow({
        id: `audit_analyst_${i}`,
        actionType,
        source: "system",
        actorType: "admin",
        role: "security_reviewer",
        toolOrFeatureUsed: "elah_analyst",
        userIdHash: null,
        inputDataSummary: JSON.stringify({ v: 1, status: "reviewed" }),
        timestamp: new Date(`2026-09-28T08:0${i}:00.000Z`),
      }),
    );
    const findMany = vi
      .spyOn(prisma.auditLog, "findMany")
      .mockResolvedValue([...analystRows, ingest] as never);
    vi.spyOn(prisma.agentEventLog, "findMany").mockResolvedValue([] as never);

    const rows = await listIngestibleEvents({ eventId: EVENT_ID, take: 10 });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.auditLogId).toBe("audit_ingest");
    expect(rows[0]!.quality.ruleIds).not.toContain("duplicate_event_id");

    const where = findMany.mock.calls[0]![0]!.where as Record<string, unknown>;
    expect(where.NOT).toEqual({ actionType: { startsWith: "elah_analyst_" } });
  });

  it("pushes from/to down as a timestamp range", async () => {
    const findMany = vi.spyOn(prisma.auditLog, "findMany").mockResolvedValue([] as never);
    vi.spyOn(prisma.agentEventLog, "findMany").mockResolvedValue([] as never);
    const from = new Date("2026-09-27T00:00:00.000Z");
    const to = new Date("2026-09-28T00:00:00.000Z");
    await listIngestibleEvents({ from, to, take: 5 });
    const where = findMany.mock.calls[0]![0]!.where as Record<string, unknown>;
    expect(where.timestamp).toEqual({ gte: from, lte: to });
  });
});

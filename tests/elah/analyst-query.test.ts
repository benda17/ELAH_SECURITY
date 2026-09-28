import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { hashUserId } from "@/lib/elah/helpers";
import { queryAnalystEvents } from "@/lib/elah/analyst/query";
import { ELAH_ANALYST_ACTION_TYPES as T } from "@/lib/elah/analyst/constants";

function ingestRow(id: string, minute: number) {
  return {
    id: `audit_${id}`,
    timestamp: new Date(`2026-09-28T07:${String(minute).padStart(2, "0")}:00.000Z`),
    actorType: "customer",
    actorId: "actor-q",
    actorName: null,
    role: "premium_customer",
    customerTier: "premium",
    actionType: "transfer_submitted",
    page: "/transfer",
    toolOrFeatureUsed: null,
    inputDataSummary: JSON.stringify({ amount: 500 }),
    targetResource: null,
    amount: 500,
    riskLevel: "low",
    requiresApproval: false,
    approvalStatus: "not_required",
    sessionId: "sess-q-1",
    ipAddress: "127.0.0.1",
    userIntent: null,
    actionOutcome: "submitted",
    reasonForFlagging: null,
    createdByAgent: false,
    eventId: id,
    userIdHash: hashUserId("actor-q"),
    source: "ui",
    userAgent: null,
  };
}

function scoreRow(eventId: string, elahScore: number, modelVersion: string | null = null) {
  return {
    id: `score_${eventId}`,
    timestamp: new Date("2026-09-28T07:59:00.000Z"),
    eventType: "elah_scored",
    eventId,
    metadata: JSON.stringify({
      status: "scored",
      score: {
        elahScore,
        confidence: 0.9,
        uncertainty: 0.1,
        intentLabel: "external_transfer",
        provenance: { scorer: "rules_v0", modelVersion, labelSource: "rules_v0" },
      },
    }),
  };
}

describe("queryAnalystEvents", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockDb() {
    const auditFindMany = vi.spyOn(prisma.auditLog, "findMany").mockImplementation(((args: {
      where?: { actionType?: unknown };
    }) => {
      if (args.where?.actionType) {
        return Promise.resolve([
          {
            id: "rs_1",
            timestamp: new Date("2026-09-28T08:00:00.000Z"),
            actionType: T.REVIEW_STATUS_SET,
            eventId: "evt_query_0002",
            actorId: "user_sec",
            actorName: "Sec",
            role: "security_reviewer",
            inputDataSummary: JSON.stringify({ v: 1, status: "escalated" }),
          },
        ]);
      }
      return Promise.resolve([
        ingestRow("evt_query_0003", 30),
        ingestRow("evt_query_0002", 20),
        ingestRow("evt_query_0001", 10),
      ]);
    }) as never);
    vi.spyOn(prisma.agentEventLog, "findMany").mockImplementation(((args: {
      where?: { eventType?: unknown };
    }) =>
      Promise.resolve(
        args.where?.eventType
          ? [scoreRow("evt_query_0001", 0.9), scoreRow("evt_query_0002", 0.2, "hybrid-1")]
          : [],
      )) as never);
    return auditFindMany;
  }

  const thresholds = { reviewBelow: 0.4, watchBelow: 0.7 };

  it("joins score snapshots and review state without touching the envelope", async () => {
    mockDb();
    const result = await queryAnalystEvents({}, { thresholds });
    expect(result.rows.map((row) => row.event.eventId)).toEqual([
      "evt_query_0003",
      "evt_query_0002",
      "evt_query_0001",
    ]);
    const [unscored, low, high] = result.rows;
    expect(unscored!.scoreStatus).toBe("none");
    expect(unscored!.band).toBe("unscored");
    expect(low!.elahScore).toBe(0.2);
    expect(low!.modelVersion).toBe("hybrid-1");
    expect(low!.band).toBe("review");
    expect(low!.review.reviewStatus).toBe("escalated");
    expect(high!.modelVersion).toBe("rules_v0");
    expect(high!.band).toBe("clear");
    for (const row of result.rows) {
      expect("elahScore" in (row.event as unknown as Record<string, unknown>)).toBe(false);
    }
  });

  it("applies in-memory analyst filters and the limit", async () => {
    mockDb();
    const review = await queryAnalystEvents({ band: "review" }, { thresholds });
    expect(review.rows.map((row) => row.event.eventId)).toEqual(["evt_query_0002"]);
    const escalated = await queryAnalystEvents({ reviewStatus: "escalated" }, { thresholds });
    expect(escalated.rows).toHaveLength(1);
    const model = await queryAnalystEvents({ modelVersion: "rules_v0" }, { thresholds });
    expect(model.rows.map((row) => row.event.eventId)).toEqual(["evt_query_0002", "evt_query_0001"]);
    const limited = await queryAnalystEvents({ limit: 2 }, { thresholds });
    expect(limited.rows).toHaveLength(2);
    expect(limited.truncated).toBe(true);
  });

  it("pushes source, session, and date range to the DB query", async () => {
    const auditFindMany = mockDb();
    await queryAnalystEvents(
      { channel: "agent", sessionId: "sess-q-1", preset: "1h" },
      { thresholds, now: new Date("2026-09-28T08:00:00.000Z") },
    );
    const where = auditFindMany.mock.calls[0]![0]!.where as Record<string, unknown>;
    expect(where.source).toBe("agent");
    expect(where.sessionId).toBe("sess-q-1");
    expect(where.timestamp).toEqual({ gte: new Date("2026-09-28T07:00:00.000Z") });
  });
});

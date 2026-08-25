import { describe, expect, it } from "vitest";
import { writeAgentEvent } from "@/lib/agent/logger";
import {
  mintEventId,
  runWithEventId,
  toIsoUtc,
  truncateUserAgent,
} from "@/lib/elah/event-context";
import { hashUserId } from "@/lib/elah/helpers";
import { writeAuditLog } from "@/lib/logging/logger";

describe("elah event context", () => {
  it("mints unique event ids", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => mintEventId()));
    expect(ids.size).toBe(1000);
  });

  it("formats occurredAt as ISO UTC ending with Z", () => {
    const iso = toIsoUtc(new Date("2026-08-25T12:34:56.789Z"));
    expect(iso).toBe("2026-08-25T12:34:56.789Z");
    expect(iso.endsWith("Z")).toBe(true);
    expect(toIsoUtc(new Date()).endsWith("Z")).toBe(true);
  });

  it("gives sequential writeAuditLog calls different eventIds", async () => {
    const first = await writeAuditLog({
      actionType: "external_transfer",
      actorId: "actor-seq-1",
      createdByAgent: false,
    });
    const second = await writeAuditLog({
      actionType: "external_transfer",
      actorId: "actor-seq-2",
      createdByAgent: false,
    });
    expect(first.eventId).toBeTruthy();
    expect(second.eventId).toBeTruthy();
    expect(first.eventId).not.toBe(second.eventId);
  });

  it("shares eventId across writeAuditLog and writeAgentEvent inside runWithEventId", async () => {
    const sharedId = mintEventId();
    const { audit, agent } = await runWithEventId(sharedId, async () => {
      const auditRow = await writeAuditLog({
        actionType: "internal_transfer",
        actorId: "actor-shared",
        createdByAgent: true,
        amount: 250,
      });
      const agentRow = await writeAgentEvent({
        eventType: "tool_call_executed",
        userId: "actor-shared",
        toolName: "create_internal_transfer",
      });
      return { audit: auditRow, agent: agentRow };
    });

    expect(audit.eventId).toBe(sharedId);
    expect(agent?.eventId).toBe(sharedId);
  });

  it("maps createdByAgent true to source agent and false to ui", async () => {
    const agentLog = await writeAuditLog({
      actionType: "bill_payment",
      actorId: "actor-source-agent",
      createdByAgent: true,
    });
    const uiLog = await writeAuditLog({
      actionType: "bill_payment",
      actorId: "actor-source-ui",
      createdByAgent: false,
    });
    expect(agentLog.source).toBe("agent");
    expect(uiLog.source).toBe("ui");
  });

  it("stores a 32-hex userIdHash and never the raw userId", async () => {
    const rawUserId = "user-raw-id-should-not-appear";
    const log = await writeAuditLog({
      actionType: "card_freeze",
      actorId: rawUserId,
      createdByAgent: false,
    });
    expect(log.userIdHash).toBe(hashUserId(rawUserId));
    expect(log.userIdHash).toMatch(/^[0-9a-f]{32}$/);
    expect(log.userIdHash).not.toContain(rawUserId);
    expect(log.actorId).toBe(rawUserId);
  });

  it("truncates user agents to 400 characters", async () => {
    const longUa = "A".repeat(500);
    expect(truncateUserAgent(longUa)).toHaveLength(400);
    const log = await writeAuditLog({
      actionType: "statement_download",
      actorId: "actor-ua",
      createdByAgent: true,
      userAgent: longUa,
    });
    expect(log.userAgent).toHaveLength(400);
    expect(log.userAgent).toBe("A".repeat(400));
  });
});

import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { prisma } from "@/lib/db";
import { executeTool } from "@/lib/agent/tools";
import type { ToolContext } from "@/lib/agent/types";
import {
  seedTestFixtures,
  type TestFixtures,
} from "../agent/fixtures";

const RECIPIENT_NAME = "Daniel Cohen";
const PAYEE_ACCOUNT = "123456789012";
const LONG_DIGIT_RUN = /\d{8,}/;

describe("agent tool audit provenance and sanitization", () => {
  let fx: TestFixtures;

  beforeAll(async () => {
    fx = await seedTestFixtures();
  });

  beforeEach(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.bankAccount.update({
      where: { id: fx.checkingAId },
      data: { status: "active" },
    });
  });

  function ctxFor(user: TestFixtures["userA"]): ToolContext {
    return {
      user,
      profileId: user.customerProfile!.id,
      ipAddress: "127.0.0.1",
      userAgent: "vitest",
      sessionCookieId: "test-session",
      conversationId: "test-conversation",
    };
  }

  async function latestAudit(actionType: string) {
    const log = await prisma.auditLog.findFirst({
      where: { actionType },
      orderBy: { timestamp: "desc" },
    });
    expect(log).not.toBeNull();
    return log!;
  }

  function assertSanitizedAgentAudit(
    log: {
      createdByAgent: boolean;
      inputDataSummary: string | null;
      actionType: string;
    },
    expectedActionType: string,
  ) {
    expect(log.createdByAgent).toBe(true);
    expect(log.actionType).toBe(expectedActionType);
    const raw = log.inputDataSummary ?? "{}";
    expect(raw).not.toContain(RECIPIENT_NAME);
    expect(raw).not.toContain("Yael Levi");
    expect(raw).not.toMatch(LONG_DIGIT_RUN);
    expect(raw).not.toContain(fx.checkingAId);
    expect(raw).not.toContain(PAYEE_ACCOUNT);
    return JSON.parse(raw) as Record<string, unknown>;
  }

  it("logs internal_transfer with createdByAgent and masked last-4 only", async () => {
    const result = await executeTool(
      "create_internal_transfer",
      { fromAccountType: "checking", toAccountType: "savings", amount: 50 },
      ctxFor(fx.userA),
    );
    expect(result.ok).toBe(true);

    const log = await latestAudit("internal_transfer");
    const summary = assertSanitizedAgentAudit(log, "internal_transfer");
    expect(summary.fromAccountType).toBe("checking");
    expect(summary.toAccountType).toBe("savings");
    expect(String(summary.fromLast4).length).toBeLessThanOrEqual(4);
    expect(String(summary.toLast4).length).toBeLessThanOrEqual(4);
  });

  it("logs external_transfer without the raw recipient name", async () => {
    const result = await executeTool(
      "create_external_transfer",
      { recipientName: RECIPIENT_NAME, amount: 100, note: "birthday gift" },
      ctxFor(fx.userA),
    );
    expect(result.ok).toBe(true);

    const log = await latestAudit("external_transfer");
    const summary = assertSanitizedAgentAudit(log, "external_transfer");
    expect(summary.recipientName).toBe("[recipient_redacted]");
    expect(summary.notePresent).toBe(true);
    expect(JSON.stringify(summary)).not.toContain(RECIPIENT_NAME);
  });

  it("logs get_saved_recipients without payee names or account numbers", async () => {
    await prisma.transaction.create({
      data: {
        accountId: fx.checkingAId,
        customerProfileId: fx.profileAId,
        description: `Transfer to ${RECIPIENT_NAME}`,
        merchantOrRecipient: `Yael Levi ${PAYEE_ACCOUNT}`,
        amount: 25,
        currency: "ILS",
        direction: "debit",
        status: "posted",
        category: "transfer_external",
        reference: "TX-PAYEE-001",
      },
    });

    const result = await executeTool("get_saved_recipients", {}, ctxFor(fx.userA));
    expect(result.ok).toBe(true);

    const log = await latestAudit("agent_recipients_read");
    const summary = assertSanitizedAgentAudit(log, "agent_recipients_read");
    expect(summary.count).toBeGreaterThanOrEqual(1);
    expect(Object.keys(summary)).toEqual(["count"]);
  });

  it("logs freeze_card with last-4 only and mutates BankAccount.status", async () => {
    const result = await executeTool(
      "freeze_card",
      { cardId: fx.checkingAId },
      ctxFor(fx.userA),
    );
    expect(result.ok).toBe(true);

    const acct = await prisma.bankAccount.findUniqueOrThrow({
      where: { id: fx.checkingAId },
    });
    expect(acct.status).toBe("frozen");

    const log = await latestAudit("card_freeze");
    const summary = assertSanitizedAgentAudit(log, "card_freeze");
    expect(summary.cardLast4).toBe(acct.accountNumberMasked.slice(-4));
    expect(JSON.stringify(summary)).not.toContain(fx.checkingAId);
  });

  it("logs statement download with period/type only", async () => {
    const month = new Date().toISOString().slice(0, 7);
    const result = await executeTool(
      "get_monthly_statement",
      { month },
      ctxFor(fx.userA),
    );
    expect(result.ok).toBe(true);

    const log = await latestAudit("agent_statement_downloaded");
    const summary = assertSanitizedAgentAudit(log, "agent_statement_downloaded");
    expect(summary.period).toBe(month);
    expect(summary.type).toBe("monthly_statement");
    expect(summary).not.toHaveProperty("transactionCount");
    expect(JSON.stringify(summary)).not.toMatch(/file|bytes|pdf|content/i);
  });
});

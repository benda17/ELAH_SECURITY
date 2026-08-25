import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { loginAction, requestPasswordResetAction } from "@/app/actions/auth";
import { updateProfileAction } from "@/app/actions/profile";
import { submitTransferAction } from "@/app/actions/transfer";
import { bulkDownloadAction } from "@/app/actions/documents";
import {
  seedTestFixtures,
  type TestFixtures,
} from "../agent/fixtures";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    const error = new Error(`NEXT_REDIRECT:${url}`);
    (error as Error & { digest: string }).digest = `NEXT_REDIRECT;${url}`;
    throw error;
  },
}));

const DEMO_PASSWORD = "DemoPass123!";
const RECIPIENT_NAME = "Daniel Cohen";
const RECIPIENT_ACCOUNT = "IL12-345678901234567890";

function formData(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

function parseSummary(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  return JSON.parse(raw) as Record<string, unknown>;
}

async function mockCustomer(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { customerProfile: true },
  });
  vi.mocked(getSessionUser).mockResolvedValue(user);
  return user;
}

describe.sequential("UI action audit events", () => {
  let fx: TestFixtures;

  beforeAll(async () => {
    fx = await seedTestFixtures();
    const passwordHash = (
      await prisma.user.findUniqueOrThrow({ where: { id: fx.userA.id } })
    ).passwordHash;
    await prisma.user.create({
      data: {
        email: "inactive-ui-actions@elah.demo",
        passwordHash,
        name: "Inactive UI User",
        role: "regular_customer",
        status: "suspended",
      },
    });
  });

  beforeEach(async () => {
    await prisma.riskEvent.deleteMany();
    await prisma.auditLog.deleteMany();
    vi.mocked(getSessionUser).mockResolvedValue(null);
  });

  it("logs login_failed without email in actorName or password in inputDataSummary", async () => {
    const password = "WrongPassword!NotTheRealOne";
    const email = "agent-test-a@elah.demo";
    const result = await loginAction(
      undefined,
      formData({ email, password }),
    );

    expect(result.error).toBe("Invalid email or password.");

    const logs = await prisma.auditLog.findMany({
      where: { actionType: "login_failed" },
    });
    expect(logs).toHaveLength(1);
    const log = logs[0]!;
    expect(log.actorType).toBe("anonymous");
    expect(log.actionOutcome).toBe("failed");
    expect(log.createdByAgent).toBe(false);
    expect(log.actorName).not.toContain(email);
    expect(log.actorName?.toLowerCase()).not.toContain("agent-test-a");
    expect(JSON.stringify(log)).not.toContain(email);
    expect(JSON.stringify(log)).not.toContain(password);

    const summary = parseSummary(log.inputDataSummary);
    expect(summary.emailDomain).toBe("elah.demo");
    expect(JSON.stringify(summary)).not.toContain(password);
    expect(JSON.stringify(summary)).not.toMatch(/password/i);
  });

  it("logs login_failed when the account is inactive", async () => {
    const result = await loginAction(
      undefined,
      formData({
        email: "inactive-ui-actions@elah.demo",
        password: DEMO_PASSWORD,
      }),
    );

    expect(result.error).toBe("This account is not active.");

    const logs = await prisma.auditLog.findMany({
      where: { actionType: "login_failed" },
    });
    expect(logs).toHaveLength(1);
    const log = logs[0]!;
    expect(log.actorType).toBe("anonymous");
    expect(log.actionOutcome).toBe("failed");
    expect(log.createdByAgent).toBe(false);
    expect(log.reasonForFlagging?.toLowerCase()).toContain("inactive");
    expect(log.actorName).not.toContain("inactive-ui-actions@elah.demo");
    expect(JSON.stringify(log)).not.toContain(DEMO_PASSWORD);
  });

  it("logs one profile_updated with changedFields and no phone value", async () => {
    const user = await mockCustomer(fx.userA.id);
    const profile = user.customerProfile!;
    const newPhone = "+972-50-111-9999";

    const result = await updateProfileAction(
      undefined,
      formData({
        email: profile.email,
        phone: newPhone,
        address: profile.address,
        employmentStatus: profile.employmentStatus,
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.error).toBeUndefined();

    const logs = await prisma.auditLog.findMany({
      where: { actionType: "profile_updated" },
    });
    expect(logs).toHaveLength(1);
    const log = logs[0]!;
    expect(log.createdByAgent).toBe(false);
    const summary = parseSummary(log.inputDataSummary);
    expect(summary.changedFields).toEqual(["phone"]);
    expect(JSON.stringify(summary)).not.toContain(newPhone);
    expect(JSON.stringify(summary)).not.toContain(profile.phone);
    expect(JSON.stringify(log.inputDataSummary)).not.toContain(newPhone);
  });

  it("does not write profile_updated on a no-op save", async () => {
    const user = await mockCustomer(fx.userA.id);
    const profile = user.customerProfile!;

    const result = await updateProfileAction(
      undefined,
      formData({
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        employmentStatus: profile.employmentStatus,
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/no changes/i);

    const logs = await prisma.auditLog.findMany({
      where: { actionType: "profile_updated" },
    });
    expect(logs).toHaveLength(0);
  });

  it("sanitizes recipient on transfer draft and submit logs", async () => {
    await mockCustomer(fx.userA.id);

    const draft = await submitTransferAction(
      undefined,
      formData({
        sourceAccountId: fx.checkingAId,
        recipientName: RECIPIENT_NAME,
        recipientAccount: RECIPIENT_ACCOUNT,
        amount: "3000",
        memo: "birthday gift",
      }),
    );
    expect(draft.ok).toBe(true);
    expect(draft.pendingApproval).toBeUndefined();

    const submit = await submitTransferAction(
      undefined,
      formData({
        sourceAccountId: fx.checkingAId,
        recipientName: RECIPIENT_NAME,
        recipientAccount: RECIPIENT_ACCOUNT,
        amount: "3000",
        memo: "birthday gift",
        confirmed: "true",
      }),
    );
    expect(submit.ok).toBe(true);
    expect(submit.pendingApproval).toBe(true);

    const logs = await prisma.auditLog.findMany({
      where: {
        actionType: {
          in: [
            "transfer_draft_created",
            "transfer_confirmation_viewed",
            "transfer_submitted",
          ],
        },
      },
      orderBy: { timestamp: "asc" },
    });
    expect(logs.map((l) => l.actionType)).toEqual([
      "transfer_draft_created",
      "transfer_confirmation_viewed",
      "transfer_submitted",
    ]);

    for (const log of logs) {
      expect(log.createdByAgent).toBe(false);
      expect(log.amount).toBe(3000);
      const blob = JSON.stringify(log);
      expect(blob).not.toContain(RECIPIENT_NAME);
      expect(blob).not.toContain(RECIPIENT_ACCOUNT);
      expect(blob).not.toContain("birthday gift");

      const summary = parseSummary(log.inputDataSummary);
      expect(summary.recipient).toBe("[recipient_redacted]");
      expect(summary.recipientAccountMasked).toBe("7890");
      expect(summary.amount).toBe(3000);
      expect(summary.memoPresent).toBe(true);
    }
  });

  it("logs a blocked bulk document download attempt", async () => {
    await mockCustomer(fx.userA.id);

    const result = await bulkDownloadAction();
    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/blocked/i);

    const logs = await prisma.auditLog.findMany({
      where: { actionType: "document_bulk_download_attempt" },
    });
    expect(logs).toHaveLength(1);
    const log = logs[0]!;
    expect(log.actionOutcome).toBe("blocked");
    expect(log.createdByAgent).toBe(false);
    expect(log.riskLevel).toBe("high");
  });

  it("logs a high-risk password_reset_requested for a known account with no session", async () => {
    const result = await requestPasswordResetAction(
      undefined,
      formData({ email: "agent-test-a@elah.demo" }),
    );
    expect(result.message).toMatch(/no email is sent/i);

    const logs = await prisma.auditLog.findMany({
      where: { actionType: "password_reset_requested" },
    });
    expect(logs).toHaveLength(1);
    const log = logs[0]!;
    expect(log.createdByAgent).toBe(false);
    expect(log.riskLevel).toBe("high");
    expect(log.actorId).toBe(fx.userA.id);
    const summary = parseSummary(log.inputDataSummary);
    expect(summary.accountKnown).toBe(true);
    expect(summary.passwordUnchanged).toBe(true);
    expect(JSON.stringify(summary)).not.toContain("agent-test-a@elah.demo");

    const risks = await prisma.riskEvent.findMany({
      where: { eventType: "password_reset_requested" },
    });
    expect(risks).toHaveLength(1);
  });

  it("logs a medium password_reset_requested for an unknown email and does not create a risk event", async () => {
    const result = await requestPasswordResetAction(
      undefined,
      formData({ email: "nobody@not-a-bank.example" }),
    );
    expect(result.message).toMatch(/if that email exists/i);

    const log = await prisma.auditLog.findFirst({
      where: { actionType: "password_reset_requested" },
    });
    expect(log?.riskLevel).toBe("medium");
    expect(parseSummary(log?.inputDataSummary ?? null).accountKnown).toBe(false);
    expect(await prisma.riskEvent.count()).toBe(0);
  });
});

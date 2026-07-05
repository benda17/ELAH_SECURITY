import bcrypt from "bcryptjs";
import type { SessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { handleAgentChat } from "@/lib/agent/orchestrator";
import type { AgentEventType } from "@/lib/agent/logger";

export interface TestFixtures {
  userA: SessionUser;
  userB: SessionUser;
  profileAId: string;
  profileBId: string;
  checkingAId: string;
  checkingBId: string;
  savingsAId: string;
  userBCheckingBalance: number;
}

const DEMO_PASSWORD = "DemoPass123!";

async function clearDatabase() {
  await prisma.agentEventLog.deleteMany();
  await prisma.agentMessage.deleteMany();
  await prisma.agentPendingAction.deleteMany();
  await prisma.agentConversation.deleteMany();
  await prisma.agentActionLog.deleteMany();
  await prisma.riskEvent.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.approvalRequest.deleteMany();
  await prisma.managerNote.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.loanRequest.deleteMany();
  await prisma.cardRequest.deleteMany();
  await prisma.document.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.session.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.promptInjectionScenario.deleteMany();
  await prisma.user.deleteMany();
}

export async function seedTestFixtures(): Promise<TestFixtures> {
  await clearDatabase();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 4);

  const userA = await prisma.user.create({
    data: {
      email: "agent-test-a@elah.demo",
      passwordHash,
      name: "Alice AgentTest",
      role: "regular_customer",
      status: "active",
    },
  });

  const userB = await prisma.user.create({
    data: {
      email: "agent-test-b@elah.demo",
      passwordHash,
      name: "Bob AgentTest",
      role: "regular_customer",
      status: "active",
    },
  });

  const profileA = await prisma.customerProfile.create({
    data: {
      userId: userA.id,
      customerNumber: "ELAH-AGENT-A",
      tier: "basic",
      fullName: "Alice AgentTest",
      dateOfBirth: new Date("1990-01-15"),
      email: userA.email,
      phone: "+972-50-000-0001",
      address: "1 Test Street, Tel Aviv",
      employmentStatus: "Employed",
    },
  });

  const profileB = await prisma.customerProfile.create({
    data: {
      userId: userB.id,
      customerNumber: "ELAH-AGENT-B",
      tier: "basic",
      fullName: "Bob AgentTest",
      dateOfBirth: new Date("1988-06-20"),
      email: userB.email,
      phone: "+972-50-000-0002",
      address: "2 Other Street, Haifa",
      employmentStatus: "Employed",
    },
  });

  const userBCheckingBalance = 99_999;

  const checkingA = await prisma.bankAccount.create({
    data: {
      customerProfileId: profileA.id,
      accountType: "checking",
      accountNumberMasked: "**** **** **** 1111",
      currentBalance: 5_000,
      availableBalance: 5_000,
      dailyTransferLimit: 5_000,
      status: "active",
    },
  });

  const savingsA = await prisma.bankAccount.create({
    data: {
      customerProfileId: profileA.id,
      accountType: "savings",
      accountNumberMasked: "**** **** **** 2222",
      currentBalance: 1_000,
      availableBalance: 1_000,
      dailyTransferLimit: 2_500,
    },
  });

  const checkingB = await prisma.bankAccount.create({
    data: {
      customerProfileId: profileB.id,
      accountType: "checking",
      accountNumberMasked: "**** **** **** 9999",
      currentBalance: userBCheckingBalance,
      availableBalance: userBCheckingBalance,
      dailyTransferLimit: 5_000,
      status: "active",
    },
  });

  const now = new Date();
  await prisma.transaction.createMany({
    data: [
      {
        accountId: checkingA.id,
        customerProfileId: profileA.id,
        timestamp: new Date(now.getTime() - 86_400_000),
        description: "Grocery store",
        merchantOrRecipient: "Supermarket",
        amount: 120,
        currency: "ILS",
        direction: "debit",
        status: "posted",
        category: "groceries",
        reference: "TX-A-001",
      },
      {
        accountId: checkingA.id,
        customerProfileId: profileA.id,
        timestamp: new Date(now.getTime() - 172_800_000),
        description: "Salary",
        merchantOrRecipient: "Employer Ltd",
        amount: 8_000,
        currency: "ILS",
        direction: "credit",
        status: "posted",
        category: "income",
        reference: "TX-A-002",
      },
      {
        accountId: checkingA.id,
        customerProfileId: profileA.id,
        timestamp: new Date(now.getTime() - 2_592_000_000),
        description: "Electric bill",
        merchantOrRecipient: "Electricity Company",
        amount: 250,
        currency: "ILS",
        direction: "debit",
        status: "posted",
        category: "bills",
        reference: "TX-A-003",
      },
    ],
  });

  const sessionA = await prisma.user.findUniqueOrThrow({
    where: { id: userA.id },
    include: { customerProfile: true },
  });

  const sessionB = await prisma.user.findUniqueOrThrow({
    where: { id: userB.id },
    include: { customerProfile: true },
  });

  return {
    userA: sessionA as SessionUser,
    userB: sessionB as SessionUser,
    profileAId: profileA.id,
    profileBId: profileB.id,
    checkingAId: checkingA.id,
    checkingBId: checkingB.id,
    savingsAId: savingsA.id,
    userBCheckingBalance,
  };
}

export async function clearAgentTables() {
  await prisma.agentEventLog.deleteMany();
  await prisma.agentMessage.deleteMany();
  await prisma.agentPendingAction.deleteMany();
  await prisma.agentConversation.deleteMany();
}

export async function chat(
  user: SessionUser,
  message: string,
  conversationId?: string,
) {
  return handleAgentChat({
    user,
    message,
    conversationId,
    ipAddress: "127.0.0.1",
    userAgent: "vitest-agent-suite",
    sessionCookieId: "test-session-id",
  });
}

export async function getConversationLogs(conversationId: string) {
  return prisma.agentEventLog.findMany({
    where: { conversationId },
    orderBy: { timestamp: "asc" },
  });
}

export async function getLogsByEventTypes(
  conversationId: string,
  eventTypes: AgentEventType[],
) {
  const logs = await getConversationLogs(conversationId);
  return logs.filter((log) =>
    eventTypes.includes(log.eventType as AgentEventType),
  );
}

export async function expectSuccessfulToolLogs(
  conversationId: string,
  toolName: string,
) {
  const logs = await getConversationLogs(conversationId);
  const types = logs.map((l) => l.eventType);
  expect(types).toContain("tool_call_requested");
  expect(types).toContain("policy_check_passed");
  expect(types).toContain("tool_call_executed");
  expect(
    logs.some((l) => l.toolName === toolName && l.eventType === "tool_call_executed"),
  ).toBe(true);
}

export async function expectConfirmationLogs(
  conversationId: string,
  toolName: string,
) {
  const logs = await getConversationLogs(conversationId);
  expect(logs.some((l) => l.eventType === "tool_call_requested")).toBe(true);
  expect(logs.some((l) => l.eventType === "confirmation_required")).toBe(true);
  expect(
    logs.some(
      (l) => l.toolName === toolName && l.eventType === "confirmation_required",
    ),
  ).toBe(true);
}

export async function expectSecurityDenyLog(
  conversationId: string,
  eventType: "suspicious_prompt_detected" | "policy_check_failed",
) {
  const logs = await getConversationLogs(conversationId);
  const match = logs.filter((l) => l.eventType === eventType);
  expect(match.length).toBeGreaterThan(0);
  if (eventType === "policy_check_failed") {
    expect(match.some((l) => l.policyDecision === "deny")).toBe(true);
  } else {
    expect(match.some((l) => l.policyDecision === "deny")).toBe(true);
  }
}

export async function getAccountBalance(accountId: string) {
  const acct = await prisma.bankAccount.findUniqueOrThrow({
    where: { id: accountId },
  });
  return acct.currentBalance;
}

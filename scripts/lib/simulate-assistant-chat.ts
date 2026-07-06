import type { PrismaClient, CustomerProfile, User } from "@prisma/client";
import type { SessionUser } from "@/lib/auth/session";
import { handleAgentChat } from "@/lib/agent/orchestrator";
import { pickConfirmPhrase } from "./assistant-phrase-bank";

type DbCustomer = CustomerProfile & {
  user: User;
  accounts: Array<{
    id: string;
    accountType: string;
    currentBalance: number;
    availableBalance: number;
  }>;
};

function toSessionUser(customer: DbCustomer): SessionUser {
  const { user, accounts: _accounts, ...profile } = customer;
  return {
    ...user,
    customerProfile: profile as CustomerProfile,
  };
}

function randInt(lo: number, hi: number): number {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

async function backdateConversation(
  prisma: PrismaClient,
  conversationId: string,
  baseTime: Date,
) {
  const messages = await prisma.agentMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
  const events = await prisma.agentEventLog.findMany({
    where: { conversationId },
    orderBy: { timestamp: "asc" },
  });
  const pending = await prisma.agentPendingAction.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });

  let offsetMs = 0;
  for (const m of messages) {
    await prisma.agentMessage.update({
      where: { id: m.id },
      data: { createdAt: new Date(baseTime.getTime() + offsetMs) },
    });
    offsetMs += randInt(2, 12) * 1000;
  }

  let eventOffset = 0;
  for (const e of events) {
    await prisma.agentEventLog.update({
      where: { id: e.id },
      data: { timestamp: new Date(baseTime.getTime() + eventOffset) },
    });
    eventOffset += randInt(1, 6) * 1000;
  }

  for (const p of pending) {
    await prisma.agentPendingAction.update({
      where: { id: p.id },
      data: {
        createdAt: new Date(baseTime.getTime() + eventOffset),
        expiresAt: new Date(baseTime.getTime() + eventOffset + 10 * 60 * 1000),
        ...(p.executedAt
          ? { executedAt: new Date(baseTime.getTime() + eventOffset + 5000) }
          : {}),
      },
    });
    eventOffset += randInt(2, 8) * 1000;
  }

  await prisma.agentConversation.update({
    where: { id: conversationId },
    data: {
      createdAt: baseTime,
      updatedAt: new Date(baseTime.getTime() + Math.max(offsetMs, eventOffset)),
    },
  });
}

async function backdateSideEffects(
  prisma: PrismaClient,
  customer: DbCustomer,
  since: Date,
  baseTime: Date,
) {
  const [audits, txs, tickets] = await Promise.all([
    prisma.auditLog.findMany({
      where: { actorId: customer.userId, timestamp: { gte: since } },
      orderBy: { timestamp: "asc" },
    }),
    prisma.transaction.findMany({
      where: { customerProfileId: customer.id, timestamp: { gte: since } },
      orderBy: { timestamp: "asc" },
    }),
    prisma.supportTicket.findMany({
      where: { customerProfileId: customer.id, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  let offset = randInt(5, 20) * 1000;
  for (const row of audits) {
    await prisma.auditLog.update({
      where: { id: row.id },
      data: { timestamp: new Date(baseTime.getTime() + offset) },
    });
    offset += randInt(1, 4) * 1000;
  }
  for (const row of txs) {
    await prisma.transaction.update({
      where: { id: row.id },
      data: { timestamp: new Date(baseTime.getTime() + offset) },
    });
    offset += randInt(1, 4) * 1000;
  }
  for (const row of tickets) {
    await prisma.supportTicket.update({
      where: { id: row.id },
      data: { createdAt: new Date(baseTime.getTime() + offset) },
    });
    offset += randInt(1, 4) * 1000;
  }
}

export interface SimulateAssistantChatInput {
  prisma: PrismaClient;
  customer: DbCustomer;
  message: string;
  sessionId: string;
  ipAddress: string;
  at: Date;
  autoConfirm?: boolean;
  confirmSeed?: string;
}

export interface SimulateAssistantChatResult {
  ok: boolean;
  conversationId: string;
  confirmed: boolean;
  refused: boolean;
  toolCount: number;
}

/**
 * Runs one (or two, with confirmation) assistant turns and backdates all
 * agent + side-effect rows to `at`.
 */
export async function simulateAssistantChat(
  input: SimulateAssistantChatInput,
): Promise<SimulateAssistantChatResult | null> {
  delete process.env.OPENAI_API_KEY;

  const user = toSessionUser(input.customer);
  const started = new Date();

  let res = await handleAgentChat({
    user,
    message: input.message,
    ipAddress: input.ipAddress,
    userAgent: "seed-more-activity",
    sessionCookieId: input.sessionId,
  });

  let confirmed = false;
  if (input.autoConfirm !== false && res.pendingAction) {
    const confirmMessage = pickConfirmPhrase(
      input.confirmSeed ?? `${input.sessionId}-${res.conversationId}`,
    );
    res = await handleAgentChat({
      user,
      message: confirmMessage,
      conversationId: res.conversationId,
      ipAddress: input.ipAddress,
      userAgent: "seed-more-activity",
      sessionCookieId: input.sessionId,
    });
    confirmed = true;
  }

  await backdateConversation(input.prisma, res.conversationId, input.at);
  await backdateSideEffects(input.prisma, input.customer, started, input.at);

  return {
    ok: res.ok,
    conversationId: res.conversationId,
    confirmed,
    refused: res.refused,
    toolCount: res.toolCalls.length,
  };
}

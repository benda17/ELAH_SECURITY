import "server-only";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/logging/logger";
import type { ToolContext, ToolDefinition, ToolResult } from "../types";

/**
 * Card operations. The current DB schema has CardRequest but no explicit
 * "issued Card" model, so we treat each customer's checking account as a
 * proxy for a single primary debit card, with a card-status flag stored
 * on the bank account's `status` field ("active" | "frozen").
 * That's enough for the assistant to freeze/unfreeze a customer's card
 * without introducing a new schema migration.
 */

interface GetCardsArgs {
  status?: "active" | "frozen" | "all";
}

const getCards: ToolDefinition<GetCardsArgs> = {
  name: "get_cards",
  description: "List the authenticated customer's card(s) with their current status.",
  category: "read",
  requiresConfirmation: false,
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {
      status: { type: "string", enum: ["active", "frozen", "all"] },
    },
  },
  async summarize() {
    return "Show your cards";
  },
  async execute(args, ctx): Promise<ToolResult> {
    const accounts = await prisma.bankAccount.findMany({
      where: {
        customerProfileId: ctx.profileId,
        accountType: "checking",
        ...(args.status && args.status !== "all" ? { status: args.status === "frozen" ? "frozen" : "active" } : {}),
      },
    });
    await writeAuditLog({
      actionType: "agent_cards_read",
      page: "/assistant",
      toolOrFeatureUsed: "ai_assistant.get_cards",
      actionOutcome: "viewed",
      riskLevel: "low",
      createdByAgent: true,
    });
    const cards = accounts.map((a) => ({
      cardId: a.id,
      linkedAccount: a.accountNumberMasked,
      status: a.status === "frozen" ? "frozen" : "active",
      type: "debit",
    }));
    return {
      ok: true,
      summary: cards.length ? `${cards.length} card${cards.length === 1 ? "" : "s"} on file.` : "No cards on file.",
      data: cards,
    };
  },
};

interface FreezeArgs {
  cardId: string;
}

const freezeCard: ToolDefinition<FreezeArgs> = {
  name: "freeze_card",
  description: "Freeze the authenticated customer's card so it cannot be used. Requires confirmation.",
  category: "card_control",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    additionalProperties: false,
    required: ["cardId"],
    properties: { cardId: { type: "string" } },
  },
  async summarize(args) {
    return `Freeze card ${args.cardId.slice(-4)}`;
  },
  async execute(args, ctx): Promise<ToolResult> {
    const acct = await prisma.bankAccount.findFirst({
      where: { id: args.cardId, customerProfileId: ctx.profileId, accountType: "checking" },
    });
    if (!acct) {
      return { ok: false, summary: "I couldn't find that card on your account.", error: "not_owned_or_missing" };
    }
    if (acct.status === "frozen") {
      return { ok: true, summary: "Your card is already frozen.", data: { status: "frozen" } };
    }
    await prisma.bankAccount.update({ where: { id: acct.id }, data: { status: "frozen" } });
    await writeAuditLog({
      actionType: "card_freeze",
      page: "/assistant",
      toolOrFeatureUsed: "ai_assistant.freeze_card",
      actionOutcome: "posted",
      riskLevel: "medium",
      createdByAgent: true,
      targetResource: acct.id,
    });
    return { ok: true, summary: "Your card has been frozen.", data: { status: "frozen" } };
  },
};

const unfreezeCard: ToolDefinition<FreezeArgs> = {
  name: "unfreeze_card",
  description: "Unfreeze the authenticated customer's card so it can be used again. Requires confirmation.",
  category: "card_control",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    additionalProperties: false,
    required: ["cardId"],
    properties: { cardId: { type: "string" } },
  },
  async summarize(args) {
    return `Unfreeze card ${args.cardId.slice(-4)}`;
  },
  async execute(args, ctx): Promise<ToolResult> {
    const acct = await prisma.bankAccount.findFirst({
      where: { id: args.cardId, customerProfileId: ctx.profileId, accountType: "checking" },
    });
    if (!acct) {
      return { ok: false, summary: "I couldn't find that card on your account.", error: "not_owned_or_missing" };
    }
    if (acct.status !== "frozen") {
      return { ok: true, summary: "Your card is already active.", data: { status: "active" } };
    }
    await prisma.bankAccount.update({ where: { id: acct.id }, data: { status: "active" } });
    await writeAuditLog({
      actionType: "card_unfreeze",
      page: "/assistant",
      toolOrFeatureUsed: "ai_assistant.unfreeze_card",
      actionOutcome: "posted",
      riskLevel: "medium",
      createdByAgent: true,
      targetResource: acct.id,
    });
    return { ok: true, summary: "Your card has been unfrozen.", data: { status: "active" } };
  },
};

export const cardTools: ToolDefinition[] = [
  getCards as unknown as ToolDefinition,
  freezeCard as unknown as ToolDefinition,
  unfreezeCard as unknown as ToolDefinition,
];

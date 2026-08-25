import "server-only";
import { prisma } from "@/lib/db";
import { writeAuditLog, writeRiskEvent } from "@/lib/logging/logger";
import { tierPolicy } from "@/lib/auth/roles";
import { riskForTransfer } from "@/lib/risk/heuristics";
import type { ToolContext, ToolDefinition, ToolResult } from "../types";

const RECIPIENT_REDACTED = "[recipient_redacted]";

function fmtNis(n: number): string {
  return new Intl.NumberFormat("en-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 2,
  }).format(n);
}

function last4(maskedOrId: string): string {
  return maskedOrId.slice(-4);
}

// ---------------------------------------------------------------------------
// create_internal_transfer
// ---------------------------------------------------------------------------

interface InternalTransferArgs {
  fromAccountType: "checking" | "savings" | "investment";
  toAccountType: "checking" | "savings" | "investment";
  amount: number;
  note?: string;
}

const createInternalTransfer: ToolDefinition<InternalTransferArgs> = {
  name: "create_internal_transfer",
  description:
    "Move money between two of the authenticated customer's own accounts (e.g. from checking to savings). Requires user confirmation.",
  category: "money_move",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    additionalProperties: false,
    required: ["fromAccountType", "toAccountType", "amount"],
    properties: {
      fromAccountType: { type: "string", enum: ["checking", "savings", "investment"] },
      toAccountType: { type: "string", enum: ["checking", "savings", "investment"] },
      amount: { type: "number", exclusiveMinimum: 0 },
      note: { type: "string", maxLength: 120 },
    },
  },
  async summarize(args) {
    return `Move ${fmtNis(args.amount)} from ${args.fromAccountType} to ${args.toAccountType}`;
  },
  async execute(args, ctx): Promise<ToolResult> {
    if (args.fromAccountType === args.toAccountType) {
      return {
        ok: false,
        summary: "The source and destination accounts must be different.",
        error: "same_account",
      };
    }
    const [from, to] = await Promise.all([
      prisma.bankAccount.findFirst({
        where: { customerProfileId: ctx.profileId, accountType: args.fromAccountType },
      }),
      prisma.bankAccount.findFirst({
        where: { customerProfileId: ctx.profileId, accountType: args.toAccountType },
      }),
    ]);
    if (!from) {
      return { ok: false, summary: `No ${args.fromAccountType} account on file.`, error: "source_missing" };
    }
    if (!to) {
      return { ok: false, summary: `No ${args.toAccountType} account on file.`, error: "target_missing" };
    }
    if (from.availableBalance < args.amount) {
      return {
        ok: false,
        summary: `Insufficient available balance in ${args.fromAccountType} (${fmtNis(from.availableBalance)}).`,
        error: "insufficient_funds",
      };
    }
    const reference = `AI-${from.id.slice(-4)}-${Date.now().toString().slice(-6)}`;
    await prisma.$transaction(async (tx) => {
      await tx.bankAccount.update({
        where: { id: from.id },
        data: {
          currentBalance: from.currentBalance - args.amount,
          availableBalance: from.availableBalance - args.amount,
        },
      });
      await tx.bankAccount.update({
        where: { id: to.id },
        data: {
          currentBalance: to.currentBalance + args.amount,
          availableBalance: to.availableBalance + args.amount,
        },
      });
      await tx.transaction.create({
        data: {
          accountId: from.id,
          customerProfileId: ctx.profileId,
          description: args.note
            ? `Transfer to own ${args.toAccountType} — ${args.note}`
            : `Transfer to own ${args.toAccountType}`,
          merchantOrRecipient: `Own ${args.toAccountType} account`,
          amount: args.amount,
          currency: "ILS",
          direction: "debit",
          status: "posted",
          category: "transfer_internal",
          reference,
        },
      });
      await tx.transaction.create({
        data: {
          accountId: to.id,
          customerProfileId: ctx.profileId,
          description: `Transfer from own ${args.fromAccountType}`,
          merchantOrRecipient: `Own ${args.fromAccountType} account`,
          amount: args.amount,
          currency: "ILS",
          direction: "credit",
          status: "posted",
          category: "transfer_internal",
          reference,
        },
      });
    });
    await writeAuditLog({
      actionType: "internal_transfer",
      page: "/assistant",
      toolOrFeatureUsed: "ai_assistant.create_internal_transfer",
      actionOutcome: "posted",
      riskLevel: "low",
      createdByAgent: true,
      targetResource: reference,
      amount: args.amount,
      inputDataSummary: {
        fromAccountType: args.fromAccountType,
        toAccountType: args.toAccountType,
        fromLast4: last4(from.accountNumberMasked),
        toLast4: last4(to.accountNumberMasked),
      },
    });
    return {
      ok: true,
      summary: `Moved ${fmtNis(args.amount)} from ${args.fromAccountType} to ${args.toAccountType}.`,
      data: { reference, newFromBalance: from.currentBalance - args.amount },
    };
  },
};

// ---------------------------------------------------------------------------
// create_external_transfer
// ---------------------------------------------------------------------------

interface ExternalTransferArgs {
  recipientName: string;
  amount: number;
  note?: string;
}

const createExternalTransfer: ToolDefinition<ExternalTransferArgs> = {
  name: "create_external_transfer",
  description:
    "Send money from the authenticated customer's checking account to a named external recipient. Requires confirmation. Amounts above the customer's tier threshold will be routed for manager approval instead of executed immediately.",
  category: "money_move",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    additionalProperties: false,
    required: ["recipientName", "amount"],
    properties: {
      recipientName: { type: "string", minLength: 2, maxLength: 80 },
      amount: { type: "number", exclusiveMinimum: 0 },
      note: { type: "string", maxLength: 120 },
    },
  },
  async summarize(args) {
    return `Transfer ${fmtNis(args.amount)} to ${args.recipientName}`;
  },
  async execute(args, ctx): Promise<ToolResult> {
    const tier = (ctx.user.customerProfile?.tier ?? "basic") as "basic" | "premium" | "vip";
    const policy = tierPolicy(tier);
    if (args.amount > policy.perTransferLimit) {
      const log = await writeAuditLog({
        actionType: "transfer_blocked",
        page: "/assistant",
        toolOrFeatureUsed: "ai_assistant.create_external_transfer",
        actionOutcome: "blocked",
        riskLevel: "critical",
        createdByAgent: true,
        amount: args.amount,
        reasonForFlagging: `Amount ${args.amount} exceeds tier ${tier} per-transfer limit ${policy.perTransferLimit}.`,
        inputDataSummary: {
          recipientName: RECIPIENT_REDACTED,
        },
      });
      await writeRiskEvent({
        severity: "critical",
        eventType: "tier_limit_violation",
        actorType: "customer",
        actorId: ctx.user.id,
        customerProfileId: ctx.profileId,
        relatedAuditLogIds: [log.id],
        reasonForFlagging: `Assistant tried external transfer of ${args.amount} above ${tier} tier limit.`,
        detectedPattern: "tier_limit_exceeded",
      });
      return {
        ok: false,
        summary: `${fmtNis(args.amount)} exceeds your ${tier}-tier per-transfer limit of ${fmtNis(policy.perTransferLimit)}.`,
        error: "over_tier_limit",
      };
    }
    const from = await prisma.bankAccount.findFirst({
      where: { customerProfileId: ctx.profileId, accountType: "checking" },
    });
    if (!from) return { ok: false, summary: "No checking account on file.", error: "no_source" };
    if (from.availableBalance < args.amount) {
      return {
        ok: false,
        summary: `Insufficient available balance (${fmtNis(from.availableBalance)}).`,
        error: "insufficient_funds",
      };
    }

    const risk = riskForTransfer(args.amount, policy.approvalRequiredAbove);
    const requiresApproval = args.amount >= policy.approvalRequiredAbove;
    const reference = `AI-${from.id.slice(-4)}-${Date.now().toString().slice(-6)}`;

    if (requiresApproval) {
      const approval = await prisma.approvalRequest.create({
        data: {
          requestType: "transfer",
          targetResourceId: reference,
          customerProfileId: ctx.profileId,
          requestedByActorType: "customer",
          requestedByActorId: ctx.user.id,
          assignedManagerId: ctx.user.customerProfile?.assignedManagerId ?? null,
          amount: args.amount,
          riskLevel: risk,
          status: "pending",
        },
      });
      await writeAuditLog({
        actionType: "transfer_submitted",
        page: "/assistant",
        toolOrFeatureUsed: "ai_assistant.create_external_transfer",
        actionOutcome: "submitted",
        riskLevel: risk,
        requiresApproval: true,
        approvalStatus: "pending",
        createdByAgent: true,
        targetResource: reference,
        amount: args.amount,
        inputDataSummary: {
          recipientName: RECIPIENT_REDACTED,
          notePresent: !!args.note,
        },
      });
      return {
        ok: true,
        summary: `Submitted ${fmtNis(args.amount)} to ${args.recipientName} for manager approval (over your usual limit).`,
        data: { reference, status: "pending_approval", approvalRequestId: approval.id },
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.bankAccount.update({
        where: { id: from.id },
        data: {
          currentBalance: from.currentBalance - args.amount,
          availableBalance: from.availableBalance - args.amount,
        },
      });
      await tx.transaction.create({
        data: {
          accountId: from.id,
          customerProfileId: ctx.profileId,
          description: args.note
            ? `Transfer to ${args.recipientName} — ${args.note}`
            : `Transfer to ${args.recipientName}`,
          merchantOrRecipient: args.recipientName,
          amount: args.amount,
          currency: "ILS",
          direction: "debit",
          status: "posted",
          category: "transfer_external",
          reference,
        },
      });
    });
    await writeAuditLog({
      actionType: "external_transfer",
      page: "/assistant",
      toolOrFeatureUsed: "ai_assistant.create_external_transfer",
      actionOutcome: "posted",
      riskLevel: risk,
      createdByAgent: true,
      targetResource: reference,
      amount: args.amount,
      inputDataSummary: {
        recipientName: RECIPIENT_REDACTED,
        notePresent: !!args.note,
      },
    });
    return {
      ok: true,
      summary: `Sent ${fmtNis(args.amount)} to ${args.recipientName}.`,
      data: { reference, status: "posted" },
    };
  },
};

// ---------------------------------------------------------------------------
// pay_bill
// ---------------------------------------------------------------------------

interface PayBillArgs {
  billerName: string;
  amount: number;
  referenceNumber?: string;
}

const payBill: ToolDefinition<PayBillArgs> = {
  name: "pay_bill",
  description:
    "Pay a named biller (electricity, phone, water, etc.) from the authenticated customer's checking account. Requires confirmation.",
  category: "money_move",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    additionalProperties: false,
    required: ["billerName", "amount"],
    properties: {
      billerName: { type: "string", minLength: 2, maxLength: 60 },
      amount: { type: "number", exclusiveMinimum: 0 },
      referenceNumber: { type: "string", maxLength: 30 },
    },
  },
  async summarize(args) {
    return `Pay ${fmtNis(args.amount)} to ${args.billerName}`;
  },
  async execute(args, ctx): Promise<ToolResult> {
    const from = await prisma.bankAccount.findFirst({
      where: { customerProfileId: ctx.profileId, accountType: "checking" },
    });
    if (!from) return { ok: false, summary: "No checking account on file.", error: "no_source" };
    if (from.availableBalance < args.amount) {
      return {
        ok: false,
        summary: `Insufficient available balance (${fmtNis(from.availableBalance)}).`,
        error: "insufficient_funds",
      };
    }
    const reference = `BILL-${from.id.slice(-4)}-${Date.now().toString().slice(-6)}`;
    await prisma.$transaction(async (tx) => {
      await tx.bankAccount.update({
        where: { id: from.id },
        data: {
          currentBalance: from.currentBalance - args.amount,
          availableBalance: from.availableBalance - args.amount,
        },
      });
      await tx.transaction.create({
        data: {
          accountId: from.id,
          customerProfileId: ctx.profileId,
          description: `Bill payment — ${args.billerName}${args.referenceNumber ? ` (ref ${args.referenceNumber})` : ""}`,
          merchantOrRecipient: args.billerName,
          amount: args.amount,
          currency: "ILS",
          direction: "debit",
          status: "posted",
          category: "bills",
          reference,
        },
      });
    });
    await writeAuditLog({
      actionType: "bill_payment",
      page: "/assistant",
      toolOrFeatureUsed: "ai_assistant.pay_bill",
      actionOutcome: "posted",
      riskLevel: "low",
      createdByAgent: true,
      targetResource: reference,
      amount: args.amount,
      inputDataSummary: {
        billerPresent: true,
        referencePresent: !!args.referenceNumber,
      },
    });
    return {
      ok: true,
      summary: `Paid ${fmtNis(args.amount)} to ${args.billerName}.`,
      data: { reference },
    };
  },
};

export const moneyTools: ToolDefinition[] = [
  createInternalTransfer as unknown as ToolDefinition,
  createExternalTransfer as unknown as ToolDefinition,
  payBill as unknown as ToolDefinition,
];

import "server-only";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/logging/logger";
import type { ToolContext, ToolDefinition, ToolResult } from "../types";

function fmtNis(n: number): string {
  return new Intl.NumberFormat("en-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 2,
  }).format(n);
}

// ---------------------------------------------------------------------------
// get_account_balance
// ---------------------------------------------------------------------------

interface BalanceArgs {
  accountType?: "checking" | "savings" | "investment" | "all";
}

const getAccountBalance: ToolDefinition<BalanceArgs> = {
  name: "get_account_balance",
  description:
    "Get the balance(s) of the authenticated customer's own accounts. Use accountType='all' to return every account.",
  category: "read",
  requiresConfirmation: false,
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {
      accountType: {
        type: "string",
        enum: ["checking", "savings", "investment", "all"],
        description:
          "Which account to look up. Defaults to 'all' when not specified.",
      },
    },
  },
  async summarize(args) {
    return args.accountType && args.accountType !== "all"
      ? `Look up your ${args.accountType} balance`
      : `Look up your account balances`;
  },
  async execute(args, ctx): Promise<ToolResult> {
    const type = args.accountType ?? "all";
    const accounts = await prisma.bankAccount.findMany({
      where: {
        customerProfileId: ctx.profileId,
        ...(type !== "all" ? { accountType: type } : {}),
      },
      orderBy: { accountType: "asc" },
    });
    if (accounts.length === 0) {
      return { ok: true, summary: "No matching accounts on file.", data: [] };
    }
    const rows = accounts.map((a) => ({
      accountType: a.accountType,
      accountNumberMasked: a.accountNumberMasked,
      currency: a.currency,
      currentBalance: a.currentBalance,
      availableBalance: a.availableBalance,
    }));
    const summary = accounts
      .map((a) => `${a.accountType}: ${fmtNis(a.currentBalance)}`)
      .join(" · ");
    await writeAuditLog({
      actionType: "agent_account_balance_read",
      page: "/assistant",
      toolOrFeatureUsed: "ai_assistant.get_account_balance",
      actionOutcome: "viewed",
      riskLevel: "low",
      createdByAgent: true,
      targetResource: ctx.profileId,
      inputDataSummary: { accountType: type },
    });
    return { ok: true, summary, data: rows };
  },
};

// ---------------------------------------------------------------------------
// get_recent_transactions
// ---------------------------------------------------------------------------

interface RecentTxArgs {
  limit?: number;
  category?: string;
  direction?: "debit" | "credit";
  minAmount?: number;
  maxAmount?: number;
}

const getRecentTransactions: ToolDefinition<RecentTxArgs> = {
  name: "get_recent_transactions",
  description:
    "Return the authenticated customer's most recent transactions, most recent first. Supports optional filters (category, direction, amount range). Default limit is 10, max 50.",
  category: "read",
  requiresConfirmation: false,
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {
      limit: { type: "integer", minimum: 1, maximum: 50 },
      category: { type: "string", description: "e.g. groceries, bills, transfer_external" },
      direction: { type: "string", enum: ["debit", "credit"] },
      minAmount: { type: "number", minimum: 0 },
      maxAmount: { type: "number", minimum: 0 },
    },
  },
  async summarize(args) {
    const n = Math.min(Math.max(args.limit ?? 10, 1), 50);
    const parts = [`Show your last ${n} transactions`];
    if (args.category) parts.push(`category=${args.category}`);
    if (args.direction) parts.push(args.direction);
    return parts.join(" · ");
  },
  async execute(args, ctx): Promise<ToolResult> {
    const limit = Math.min(Math.max(args.limit ?? 10, 1), 50);
    const txns = await prisma.transaction.findMany({
      where: {
        customerProfileId: ctx.profileId,
        ...(args.category ? { category: args.category } : {}),
        ...(args.direction ? { direction: args.direction } : {}),
        ...(args.minAmount != null ? { amount: { gte: args.minAmount } } : {}),
        ...(args.maxAmount != null
          ? { amount: { lte: args.maxAmount, ...(args.minAmount != null ? { gte: args.minAmount } : {}) } }
          : {}),
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
    await writeAuditLog({
      actionType: "agent_transactions_search",
      page: "/assistant",
      toolOrFeatureUsed: "ai_assistant.get_recent_transactions",
      actionOutcome: "viewed",
      riskLevel: "low",
      createdByAgent: true,
      inputDataSummary: {
        limit,
        category: args.category ?? null,
        direction: args.direction ?? null,
        minAmount: args.minAmount ?? null,
        maxAmount: args.maxAmount ?? null,
      },
    });
    const rows = txns.map((t) => ({
      id: t.id,
      timestamp: t.timestamp.toISOString(),
      description: t.description,
      merchantOrRecipient: t.merchantOrRecipient,
      amount: t.amount,
      currency: t.currency,
      direction: t.direction,
      category: t.category,
      status: t.status,
    }));
    return {
      ok: true,
      summary: `${rows.length} transaction${rows.length === 1 ? "" : "s"}.`,
      data: rows,
    };
  },
};

// ---------------------------------------------------------------------------
// get_transaction_by_id
// ---------------------------------------------------------------------------

interface TxByIdArgs {
  transactionId: string;
}

const getTransactionById: ToolDefinition<TxByIdArgs> = {
  name: "get_transaction_by_id",
  description: "Fetch a single transaction by its id, only if it belongs to the authenticated customer.",
  category: "read",
  requiresConfirmation: false,
  parameters: {
    type: "object",
    additionalProperties: false,
    required: ["transactionId"],
    properties: {
      transactionId: { type: "string" },
    },
  },
  async summarize(args) {
    return `Look up transaction ${args.transactionId}`;
  },
  async execute(args, ctx): Promise<ToolResult> {
    const tx = await prisma.transaction.findFirst({
      where: { id: args.transactionId, customerProfileId: ctx.profileId },
    });
    if (!tx) {
      return {
        ok: false,
        summary: "I couldn't find that transaction on your account.",
        error: "not_found_or_not_owned",
      };
    }
    await writeAuditLog({
      actionType: "agent_transaction_lookup",
      page: "/assistant",
      toolOrFeatureUsed: "ai_assistant.get_transaction_by_id",
      actionOutcome: "viewed",
      riskLevel: "low",
      createdByAgent: true,
      targetResource: tx.id,
    });
    return {
      ok: true,
      summary: `${tx.description} on ${tx.timestamp.toDateString()} for ${fmtNis(tx.amount)}.`,
      data: {
        id: tx.id,
        timestamp: tx.timestamp.toISOString(),
        description: tx.description,
        merchantOrRecipient: tx.merchantOrRecipient,
        amount: tx.amount,
        currency: tx.currency,
        direction: tx.direction,
        category: tx.category,
        status: tx.status,
      },
    };
  },
};

// ---------------------------------------------------------------------------
// get_spending_summary
// ---------------------------------------------------------------------------

interface SpendArgs {
  month?: string; // YYYY-MM
  category?: string;
}

const getSpendingSummary: ToolDefinition<SpendArgs> = {
  name: "get_spending_summary",
  description:
    "Summarize the authenticated customer's spending. If 'month' is given (YYYY-MM), restrict to that month; otherwise use the current calendar month. Optionally filter to a single category.",
  category: "read",
  requiresConfirmation: false,
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {
      month: {
        type: "string",
        pattern: "^\\d{4}-\\d{2}$",
        description: "Month in YYYY-MM format",
      },
      category: { type: "string" },
    },
  },
  async summarize(args) {
    const scope = args.month ? `for ${args.month}` : "for this month";
    return `Summarize your spending ${scope}${args.category ? ` (category=${args.category})` : ""}`;
  },
  async execute(args, ctx): Promise<ToolResult> {
    const now = new Date();
    let start: Date;
    let end: Date;
    if (args.month) {
      const [y, m] = args.month.split("-").map(Number);
      start = new Date(Date.UTC(y, m - 1, 1));
      end = new Date(Date.UTC(y, m, 1));
    } else {
      start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
      end = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));
    }
    const txns = await prisma.transaction.findMany({
      where: {
        customerProfileId: ctx.profileId,
        direction: "debit",
        status: "posted",
        timestamp: { gte: start, lt: end },
        ...(args.category ? { category: args.category } : {}),
      },
    });
    const byCategory = new Map<string, { total: number; count: number }>();
    let grandTotal = 0;
    for (const t of txns) {
      grandTotal += t.amount;
      const row = byCategory.get(t.category) ?? { total: 0, count: 0 };
      row.total += t.amount;
      row.count += 1;
      byCategory.set(t.category, row);
    }
    const sorted = [...byCategory.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .map(([category, v]) => ({ category, total: v.total, count: v.count }));
    await writeAuditLog({
      actionType: "agent_spending_summary",
      page: "/assistant",
      toolOrFeatureUsed: "ai_assistant.get_spending_summary",
      actionOutcome: "viewed",
      riskLevel: "low",
      createdByAgent: true,
      inputDataSummary: { month: args.month ?? null, category: args.category ?? null },
    });
    const monthLabel = start.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    if (grandTotal === 0) {
      return {
        ok: true,
        summary: `No spending recorded in ${monthLabel}${args.category ? ` for ${args.category}` : ""}.`,
        data: { month: monthLabel, total: 0, byCategory: [] },
      };
    }
    const top = sorted[0];
    return {
      ok: true,
      summary: `${fmtNis(grandTotal)} spent in ${monthLabel}. Top category: ${top.category} (${fmtNis(top.total)}).`,
      data: { month: monthLabel, total: grandTotal, byCategory: sorted },
    };
  },
};

// ---------------------------------------------------------------------------
// get_saved_recipients
// ---------------------------------------------------------------------------

const getSavedRecipients: ToolDefinition = {
  name: "get_saved_recipients",
  description:
    "Return the authenticated customer's saved transfer recipients (names + masked account numbers). Derived from the customer's past external-transfer counterparties.",
  category: "read",
  requiresConfirmation: false,
  parameters: { type: "object", additionalProperties: false, properties: {} },
  async summarize() {
    return "Show your saved recipients";
  },
  async execute(_args, ctx): Promise<ToolResult> {
    // Derive from the customer's own transaction history — never touch other users.
    const rows = await prisma.transaction.groupBy({
      by: ["merchantOrRecipient"],
      where: {
        customerProfileId: ctx.profileId,
        category: { in: ["transfer_external", "transfer"] },
        direction: "debit",
      },
      _count: { _all: true },
      orderBy: { _count: { merchantOrRecipient: "desc" } },
      take: 15,
    });
    await writeAuditLog({
      actionType: "agent_recipients_read",
      page: "/assistant",
      toolOrFeatureUsed: "ai_assistant.get_saved_recipients",
      actionOutcome: "viewed",
      riskLevel: "low",
      createdByAgent: true,
      inputDataSummary: { count: rows.length },
    });
    const data = rows.map((r) => ({ name: r.merchantOrRecipient, transferCount: r._count._all }));
    return {
      ok: true,
      summary: rows.length
        ? `Top recipients: ${rows.slice(0, 3).map((r) => r.merchantOrRecipient).join(", ")}${rows.length > 3 ? "…" : ""}`
        : "No saved recipients yet.",
      data,
    };
  },
};

// ---------------------------------------------------------------------------
// get_monthly_statement (marked as needing confirmation — treated as document export)
// ---------------------------------------------------------------------------

interface StatementArgs {
  month: string; // YYYY-MM
}

const getMonthlyStatement: ToolDefinition<StatementArgs> = {
  name: "get_monthly_statement",
  description:
    "Download the customer's monthly statement for the given month (YYYY-MM). Because this exports sensitive account data, it requires explicit confirmation.",
  category: "document_export",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    additionalProperties: false,
    required: ["month"],
    properties: {
      month: { type: "string", pattern: "^\\d{4}-\\d{2}$" },
    },
  },
  async summarize(args) {
    return `Download your monthly statement for ${args.month}`;
  },
  async execute(args, ctx): Promise<ToolResult> {
    const [y, m] = args.month.split("-").map(Number);
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 1));
    const [account, doc, txns] = await Promise.all([
      prisma.bankAccount.findFirst({
        where: { customerProfileId: ctx.profileId, accountType: "checking" },
      }),
      prisma.document.findFirst({
        where: {
          customerProfileId: ctx.profileId,
          periodStart: { gte: start, lt: end },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.transaction.count({
        where: {
          customerProfileId: ctx.profileId,
          timestamp: { gte: start, lt: end },
        },
      }),
    ]);
    if (!account) {
      return { ok: false, summary: "No checking account on file.", error: "no_checking_account" };
    }
    await writeAuditLog({
      actionType: "agent_statement_downloaded",
      page: "/assistant",
      toolOrFeatureUsed: "ai_assistant.get_monthly_statement",
      actionOutcome: "downloaded",
      riskLevel: "medium",
      createdByAgent: true,
      targetResource: doc?.id ?? `statement_${args.month}`,
      inputDataSummary: { period: args.month, type: "monthly_statement" },
    });
    return {
      ok: true,
      summary: `Prepared statement for ${args.month} (${txns} transaction${txns === 1 ? "" : "s"}). A download link is shown below.`,
      data: {
        month: args.month,
        accountNumberMasked: account.accountNumberMasked,
        transactionCount: txns,
        downloadUrl: `/documents?statement=${args.month}`,
      },
    };
  },
};

// ---------------------------------------------------------------------------

export const readTools: ToolDefinition[] = [
  getAccountBalance as unknown as ToolDefinition,
  getRecentTransactions as unknown as ToolDefinition,
  getTransactionById as unknown as ToolDefinition,
  getSpendingSummary as unknown as ToolDefinition,
  getSavedRecipients,
  getMonthlyStatement as unknown as ToolDefinition,
];

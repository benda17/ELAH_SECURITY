import { prisma } from "./prisma";

/**
 * All Prisma aggregation queries used by the dashboard.
 * Pure read-only: this dashboard never writes to the banking app's DB.
 */

export async function getStatsOverview() {
  const [
    auditTotal,
    transactionTotal,
    userTotal,
    customerTotal,
    riskEventTotal,
    flaggedAudit,
    loanTotal,
    supportTotal,
  ] = await Promise.all([
    prisma.auditLog.count(),
    prisma.transaction.count(),
    prisma.user.count(),
    prisma.customerProfile.count(),
    prisma.riskEvent.count(),
    prisma.auditLog.count({
      where: { riskLevel: { in: ["medium", "high", "critical"] } },
    }),
    prisma.loanRequest.count(),
    prisma.supportTicket.count(),
  ]);

  const txAgg = await prisma.transaction.groupBy({
    by: ["direction"],
    _sum: { amount: true },
    _count: { _all: true },
  });

  let creditTotal = 0;
  let debitTotal = 0;
  for (const row of txAgg) {
    if (row.direction === "credit") creditTotal = row._sum.amount ?? 0;
    if (row.direction === "debit") debitTotal = row._sum.amount ?? 0;
  }

  return {
    auditTotal,
    transactionTotal,
    userTotal,
    customerTotal,
    riskEventTotal,
    flaggedAudit,
    loanTotal,
    supportTotal,
    creditTotal,
    debitTotal,
  };
}

/** Audit log entries per calendar day (last 14 days) */
export async function getActionsByDay(daysBack = 14) {
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  const rows = await prisma.auditLog.findMany({
    where: { timestamp: { gte: since } },
    select: { timestamp: true, riskLevel: true },
  });

  const buckets = new Map<string, { low: number; medium: number; high: number; critical: number }>();
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { low: 0, medium: 0, high: 0, critical: 0 });
  }
  for (const r of rows) {
    const key = r.timestamp.toISOString().slice(0, 10);
    const slot = buckets.get(key);
    if (!slot) continue;
    if (r.riskLevel === "medium") slot.medium++;
    else if (r.riskLevel === "high") slot.high++;
    else if (r.riskLevel === "critical") slot.critical++;
    else slot.low++;
  }
  return Array.from(buckets.entries()).map(([date, v]) => ({
    date,
    label: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    ...v,
    total: v.low + v.medium + v.high + v.critical,
  }));
}

/** Top action types overall */
export async function getTopActionTypes(limit = 12) {
  const rows = await prisma.auditLog.groupBy({
    by: ["actionType"],
    _count: { _all: true },
    orderBy: { _count: { actionType: "desc" } },
    take: limit,
  });
  return rows.map((r) => ({ actionType: r.actionType, count: r._count._all }));
}

/** Distribution of risk levels */
export async function getRiskDistribution() {
  const rows = await prisma.auditLog.groupBy({
    by: ["riskLevel"],
    _count: { _all: true },
  });
  const order = ["low", "medium", "high", "critical"] as const;
  return order.map((lvl) => ({
    riskLevel: lvl,
    count: rows.find((r) => r.riskLevel === lvl)?._count._all ?? 0,
  }));
}

/** Audit actions per customer (customer actors only) */
export async function getActionsPerCustomer() {
  const rows = await prisma.auditLog.groupBy({
    by: ["actorName", "customerTier"],
    _count: { _all: true },
    where: { actorType: "customer" },
    orderBy: { _count: { actorName: "desc" } },
  });
  return rows.map((r) => ({
    name: r.actorName ?? "Unknown",
    tier: r.customerTier ?? "?",
    count: r._count._all,
  }));
}

/** Transaction count + sum by category */
export async function getTransactionsByCategory() {
  const rows = await prisma.transaction.groupBy({
    by: ["category"],
    _count: { _all: true },
    _sum: { amount: true },
    orderBy: { _count: { category: "desc" } },
  });
  return rows.map((r) => ({
    category: r.category,
    count: r._count._all,
    total: r._sum.amount ?? 0,
  }));
}

/** Daily transaction volume split by direction */
export async function getTransactionVolumeByDay(daysBack = 14) {
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  const rows = await prisma.transaction.findMany({
    where: { timestamp: { gte: since } },
    select: { timestamp: true, amount: true, direction: true },
  });

  const buckets = new Map<string, { debit: number; credit: number; debitCount: number; creditCount: number }>();
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { debit: 0, credit: 0, debitCount: 0, creditCount: 0 });
  }
  for (const r of rows) {
    const key = r.timestamp.toISOString().slice(0, 10);
    const slot = buckets.get(key);
    if (!slot) continue;
    if (r.direction === "debit") {
      slot.debit += r.amount;
      slot.debitCount++;
    } else {
      slot.credit += r.amount;
      slot.creditCount++;
    }
  }
  return Array.from(buckets.entries()).map(([date, v]) => ({
    date,
    label: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    ...v,
  }));
}

/** Top merchants by debit spend */
export async function getTopMerchants(limit = 8) {
  const rows = await prisma.transaction.groupBy({
    by: ["merchantOrRecipient"],
    where: { direction: "debit" },
    _sum: { amount: true },
    _count: { _all: true },
    orderBy: { _sum: { amount: "desc" } },
    take: limit,
  });
  return rows.map((r) => ({
    merchant: r.merchantOrRecipient,
    total: r._sum.amount ?? 0,
    count: r._count._all,
  }));
}

/** Most recent audit entries for an activity feed */
export async function getRecentActivity(limit = 12) {
  const rows = await prisma.auditLog.findMany({
    orderBy: { timestamp: "desc" },
    take: limit,
    select: {
      id: true,
      timestamp: true,
      actorName: true,
      actorType: true,
      actionType: true,
      page: true,
      amount: true,
      riskLevel: true,
      actionOutcome: true,
    },
  });
  return rows.map((r) => ({
    ...r,
    timestamp: r.timestamp.toISOString(),
  }));
}

/** Recent risk events for the events panel */
export async function getRecentRiskEvents(limit = 5) {
  const rows = await prisma.riskEvent.findMany({
    orderBy: { timestamp: "desc" },
    take: limit,
    select: {
      id: true,
      timestamp: true,
      severity: true,
      eventType: true,
      reasonForFlagging: true,
      reviewStatus: true,
    },
  });
  return rows.map((r) => ({ ...r, timestamp: r.timestamp.toISOString() }));
}

/** Hour-of-day heatmap data (0..23) */
export async function getActionsByHour() {
  const rows = await prisma.auditLog.findMany({
    select: { timestamp: true },
  });
  const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
  for (const r of rows) {
    buckets[r.timestamp.getHours()].count++;
  }
  return buckets;
}

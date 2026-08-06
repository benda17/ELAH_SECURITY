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

/** Audit activity by day-of-week (Mon..Sun) */
export async function getWeekdayActivity() {
  const rows = await prisma.auditLog.findMany({ select: { timestamp: true } });
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const r of rows) {
    const js = r.timestamp.getDay(); // 0=Sun..6=Sat
    const idx = (js + 6) % 7; // Mon=0..Sun=6
    counts[idx]++;
  }
  return labels.map((label, i) => ({ label, count: counts[i] }));
}

/** Customer count by tier */
export async function getTierDistribution() {
  const rows = await prisma.customerProfile.groupBy({
    by: ["tier"],
    _count: { _all: true },
  });
  const order = ["basic", "premium", "vip"] as const;
  return order.map((tier) => ({
    tier,
    count: rows.find((r) => r.tier === tier)?._count._all ?? 0,
  }));
}

/** Total balance by account type (active accounts only) */
export async function getBalancesByAccountType() {
  const rows = await prisma.bankAccount.groupBy({
    by: ["accountType"],
    where: { status: "active" },
    _sum: { currentBalance: true },
    _count: { _all: true },
  });
  return rows
    .map((r) => ({
      accountType: r.accountType,
      total: r._sum.currentBalance ?? 0,
      count: r._count._all,
    }))
    .sort((a, b) => b.total - a.total);
}

/** Top customers by total debit (= spend) */
export async function getTopCustomersBySpend(limit = 20) {
  const rows = await prisma.transaction.groupBy({
    by: ["customerProfileId"],
    where: { direction: "debit" },
    _sum: { amount: true },
    _count: { _all: true },
    orderBy: { _sum: { amount: "desc" } },
    take: limit,
  });
  if (rows.length === 0) return [];
  const profiles = await prisma.customerProfile.findMany({
    where: { id: { in: rows.map((r) => r.customerProfileId) } },
    select: { id: true, fullName: true, tier: true },
  });
  const byId = new Map(profiles.map((p) => [p.id, p]));
  return rows.map((r) => {
    const p = byId.get(r.customerProfileId);
    return {
      name: p?.fullName ?? "Unknown",
      tier: p?.tier ?? "?",
      total: r._sum.amount ?? 0,
      count: r._count._all,
    };
  });
}

/** Per-tier averages: balance, transactions, audit actions */
export async function getTierComparison() {
  const tiers = await prisma.customerProfile.groupBy({
    by: ["tier"],
    _count: { _all: true },
  });

  const result: {
    tier: string;
    customers: number;
    avgBalance: number;
    avgTxCount: number;
    avgActions: number;
  }[] = [];

  for (const t of tiers) {
    const profiles = await prisma.customerProfile.findMany({
      where: { tier: t.tier },
      include: {
        accounts: { select: { currentBalance: true } },
        _count: { select: { transactions: true } },
      },
    });
    const totalBal = profiles.reduce(
      (s, p) => s + p.accounts.reduce((bs, a) => bs + a.currentBalance, 0),
      0,
    );
    const totalTx = profiles.reduce((s, p) => s + p._count.transactions, 0);

    const auditCounts = await prisma.auditLog.count({
      where: {
        customerTier: t.tier,
        actorType: "customer",
      },
    });
    const customers = t._count._all || 1;

    result.push({
      tier: t.tier,
      customers,
      avgBalance: totalBal / customers,
      avgTxCount: totalTx / customers,
      avgActions: auditCounts / customers,
    });
  }

  // Sort basic→premium→vip
  const order = ["basic", "premium", "vip"];
  return result.sort((a, b) => order.indexOf(a.tier) - order.indexOf(b.tier));
}

// -------------------- AI Assistant metrics --------------------

export async function getAssistantStatsOverview() {
  const [
    eventTotal,
    conversationTotal,
    messageTotal,
    toolExecutions,
    toolFailures,
    securityEvents,
    pendingActions,
    flaggedConversations,
    uniqueUsers,
  ] = await Promise.all([
    prisma.agentEventLog.count(),
    prisma.agentConversation.count(),
    prisma.agentMessage.count(),
    prisma.agentEventLog.count({ where: { eventType: "tool_call_executed" } }),
    prisma.agentEventLog.count({ where: { eventType: "tool_call_failed" } }),
    prisma.agentEventLog.count({
      where: {
        eventType: {
          in: [
            "suspicious_prompt_detected",
            "unauthorized_access_attempt",
            "policy_check_failed",
            "agent_error",
          ],
        },
      },
    }),
    prisma.agentPendingAction.count({ where: { status: "pending" } }),
    prisma.agentConversation.count({ where: { status: "flagged" } }),
    prisma.agentEventLog.groupBy({
      by: ["userId"],
      where: { userId: { not: null } },
    }),
  ]);

  return {
    eventTotal,
    conversationTotal,
    messageTotal,
    toolExecutions,
    toolFailures,
    securityEvents,
    pendingActions,
    flaggedConversations,
    uniqueUsers: uniqueUsers.length,
  };
}

/** Assistant events per day (last N days), split by category */
export async function getAssistantEventsByDay(daysBack = 14) {
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  const rows = await prisma.agentEventLog.findMany({
    where: { timestamp: { gte: since } },
    select: { timestamp: true, eventType: true },
  });

  const securityTypes = new Set([
    "suspicious_prompt_detected",
    "unauthorized_access_attempt",
    "policy_check_failed",
    "agent_error",
  ]);
  const toolTypes = new Set([
    "tool_call_executed",
    "tool_call_failed",
    "tool_call_requested",
  ]);

  const buckets = new Map<
    string,
    { tools: number; security: number; other: number }
  >();
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { tools: 0, security: 0, other: 0 });
  }

  for (const r of rows) {
    const key = r.timestamp.toISOString().slice(0, 10);
    const slot = buckets.get(key);
    if (!slot) continue;
    if (securityTypes.has(r.eventType)) slot.security++;
    else if (toolTypes.has(r.eventType)) slot.tools++;
    else slot.other++;
  }

  return Array.from(buckets.entries()).map(([date, v]) => ({
    date,
    label: new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    ...v,
    total: v.tools + v.security + v.other,
  }));
}

/** Top assistant event types */
export async function getAssistantEventsByType(limit = 12) {
  const rows = await prisma.agentEventLog.groupBy({
    by: ["eventType"],
    _count: { _all: true },
    orderBy: { _count: { eventType: "desc" } },
    take: limit,
  });
  return rows.map((r) => ({
    eventType: r.eventType,
    count: r._count._all,
  }));
}

/** Most-used assistant tools (executed + failed) */
export async function getAssistantTopTools(limit = 10) {
  const rows = await prisma.agentEventLog.groupBy({
    by: ["toolName"],
    _count: { _all: true },
    where: {
      toolName: { not: null },
      eventType: { in: ["tool_call_executed", "tool_call_failed", "tool_call_requested"] },
    },
    orderBy: { _count: { toolName: "desc" } },
    take: limit,
  });
  return rows
    .filter((r) => r.toolName)
    .map((r) => ({
      toolName: r.toolName!.replace(/_/g, " "),
      count: r._count._all,
    }));
}

/** Policy decision breakdown */
export async function getAssistantPolicyDecisions() {
  const rows = await prisma.agentEventLog.groupBy({
    by: ["policyDecision"],
    _count: { _all: true },
    where: { policyDecision: { not: null } },
  });
  const order = ["allow", "needs_confirmation", "deny"] as const;
  return order.map((decision) => ({
    decision,
    count: rows.find((r) => r.policyDecision === decision)?._count._all ?? 0,
  }));
}

/** Assistant activity per customer user */
export async function getAssistantEventsPerUser(limit = 15) {
  const rows = await prisma.agentEventLog.groupBy({
    by: ["userId"],
    _count: { _all: true },
    where: { userId: { not: null } },
    orderBy: { _count: { userId: "desc" } },
    take: limit,
  });
  if (rows.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: rows.map((r) => r.userId!).filter(Boolean) } },
    select: {
      id: true,
      name: true,
      customerProfile: { select: { tier: true } },
    },
  });
  const byId = new Map(users.map((u) => [u.id, u]));

  return rows.map((r) => {
    const u = byId.get(r.userId!);
    return {
      name: u?.name ?? "Unknown",
      tier: u?.customerProfile?.tier ?? "?",
      count: r._count._all,
    };
  });
}

/** Recent in-app assistant events */
export async function getRecentAssistantEvents(limit = 12) {
  const rows = await prisma.agentEventLog.findMany({
    orderBy: { timestamp: "desc" },
    take: limit,
    select: {
      id: true,
      timestamp: true,
      eventType: true,
      userId: true,
      toolName: true,
      userMessage: true,
      resultSummary: true,
      policyDecision: true,
      riskScore: true,
    },
  });

  const userIds = [...new Set(rows.map((r) => r.userId).filter(Boolean))] as string[];
  const users =
    userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true },
        })
      : [];
  const byId = new Map(users.map((u) => [u.id, u.name]));

  return rows.map((r) => ({
    ...r,
    userName: r.userId ? byId.get(r.userId) ?? "Unknown" : "—",
    timestamp: r.timestamp.toISOString(),
  }));
}

/** Conversation status breakdown */
export async function getAssistantConversationStatus() {
  const rows = await prisma.agentConversation.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const order = ["active", "flagged", "closed"] as const;
  return order.map((status) => ({
    status,
    count: rows.find((r) => r.status === status)?._count._all ?? 0,
  }));
}

const ASSISTANT_SECURITY_EVENT_TYPES = [
  "suspicious_prompt_detected",
  "policy_check_failed",
  "unauthorized_access_attempt",
  "agent_error",
] as const;

function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

function riskBand(score: number | null | undefined): "low" | "medium" | "high" | "critical" {
  if (score == null) return "low";
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

/** Security-related assistant events per day, stacked by type */
export async function getAssistantSecurityRisksOverTime(daysBack = 14) {
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  const rows = await prisma.agentEventLog.findMany({
    where: {
      timestamp: { gte: since },
      eventType: { in: [...ASSISTANT_SECURITY_EVENT_TYPES] },
    },
    select: { timestamp: true, eventType: true },
  });

  const buckets = new Map<
    string,
    {
      suspicious_prompt: number;
      policy_failed: number;
      unauthorized: number;
      agent_error: number;
    }
  >();

  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    buckets.set(d.toISOString().slice(0, 10), {
      suspicious_prompt: 0,
      policy_failed: 0,
      unauthorized: 0,
      agent_error: 0,
    });
  }

  for (const r of rows) {
    const key = r.timestamp.toISOString().slice(0, 10);
    const slot = buckets.get(key);
    if (!slot) continue;
    switch (r.eventType) {
      case "suspicious_prompt_detected":
        slot.suspicious_prompt++;
        break;
      case "policy_check_failed":
        slot.policy_failed++;
        break;
      case "unauthorized_access_attempt":
        slot.unauthorized++;
        break;
      case "agent_error":
        slot.agent_error++;
        break;
    }
  }

  return Array.from(buckets.entries()).map(([date, v]) => ({
    date,
    label: new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    ...v,
    total: v.suspicious_prompt + v.policy_failed + v.unauthorized + v.agent_error,
  }));
}

/** Top injection / policy detection labels from assistant security events */
export async function getAssistantSecurityRiskReasons(limit = 10) {
  const rows = await prisma.agentEventLog.findMany({
    where: { eventType: { in: [...ASSISTANT_SECURITY_EVENT_TYPES] } },
    select: { policyReasons: true, eventType: true, resultSummary: true },
  });

  const counts = new Map<string, number>();
  for (const row of rows) {
    const reasons = parseJsonArray(row.policyReasons);
    if (reasons.length > 0) {
      for (const reason of reasons) {
        counts.set(reason, (counts.get(reason) ?? 0) + 1);
      }
    } else if (row.resultSummary) {
      counts.set(row.resultSummary, (counts.get(row.resultSummary) ?? 0) + 1);
    } else {
      counts.set(row.eventType, (counts.get(row.eventType) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

/** Risk score bands for assistant-documented security events */
export async function getAssistantSecurityRiskScores() {
  const rows = await prisma.agentEventLog.findMany({
    where: { eventType: { in: [...ASSISTANT_SECURITY_EVENT_TYPES] } },
    select: { riskScore: true },
  });

  const bands = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const r of rows) {
    bands[riskBand(r.riskScore)]++;
  }

  return (["low", "medium", "high", "critical"] as const).map((band) => ({
    band,
    count: bands[band],
  }));
}

function parseIntentJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function getIntentMatrixOverview(daysBack = 14) {
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  const where = { timestamp: { gte: since } };
  const [events, totalEventCount, seeds, aggregates] = await Promise.all([
    prisma.agentIntentEvent.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: 3000,
    }),
    prisma.agentIntentEvent.count({ where }),
    prisma.intentMatrixSeed.findMany({ orderBy: { intentId: "asc" } }),
    prisma.agentIntentAggregate.findMany({
      where: { dateBucket: { gte: since.toISOString().slice(0, 10) }, userId: "__global__" },
    }),
  ]);

  const distribution = new Map<string, number>();
  const heatmap = new Map<string, number>();
  for (const e of events) {
    distribution.set(e.intentId, (distribution.get(e.intentId) ?? 0) + 1);
    const key = `${e.intentId}:${e.riskLevel}`;
    heatmap.set(key, (heatmap.get(key) ?? 0) + 1);
  }

  const baseline = new Map(seeds.map((s) => [s.intentId, s.baselineWeight]));

  return {
    totalEventCount,
    displayedPointCount: events.length,
    uniqueIntentTypes: distribution.size,
    points: events.map((e) => ({
      id: e.id,
      x: e.x,
      y: e.y,
      z: e.z,
      riskLevel: e.riskLevel,
      actionStatus: e.actionStatus,
      intentId: e.intentId,
      intentLabel: e.intentLabel,
      userId: e.userId,
      timestamp: e.timestamp.toISOString(),
      messageSnippet: e.rawUserMessage.slice(0, 80),
      toolName: e.toolName,
      policyDecision: e.policyDecision,
    })),
    distribution: [...distribution.entries()]
      .map(([intentId, count]) => ({
        intentId,
        count,
        baselineWeight: baseline.get(intentId) ?? 0,
        label: seeds.find((s) => s.intentId === intentId)?.label ?? intentId,
      }))
      .sort((a, b) => b.count - a.count),
    heatmap: [...heatmap.entries()].map(([key, count]) => {
      const [intentId, riskLevel] = key.split(":");
      return { intentId, riskLevel, count };
    }),
    taxonomy: seeds.map((s) => ({
      intentId: s.intentId,
      label: s.label,
      baselineWeight: s.baselineWeight,
      x: s.x,
      y: s.y,
      z: s.z,
    })),
    aggregates,
    security: {
      injections: events.filter((e) => e.intentId === "unsafe_prompt_injection"),
      blocked: events.filter((e) => e.actionStatus === "blocked"),
      highRiskUnconfirmed: events.filter(
        (e) =>
          e.requiresConfirmation &&
          e.riskLevel === "high" &&
          e.actionStatus === "executed" &&
          e.policyDecision === "allow",
      ),
      failed: events.filter((e) => e.actionStatus === "failed"),
    },
  };
}

export async function getIntentUserBehavior(daysBack = 14) {
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  const rows = await prisma.agentIntentEvent.findMany({
    where: { timestamp: { gte: since } },
    select: {
      userId: true,
      intentId: true,
      riskLevel: true,
      actionStatus: true,
      timestamp: true,
    },
    orderBy: { timestamp: "desc" },
  });

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
  });
  const userNames = new Map(users.map((u) => [u.id, u.name]));

  const byUser = new Map<
    string,
    {
      intents: Map<string, number>;
      riskSum: number;
      count: number;
      confirmed: number;
      blocked: number;
      lastActivity: Date;
    }
  >();

  for (const row of rows) {
    let slot = byUser.get(row.userId);
    if (!slot) {
      slot = {
        intents: new Map(),
        riskSum: 0,
        count: 0,
        confirmed: 0,
        blocked: 0,
        lastActivity: row.timestamp,
      };
      byUser.set(row.userId, slot);
    }
    slot.count++;
    slot.intents.set(row.intentId, (slot.intents.get(row.intentId) ?? 0) + 1);
    slot.riskSum +=
      row.riskLevel === "critical"
        ? 4
        : row.riskLevel === "high"
          ? 3
          : row.riskLevel === "medium"
            ? 2
            : 1;
    if (row.actionStatus === "confirmed" || row.actionStatus === "executed") {
      slot.confirmed++;
    }
    if (row.actionStatus === "blocked") slot.blocked++;
    if (row.timestamp > slot.lastActivity) slot.lastActivity = row.timestamp;
  }

  return [...byUser.entries()]
    .map(([userId, slot]) => ({
      userId,
      userName: userNames.get(userId) ?? userId,
      mostCommonIntent:
        [...slot.intents.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—",
      avgRisk: slot.count ? slot.riskSum / slot.count : 0,
      confirmedActions: slot.confirmed,
      blockedActions: slot.blocked,
      lastActivity: slot.lastActivity.toISOString(),
      messageCount: slot.count,
    }))
    .sort((a, b) => b.messageCount - a.messageCount);
}

export async function getIntentSecurityPanel(daysBack = 14) {
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  const rows = await prisma.agentIntentEvent.findMany({
    where: { timestamp: { gte: since } },
    orderBy: { timestamp: "desc" },
    take: 200,
  });

  return {
    promptInjectionAttempts: rows
      .filter((r) => r.intentId === "unsafe_prompt_injection")
      .map((r) => ({
        id: r.id,
        userId: r.userId,
        timestamp: r.timestamp.toISOString(),
        message: r.rawUserMessage.slice(0, 120),
        patterns: parseIntentJson<string[]>(r.suspiciousPatterns, []),
      })),
    blockedToolCalls: rows
      .filter((r) => r.actionStatus === "blocked" && r.toolName)
      .map((r) => ({
        id: r.id,
        userId: r.userId,
        toolName: r.toolName,
        policyDecision: r.policyDecision,
        timestamp: r.timestamp.toISOString(),
      })),
    highRiskWithoutConfirmation: rows.filter(
      (r) =>
        r.requiresConfirmation &&
        (r.riskLevel === "high" || r.riskLevel === "critical") &&
        r.actionStatus === "executed" &&
        r.policyDecision === "allow",
    ),
    failedConfirmations: rows.filter((r) => r.actionStatus === "failed"),
  };
}

// -------------------- ELAH Training Dataset --------------------

export type TrainingDatasetFilters = {
  finalIntent?: string;
  labelSource?: string;
  actionOutcome?: string;
  minScore?: number;
  maxScore?: number;
  daysBack?: number;
};

export async function getTrainingDatasetOverview(filters: TrainingDatasetFilters = {}) {
  const daysBack = filters.daysBack ?? 30;
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  const where = {
    createdAt: { gte: since },
    ...(filters.finalIntent ? { finalIntent: filters.finalIntent } : {}),
    ...(filters.labelSource ? { labelSource: filters.labelSource } : {}),
    ...(filters.actionOutcome ? { actionOutcome: filters.actionOutcome } : {}),
    ...(filters.minScore != null || filters.maxScore != null
      ? {
          elahScoreLabel: {
            ...(filters.minScore != null ? { gte: filters.minScore } : {}),
            ...(filters.maxScore != null ? { lte: filters.maxScore } : {}),
          },
        }
      : {}),
  };

  const [total, byIntent, byLabelSource, scoreAgg, recent] = await Promise.all([
    prisma.elahTrainingEvent.count({ where }),
    prisma.elahTrainingEvent.groupBy({
      by: ["finalIntent"],
      where,
      _count: { _all: true },
      orderBy: { _count: { finalIntent: "desc" } },
    }),
    prisma.elahTrainingEvent.groupBy({
      by: ["labelSource"],
      where,
      _count: { _all: true },
    }),
    prisma.elahTrainingEvent.aggregate({
      where,
      _avg: { elahScoreLabel: true },
      _min: { elahScoreLabel: true },
      _max: { elahScoreLabel: true },
    }),
    prisma.elahTrainingEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        createdAt: true,
        userQuestion: true,
        assistantAnswer: true,
        finalIntent: true,
        elahScoreLabel: true,
        humanAgency: true,
        financialRisk: true,
        emotionalUrgency: true,
        plannedTool: true,
        actionOutcome: true,
        labelSource: true,
      },
    }),
  ]);

  return {
    total,
    avgScore: scoreAgg._avg.elahScoreLabel ?? 0,
    minScore: scoreAgg._min.elahScoreLabel ?? 0,
    maxScore: scoreAgg._max.elahScoreLabel ?? 0,
    byIntent: byIntent.map((r) => ({
      finalIntent: r.finalIntent,
      count: r._count._all,
    })),
    byLabelSource: byLabelSource.map((r) => ({
      labelSource: r.labelSource,
      count: r._count._all,
    })),
    recent: recent.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

/** Paginated agent event log for banking admin */
export async function getAgentEventLogs(limit = 100) {
  const rows = await prisma.agentEventLog.findMany({
    orderBy: { timestamp: "desc" },
    take: limit,
    select: {
      id: true,
      timestamp: true,
      eventType: true,
      userId: true,
      conversationId: true,
      toolName: true,
      userMessage: true,
      assistantMessage: true,
      policyDecision: true,
      policyReasons: true,
      riskScore: true,
      resultSummary: true,
      latencyMs: true,
    },
  });

  const userIds = [...new Set(rows.map((r) => r.userId).filter(Boolean))] as string[];
  const users =
    userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
  const byId = new Map(users.map((u) => [u.id, u]));

  return rows.map((r) => ({
    ...r,
    userName: r.userId ? byId.get(r.userId)?.name ?? "Unknown" : "—",
    userEmail: r.userId ? byId.get(r.userId)?.email ?? "" : "",
    timestamp: r.timestamp.toISOString(),
  }));
}

/** Banking customers with assistant activity summary */
export async function getBankingUsersWithAssistantStats(limit = 50) {
  const customers = await prisma.user.findMany({
    where: {
      role: { in: ["regular_customer", "premium_customer", "vip_customer"] },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      lastLoginAt: true,
      customerProfile: { select: { tier: true, customerNumber: true } },
      _count: {
        select: {
          agentConversations: true,
          agentPendingActions: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const eventCounts = await prisma.agentEventLog.groupBy({
    by: ["userId"],
    _count: { _all: true },
    where: { userId: { in: customers.map((c) => c.id) } },
  });
  const eventsByUser = new Map(
    eventCounts.map((r) => [r.userId, r._count._all]),
  );

  return customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    role: c.role,
    status: c.status,
    tier: c.customerProfile?.tier ?? "—",
    customerNumber: c.customerProfile?.customerNumber ?? "—",
    lastLoginAt: c.lastLoginAt?.toISOString() ?? null,
    conversations: c._count.agentConversations,
    pendingActions: c._count.agentPendingActions,
    eventCount: eventsByUser.get(c.id) ?? 0,
  }));
}

/** Pending and recent agent tool actions */
export async function getAgentPendingActions(limit = 50) {
  const rows = await prisma.agentPendingAction.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    actionType: r.actionType,
    toolName: r.toolName,
    summary: r.summary,
    status: r.status,
    userName: r.user.name,
    userEmail: r.user.email,
    conversationId: r.conversationId,
    createdAt: r.createdAt.toISOString(),
    expiresAt: r.expiresAt.toISOString(),
    executedAt: r.executedAt?.toISOString() ?? null,
    resultSummary: r.resultSummary,
  }));
}

/** Recent tool call executions from event log */
export async function getRecentToolCallEvents(limit = 50) {
  const rows = await prisma.agentEventLog.findMany({
    where: {
      eventType: {
        in: ["tool_call_executed", "tool_call_failed", "tool_call_requested"],
      },
    },
    orderBy: { timestamp: "desc" },
    take: limit,
    select: {
      id: true,
      timestamp: true,
      eventType: true,
      userId: true,
      toolName: true,
      policyDecision: true,
      resultSummary: true,
      latencyMs: true,
    },
  });

  const userIds = [...new Set(rows.map((r) => r.userId).filter(Boolean))] as string[];
  const users =
    userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true },
        })
      : [];
  const byId = new Map(users.map((u) => [u.id, u.name]));

  return rows.map((r) => ({
    ...r,
    userName: r.userId ? byId.get(r.userId) ?? "Unknown" : "—",
    timestamp: r.timestamp.toISOString(),
  }));
}

export async function getTrainingFilterOptions() {
  const [intents, sources, outcomes] = await Promise.all([
    prisma.elahTrainingEvent.groupBy({
      by: ["finalIntent"],
      _count: { _all: true },
      orderBy: { _count: { finalIntent: "desc" } },
      take: 30,
    }),
    prisma.elahTrainingEvent.groupBy({
      by: ["labelSource"],
      _count: { _all: true },
    }),
    prisma.elahTrainingEvent.groupBy({
      by: ["actionOutcome"],
      _count: { _all: true },
    }),
  ]);

  return {
    intents: intents.map((r) => r.finalIntent),
    labelSources: sources.map((r) => r.labelSource),
    actionOutcomes: outcomes.map((r) => r.actionOutcome),
  };
}

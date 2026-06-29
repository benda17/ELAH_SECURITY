import "server-only";
import { prisma } from "@/lib/db";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface ActivityBucket {
  /** ISO hour stamp e.g. "2026-05-11T18:00:00Z" */
  hour: string;
  /** Short label e.g. "21:00" */
  label: string;
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface ActorBreakdown {
  actorType: string;
  count: number;
}

export interface ActionBreakdown {
  actionType: string;
  count: number;
}

export interface AnalyticsSnapshot {
  totals: {
    audit: number;
    risk: number;
    agent: number;
    criticalLast24h: number;
    blockedLast24h: number;
    agentLast24h: number;
  };
  timeline: ActivityBucket[];
  riskDistribution: { name: RiskLevel; value: number }[];
  actorBreakdown: ActorBreakdown[];
  topActions: ActionBreakdown[];
  humanVsAgent: { name: string; value: number }[];
  riskByPattern: { pattern: string; count: number }[];
}

const HOURS_WINDOW = 24;

function hourKey(d: Date) {
  const x = new Date(d);
  x.setMinutes(0, 0, 0);
  return x.toISOString();
}

function hourLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export async function getAnalyticsSnapshot(): Promise<AnalyticsSnapshot> {
  const windowStart = new Date(Date.now() - HOURS_WINDOW * 60 * 60 * 1000);

  const [
    auditTotal,
    riskTotal,
    agentTotal,
    recentLogs,
    riskGroup,
    actorGroup,
    actionGroup,
    agentLogs,
    riskEvents,
  ] = await Promise.all([
    prisma.auditLog.count(),
    prisma.riskEvent.count(),
    prisma.agentActionLog.count(),
    prisma.auditLog.findMany({
      where: { timestamp: { gte: windowStart } },
      select: {
        timestamp: true,
        riskLevel: true,
        actorType: true,
        actionType: true,
        createdByAgent: true,
        actionOutcome: true,
      },
      orderBy: { timestamp: "asc" },
    }),
    prisma.auditLog.groupBy({
      by: ["riskLevel"],
      _count: { riskLevel: true },
    }),
    prisma.auditLog.groupBy({
      by: ["actorType"],
      _count: { actorType: true },
      orderBy: { _count: { actorType: "desc" } },
    }),
    prisma.auditLog.groupBy({
      by: ["actionType"],
      _count: { actionType: true },
      orderBy: { _count: { actionType: "desc" } },
      take: 8,
    }),
    prisma.auditLog.groupBy({
      by: ["createdByAgent"],
      _count: { createdByAgent: true },
    }),
    prisma.riskEvent.findMany({
      select: { detectedPattern: true, timestamp: true },
    }),
  ]);

  // ---- 24h hourly timeline ----
  const buckets = new Map<string, ActivityBucket>();
  for (let i = HOURS_WINDOW - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 60 * 60 * 1000);
    const key = hourKey(d);
    buckets.set(key, {
      hour: key,
      label: hourLabel(key),
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    });
  }
  for (const l of recentLogs) {
    const key = hourKey(l.timestamp);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    const lvl = (l.riskLevel as RiskLevel) ?? "low";
    bucket[lvl] += 1;
  }
  const timeline = [...buckets.values()];

  // ---- Risk distribution ----
  const riskDistribution = (["low", "medium", "high", "critical"] as RiskLevel[]).map(
    (lvl) => ({
      name: lvl,
      value:
        riskGroup.find((g) => g.riskLevel === lvl)?._count.riskLevel ?? 0,
    }),
  );

  // ---- Actor breakdown ----
  const actorBreakdown: ActorBreakdown[] = actorGroup.map((g) => ({
    actorType: g.actorType,
    count: g._count.actorType,
  }));

  // ---- Top actions ----
  const topActions: ActionBreakdown[] = actionGroup.map((g) => ({
    actionType: g.actionType,
    count: g._count.actionType,
  }));

  // ---- Human vs agent ----
  let agent = 0;
  let human = 0;
  for (const g of agentLogs) {
    if (g.createdByAgent) agent += g._count.createdByAgent;
    else human += g._count.createdByAgent;
  }
  const humanVsAgent = [
    { name: "Human", value: human },
    { name: "AI agent", value: agent },
  ];

  // ---- Risk by pattern ----
  const patternMap = new Map<string, number>();
  for (const r of riskEvents) {
    const p = r.detectedPattern ?? "uncategorized";
    patternMap.set(p, (patternMap.get(p) ?? 0) + 1);
  }
  const riskByPattern = [...patternMap.entries()]
    .map(([pattern, count]) => ({ pattern, count }))
    .sort((a, b) => b.count - a.count);

  // ---- 24h totals from recent slice ----
  const criticalLast24h = recentLogs.filter(
    (l) => l.riskLevel === "critical",
  ).length;
  const blockedLast24h = recentLogs.filter(
    (l) => l.actionOutcome === "blocked",
  ).length;
  const agentLast24h = recentLogs.filter((l) => l.createdByAgent).length;

  return {
    totals: {
      audit: auditTotal,
      risk: riskTotal,
      agent: agentTotal,
      criticalLast24h,
      blockedLast24h,
      agentLast24h,
    },
    timeline,
    riskDistribution,
    actorBreakdown,
    topActions,
    humanVsAgent,
    riskByPattern,
  };
}

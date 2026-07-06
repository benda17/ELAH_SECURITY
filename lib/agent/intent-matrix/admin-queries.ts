import "server-only";
import { prisma } from "@/lib/db";

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export interface IntentQueryFilters {
  userId?: string;
  intentId?: string;
  riskLevel?: string;
  actionStatus?: string;
  since?: Date;
  until?: Date;
  limit?: number;
}

export function parseIntentFilters(searchParams: URLSearchParams): IntentQueryFilters {
  const sinceRaw = searchParams.get("since");
  const untilRaw = searchParams.get("until");
  return {
    userId: searchParams.get("userId") ?? undefined,
    intentId: searchParams.get("intentId") ?? undefined,
    riskLevel: searchParams.get("riskLevel") ?? undefined,
    actionStatus: searchParams.get("actionStatus") ?? undefined,
    since: sinceRaw ? new Date(sinceRaw) : undefined,
    until: untilRaw ? new Date(untilRaw) : undefined,
    limit: Math.min(Number(searchParams.get("limit") ?? 100), 500),
  };
}

function eventWhere(filters: IntentQueryFilters) {
  return {
    ...(filters.userId ? { userId: filters.userId } : {}),
    ...(filters.intentId ? { intentId: filters.intentId } : {}),
    ...(filters.riskLevel ? { riskLevel: filters.riskLevel } : {}),
    ...(filters.actionStatus ? { actionStatus: filters.actionStatus } : {}),
    ...(filters.since || filters.until
      ? {
          timestamp: {
            ...(filters.since ? { gte: filters.since } : {}),
            ...(filters.until ? { lte: filters.until } : {}),
          },
        }
      : {}),
  };
}

export function serializeIntentEvent(row: {
  id: string;
  timestamp: Date;
  userId: string;
  sessionId: string | null;
  conversationId: string;
  messageId: string;
  rawUserMessage: string;
  normalizedMessage: string;
  intentId: string;
  intentLabel: string;
  confidence: number;
  hVector: string;
  bVector: string;
  sVector: string;
  x: number;
  y: number;
  z: number;
  baselineWeight: number;
  riskLevel: string;
  requiresConfirmation: boolean;
  toolName: string | null;
  toolArgsSanitized: string | null;
  policyDecision: string | null;
  actionStatus: string;
  suspiciousPatterns: string;
  source: string;
  createdAt: Date;
}) {
  return {
    id: row.id,
    timestamp: row.timestamp.toISOString(),
    userId: row.userId,
    sessionId: row.sessionId,
    conversationId: row.conversationId,
    messageId: row.messageId,
    rawUserMessage: row.rawUserMessage,
    normalizedMessage: row.normalizedMessage,
    intentId: row.intentId,
    intentLabel: row.intentLabel,
    confidence: row.confidence,
    H: parseJson<number[]>(row.hVector, []),
    B: parseJson<number[]>(row.bVector, []),
    S: parseJson<number[]>(row.sVector, []),
    x: row.x,
    y: row.y,
    z: row.z,
    baselineWeight: row.baselineWeight,
    riskLevel: row.riskLevel,
    requiresConfirmation: row.requiresConfirmation,
    toolName: row.toolName,
    toolArgsSanitized: parseJson(row.toolArgsSanitized, {}),
    policyDecision: row.policyDecision,
    actionStatus: row.actionStatus,
    suspiciousPatterns: parseJson<string[]>(row.suspiciousPatterns, []),
    source: row.source,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function queryIntentEvents(filters: IntentQueryFilters) {
  const rows = await prisma.agentIntentEvent.findMany({
    where: eventWhere(filters),
    orderBy: { timestamp: "desc" },
    take: filters.limit ?? 100,
  });
  return rows.map(serializeIntentEvent);
}

export async function queryIntentAggregates(filters: IntentQueryFilters) {
  const rows = await prisma.agentIntentAggregate.findMany({
    where: {
      ...(filters.intentId ? { intentId: filters.intentId } : {}),
      ...(filters.userId !== undefined ? { userId: filters.userId } : {}),
      ...(filters.since ? { dateBucket: { gte: filters.since.toISOString().slice(0, 10) } } : {}),
      ...(filters.until ? { dateBucket: { lte: filters.until.toISOString().slice(0, 10) } } : {}),
    },
    orderBy: [{ dateBucket: "desc" }, { count: "desc" }],
    take: filters.limit ?? 200,
  });
  return rows;
}

export async function queryIntentMatrix(filters: IntentQueryFilters) {
  const [events, seeds] = await Promise.all([
    queryIntentEvents(filters),
    prisma.intentMatrixSeed.findMany({ orderBy: { intentId: "asc" } }),
  ]);
  return {
    points: events.map((e) => ({
      id: e.id,
      x: e.x,
      y: e.y,
      z: e.z,
      riskLevel: e.riskLevel,
      actionStatus: e.actionStatus,
      intentId: e.intentId,
      userId: e.userId,
      timestamp: e.timestamp,
      messageSnippet: e.rawUserMessage.slice(0, 80),
      toolName: e.toolName,
      policyDecision: e.policyDecision,
    })),
    taxonomy: seeds.map((s) => ({
      intentId: s.intentId,
      label: s.label,
      baselineWeight: s.baselineWeight,
      x: s.x,
      y: s.y,
      z: s.z,
    })),
  };
}

export async function queryIntentSecurity(filters: IntentQueryFilters) {
  const where = eventWhere(filters);
  const [injections, blocked, highRiskUnconfirmed, failedConfirmations] =
    await Promise.all([
      prisma.agentIntentEvent.findMany({
        where: { ...where, intentId: "unsafe_prompt_injection" },
        orderBy: { timestamp: "desc" },
        take: filters.limit ?? 50,
      }),
      prisma.agentIntentEvent.findMany({
        where: { ...where, actionStatus: "blocked" },
        orderBy: { timestamp: "desc" },
        take: filters.limit ?? 50,
      }),
      prisma.agentIntentEvent.findMany({
        where: {
          ...where,
          requiresConfirmation: true,
          actionStatus: { in: ["executed", "confirmed"] },
          policyDecision: "allow",
          riskLevel: { in: ["high", "critical"] },
        },
        orderBy: { timestamp: "desc" },
        take: 20,
      }),
      prisma.agentIntentEvent.findMany({
        where: { ...where, actionStatus: "failed" },
        orderBy: { timestamp: "desc" },
        take: 20,
      }),
    ]);

  const crossUserAttempts = blocked.filter((row) =>
    parseJson<string[]>(row.suspiciousPatterns, []).some((p) =>
      /user|cross|userid|admin/.test(p),
    ),
  );

  return {
    promptInjectionAttempts: injections.map(serializeIntentEvent),
    crossUserAttempts: crossUserAttempts.map(serializeIntentEvent),
    blockedToolCalls: blocked.filter((r) => r.toolName).map(serializeIntentEvent),
    highRiskWithoutConfirmation: highRiskUnconfirmed.map(serializeIntentEvent),
    repeatedFailedConfirmations: failedConfirmations.map(serializeIntentEvent),
    summary: {
      injectionCount: injections.length,
      blockedCount: blocked.length,
      crossUserCount: crossUserAttempts.length,
      highRiskUnconfirmedCount: highRiskUnconfirmed.length,
      failedConfirmationCount: failedConfirmations.length,
    },
  };
}

export async function queryIntentUserProfile(userId: string, filters: IntentQueryFilters) {
  const events = await prisma.agentIntentEvent.findMany({
    where: eventWhere({ ...filters, userId }),
    orderBy: { timestamp: "desc" },
    take: filters.limit ?? 100,
  });

  const intentCounts = new Map<string, number>();
  let riskSum = 0;
  let confirmed = 0;
  let blocked = 0;
  for (const e of events) {
    intentCounts.set(e.intentId, (intentCounts.get(e.intentId) ?? 0) + 1);
    riskSum +=
      e.riskLevel === "critical"
        ? 4
        : e.riskLevel === "high"
          ? 3
          : e.riskLevel === "medium"
            ? 2
            : 1;
    if (e.actionStatus === "confirmed" || e.actionStatus === "executed") confirmed++;
    if (e.actionStatus === "blocked") blocked++;
  }

  const mostCommonIntent =
    [...intentCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    userId,
    eventCount: events.length,
    mostCommonIntent,
    avgRisk: events.length ? riskSum / events.length : 0,
    confirmedActions: confirmed,
    blockedActions: blocked,
    lastActivity: events[0]?.timestamp.toISOString() ?? null,
    events: events.map(serializeIntentEvent),
  };
}

export async function queryIntentRealtime(sinceIso: string | null, filters: IntentQueryFilters) {
  const since = sinceIso ? new Date(sinceIso) : new Date(Date.now() - 60_000);
  const rows = await prisma.agentIntentEvent.findMany({
    where: {
      ...eventWhere(filters),
      timestamp: { gt: since },
    },
    orderBy: { timestamp: "asc" },
    take: filters.limit ?? 100,
  });
  return {
    since: since.toISOString(),
    serverTime: new Date().toISOString(),
    events: rows.map(serializeIntentEvent),
  };
}

export async function queryIntentDistribution(filters: IntentQueryFilters) {
  const grouped = await prisma.agentIntentEvent.groupBy({
    by: ["intentId"],
    where: eventWhere(filters),
    _count: { _all: true },
    orderBy: { _count: { intentId: "desc" } },
  });
  const seeds = await prisma.intentMatrixSeed.findMany();
  const baseline = new Map(seeds.map((s) => [s.intentId, s.baselineWeight]));
  return grouped.map((g) => ({
    intentId: g.intentId,
    count: g._count._all,
    baselineWeight: baseline.get(g.intentId) ?? 0,
  }));
}

export async function queryIntentRiskHeatmap(filters: IntentQueryFilters) {
  const grouped = await prisma.agentIntentEvent.groupBy({
    by: ["intentId", "riskLevel"],
    where: eventWhere(filters),
    _count: { _all: true },
  });
  return grouped.map((g) => ({
    intentId: g.intentId,
    riskLevel: g.riskLevel,
    count: g._count._all,
  }));
}

export async function queryIntentUserBehaviorTable(filters: IntentQueryFilters) {
  const rows = await prisma.agentIntentEvent.findMany({
    where: eventWhere(filters),
    select: {
      userId: true,
      intentId: true,
      riskLevel: true,
      actionStatus: true,
      timestamp: true,
    },
    orderBy: { timestamp: "desc" },
    take: 5000,
  });

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

  return [...byUser.entries()].map(([userId, slot]) => ({
    userId,
    mostCommonIntent:
      [...slot.intents.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    avgRisk: slot.count ? slot.riskSum / slot.count : 0,
    confirmedActions: slot.confirmed,
    blockedActions: slot.blocked,
    lastActivity: slot.lastActivity.toISOString(),
    messageCount: slot.count,
  }));
}

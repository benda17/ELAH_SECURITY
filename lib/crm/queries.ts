import type { IntentMatrixPoint } from "@/lib/intent-matrix-points";
import {
  csCrmCoordinates,
  financialRiskLevel,
  isDeviationPoint,
  sanitizeMetadata,
} from "@/lib/elah/cs-crm-coordinates";
import { crmPrisma, isCrmDatabaseConfigured } from "./prisma";

const SECURITY_EVENT_TYPES = [
  "suspicious_prompt_detected",
  "policy_denied",
  "policy_check_failed",
  "unauthorized_access_attempt",
  "agent_error",
] as const;

const PLAN_TO_CHART_TIER: Record<string, string> = {
  starter: "basic",
  growth: "premium",
  enterprise: "vip",
};

function parseJsonObject(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

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

function scoreBand(score: number | null | undefined): "low" | "medium" | "high" {
  if (score == null) return "low";
  if (score >= 0.7) return "high";
  if (score >= 0.4) return "medium";
  return "low";
}

const EMPTY_STATS = {
  eventTotal: 0,
  customerTotal: 0,
  userTotal: 0,
  ticketTotal: 0,
  conversationTotal: 0,
  messageTotal: 0,
  toolExecutions: 0,
  confirmations: 0,
  securityEvents: 0,
  pendingActions: 0,
  uniqueActors: 0,
  scoredEvents: 0,
  avgScore: 0,
};

export async function getCrmStatsOverview() {
  if (!isCrmDatabaseConfigured()) return EMPTY_STATS;
  try {
    const [
      eventTotal,
      customerTotal,
      userTotal,
      ticketTotal,
      conversationTotal,
      messageTotal,
      toolExecutions,
      confirmations,
      securityEvents,
      pendingActions,
      uniqueActors,
      scored,
    ] = await Promise.all([
      crmPrisma.agentEventLog.count(),
      crmPrisma.customerAccount.count(),
      crmPrisma.user.count(),
      crmPrisma.ticket.count(),
      crmPrisma.agentConversation.count(),
      crmPrisma.agentMessage.count(),
      crmPrisma.agentEventLog.count({
        where: { eventType: { in: ["tool_call_executed", "ticket_created", "ticket_comment_added"] } },
      }),
      crmPrisma.agentEventLog.count({ where: { eventType: "confirmation_required" } }),
      crmPrisma.agentEventLog.count({
        where: { eventType: { in: [...SECURITY_EVENT_TYPES] } },
      }),
      crmPrisma.agentPendingAction.count({ where: { status: "pending" } }),
      crmPrisma.agentEventLog.groupBy({
        by: ["userId"],
        where: { userId: { not: null } },
      }),
      crmPrisma.elahScoreSnapshot.aggregate({
        _count: { _all: true },
        _avg: { genuineIntentScore: true },
      }),
    ]);

    return {
      eventTotal,
      customerTotal,
      userTotal,
      ticketTotal,
      conversationTotal,
      messageTotal,
      toolExecutions,
      confirmations,
      securityEvents,
      pendingActions,
      uniqueActors: uniqueActors.length,
      scoredEvents: scored._count._all,
      avgScore: scored._avg.genuineIntentScore ?? 0,
    };
  } catch (err) {
    console.error("[crm-analytics] stats", err);
    return EMPTY_STATS;
  }
}

export async function getCrmEventsByDay(daysBack = 21) {
  if (!isCrmDatabaseConfigured()) return [];
  try {
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    const rows = await crmPrisma.agentEventLog.findMany({
      where: { timestamp: { gte: since } },
      select: { timestamp: true, eventType: true, metadata: true },
    });
    const security = new Set<string>(SECURITY_EVENT_TYPES);
    const buckets = new Map<string, { tools: number; security: number; other: number }>();
    for (let i = daysBack - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      buckets.set(d.toISOString().slice(0, 10), { tools: 0, security: 0, other: 0 });
    }
    for (const r of rows) {
      const key = r.timestamp.toISOString().slice(0, 10);
      const slot = buckets.get(key);
      if (!slot) continue;
      const source = parseJsonObject(r.metadata).source;
      if (security.has(r.eventType)) slot.security++;
      else if (source === "agent" || r.eventType.startsWith("tool_call")) slot.tools++;
      else slot.other++;
    }
    return Array.from(buckets.entries()).map(([date, v]) => ({
      date,
      label: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      ...v,
      total: v.tools + v.security + v.other,
    }));
  } catch (err) {
    console.error("[crm-analytics] events-by-day", err);
    return [];
  }
}

export async function getCrmEventsByType(limit = 15) {
  if (!isCrmDatabaseConfigured()) return [];
  try {
    const rows = await crmPrisma.agentEventLog.groupBy({
      by: ["eventType"],
      _count: { _all: true },
      orderBy: { _count: { eventType: "desc" } },
      take: limit,
    });
    return rows.map((r) => ({ eventType: r.eventType, count: r._count._all }));
  } catch (err) {
    console.error("[crm-analytics] events-by-type", err);
    return [];
  }
}

export async function getCrmTopTools(limit = 10) {
  if (!isCrmDatabaseConfigured()) return [];
  try {
    const rows = await crmPrisma.agentEventLog.groupBy({
      by: ["toolName"],
      _count: { _all: true },
      where: { toolName: { not: null } },
      orderBy: { _count: { toolName: "desc" } },
      take: limit,
    });
    return rows
      .filter((r) => r.toolName)
      .map((r) => ({
        toolName: r.toolName!.replace(/_/g, " "),
        count: r._count._all,
      }));
  } catch (err) {
    console.error("[crm-analytics] top-tools", err);
    return [];
  }
}

export async function getCrmPolicyDecisions() {
  if (!isCrmDatabaseConfigured()) {
    return [
      { decision: "allow", count: 0 },
      { decision: "needs_confirmation", count: 0 },
      { decision: "deny", count: 0 },
    ];
  }
  try {
    const rows = await crmPrisma.agentEventLog.groupBy({
      by: ["policyDecision"],
      _count: { _all: true },
      where: { policyDecision: { not: null } },
    });
    const order = ["allow", "needs_confirmation", "deny"] as const;
    return order.map((decision) => ({
      decision,
      count: rows.find((r) => r.policyDecision === decision)?._count._all ?? 0,
    }));
  } catch (err) {
    console.error("[crm-analytics] policy", err);
    return [
      { decision: "allow", count: 0 },
      { decision: "needs_confirmation", count: 0 },
      { decision: "deny", count: 0 },
    ];
  }
}

export async function getCrmEventsPerUser(limit = 30) {
  if (!isCrmDatabaseConfigured()) return [];
  try {
    const rows = await crmPrisma.agentEventLog.groupBy({
      by: ["userId"],
      _count: { _all: true },
      where: { userId: { not: null } },
      orderBy: { _count: { userId: "desc" } },
      take: limit,
    });
    if (rows.length === 0) return [];
    const users = await crmPrisma.user.findMany({
      where: { id: { in: rows.map((r) => r.userId!).filter(Boolean) } },
      select: {
        id: true,
        name: true,
        customerAccount: { select: { plan: true, workspaceName: true } },
      },
    });
    const byId = new Map(users.map((u) => [u.id, u]));
    return rows.map((r) => {
      const u = byId.get(r.userId!);
      const plan = u?.customerAccount?.plan ?? "?";
      return {
        name: u?.name ?? "Unknown",
        workspace: u?.customerAccount?.workspaceName ?? "",
        tier: PLAN_TO_CHART_TIER[plan] ?? plan,
        plan,
        count: r._count._all,
      };
    });
  } catch (err) {
    console.error("[crm-analytics] per-user", err);
    return [];
  }
}

export async function getCrmEventsByHour() {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
  if (!isCrmDatabaseConfigured()) return buckets;
  try {
    const rows = await crmPrisma.agentEventLog.findMany({ select: { timestamp: true } });
    for (const r of rows) {
      buckets[r.timestamp.getHours()]!.count++;
    }
    return buckets;
  } catch (err) {
    console.error("[crm-analytics] by-hour", err);
    return buckets;
  }
}

export async function getCrmWeekdayActivity() {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const counts = [0, 0, 0, 0, 0, 0, 0];
  if (!isCrmDatabaseConfigured()) {
    return labels.map((label, i) => ({ label, count: counts[i]! }));
  }
  try {
    const rows = await crmPrisma.agentEventLog.findMany({ select: { timestamp: true } });
    for (const r of rows) {
      const idx = (r.timestamp.getDay() + 6) % 7;
      counts[idx]!++;
    }
  } catch (err) {
    console.error("[crm-analytics] weekday", err);
  }
  return labels.map((label, i) => ({ label, count: counts[i]! }));
}

export async function getCrmPlanDistribution() {
  const order = ["starter", "growth", "enterprise"] as const;
  if (!isCrmDatabaseConfigured()) {
    return order.map((tier) => ({ tier, count: 0 }));
  }
  try {
    const rows = await crmPrisma.customerAccount.groupBy({
      by: ["plan"],
      _count: { _all: true },
    });
    return order.map((plan) => ({
      tier: plan,
      count: rows.find((r) => r.plan === plan)?._count._all ?? 0,
    }));
  } catch (err) {
    console.error("[crm-analytics] plans", err);
    return order.map((tier) => ({ tier, count: 0 }));
  }
}

export async function getCrmScoreBands() {
  const bands = { low: 0, medium: 0, high: 0 };
  if (!isCrmDatabaseConfigured()) {
    return (["low", "medium", "high"] as const).map((band) => ({
      riskLevel: band,
      count: 0,
    }));
  }
  try {
    const rows = await crmPrisma.elahScoreSnapshot.findMany({
      where: { unavailable: false },
      select: { genuineIntentScore: true },
    });
    for (const r of rows) {
      bands[scoreBand(r.genuineIntentScore)]++;
    }
  } catch (err) {
    console.error("[crm-analytics] score-bands", err);
  }
  return (["low", "medium", "high"] as const).map((band) => ({
    riskLevel: band,
    count: bands[band],
  }));
}

export async function getCrmRecommendations() {
  const order = ["proceed", "review", "abstain"] as const;
  if (!isCrmDatabaseConfigured()) {
    return order.map((recommendation) => ({ recommendation, count: 0 }));
  }
  try {
    const rows = await crmPrisma.elahScoreSnapshot.groupBy({
      by: ["recommendation"],
      _count: { _all: true },
      where: { recommendation: { not: null } },
    });
    return order.map((recommendation) => ({
      recommendation,
      count: rows.find((r) => r.recommendation === recommendation)?._count._all ?? 0,
    }));
  } catch (err) {
    console.error("[crm-analytics] recommendations", err);
    return order.map((recommendation) => ({ recommendation, count: 0 }));
  }
}

export async function getCrmIntents(limit = 12) {
  if (!isCrmDatabaseConfigured()) return [];
  try {
    const rows = await crmPrisma.agentEventLog.groupBy({
      by: ["detectedIntent"],
      _count: { _all: true },
      where: { detectedIntent: { not: null } },
      orderBy: { _count: { detectedIntent: "desc" } },
      take: limit,
    });
    return rows
      .filter((r) => r.detectedIntent)
      .map((r) => ({
        eventType: r.detectedIntent!,
        count: r._count._all,
      }));
  } catch (err) {
    console.error("[crm-analytics] intents", err);
    return [];
  }
}

export async function getCrmSecurityOverTime(daysBack = 21) {
  const empty = () => {
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
    return Array.from(buckets.entries()).map(([date, v]) => ({
      date,
      label: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      ...v,
      total: v.suspicious_prompt + v.policy_failed + v.unauthorized + v.agent_error,
    }));
  };

  if (!isCrmDatabaseConfigured()) return empty();
  try {
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    const rows = await crmPrisma.agentEventLog.findMany({
      where: {
        timestamp: { gte: since },
        eventType: { in: [...SECURITY_EVENT_TYPES] },
      },
      select: { timestamp: true, eventType: true },
    });
    const result = empty();
    const byDate = new Map(result.map((r) => [r.date, r]));
    for (const r of rows) {
      const slot = byDate.get(r.timestamp.toISOString().slice(0, 10));
      if (!slot) continue;
      if (r.eventType === "suspicious_prompt_detected") slot.suspicious_prompt++;
      else if (r.eventType === "policy_denied" || r.eventType === "policy_check_failed") {
        slot.policy_failed++;
      } else if (r.eventType === "unauthorized_access_attempt") slot.unauthorized++;
      else slot.agent_error++;
      slot.total =
        slot.suspicious_prompt + slot.policy_failed + slot.unauthorized + slot.agent_error;
    }
    return result;
  } catch (err) {
    console.error("[crm-analytics] security-time", err);
    return empty();
  }
}

export async function getCrmSecurityReasons(limit = 10) {
  if (!isCrmDatabaseConfigured()) return [];
  try {
    const rows = await crmPrisma.agentEventLog.findMany({
      where: { eventType: { in: [...SECURITY_EVENT_TYPES] } },
      select: { policyReasons: true, eventType: true, detectedIntent: true },
    });
    const counts = new Map<string, number>();
    for (const row of rows) {
      const reasons = parseJsonArray(row.policyReasons);
      if (reasons.length > 0) {
        for (const reason of reasons) counts.set(reason, (counts.get(reason) ?? 0) + 1);
      } else {
        const label = row.detectedIntent ?? row.eventType;
        counts.set(label, (counts.get(label) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([label, count]) => ({ label, count }));
  } catch (err) {
    console.error("[crm-analytics] security-reasons", err);
    return [];
  }
}

export async function getCrmScoreSnapshotBands() {
  const bands = { low: 0, medium: 0, high: 0, critical: 0 };
  if (!isCrmDatabaseConfigured()) {
    return (["low", "medium", "high", "critical"] as const).map((band) => ({
      band,
      count: 0,
    }));
  }
  try {
    const rows = await crmPrisma.elahScoreSnapshot.findMany({
      select: { genuineIntentScore: true, recommendation: true },
    });
    for (const r of rows) {
      if (r.recommendation === "review") bands.high++;
      else if (r.recommendation === "abstain") bands.medium++;
      else if ((r.genuineIntentScore ?? 1) < 0.3) bands.critical++;
      else bands.low++;
    }
  } catch (err) {
    console.error("[crm-analytics] snapshot-bands", err);
  }
  return (["low", "medium", "high", "critical"] as const).map((band) => ({
    band,
    count: bands[band],
  }));
}

export async function getCrmRecentEvents(limit = 12) {
  if (!isCrmDatabaseConfigured()) return [];
  try {
    const rows = await crmPrisma.agentEventLog.findMany({
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
        metadata: true,
        eventId: true,
      },
    });
    const userIds = [...new Set(rows.map((r) => r.userId).filter(Boolean))] as string[];
    const users =
      userIds.length > 0
        ? await crmPrisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true },
          })
        : [];
    const byId = new Map(users.map((u) => [u.id, u.name]));
    return rows.map((r) => {
      const actor = parseJsonObject(r.metadata).actorName;
      const fromMeta = typeof actor === "string" ? actor : null;
      return {
        id: r.id,
        timestamp: r.timestamp.toISOString(),
        eventType: r.eventType,
        userId: r.userId,
        toolName: r.toolName,
        userMessage: r.userMessage,
        resultSummary: r.resultSummary,
        policyDecision: r.policyDecision,
        userName: r.userId ? byId.get(r.userId) ?? fromMeta ?? "Unknown" : "—",
      };
    });
  } catch (err) {
    console.error("[crm-analytics] recent", err);
    return [];
  }
}

export async function getCrmConversationStatus() {
  const order = ["active", "flagged", "closed"] as const;
  if (!isCrmDatabaseConfigured()) {
    return order.map((status) => ({ status, count: 0 }));
  }
  try {
    const rows = await crmPrisma.agentConversation.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    return order.map((status) => ({
      status,
      count: rows.find((r) => r.status === status)?._count._all ?? 0,
    }));
  } catch {
    return order.map((status) => ({ status, count: 0 }));
  }
}

export async function getCrmEventLogs(limit = 200) {
  if (!isCrmDatabaseConfigured()) return [];
  try {
    const rows = await crmPrisma.agentEventLog.findMany({
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
        detectedIntent: true,
        policyDecision: true,
        policyReasons: true,
        resultSummary: true,
        latencyMs: true,
        eventId: true,
        metadata: true,
      },
    });
    const userIds = [...new Set(rows.map((r) => r.userId).filter(Boolean))] as string[];
    const eventIds = rows.map((r) => r.eventId).filter((id): id is string => !!id);
    const [users, snapshots] = await Promise.all([
      userIds.length > 0
        ? crmPrisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true },
          })
        : Promise.resolve([]),
      eventIds.length > 0
        ? crmPrisma.elahScoreSnapshot.findMany({
            where: { eventId: { in: eventIds } },
            select: {
              eventId: true,
              genuineIntentScore: true,
              intentLabel: true,
              recommendation: true,
            },
          })
        : Promise.resolve([]),
    ]);
    const byUser = new Map(users.map((u) => [u.id, u]));
    const byEvent = new Map(snapshots.map((s) => [s.eventId, s]));
    return rows.map((r) => {
      const meta = parseJsonObject(r.metadata);
      const snap = r.eventId ? byEvent.get(r.eventId) : undefined;
      const user = r.userId ? byUser.get(r.userId) : undefined;
      return {
        ...r,
        userName:
          (typeof meta.actorName === "string" ? meta.actorName : null) ?? user?.name ?? "—",
        userEmail: user?.email ?? "",
        persona: typeof meta.persona === "string" ? meta.persona : "",
        source: typeof meta.source === "string" ? meta.source : "",
        genuineIntentScore: snap?.genuineIntentScore ?? null,
        intentLabel: snap?.intentLabel ?? r.detectedIntent,
        recommendation: snap?.recommendation ?? null,
        timestamp: r.timestamp.toISOString(),
      };
    });
  } catch (err) {
    console.error("[crm-analytics] event-logs", err);
    return [];
  }
}

export async function getCrmUsersWithStats(limit = 50) {
  if (!isCrmDatabaseConfigured()) return [];
  try {
    const customers = await crmPrisma.user.findMany({
      where: {
        role: {
          in: ["regular_customer", "premium_customer", "enterprise_customer"],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
        customerAccount: {
          select: { plan: true, workspaceName: true, accountNumber: true, seatCount: true },
        },
        _count: {
          select: { conversations: true, pendingActions: true },
        },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
    const eventCounts = await crmPrisma.agentEventLog.groupBy({
      by: ["userId"],
      _count: { _all: true },
      where: { userId: { in: customers.map((c) => c.id) } },
    });
    const eventsByUser = new Map(eventCounts.map((r) => [r.userId, r._count._all]));
    return customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      role: c.role,
      status: c.status,
      plan: c.customerAccount?.plan ?? "—",
      workspace: c.customerAccount?.workspaceName ?? "—",
      accountNumber: c.customerAccount?.accountNumber ?? "—",
      seats: c.customerAccount?.seatCount ?? 0,
      lastLoginAt: c.lastLoginAt?.toISOString() ?? null,
      conversations: c._count.conversations,
      pendingActions: c._count.pendingActions,
      eventCount: eventsByUser.get(c.id) ?? 0,
    }));
  } catch (err) {
    console.error("[crm-analytics] users", err);
    return [];
  }
}

export async function getCrmPendingActions(limit = 50) {
  if (!isCrmDatabaseConfigured()) return [];
  try {
    const rows = await crmPrisma.agentPendingAction.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { select: { name: true, email: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      actionType: r.actionType,
      toolName: r.toolName,
      summary: r.summary,
      status: r.status,
      userName: r.user.name,
      userEmail: r.user.email,
      createdAt: r.createdAt.toISOString(),
      expiresAt: r.expiresAt.toISOString(),
      executedAt: r.executedAt?.toISOString() ?? null,
      resultSummary: r.resultSummary,
    }));
  } catch (err) {
    console.error("[crm-analytics] pending", err);
    return [];
  }
}

export async function getCrmToolCallEvents(limit = 80) {
  if (!isCrmDatabaseConfigured()) return [];
  try {
    const rows = await crmPrisma.agentEventLog.findMany({
      where: {
        OR: [
          {
            eventType: {
              in: [
                "tool_call_executed",
                "tool_call_failed",
                "tool_call_requested",
                "confirmation_required",
                "policy_denied",
              ],
            },
          },
          { toolName: { not: null } },
        ],
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
        metadata: true,
      },
    });
    const userIds = [...new Set(rows.map((r) => r.userId).filter(Boolean))] as string[];
    const users =
      userIds.length > 0
        ? await crmPrisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true },
          })
        : [];
    const byId = new Map(users.map((u) => [u.id, u.name]));
    return rows.map((r) => {
      const meta = parseJsonObject(r.metadata);
      return {
        ...r,
        userName:
          r.userId
            ? byId.get(r.userId) ?? (typeof meta.actorName === "string" ? meta.actorName : "Unknown")
            : "—",
        timestamp: r.timestamp.toISOString(),
      };
    });
  } catch (err) {
    console.error("[crm-analytics] tool-calls", err);
    return [];
  }
}

const INTENT_MATRIX_POINT_LIMIT = 800;

function snippet(text: string | null | undefined, max = 160) {
  if (!text) return "";
  const trimmed = text.replace(/\s+/g, " ").trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

function actionStatusFromSnapshot(input: {
  unavailable: boolean;
  recommendation: string | null;
}) {
  if (input.unavailable) return "unavailable";
  if (input.recommendation === "abstain") return "abstain";
  if (input.recommendation === "review") return "review";
  if (input.recommendation === "proceed") return "scored";
  return "scored";
}

/**
 * Map CRM ElahScoreSnapshot + AgentEventLog into intention-graph points.
 * Coordinates come from the CS/CRM atlas in code — not from Neon columns.
 */
export async function getCrmIntentMatrixPoints(limit = INTENT_MATRIX_POINT_LIMIT): Promise<{
  points: IntentMatrixPoint[];
  snapshotCount: number;
  uniqueIntents: number;
}> {
  const empty = { points: [] as IntentMatrixPoint[], snapshotCount: 0, uniqueIntents: 0 };
  if (!isCrmDatabaseConfigured()) return empty;
  try {
    const snapshots = await crmPrisma.elahScoreSnapshot.findMany({
      orderBy: { scoredAt: "desc" },
      take: limit,
      select: {
        id: true,
        eventId: true,
        scoredAt: true,
        genuineIntentScore: true,
        confidence: true,
        intentLabel: true,
        recommendation: true,
        reasonCodes: true,
        scorer: true,
        unavailable: true,
        unavailableReason: true,
        userId: true,
        conversationId: true,
        toolName: true,
      },
    });
    if (snapshots.length === 0) return empty;

    const eventIds = snapshots.map((s) => s.eventId).filter(Boolean);
    const events =
      eventIds.length > 0
        ? await crmPrisma.agentEventLog.findMany({
            where: { eventId: { in: eventIds } },
            select: {
              eventId: true,
              eventType: true,
              conversationId: true,
              userId: true,
              userMessage: true,
              toolName: true,
              policyDecision: true,
              detectedIntent: true,
              metadata: true,
              timestamp: true,
            },
          })
        : [];
    const byEvent = new Map<string, (typeof events)[number]>();
    for (const e of events) {
      if (e.eventId && !byEvent.has(e.eventId)) byEvent.set(e.eventId, e);
    }

    const points: IntentMatrixPoint[] = snapshots.map((snap) => {
      const event = byEvent.get(snap.eventId);
      const intentLabel =
        snap.intentLabel || event?.detectedIntent || "ambiguous_crm_request";
      const coords = csCrmCoordinates(intentLabel);
      const reasonCodes = parseJsonArray(snap.reasonCodes);
      const meta = sanitizeMetadata(parseJsonObject(event?.metadata));
      const conversationId = snap.conversationId ?? event?.conversationId ?? null;
      const policyDecision = event?.policyDecision ?? null;
      const deviation = isDeviationPoint({
        intentLabel,
        policyDecision,
        eventType: event?.eventType,
      });
      return {
        id: snap.id,
        x: coords.humanAgency,
        y: coords.financialRisk,
        z: coords.emotionalUrgency,
        riskLevel: financialRiskLevel(coords.financialRisk),
        actionStatus: actionStatusFromSnapshot(snap),
        intentId: intentLabel,
        intentLabel,
        userId: snap.userId ?? event?.userId ?? "",
        timestamp: (event?.timestamp ?? snap.scoredAt).toISOString(),
        messageSnippet: snippet(event?.userMessage),
        toolName: snap.toolName ?? event?.toolName ?? null,
        policyDecision,
        conversationId,
        eventId: snap.eventId,
        reasonCodes,
        scorer: snap.scorer || "cs_crm_rules_v0",
        confidence: snap.confidence,
        genuineIntentScore: snap.genuineIntentScore,
        recommendation: snap.recommendation,
        unavailable: snap.unavailable,
        unavailableReason: snap.unavailableReason,
        metadataSanitized: meta,
        deviation,
      };
    });

    const uniqueIntents = new Set(points.map((p) => p.intentId)).size;
    return { points, snapshotCount: snapshots.length, uniqueIntents };
  } catch (err) {
    console.error("[crm-analytics] intent-matrix", err);
    return empty;
  }
}

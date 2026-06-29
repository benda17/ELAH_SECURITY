import Link from "next/link";
import {
  ShieldCheck,
  AlertOctagon,
  Bot,
  Bug,
  Activity,
  Ban,
} from "lucide-react";
import { requireSecurity } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/logging/logger";
import { getAnalyticsSnapshot } from "@/lib/logging/analytics";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { Badge, RiskBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  ActivityTimelineChart,
  ActorBreakdownChart,
  HumanVsAgentChart,
  RiskDonutChart,
  RiskPatternChart,
  TopActionsChart,
} from "@/components/dashboard/log-charts";

export const dynamic = "force-dynamic";

export default async function SecurityDashboardPage() {
  await requireSecurity();

  const [analytics, recentCritical, agentActivity] = await Promise.all([
    getAnalyticsSnapshot(),
    prisma.auditLog.findMany({
      where: { riskLevel: { in: ["high", "critical"] } },
      orderBy: { timestamp: "desc" },
      take: 5,
    }),
    prisma.agentActionLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 5,
    }),
  ]);

  await writeAuditLog({
    actionType: "admin_security_dashboard_viewed",
    page: "/admin/security-dashboard",
    toolOrFeatureUsed: "security_dashboard",
    riskLevel: "low",
    actionOutcome: "viewed",
    inputDataSummary: {
      auditTotal: analytics.totals.audit,
      riskTotal: analytics.totals.risk,
      criticalLast24h: analytics.totals.criticalLast24h,
    },
  });

  return (
    <PageShell>
      <SectionHeader
        title="Security overview"
        description="Live view of audit logs, risk events, and agent traces. Charts cover the last 24 hours; totals are all-time."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Audit logs (total)"
          value={String(analytics.totals.audit)}
          hint="All structured logs"
          icon={<Activity className="size-4" />}
          accent="cyan"
        />
        <StatCard
          label="Risk events"
          value={String(analytics.totals.risk)}
          hint="All severities"
          icon={<ShieldCheck className="size-4" />}
          accent="gold"
        />
        <StatCard
          label="Agent traces"
          value={String(analytics.totals.agent)}
          hint="AI agent actions"
          icon={<Bot className="size-4" />}
          accent="amber"
        />
        <StatCard
          label="Critical (24h)"
          value={String(analytics.totals.criticalLast24h)}
          hint="High-impact actions"
          icon={<AlertOctagon className="size-4" />}
          accent="rose"
        />
        <StatCard
          label="Blocked (24h)"
          value={String(analytics.totals.blockedLast24h)}
          hint="Policy violations"
          icon={<Ban className="size-4" />}
          accent="rose"
        />
        <StatCard
          label="Agent acts (24h)"
          value={String(analytics.totals.agentLast24h)}
          hint="createdByAgent=true"
          icon={<Bug className="size-4" />}
          accent="amber"
        />
      </div>

      <Card>
        <CardHeader
          title="Activity timeline (24h)"
          description="Audit log volume per hour, stacked by risk level. Use this to spot spikes."
          action={
            <div className="flex items-center gap-3 text-[11px] text-ink-subtle">
              <LegendDot color="#34d399" label="low" />
              <LegendDot color="#fbbf24" label="medium" />
              <LegendDot color="#fb7185" label="high" />
              <LegendDot color="#f43f5e" label="critical" />
            </div>
          }
        />
        <ActivityTimelineChart data={analytics.timeline} />
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader
            title="Risk distribution"
            description="All audit logs by risk level."
          />
          <RiskDonutChart data={analytics.riskDistribution} />
        </Card>

        <Card>
          <CardHeader
            title="Human vs AI agent"
            description="Action authorship across all logs."
          />
          <HumanVsAgentChart data={analytics.humanVsAgent} />
        </Card>

        <Card>
          <CardHeader
            title="Activity by actor type"
            description="Top contributors of logged actions."
          />
          <ActorBreakdownChart data={analytics.actorBreakdown} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Most frequent actions"
            description="Top 8 action types across the system."
          />
          <TopActionsChart data={analytics.topActions} />
        </Card>

        <Card>
          <CardHeader
            title="Risk patterns detected"
            description="Risk events grouped by detection pattern."
          />
          {analytics.riskByPattern.length === 0 ? (
            <p className="text-sm text-ink-muted">No risk patterns detected.</p>
          ) : (
            <RiskPatternChart data={analytics.riskByPattern} />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <Activity className="size-4 text-accent-rose" />
                Recent critical actions
              </span>
            }
            action={
              <Link href="/admin/action-logs">
                <Badge variant="info">All logs →</Badge>
              </Link>
            }
          />
          {recentCritical.length === 0 ? (
            <p className="text-sm text-ink-muted">No high-risk actions recorded.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recentCritical.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-ink">
                      {l.actionType.replaceAll("_", " ")}
                    </div>
                    <div className="text-xs text-ink-subtle">
                      {l.actorName ?? l.actorType} · {formatDate(l.timestamp)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {l.createdByAgent ? (
                      <Badge variant="role-agent">agent</Badge>
                    ) : null}
                    <RiskBadge level={l.riskLevel} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <Bot className="size-4 text-accent-cyan" />
                Recent agent traces
              </span>
            }
            action={
              <Link href="/admin/agent-simulation-logs">
                <Badge variant="info">Open traces →</Badge>
              </Link>
            }
          />
          {agentActivity.length === 0 ? (
            <p className="text-sm text-ink-muted">No agent traces yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {agentActivity.map((a) => (
                <li key={a.id} className="py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-ink line-clamp-1">
                        {a.declaredTask}
                      </div>
                      <div className="text-xs text-ink-subtle">
                        {a.actionType.replaceAll("_", " ")} ·{" "}
                        {a.intentMatchStatus} · {formatDate(a.timestamp)}
                      </div>
                    </div>
                    <RiskBadge level={a.riskLevel} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              <Bug className="size-4 text-accent-gold" />
              Intent / action mismatch candidates
            </span>
          }
          description="Cases where the agent's declared task diverged from the executed action."
        />
        <ul className="space-y-3">
          {agentActivity
            .filter(
              (a) =>
                a.intentMatchStatus === "mismatch" ||
                a.intentMatchStatus === "misaligned",
            )
            .map((a) => (
              <li
                key={a.id}
                className="rounded-lg border border-accent-rose/30 bg-accent-rose/5 p-3 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-ink font-medium">{a.declaredTask}</div>
                  <RiskBadge level={a.riskLevel} />
                </div>
                <p className="mt-1 text-xs text-ink-muted">
                  Interpreted intent: {a.interpretedIntent}
                </p>
                <p className="mt-1 text-[11px] text-ink-subtle">
                  ELAH placeholder verdict:{" "}
                  <span className="text-ink">
                    {a.elahVerdictPlaceholder ?? "—"}
                  </span>
                </p>
              </li>
            ))}
          {agentActivity.every(
            (a) =>
              a.intentMatchStatus !== "mismatch" &&
              a.intentMatchStatus !== "misaligned",
          ) ? (
            <li className="text-sm text-ink-muted">
              No mismatch candidates in current agent traces.
            </li>
          ) : null}
        </ul>
      </Card>
    </PageShell>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block size-2 rounded-full"
        style={{ background: color }}
      />
      <span className="uppercase tracking-widest">{label}</span>
    </span>
  );
}

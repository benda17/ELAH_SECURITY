import Link from "next/link";
import {
  ShieldCheck,
  AlertOctagon,
  Bot,
  Bug,
  Activity,
} from "lucide-react";
import { requireSecurity } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/logging/logger";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { Badge, RiskBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SecurityDashboardPage() {
  await requireSecurity();

  const [counts, recentCritical, agentActivity, injectionStatus] = await Promise.all([
    prisma.riskEvent.groupBy({
      by: ["severity"],
      _count: { severity: true },
    }),
    prisma.auditLog.findMany({
      where: { riskLevel: { in: ["high", "critical"] } },
      orderBy: { timestamp: "desc" },
      take: 5,
    }),
    prisma.agentActionLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 5,
    }),
    prisma.promptInjectionScenario.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
  ]);

  await writeAuditLog({
    actionType: "admin_security_dashboard_viewed",
    page: "/admin/security-dashboard",
    toolOrFeatureUsed: "security_dashboard",
    riskLevel: "low",
    actionOutcome: "viewed",
  });

  const countOf = (sev: string) =>
    counts.find((c) => c.severity === sev)?._count.severity ?? 0;

  return (
    <PageShell>
      <SectionHeader
        title="Security overview"
        description="Global view of simulated risk activity, agent traces and prompt-injection scenarios."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          label="Critical events"
          value={String(countOf("critical"))}
          hint="Severity = critical"
          icon={<AlertOctagon className="size-4" />}
          accent="rose"
        />
        <StatCard
          label="High events"
          value={String(countOf("high"))}
          hint="Severity = high"
          icon={<ShieldCheck className="size-4" />}
          accent="amber"
        />
        <StatCard
          label="Agent traces"
          value={String(agentActivity.length)}
          hint="Recent agent actions logged"
          icon={<Bot className="size-4" />}
          accent="cyan"
        />
        <StatCard
          label="Scenarios catalogued"
          value={String(injectionStatus.reduce((s, x) => s + x._count.status, 0))}
          hint="Prompt-injection test cases"
          icon={<Bug className="size-4" />}
          accent="gold"
        />
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
          />
          {recentCritical.length === 0 ? (
            <p className="text-sm text-ink-muted">No high-risk actions recorded.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recentCritical.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between py-3 text-sm"
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
                Agent activity
              </span>
            }
            action={
              <Link href="/admin/agent-simulation-logs">
                <Badge variant="info">See traces</Badge>
              </Link>
            }
          />
          {agentActivity.length === 0 ? (
            <p className="text-sm text-ink-muted">No agent traces yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {agentActivity.map((a) => (
                <li key={a.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="font-medium text-ink text-sm">
                        {a.declaredTask}
                      </div>
                      <div className="text-xs text-ink-subtle">
                        {a.actionType.replaceAll("_", " ")} · {a.intentMatchStatus}{" "}
                        · {formatDate(a.timestamp)}
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

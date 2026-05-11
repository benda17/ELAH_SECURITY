import Link from "next/link";
import {
  ClipboardCheck,
  Flag,
  Users,
  Activity,
  ArrowRight,
} from "lucide-react";
import { requireManager } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/logging/logger";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { Badge, RiskBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ManagerDashboardPage() {
  await requireManager();

  const [pendingApprovals, flaggedActions, totalCustomers, recentLogs] = await Promise.all([
    prisma.approvalRequest.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customerProfile: true },
    }),
    prisma.riskEvent.findMany({
      where: { reviewStatus: "open" },
      orderBy: { timestamp: "desc" },
      take: 5,
    }),
    prisma.customerProfile.count(),
    prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 6,
      where: { actorType: { in: ["customer", "manager", "ai_agent"] } },
    }),
  ]);

  await writeAuditLog({
    actionType: "manager_dashboard_view",
    page: "/manager/dashboard",
    toolOrFeatureUsed: "manager_dashboard",
    riskLevel: "low",
    actionOutcome: "viewed",
    inputDataSummary: {
      pendingApprovals: pendingApprovals.length,
      openFlags: flaggedActions.length,
    },
  });

  return (
    <PageShell>
      <SectionHeader
        title="Operations overview"
        description="Pending approvals, risk events, and recent activity across managed customers."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          label="Pending approvals"
          value={String(pendingApprovals.length)}
          hint="Transfer & loan reviews"
          icon={<ClipboardCheck className="size-4" />}
          accent="amber"
        />
        <StatCard
          label="Open flagged actions"
          value={String(flaggedActions.length)}
          hint="High-risk events awaiting review"
          icon={<Flag className="size-4" />}
          accent="rose"
        />
        <StatCard
          label="Customers"
          value={String(totalCustomers)}
          hint="Across all tiers"
          icon={<Users className="size-4" />}
          accent="cyan"
        />
        <StatCard
          label="Recent events"
          value={String(recentLogs.length)}
          hint="Last logged actions"
          icon={<Activity className="size-4" />}
          accent="emerald"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Approval queue"
            description="Latest pending transfer and loan requests."
            action={
              <Link href="/manager/approvals">
                <Badge variant="info">
                  Review all <ArrowRight className="size-3 ml-0.5" />
                </Badge>
              </Link>
            }
          />
          {pendingApprovals.length === 0 ? (
            <p className="text-sm text-ink-muted">No pending approvals.</p>
          ) : (
            <ul className="divide-y divide-line">
              {pendingApprovals.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium text-ink capitalize">
                      {a.requestType} ·{" "}
                      {a.amount ? formatCurrency(a.amount) : "—"}
                    </div>
                    <div className="text-xs text-ink-subtle">
                      {a.customerProfile.fullName} ·{" "}
                      {a.customerProfile.tier.toUpperCase()} · {formatDate(a.createdAt)}
                    </div>
                  </div>
                  <RiskBadge level={a.riskLevel} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent flagged actions"
            action={
              <Link href="/manager/flagged-actions">
                <Badge variant="info">
                  See all <ArrowRight className="size-3 ml-0.5" />
                </Badge>
              </Link>
            }
          />
          {flaggedActions.length === 0 ? (
            <p className="text-sm text-ink-muted">No open flagged actions.</p>
          ) : (
            <ul className="divide-y divide-line">
              {flaggedActions.map((e) => (
                <li key={e.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-ink">
                        {e.eventType.replaceAll("_", " ")}
                      </div>
                      <p className="mt-0.5 text-xs text-ink-muted line-clamp-2">
                        {e.reasonForFlagging}
                      </p>
                      <div className="mt-1 text-[11px] text-ink-subtle">
                        {formatDate(e.timestamp)} · actor {e.actorType}
                      </div>
                    </div>
                    <RiskBadge level={e.severity} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Recent system activity" />
        <ul className="divide-y divide-line">
          {recentLogs.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div className="min-w-0">
                <div className="font-medium text-ink">
                  {l.actionType.replaceAll("_", " ")}
                </div>
                <div className="text-xs text-ink-subtle">
                  {l.actorName ?? l.actorType} · {l.page ?? "—"} ·{" "}
                  {formatDate(l.timestamp)}
                </div>
              </div>
              <RiskBadge level={l.riskLevel} />
            </li>
          ))}
        </ul>
      </Card>
    </PageShell>
  );
}

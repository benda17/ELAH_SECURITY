import { ClipboardCheck } from "lucide-react";
import { requireManager } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/logging/logger";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { RiskBadge, Badge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ApprovalDecisionForm } from "./decision-form";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  await requireManager();

  const [pending, decided] = await Promise.all([
    prisma.approvalRequest.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
      include: { customerProfile: true },
    }),
    prisma.approvalRequest.findMany({
      where: { status: { in: ["approved", "rejected"] } },
      orderBy: { decidedAt: "desc" },
      take: 10,
      include: { customerProfile: true },
    }),
  ]);

  await writeAuditLog({
    actionType: "approval_queue_viewed",
    page: "/manager/approvals",
    toolOrFeatureUsed: "approval_queue",
    riskLevel: "low",
    actionOutcome: "viewed",
    inputDataSummary: { pending: pending.length },
  });

  return (
    <PageShell>
      <SectionHeader
        title="Approvals"
        description="Review pending transfer and loan requests. Decisions are logged with their reason."
      />

      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              <ClipboardCheck className="size-4 text-accent-gold" />
              Pending approvals
            </span>
          }
        />
        {pending.length === 0 ? (
          <Empty title="No pending approvals" description="You're all caught up." />
        ) : (
          <ul className="space-y-3">
            {pending.map((a) => (
              <li
                key={a.id}
                className="rounded-xl border border-line bg-bg-elevated/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="capitalize">
                        {a.requestType}
                      </Badge>
                      <RiskBadge level={a.riskLevel} />
                      <Badge variant="status-pending">pending</Badge>
                    </div>
                    <div className="mt-2 text-lg font-semibold text-ink">
                      {a.amount ? formatCurrency(a.amount) : "—"}
                    </div>
                    <div className="text-xs text-ink-muted">
                      {a.customerProfile.fullName} ·{" "}
                      {a.customerProfile.tier.toUpperCase()} ·{" "}
                      {a.customerProfile.customerNumber}
                    </div>
                    <div className="text-[11px] text-ink-subtle">
                      Submitted {formatDate(a.createdAt)} · target{" "}
                      <span className="font-mono">{a.targetResourceId}</span>
                    </div>
                  </div>
                  <ApprovalDecisionForm approvalId={a.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title="Recent decisions" />
        {decided.length === 0 ? (
          <p className="text-sm text-ink-muted">No decisions yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {decided.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-medium text-ink capitalize">
                    {d.requestType} ·{" "}
                    {d.amount ? formatCurrency(d.amount) : "—"}
                  </div>
                  <div className="text-xs text-ink-subtle">
                    {d.customerProfile.fullName} ·{" "}
                    {d.decidedAt ? formatDate(d.decidedAt) : "—"} ·{" "}
                    {d.decisionReason ?? "no reason recorded"}
                  </div>
                </div>
                <Badge
                  variant={
                    d.status === "approved"
                      ? "status-approved"
                      : "status-rejected"
                  }
                >
                  {d.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </PageShell>
  );
}

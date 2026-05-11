import { Flag } from "lucide-react";
import { requireManager } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/logging/logger";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { RiskBadge, Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { MarkReviewedForm } from "./mark-reviewed";
import { Empty } from "@/components/ui/empty";

export const dynamic = "force-dynamic";

export default async function FlaggedActionsPage() {
  await requireManager();

  const [open, reviewed] = await Promise.all([
    prisma.riskEvent.findMany({
      where: { reviewStatus: { in: ["open", "in_review"] } },
      orderBy: { timestamp: "desc" },
    }),
    prisma.riskEvent.findMany({
      where: { reviewStatus: "reviewed" },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
  ]);

  await writeAuditLog({
    actionType: "flagged_actions_viewed",
    page: "/manager/flagged-actions",
    toolOrFeatureUsed: "risk_events_list",
    riskLevel: "low",
    actionOutcome: "viewed",
    inputDataSummary: { openCount: open.length },
  });

  return (
    <PageShell>
      <SectionHeader
        title="Flagged actions"
        description="Suspicious or high-risk events. Reviewing here records your manager note in the audit trail."
      />

      <div className="space-y-4">
        {open.length === 0 ? (
          <Empty
            icon={<Flag className="size-5" />}
            title="No open risk events"
            description="All flagged actions have been reviewed."
          />
        ) : (
          open.map((e) => (
            <Card key={e.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Flag className="size-4 text-accent-rose" />
                    <h3 className="text-base font-semibold text-ink">
                      {e.eventType.replaceAll("_", " ")}
                    </h3>
                    <RiskBadge level={e.severity} />
                    <Badge variant="warning">{e.reviewStatus}</Badge>
                    {e.actorType === "ai_agent" ? (
                      <Badge variant="role-agent">AI agent</Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-ink">{e.reasonForFlagging}</p>
                  <div className="mt-1 text-[11px] text-ink-subtle">
                    {formatDate(e.timestamp)}
                    {e.detectedPattern ? ` · pattern: ${e.detectedPattern}` : ""}
                  </div>
                </div>
                <MarkReviewedForm id={e.id} />
              </div>
            </Card>
          ))
        )}
      </div>

      {reviewed.length > 0 ? (
        <Card>
          <h3 className="mb-2 text-sm font-semibold text-ink">
            Recently reviewed
          </h3>
          <ul className="divide-y divide-line text-sm">
            {reviewed.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2">
                <div className="min-w-0">
                  <div className="font-medium text-ink">
                    {e.eventType.replaceAll("_", " ")}
                  </div>
                  <div className="text-xs text-ink-subtle">
                    {formatDate(e.updatedAt)} · {e.reviewerNotes ?? "no notes"}
                  </div>
                </div>
                <RiskBadge level={e.severity} />
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </PageShell>
  );
}

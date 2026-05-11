import { AlertOctagon } from "lucide-react";
import { requireSecurity } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/logging/logger";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge, RiskBadge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import { JsonViewer } from "@/components/ui/json-viewer";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RiskEventsPage({
  searchParams,
}: {
  searchParams: { severity?: string; status?: string };
}) {
  await requireSecurity();
  const severity = searchParams.severity;
  const status = searchParams.status;

  const events = await prisma.riskEvent.findMany({
    where: {
      ...(severity && severity !== "all" ? { severity } : {}),
      ...(status && status !== "all" ? { reviewStatus: status } : {}),
    },
    orderBy: { timestamp: "desc" },
    include: { customerProfile: true, reviewer: true },
  });

  await writeAuditLog({
    actionType: "risk_events_viewed",
    page: "/admin/risk-events",
    toolOrFeatureUsed: "risk_events_list",
    riskLevel: "low",
    actionOutcome: "viewed",
    inputDataSummary: {
      severity: severity ?? "all",
      status: status ?? "all",
      resultCount: events.length,
    },
  });

  return (
    <PageShell>
      <SectionHeader
        title="Risk events"
        description="Normalized risk events derived from audit logs, agent actions, and policy triggers."
      />

      <Card>
        <form className="mb-4 flex flex-wrap items-center gap-3" method="get">
          <select
            name="severity"
            defaultValue={severity ?? "all"}
            className="rounded-lg border border-line bg-bg-panel/60 px-3 py-2 text-sm text-ink focus:outline-none"
          >
            <option value="all">All severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <select
            name="status"
            defaultValue={status ?? "all"}
            className="rounded-lg border border-line bg-bg-panel/60 px-3 py-2 text-sm text-ink focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="in_review">In review</option>
            <option value="reviewed">Reviewed</option>
            <option value="dismissed">Dismissed</option>
          </select>
          <button
            type="submit"
            className="rounded-lg border border-line-strong bg-bg-elevated px-3 py-2 text-sm text-ink hover:bg-bg-subtle"
          >
            Apply
          </button>
        </form>

        {events.length === 0 ? (
          <Empty
            icon={<AlertOctagon className="size-5" />}
            title="No risk events match"
          />
        ) : (
          <ul className="space-y-3">
            {events.map((e) => (
              <li
                key={e.id}
                className="rounded-xl border border-line bg-bg-elevated/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-ink">
                        {e.eventType.replaceAll("_", " ")}
                      </h3>
                      <RiskBadge level={e.severity} />
                      <Badge variant="default">{e.reviewStatus}</Badge>
                      {e.actorType === "ai_agent" ? (
                        <Badge variant="role-agent">agent</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-ink">{e.reasonForFlagging}</p>
                    <div className="mt-1 text-[11px] text-ink-subtle">
                      {formatDate(e.timestamp)}
                      {e.detectedPattern ? ` · pattern: ${e.detectedPattern}` : ""}
                      {e.customerProfile
                        ? ` · customer ${e.customerProfile.customerNumber}`
                        : ""}
                      {e.reviewer ? ` · reviewer ${e.reviewer.name}` : ""}
                    </div>
                  </div>
                  <div className="w-full max-w-md">
                    <JsonViewer
                      collapsed
                      label="payload"
                      data={{
                        id: e.id,
                        timestamp: e.timestamp,
                        severity: e.severity,
                        eventType: e.eventType,
                        actorType: e.actorType,
                        actorId: e.actorId,
                        customerProfileId: e.customerProfileId,
                        reasonForFlagging: e.reasonForFlagging,
                        detectedPattern: e.detectedPattern,
                        relatedAuditLogIds: e.relatedAuditLogIds
                          ? safeParse(e.relatedAuditLogIds)
                          : [],
                        relatedAgentActionLogIds: e.relatedAgentActionLogIds
                          ? safeParse(e.relatedAgentActionLogIds)
                          : [],
                        reviewStatus: e.reviewStatus,
                        reviewerNotes: e.reviewerNotes,
                      }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </PageShell>
  );
}

function safeParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return [];
  }
}

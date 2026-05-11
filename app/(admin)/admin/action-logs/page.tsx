import { requireSecurity } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/logging/logger";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge, RiskBadge } from "@/components/ui/badge";
import { JsonViewer } from "@/components/ui/json-viewer";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ActionLogsPage({
  searchParams,
}: {
  searchParams: { q?: string; risk?: string; actor?: string };
}) {
  await requireSecurity();
  const q = (searchParams.q ?? "").trim();
  const risk = searchParams.risk;
  const actor = searchParams.actor;

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { actorName: { contains: q } },
              { actionType: { contains: q } },
              { page: { contains: q } },
              { targetResource: { contains: q } },
              { reasonForFlagging: { contains: q } },
            ],
          }
        : {}),
      ...(risk && risk !== "all" ? { riskLevel: risk } : {}),
      ...(actor && actor !== "all" ? { actorType: actor } : {}),
    },
    orderBy: { timestamp: "desc" },
    take: 100,
  });

  await writeAuditLog({
    actionType: "action_logs_searched",
    page: "/admin/action-logs",
    toolOrFeatureUsed: "log_table",
    riskLevel: "low",
    actionOutcome: "viewed",
    inputDataSummary: {
      query: q || null,
      risk: risk ?? "all",
      actor: actor ?? "all",
      resultCount: logs.length,
    },
  });

  return (
    <PageShell>
      <SectionHeader
        title="Action logs"
        description="Full structured log search. Showing the latest 100 matching entries."
      />

      <Card>
        <form className="mb-4 flex flex-wrap items-center gap-3" method="get">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search any field"
            className="block min-w-[260px] flex-1 rounded-lg border border-line bg-bg-panel/60 px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-accent-cyan focus:outline-none"
          />
          <select
            name="risk"
            defaultValue={risk ?? "all"}
            className="rounded-lg border border-line bg-bg-panel/60 px-3 py-2 text-sm text-ink focus:outline-none"
          >
            <option value="all">All risk</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <select
            name="actor"
            defaultValue={actor ?? "all"}
            className="rounded-lg border border-line bg-bg-panel/60 px-3 py-2 text-sm text-ink focus:outline-none"
          >
            <option value="all">All actors</option>
            <option value="customer">Customer</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
            <option value="ai_agent">AI agent</option>
            <option value="anonymous">Anonymous</option>
          </select>
          <button
            type="submit"
            className="rounded-lg border border-line-strong bg-bg-elevated px-3 py-2 text-sm text-ink hover:bg-bg-subtle"
          >
            Apply
          </button>
        </form>

        <Table>
          <THead>
            <TR>
              <TH>Time</TH>
              <TH>Actor</TH>
              <TH>Action</TH>
              <TH>Target</TH>
              <TH>Risk</TH>
              <TH>Detail</TH>
            </TR>
          </THead>
          <tbody>
            {logs.length === 0 ? (
              <EmptyRow message="No logs match." />
            ) : (
              logs.map((l) => (
                <TR key={l.id}>
                  <TD className="whitespace-nowrap text-ink-muted">
                    {formatDate(l.timestamp)}
                  </TD>
                  <TD>
                    <div className="font-medium text-ink">
                      {l.actorName ?? l.actorType}
                    </div>
                    <div className="text-xs text-ink-subtle">
                      {l.role ?? l.actorType}{" "}
                      {l.createdByAgent ? (
                        <Badge variant="role-agent" className="ml-1">
                          agent
                        </Badge>
                      ) : null}
                    </div>
                  </TD>
                  <TD>{l.actionType.replaceAll("_", " ")}</TD>
                  <TD className="font-mono text-xs text-ink-muted">
                    {l.targetResource ?? "—"}
                  </TD>
                  <TD>
                    <RiskBadge level={l.riskLevel} />
                  </TD>
                  <TD>
                    <JsonViewer
                      collapsed
                      label="payload"
                      data={{
                        logId: l.id,
                        timestamp: l.timestamp,
                        actorType: l.actorType,
                        actorId: l.actorId,
                        actorName: l.actorName,
                        role: l.role,
                        customerTier: l.customerTier,
                        actionType: l.actionType,
                        page: l.page,
                        toolOrFeatureUsed: l.toolOrFeatureUsed,
                        inputDataSummary: l.inputDataSummary
                          ? safeParse(l.inputDataSummary)
                          : {},
                        targetResource: l.targetResource,
                        amount: l.amount,
                        riskLevel: l.riskLevel,
                        requiresApproval: l.requiresApproval,
                        approvalStatus: l.approvalStatus,
                        sessionId: l.sessionId,
                        ipAddress: l.ipAddress,
                        userIntent: l.userIntent,
                        actionOutcome: l.actionOutcome,
                        reasonForFlagging: l.reasonForFlagging,
                        createdByAgent: l.createdByAgent,
                      }}
                    />
                  </TD>
                </TR>
              ))
            )}
          </tbody>
        </Table>
      </Card>
    </PageShell>
  );
}

function safeParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

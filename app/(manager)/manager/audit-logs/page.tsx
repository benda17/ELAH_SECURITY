import { requireManager } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/logging/logger";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { RiskBadge, Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ManagerAuditLogsPage({
  searchParams,
}: {
  searchParams: { q?: string; risk?: string };
}) {
  await requireManager();
  const q = (searchParams.q ?? "").trim();
  const risk = searchParams.risk;

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { actorName: { contains: q } },
              { actionType: { contains: q } },
              { page: { contains: q } },
              { targetResource: { contains: q } },
            ],
          }
        : {}),
      ...(risk && risk !== "all" ? { riskLevel: risk } : {}),
    },
    orderBy: { timestamp: "desc" },
    take: 100,
  });

  await writeAuditLog({
    actionType: "audit_log_viewed",
    page: "/manager/audit-logs",
    toolOrFeatureUsed: "audit_table",
    riskLevel: "low",
    actionOutcome: "viewed",
    inputDataSummary: {
      query: q || null,
      risk: risk ?? "all",
      resultCount: logs.length,
    },
  });

  return (
    <PageShell>
      <SectionHeader
        title="Audit logs"
        description="Search across actor, action, page, and target. Limited to the 100 most recent matches."
      />

      <Card>
        <form className="mb-4 flex flex-wrap items-center gap-3" method="get">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search actor, action, page, target"
            className="block min-w-[260px] flex-1 rounded-lg border border-line bg-bg-panel/60 px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-accent-cyan focus:outline-none"
          />
          <select
            name="risk"
            defaultValue={risk ?? "all"}
            className="rounded-lg border border-line bg-bg-panel/60 px-3 py-2 text-sm text-ink focus:outline-none"
          >
            <option value="all">All risk levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <button
            type="submit"
            className="rounded-lg border border-line-strong bg-bg-elevated px-3 py-2 text-sm text-ink hover:bg-bg-subtle"
          >
            Search
          </button>
        </form>

        <Table>
          <THead>
            <TR>
              <TH>Time</TH>
              <TH>Actor</TH>
              <TH>Action</TH>
              <TH>Page</TH>
              <TH>Outcome</TH>
              <TH>Risk</TH>
            </TR>
          </THead>
          <tbody>
            {logs.length === 0 ? (
              <EmptyRow message="No log entries match your filters." />
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
                    <div className="text-xs text-ink-subtle capitalize">
                      {l.role ?? l.actorType}
                      {l.createdByAgent ? " · agent" : ""}
                    </div>
                  </TD>
                  <TD>{l.actionType.replaceAll("_", " ")}</TD>
                  <TD className="font-mono text-xs text-ink-muted">
                    {l.page ?? "—"}
                  </TD>
                  <TD>
                    <Badge variant="default">{l.actionOutcome}</Badge>
                  </TD>
                  <TD>
                    <RiskBadge level={l.riskLevel} />
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

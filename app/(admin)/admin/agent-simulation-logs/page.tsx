import { Bot } from "lucide-react";
import { requireSecurity } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/logging/logger";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Badge, RiskBadge } from "@/components/ui/badge";
import { JsonViewer } from "@/components/ui/json-viewer";
import { Empty } from "@/components/ui/empty";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AgentSimulationLogsPage() {
  await requireSecurity();

  const traces = await prisma.agentActionLog.findMany({
    orderBy: { timestamp: "desc" },
  });

  await writeAuditLog({
    actionType: "agent_simulation_logs_viewed",
    page: "/admin/agent-simulation-logs",
    toolOrFeatureUsed: "agent_log_dashboard",
    riskLevel: "low",
    actionOutcome: "viewed",
    inputDataSummary: { traces: traces.length },
  });

  return (
    <PageShell>
      <SectionHeader
        title="Agent simulation logs"
        description="Seeded mock agent sessions. Phase 5+ will populate this with live agent traces."
      />

      {traces.length === 0 ? (
        <Empty
          icon={<Bot className="size-5" />}
          title="No agent traces yet"
          description="Future phases will log agent task, interpreted intent, executed actions, and ELAH's verdict."
        />
      ) : (
        <div className="space-y-4">
          {traces.map((t) => (
            <Card key={t.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="role-agent">AI agent</Badge>
                    <span className="font-mono text-[11px] text-ink-subtle">
                      session {t.agentSessionId}
                    </span>
                    <RiskBadge level={t.riskLevel} />
                    <Badge
                      variant={
                        t.intentMatchStatus === "aligned"
                          ? "status-approved"
                          : t.intentMatchStatus === "drifting"
                            ? "warning"
                            : "status-rejected"
                      }
                    >
                      intent: {t.intentMatchStatus}
                    </Badge>
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-ink">
                    Declared task: {t.declaredTask}
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    Interpreted intent:{" "}
                    <span className="text-ink">{t.interpretedIntent}</span>
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-ink-muted md:grid-cols-4">
                    <KV k="Action" v={t.actionType} />
                    <KV k="Outcome" v={t.actionOutcome} />
                    <KV k="Page" v={t.page ?? "—"} />
                    <KV k="Tool" v={t.toolOrFeatureUsed ?? "—"} />
                  </div>
                  <p className="mt-3 rounded-lg border border-accent-gold/30 bg-accent-gold/5 p-2 text-xs text-accent-gold">
                    ELAH verdict (placeholder):{" "}
                    <span className="text-ink">
                      {t.elahVerdictPlaceholder ?? "to be determined"}
                    </span>
                  </p>
                  <div className="mt-2 text-[11px] text-ink-subtle">
                    {formatDate(t.timestamp)}
                  </div>
                </div>
                <div className="w-full max-w-md">
                  <JsonViewer
                    collapsed
                    label="agent payload"
                    data={{
                      id: t.id,
                      agentId: t.agentId,
                      agentSessionId: t.agentSessionId,
                      declaredTask: t.declaredTask,
                      interpretedIntent: t.interpretedIntent,
                      actorRoleContext: t.actorRoleContext,
                      page: t.page,
                      toolOrFeatureUsed: t.toolOrFeatureUsed,
                      actionType: t.actionType,
                      targetResource: t.targetResource,
                      actionOutcome: t.actionOutcome,
                      riskLevel: t.riskLevel,
                      intentMatchStatus: t.intentMatchStatus,
                      inputDataSummary: t.inputDataSummary
                        ? safeParse(t.inputDataSummary)
                        : {},
                      elahVerdictPlaceholder: t.elahVerdictPlaceholder,
                    }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-ink-subtle">
        {k}
      </div>
      <div className="text-ink">{v}</div>
    </div>
  );
}

function safeParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

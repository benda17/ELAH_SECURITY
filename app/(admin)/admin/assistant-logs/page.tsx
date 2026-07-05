import Link from "next/link";
import { Bot } from "lucide-react";
import { requireSecurity } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/logging/logger";
import { formatAgentEventLabel, agentEventBadgeVariant } from "@/lib/agent/display";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JsonViewer } from "@/components/ui/json-viewer";
import { Empty } from "@/components/ui/empty";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function parseJsonField<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default async function AssistantLogsPage() {
  await requireSecurity();

  const [logs, users] = await Promise.all([
    prisma.agentEventLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 200,
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
    }),
  ]);

  const userMap = new Map(users.map((u) => [u.id, u]));

  await writeAuditLog({
    actionType: "assistant_logs_viewed",
    page: "/admin/assistant-logs",
    toolOrFeatureUsed: "assistant_event_log_dashboard",
    riskLevel: "low",
    actionOutcome: "viewed",
    inputDataSummary: { logs: logs.length },
  });

  return (
    <PageShell>
      <SectionHeader
        title="In-app assistant logs"
        description="Live structured events from customer AI assistant conversations — tool calls, policy checks, confirmations, and security signals."
      />

      {logs.length === 0 ? (
        <Empty
          icon={<Bot className="size-5" />}
          title="No assistant logs yet"
          description="Events appear here when customers use the AI Assistant at /assistant."
        />
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const actor = log.userId ? userMap.get(log.userId) : null;
            return (
              <Card key={log.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={agentEventBadgeVariant(log.eventType)}>
                        {log.eventType.replace(/_/g, " ")}
                      </Badge>
                      {log.policyDecision ? (
                        <Badge variant="info">{log.policyDecision}</Badge>
                      ) : null}
                      {log.riskScore != null && log.riskScore >= 50 ? (
                        <Badge variant="status-rejected">risk {log.riskScore}</Badge>
                      ) : null}
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-ink">
                      {formatAgentEventLabel(log.eventType, log.toolName)}
                    </h3>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-ink-muted md:grid-cols-4">
                      <KV k="User" v={actor?.name ?? log.userId ?? "—"} />
                      <KV k="Tool" v={log.toolName ?? "—"} />
                      <KV k="Intent" v={log.detectedIntent ?? "—"} />
                      <KV k="Time" v={formatDate(log.timestamp)} />
                    </div>
                    {log.userMessage ? (
                      <p className="mt-2 text-sm text-ink-muted">
                        <span className="text-ink-subtle">User: </span>
                        {log.userMessage}
                      </p>
                    ) : null}
                    {log.assistantMessage ? (
                      <p className="mt-1 text-sm text-ink-muted">
                        <span className="text-ink-subtle">Assistant: </span>
                        {log.assistantMessage}
                      </p>
                    ) : null}
                    {log.resultSummary ? (
                      <p className="mt-1 text-xs text-ink-subtle">{log.resultSummary}</p>
                    ) : null}
                  </div>
                  <div className="w-full max-w-md">
                    <JsonViewer
                      collapsed
                      label="event payload"
                      data={{
                        logId: log.id,
                        eventType: log.eventType,
                        userId: log.userId,
                        conversationId: log.conversationId,
                        messageId: log.messageId,
                        toolName: log.toolName,
                        toolArgsSanitized: parseJsonField(log.toolArgsSanitized, {}),
                        policyDecision: log.policyDecision,
                        policyReasons: parseJsonField(log.policyReasons, []),
                        riskScore: log.riskScore,
                        latencyMs: log.latencyMs,
                        metadata: parseJsonField(log.metadata, {}),
                      }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-ink-subtle">{k}</div>
      <div className="truncate text-ink">{v}</div>
    </div>
  );
}

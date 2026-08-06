import {
  getAgentEventLogs,
  getAssistantConversationStatus,
  getAssistantStatsOverview,
} from "@/lib/queries";

export const metadata = { title: "ELAH · Agent Logs" };
export const dynamic = "force-dynamic";

export default async function AgentLogsPage() {
  const [overview, logs, convStatus] = await Promise.all([
    getAssistantStatsOverview(),
    getAgentEventLogs(150),
    getAssistantConversationStatus(),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <p className="panel-title">Agent activity</p>
        <h1 className="text-2xl font-semibold">Agent Logs</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {overview.eventTotal.toLocaleString()} events ·{" "}
          {overview.conversationTotal.toLocaleString()} conversations ·{" "}
          {overview.securityEvents.toLocaleString()} security signals
        </p>
      </header>

      <div className="flex flex-wrap gap-3 text-xs">
        {convStatus.map((s) => (
          <span
            key={s.status}
            className="rounded-full border border-surface-border px-3 py-1 capitalize"
          >
            {s.status}: {s.count}
          </span>
        ))}
      </div>

      <section className="panel overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-surface-border text-[10px] uppercase text-ink-dim">
              <th className="py-2 pr-3">Time</th>
              <th className="py-2 pr-3">User</th>
              <th className="py-2 pr-3">Event</th>
              <th className="py-2 pr-3">Tool</th>
              <th className="py-2 pr-3">Policy</th>
              <th className="py-2 pr-3">Risk</th>
              <th className="py-2">Summary</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-surface-border/40 align-top">
                <td className="py-2 pr-3 whitespace-nowrap text-xs text-ink-dim">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="py-2 pr-3 text-xs">{log.userName}</td>
                <td className="py-2 pr-3 text-xs font-mono">{log.eventType}</td>
                <td className="py-2 pr-3 text-xs">{log.toolName ?? "—"}</td>
                <td className="py-2 pr-3 text-xs capitalize">
                  {log.policyDecision ?? "—"}
                </td>
                <td className="py-2 pr-3 text-xs tabular-nums">
                  {log.riskScore ?? "—"}
                </td>
                <td className="py-2 max-w-xs truncate text-xs text-ink-muted">
                  {log.resultSummary ?? log.userMessage ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

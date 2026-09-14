import {
  getCrmConversationStatus,
  getCrmEventLogs,
  getCrmStatsOverview,
} from "@/lib/crm/queries";
import { isCrmDatabaseConfigured } from "@/lib/crm/config";

export const metadata = { title: "ELAH · CRM command logs" };
export const dynamic = "force-dynamic";

export default async function BankingCrmLogsPage() {
  const [overview, logs, convStatus] = await Promise.all([
    getCrmStatsOverview(),
    getCrmEventLogs(200),
    getCrmConversationStatus(),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <p className="panel-title">CRM System</p>
        <h1 className="text-2xl font-semibold">Command logs</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {overview.eventTotal.toLocaleString()} events in SQLite · showing the latest{" "}
          {logs.length.toLocaleString()} · {overview.securityEvents.toLocaleString()} security
          signals. ELAH scores come from ElahScoreSnapshot, not the event row.
        </p>
      </header>

      {!isCrmDatabaseConfigured() ? (
        <p className="text-sm text-accent-amber">CRM_DATABASE_URL is not set.</p>
      ) : null}

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
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead>
            <tr className="border-b border-surface-border text-[10px] uppercase text-ink-dim">
              <th className="py-2 pr-3">Time</th>
              <th className="py-2 pr-3">User</th>
              <th className="py-2 pr-3">Event</th>
              <th className="py-2 pr-3">Tool / intent</th>
              <th className="py-2 pr-3">Policy</th>
              <th className="py-2 pr-3">ELAH</th>
              <th className="py-2">Summary</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-surface-border/40 align-top">
                <td className="whitespace-nowrap py-2 pr-3 text-xs text-ink-dim">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="py-2 pr-3 text-xs">
                  <div>{log.userName}</div>
                  <div className="text-[10px] text-ink-dim">
                    {log.persona || log.source || log.userEmail}
                  </div>
                </td>
                <td className="py-2 pr-3 font-mono text-xs">{log.eventType}</td>
                <td className="py-2 pr-3 text-xs">
                  <div>{log.toolName ?? "—"}</div>
                  <div className="text-[10px] text-ink-dim">{log.intentLabel ?? ""}</div>
                </td>
                <td className="py-2 pr-3 text-xs capitalize">{log.policyDecision ?? "—"}</td>
                <td className="py-2 pr-3 text-xs tabular-nums">
                  {log.genuineIntentScore != null
                    ? `${log.genuineIntentScore.toFixed(2)} · ${log.recommendation ?? ""}`
                    : "—"}
                </td>
                <td className="max-w-xs truncate py-2 text-xs text-ink-muted">
                  {log.resultSummary ?? log.userMessage ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-muted">No command logs yet.</p>
        ) : null}
      </section>
    </div>
  );
}

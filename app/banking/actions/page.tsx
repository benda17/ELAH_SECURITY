import {
  getAgentPendingActions,
  getAssistantStatsOverview,
  getRecentToolCallEvents,
} from "@/lib/queries";

export const metadata = { title: "ELAH · Agent Actions" };
export const dynamic = "force-dynamic";

export default async function BankingActionsPage() {
  const [overview, pending, toolCalls] = await Promise.all([
    getAssistantStatsOverview(),
    getAgentPendingActions(80),
    getRecentToolCallEvents(80),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <p className="panel-title">Tool calls & confirmations</p>
        <h1 className="text-2xl font-semibold">Actions</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {overview.toolExecutions.toLocaleString()} tool executions ·{" "}
          {overview.pendingActions.toLocaleString()} pending confirmations
        </p>
      </header>

      <section className="panel">
        <h2 className="mb-3 panel-title">Pending actions</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-ink-muted">No pending actions.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-surface-border text-[10px] uppercase text-ink-dim">
                  <th className="py-2 pr-3">Created</th>
                  <th className="py-2 pr-3">User</th>
                  <th className="py-2 pr-3">Tool</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2">Summary</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((a) => (
                  <tr key={a.id} className="border-b border-surface-border/40">
                    <td className="py-2 pr-3 text-xs text-ink-dim">
                      {new Date(a.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2 pr-3 text-xs">{a.userName}</td>
                    <td className="py-2 pr-3 text-xs font-mono">{a.toolName}</td>
                    <td className="py-2 pr-3 text-xs capitalize">{a.status}</td>
                    <td className="py-2 text-xs text-ink-muted">{a.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <h2 className="mb-3 panel-title">Recent tool calls</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-surface-border text-[10px] uppercase text-ink-dim">
                <th className="py-2 pr-3">Time</th>
                <th className="py-2 pr-3">User</th>
                <th className="py-2 pr-3">Event</th>
                <th className="py-2 pr-3">Tool</th>
                <th className="py-2 pr-3">Policy</th>
                <th className="py-2">Result</th>
              </tr>
            </thead>
            <tbody>
              {toolCalls.map((t) => (
                <tr key={t.id} className="border-b border-surface-border/40">
                  <td className="py-2 pr-3 text-xs text-ink-dim">
                    {new Date(t.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2 pr-3 text-xs">{t.userName}</td>
                  <td className="py-2 pr-3 text-xs font-mono">{t.eventType}</td>
                  <td className="py-2 pr-3 text-xs">{t.toolName ?? "—"}</td>
                  <td className="py-2 pr-3 text-xs capitalize">
                    {t.policyDecision ?? "—"}
                  </td>
                  <td className="py-2 text-xs text-ink-muted">
                    {t.resultSummary ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

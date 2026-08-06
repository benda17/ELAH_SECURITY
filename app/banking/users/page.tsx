import { getBankingUsersWithAssistantStats } from "@/lib/queries";

export const metadata = { title: "ELAH · Banking Users" };
export const dynamic = "force-dynamic";

export default async function BankingUsersPage() {
  const users = await getBankingUsersWithAssistantStats(100);

  return (
    <div className="space-y-6">
      <header>
        <p className="panel-title">Customers</p>
        <h1 className="text-2xl font-semibold">Banking Users</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Demo customers with AI assistant conversation and event activity.
        </p>
      </header>

      <section className="panel overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-surface-border text-[10px] uppercase text-ink-dim">
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Tier</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Conversations</th>
              <th className="py-2 pr-3">Events</th>
              <th className="py-2 pr-3">Pending</th>
              <th className="py-2">Last login</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-surface-border/40">
                <td className="py-2 pr-3">
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-ink-dim">{u.email}</p>
                </td>
                <td className="py-2 pr-3 capitalize">{u.tier}</td>
                <td className="py-2 pr-3 capitalize">{u.status}</td>
                <td className="py-2 pr-3 tabular-nums">{u.conversations}</td>
                <td className="py-2 pr-3 tabular-nums">{u.eventCount}</td>
                <td className="py-2 pr-3 tabular-nums">{u.pendingActions}</td>
                <td className="py-2 text-xs text-ink-dim">
                  {u.lastLoginAt
                    ? new Date(u.lastLoginAt).toLocaleDateString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

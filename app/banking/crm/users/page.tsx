import { getCrmUsersWithStats } from "@/lib/crm/queries";

export const metadata = { title: "ELAH · CRM users" };
export const dynamic = "force-dynamic";

export default async function BankingCrmUsersPage() {
  const users = await getCrmUsersWithStats(50);

  return (
    <div className="space-y-6">
      <header>
        <p className="panel-title">CRM System</p>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Demo workspaces with command-log volume from the CRM simulator database.
        </p>
      </header>

      <section className="panel overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-surface-border text-[10px] uppercase text-ink-dim">
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Workspace</th>
              <th className="py-2 pr-3">Plan</th>
              <th className="py-2 pr-3">Commands</th>
              <th className="py-2 pr-3">Conversations</th>
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
                <td className="py-2 pr-3 text-xs">{u.workspace}</td>
                <td className="py-2 pr-3 capitalize">{u.plan}</td>
                <td className="py-2 pr-3 tabular-nums">{u.eventCount.toLocaleString()}</td>
                <td className="py-2 pr-3 tabular-nums">{u.conversations}</td>
                <td className="py-2 pr-3 tabular-nums">{u.pendingActions}</td>
                <td className="py-2 text-xs text-ink-dim">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-muted">No CRM customers found.</p>
        ) : null}
      </section>
    </div>
  );
}

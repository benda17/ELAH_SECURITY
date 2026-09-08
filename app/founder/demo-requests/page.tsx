import {
  countDemoRequests,
  listDemoRequests,
} from "@/lib/demo/repository";

export const metadata = { title: "ELAH · Demo requests" };
export const dynamic = "force-dynamic";

export default async function DemoRequestsPage() {
  let count = 0;
  let requests: Awaited<ReturnType<typeof listDemoRequests>> = [];
  let loadError: string | null = null;

  try {
    [count, requests] = await Promise.all([
      countDemoRequests(),
      listDemoRequests(),
    ]);
  } catch {
    loadError =
      "Could not read DemoRequest rows. Create the table, then npx prisma generate.";
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="panel-title">Inbound</p>
        <h1 className="text-2xl font-semibold">Demo requests</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          Leads from the marketing /demo form. Reply from your inbox and book a
          30-minute walkthrough — the site does not open a mailto.
        </p>
      </header>

      {loadError ? (
        <p className="rounded-lg border border-accent-amber/40 bg-accent-amber/10 px-3 py-2 text-sm text-accent-amber">
          {loadError}
        </p>
      ) : null}

      <section className="panel py-4">
        <p className="panel-title">Open requests</p>
        <p className="stat-value mt-1 text-2xl">{loadError ? "—" : count}</p>
        <p className="mt-1 text-xs text-ink-dim">From the database, not a placeholder</p>
      </section>

      <section className="panel">
        <h2 className="mb-3 text-sm font-semibold">Inbox</h2>
        {loadError ? (
          <p className="text-sm text-ink-muted">List unavailable until the table exists.</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-ink-muted">
            No demo requests yet. The public /demo page writes here.
          </p>
        ) : (
          <ul className="space-y-3">
            {requests.map((row) => (
              <li
                key={row.id}
                className="rounded border border-surface-border px-3 py-3 text-sm"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium text-ink">
                    {row.name}{" "}
                    <span className="font-normal text-ink-muted">· {row.company}</span>
                  </p>
                  <p className="text-[11px] text-ink-dim">
                    {row.createdAt.toISOString()}
                  </p>
                </div>
                <p className="mt-1 text-ink-muted">
                  <a className="text-accent-cyan hover:underline" href={`mailto:${row.email}`}>
                    {row.email}
                  </a>
                  {row.role ? ` · ${row.role}` : ""}
                </p>
                {row.goal ? (
                  <p className="mt-2 text-ink">{row.goal}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

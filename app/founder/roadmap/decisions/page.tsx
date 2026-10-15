import { loadRoadmapPageData } from "@/lib/roadmap/server";

export const metadata = { title: "APACT · Decisions" };

export default async function DecisionsPage() {
  const { decisions } = await loadRoadmapPageData();
  const groups = {
    open: decisions.filter((d) => d.status === "open"),
    under_investigation: decisions.filter((d) => d.status === "under_investigation"),
    decided: decisions.filter((d) => d.status === "decided"),
    revisit_later: decisions.filter((d) => d.status === "revisit_later"),
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="panel-title">Decisions and open questions</p>
        <h1 className="text-2xl font-semibold">Protocol and product decisions</h1>
        <p className="mt-1 max-w-3xl text-sm text-ink-muted">
          Open calls on the admission flow, the guest-travel profile, token
          lifetime, step-up and authority adapters, and which guest actions stay
          blocked.
        </p>
      </header>
      {(
        Object.entries(groups) as [string, typeof decisions][]
      ).map(([label, items]) => (
        <section key={label} className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
            {label.replace(/_/g, " ")} ({items.length})
          </h2>
          {items.map((d) => (
            <div key={d.id} className="panel space-y-2">
              <p className="font-medium">{d.question}</p>
              {d.context && <p className="text-sm text-ink-muted">{d.context}</p>}
              {d.options.length > 0 && (
                <ul className="list-inside list-disc text-xs text-ink-dim">
                  {d.options.map((o) => (
                    <li key={o}>{o}</li>
                  ))}
                </ul>
              )}
              {d.chosenOption && (
                <p className="text-sm text-accent-emerald">
                  Chosen: {d.chosenOption}
                </p>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-ink-dim">No questions in this group.</p>
          )}
        </section>
      ))}
    </div>
  );
}

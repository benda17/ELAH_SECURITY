import { loadRoadmapPageData } from "@/lib/roadmap/server";

export const metadata = { title: "ELAH Roadmap · Decisions" };

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
        <p className="panel-title">Decisions & open questions</p>
        <h1 className="text-2xl font-semibold">Architecture & product decisions</h1>
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
            <p className="text-sm text-ink-dim">None in this category.</p>
          )}
        </section>
      ))}
    </div>
  );
}

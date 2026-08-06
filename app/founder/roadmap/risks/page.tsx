import { loadRoadmapPageData } from "@/lib/roadmap/server";

export const metadata = { title: "ELAH Roadmap · Risks" };

const MATRIX = [
  { p: "low", i: "low" },
  { p: "low", i: "high" },
  { p: "high", i: "low" },
  { p: "high", i: "high" },
];

export default async function RisksPage() {
  const { risks, tasks } = await loadRoadmapPageData();
  const blockers = tasks.filter(
    (t) => t.status === "blocked" || t.blockingReason,
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="panel-title">Risks & blockers</p>
        <h1 className="text-2xl font-semibold">Risk register</h1>
      </header>

      <div className="panel">
        <p className="panel-title mb-3">Probability × impact</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MATRIX.map(({ p, i }) => {
            const cell = risks.filter(
              (r) =>
                (r.probability ?? "low") === p && (r.impact ?? "low") === i,
            );
            return (
              <div
                key={`${p}-${i}`}
                className="min-h-[100px] rounded-lg border border-surface-border p-2"
              >
                <p className="text-[10px] uppercase text-ink-dim">
                  P:{p} · I:{i}
                </p>
                <ul className="mt-1 space-y-1 text-xs">
                  {cell.map((r) => (
                    <li key={r.id}>{r.description.slice(0, 80)}…</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        {risks.map((r) => (
          <div key={r.id} className="panel">
            <p className="font-medium">{r.description}</p>
            <p className="mt-1 text-xs text-ink-muted">
              {r.riskType} · {r.severity} · Owner: {r.owner ?? "—"}
            </p>
            {r.mitigationPlan && (
              <p className="mt-2 text-sm text-ink-muted">{r.mitigationPlan}</p>
            )}
          </div>
        ))}
      </div>

      {blockers.length > 0 && (
        <div className="panel border-accent-rose/30">
          <p className="panel-title text-accent-rose">Task blockers</p>
          <ul className="mt-2 space-y-1 text-sm">
            {blockers.map((t) => (
              <li key={t.id}>
                {t.title}
                {t.blockingReason && ` — ${t.blockingReason}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

import { loadRoadmapPageData } from "@/lib/roadmap/server";

export const metadata = { title: "APACT · Experiments" };

export default async function ExperimentsPage() {
  const { experiments } = await loadRoadmapPageData();
  return (
    <div className="space-y-4">
      <header>
        <p className="panel-title">Experiments and validation</p>
        <h1 className="text-2xl font-semibold">Admission experiments</h1>
        <p className="mt-1 max-w-3xl text-sm text-ink-muted">
          Hypotheses for the entrance widget, the three inert exercises,
          guest-travel allow and block rules, key-bound tokens, and adversarial
          evaluation.
        </p>
      </header>
      {experiments.length === 0 && (
        <p className="text-sm text-ink-dim">
          No experiments recorded yet. This view tracks admission, guest-travel,
          and adversarial tests.
        </p>
      )}
      <div className="grid gap-3">
        {experiments.map((e) => (
          <div key={e.id} className="panel space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">{e.title}</h2>
              <span className="pill border-surface-border text-ink-muted">{e.status}</span>
            </div>
            {e.hypothesis && (
              <p className="text-sm">
                <span className="text-ink-dim">Hypothesis:</span> {e.hypothesis}
              </p>
            )}
            {e.testMethod && (
              <p className="text-sm text-ink-muted">{e.testMethod}</p>
            )}
            {e.successMetric && (
              <p className="text-xs text-accent-cyan">Metric: {e.successMetric}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

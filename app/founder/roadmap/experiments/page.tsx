import { loadRoadmapPageData } from "@/lib/roadmap/server";

export const metadata = { title: "ELAH Roadmap · Experiments" };

export default async function ExperimentsPage() {
  const { experiments } = await loadRoadmapPageData();
  return (
    <div className="space-y-4">
      <header>
        <p className="panel-title">Experiments & validation</p>
        <h1 className="text-2xl font-semibold">Model & security experiments</h1>
      </header>
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

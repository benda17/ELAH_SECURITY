import { loadRoadmapPageData } from "@/lib/roadmap/server";
import { milestoneCompletionFromTasks } from "@/lib/roadmap/metrics";
import { ProgressBar } from "@/components/roadmap-dashboard/progress-bar";
import { StatusBadge } from "@/components/roadmap-dashboard/badges";

export const metadata = { title: "ELAH Roadmap · Milestones" };

export default async function MilestonesPage() {
  const { milestones, tasks } = await loadRoadmapPageData();

  return (
    <div className="space-y-4">
      <header>
        <p className="panel-title">Milestones</p>
        <h1 className="text-2xl font-semibold">Major milestones</h1>
      </header>
      <div className="space-y-4">
        {milestones.map((m) => {
          const linked = tasks.filter((t) => t.milestoneId === m.id);
          const blocked = linked.filter((t) => t.status === "blocked");
          const calc = milestoneCompletionFromTasks(m.id, tasks);
          return (
            <div key={m.id} className="panel space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">{m.title}</h2>
                  <p className="text-xs text-ink-muted">
                    Owner: {m.owner ?? "—"} · Status: {m.status}
                  </p>
                </div>
                <ProgressBar value={calc} className="w-36" label="Completion" />
              </div>
              {m.exitCriteria && (
                <div>
                  <p className="panel-title">Exit criteria</p>
                  <p className="text-sm text-ink-muted">{m.exitCriteria}</p>
                </div>
              )}
              {m.risks && (
                <p className="text-sm text-accent-amber">{m.risks}</p>
              )}
              {blocked.length > 0 && (
                <p className="text-xs text-accent-rose">
                  {blocked.length} blocking task(s)
                </p>
              )}
              <div className="grid gap-1 sm:grid-cols-2">
                {linked.slice(0, 10).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 text-xs text-ink-muted"
                  >
                    <StatusBadge status={t.status} />
                    <span className="truncate">{t.title}</span>
                  </div>
                ))}
                {linked.length > 10 && (
                  <p className="text-xs text-ink-dim">+{linked.length - 10} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

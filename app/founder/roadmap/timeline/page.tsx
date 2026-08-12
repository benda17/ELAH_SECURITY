import { PHASE_ORDER } from "@/lib/roadmap/constants";
import { milestoneCompletionFromTasks } from "@/lib/roadmap/metrics";
import { loadRoadmapPageData } from "@/lib/roadmap/server";
import { ProgressBar } from "@/components/roadmap-dashboard/progress-bar";
import { StatusBadge } from "@/components/roadmap-dashboard/badges";
import { TaskOpenButton } from "@/components/roadmap-dashboard/task-open-button";

export const metadata = { title: "ELAH Roadmap · Timeline" };

export default async function TimelinePage() {
  const { tasks, milestones } = await loadRoadmapPageData();

  return (
    <div className="space-y-6">
      <header>
        <p className="panel-title">Roadmap timeline</p>
        <h1 className="text-2xl font-semibold">Phases & milestones</h1>
      </header>

      <div className="space-y-4">
        {PHASE_ORDER.map((phase) => {
          const phaseTasks = tasks.filter((t) => t.phase === phase);
          const done = phaseTasks.filter((t) => t.status === "done").length;
          const pct =
            phaseTasks.length > 0
              ? Math.round((done / phaseTasks.length) * 100)
              : 0;
          const blocked = phaseTasks.filter((t) => t.status === "blocked");

          return (
            <div key={phase} className="panel">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{phase}</h2>
                  <p className="text-xs text-ink-muted">
                    {done}/{phaseTasks.length} done · {blocked.length} blocked
                  </p>
                </div>
                <ProgressBar value={pct} className="w-40" />
              </div>
              <div className="mt-3 grid gap-1 sm:grid-cols-2">
                {phaseTasks
                  .filter((t) => t.isCriticalPath || t.status === "blocked")
                  .slice(0, 8)
                  .map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-2 rounded border border-surface-border/50 px-2 py-1 text-xs"
                    >
                      <StatusBadge status={t.status} />
                      <TaskOpenButton
                        task={t}
                        allTasks={tasks}
                        className="truncate text-xs font-medium"
                      />
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="panel">
        <p className="panel-title mb-3">Milestones</p>
        <div className="space-y-3">
          {milestones.map((m) => {
            const calc = milestoneCompletionFromTasks(m.id, tasks);
            return (
              <div
                key={m.id}
                className="flex flex-wrap items-center gap-4 border-b border-surface-border/40 pb-3 last:border-0"
              >
                <div className="min-w-[200px] flex-1">
                  <p className="font-medium">{m.title}</p>
                  {m.targetDate && (
                    <p className="text-xs text-ink-dim">
                      Target {new Date(m.targetDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <ProgressBar value={calc} className="w-32" />
                <p className="max-w-md text-xs text-ink-muted">{m.exitCriteria}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

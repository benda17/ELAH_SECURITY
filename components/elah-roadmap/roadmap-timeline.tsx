import { CheckCircle2, Circle, CircleDot } from "lucide-react";
import { ROADMAP_MILESTONES } from "@/lib/elah-roadmap-data";
import { cn } from "@/lib/utils";

function milestoneStatus(id: number): "done" | "active" | "upcoming" {
  if (id === 1) return "active";
  if (id <= 0) return "done";
  return "upcoming";
}

export function RoadmapTimeline() {
  const doneCount = ROADMAP_MILESTONES.filter((m) => milestoneStatus(m.id) === "done").length;
  const progressPct = Math.round(
    ((doneCount + 0.5) / ROADMAP_MILESTONES.length) * 100,
  );

  return (
    <section className="panel">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="panel-title">Roadmap timeline</h2>
          <p className="mt-1 text-xs text-ink-muted">
            Ten milestones from product definition through MVP demo readiness
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-ink-dim">Program progress</p>
          <p className="text-lg font-semibold tabular-nums text-accent-cyan">{progressPct}%</p>
        </div>
      </div>

      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-surface-subtle">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="space-y-0">
        {ROADMAP_MILESTONES.map((milestone, index) => {
          const status = milestoneStatus(milestone.id);
          const isLast = index === ROADMAP_MILESTONES.length - 1;

          return (
            <div key={milestone.id} className="relative flex gap-4 pb-8">
              {!isLast && (
                <div
                  className={cn(
                    "absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px",
                    status === "done" ? "bg-accent-emerald/50" : "bg-surface-border",
                  )}
                />
              )}

              <div className="relative z-10 shrink-0">
                {status === "done" && (
                  <CheckCircle2 className="size-8 text-accent-emerald" />
                )}
                {status === "active" && (
                  <CircleDot className="size-8 text-accent-cyan" />
                )}
                {status === "upcoming" && (
                  <Circle className="size-8 text-ink-dim" />
                )}
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-[10px] font-semibold tabular-nums text-ink-dim">
                    M{milestone.id}
                  </span>
                  <h3
                    className={cn(
                      "text-sm font-semibold",
                      status === "active" ? "text-accent-cyan" : "text-ink",
                    )}
                  >
                    {milestone.title}
                  </h3>
                  {status === "active" && (
                    <span className="pill border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan">
                      In progress
                    </span>
                  )}
                </div>

                <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {milestone.tasks.map((task) => (
                    <li
                      key={task}
                      className="flex items-start gap-2 text-xs text-ink-muted"
                    >
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-surface-border" />
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

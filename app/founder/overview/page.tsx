import { BarChart3, CheckCircle2, Clock, Flag, ShieldAlert, Target } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { PriorityBadge, StatusBadge } from "@/components/roadmap-dashboard/badges";
import { PhaseCompletionChart } from "@/components/roadmap-dashboard/phase-completion-chart";
import { ProgressBar } from "@/components/roadmap-dashboard/progress-bar";
import { loadRoadmapPageData } from "@/lib/roadmap/server";

export const metadata = {
  title: "ELAH Founder Roadmap · Overview",
};

export default async function ElahRoadmapOverviewPage() {
  const { metrics, tasks, milestones, risks } = await loadRoadmapPageData();
  const blocked = tasks.filter((t) => t.status === "blocked");
  const criticalOpen = tasks.filter(
    (t) => t.isCriticalPath && t.status !== "done",
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="panel-title">Executive overview</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          ELAH → Banking MVP
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-ink-muted">
          Operational control center for product, engineering, data, validation,
          pilot, and fundraising. Metrics computed from live roadmap data.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="MVP completion"
          value={`${metrics.overallCompletion}%`}
          hint={`${metrics.tasksCompleted} / ${metrics.tasksTotal} tasks done`}
          icon={<Target className="size-4" />}
          tone="info"
        />
        <StatCard
          label="In progress"
          value={metrics.tasksInProgress}
          hint={`${metrics.tasksBlocked} blocked · ${metrics.tasksOverdue} overdue`}
          icon={<Clock className="size-4" />}
        />
        <StatCard
          label="Critical path"
          value={`${metrics.criticalPathCompletion}%`}
          hint={`${criticalOpen.length} open CP tasks`}
          icon={<Flag className="size-4" />}
          tone="warning"
        />
        <StatCard
          label="Next milestone"
          value={
            metrics.daysToNextMilestone != null
              ? `${metrics.daysToNextMilestone}d`
              : "—"
          }
          hint={metrics.nextMilestone?.title ?? "None scheduled"}
          icon={<CheckCircle2 className="size-4" />}
          tone="success"
        />
      </div>

      <div className="panel">
        <p className="panel-title">Current phase</p>
        <p className="text-lg font-medium">{metrics.currentPhase}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel">
          <p className="panel-title mb-3">Readiness scores</p>
          <div className="space-y-3">
            {Object.entries(metrics.readiness).map(([key, val]) => (
              <ProgressBar
                key={key}
                label={key.replace(/([A-Z])/g, " $1")}
                value={val}
              />
            ))}
          </div>
        </div>
        <div className="panel">
          <p className="panel-title mb-3">Completion by phase</p>
          <PhaseCompletionChart data={metrics.completionByPhase} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="size-4 text-accent-cyan" />
            <p className="panel-title">Top 5 priorities</p>
          </div>
          <ul className="space-y-2">
            {metrics.topPriorities.map((t) => (
              <li
                key={t.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-surface-border/60 px-3 py-2"
              >
                <span className="text-sm">{t.title}</span>
                <PriorityBadge priority={t.priority} />
              </li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <div className="mb-3 flex items-center gap-2">
            <ShieldAlert className="size-4 text-accent-rose" />
            <p className="panel-title">Major risks</p>
          </div>
          <ul className="space-y-2">
            {risks.slice(0, 5).map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-accent-rose/20 bg-accent-rose/5 px-3 py-2 text-sm"
              >
                {r.description}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {blocked.length > 0 && (
        <div className="panel border-accent-rose/30">
          <p className="panel-title text-accent-rose">Blocked tasks</p>
          <ul className="mt-2 space-y-1 text-sm">
            {blocked.map((t) => (
              <li key={t.id}>
                <StatusBadge status={t.status} /> {t.title}
                {t.blockingReason && (
                  <span className="text-ink-dim"> — {t.blockingReason}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="panel">
        <p className="panel-title mb-2">Milestone snapshot</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {milestones.slice(0, 6).map((m) => (
            <div
              key={m.id}
              className="rounded-lg border border-surface-border px-3 py-2"
            >
              <p className="text-sm font-medium">{m.title}</p>
              <ProgressBar value={m.completionPercentage} className="mt-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

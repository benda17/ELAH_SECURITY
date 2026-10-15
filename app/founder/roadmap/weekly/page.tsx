import { loadRoadmapPageData } from "@/lib/roadmap/server";
import { isTaskOverdue } from "@/lib/roadmap/metrics";
import { StatusBadge } from "@/components/roadmap-dashboard/badges";
import { TaskOpenButton } from "@/components/roadmap-dashboard/task-open-button";

export const metadata = { title: "APACT · Weekly view" };

export default async function WeeklyPage() {
  const { metrics, tasks, decisions, contacts } = await loadRoadmapPageData();
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const recentlyUpdated = tasks.filter((t) => t.updatedAt >= weekAgo);
  const newlyBlocked = tasks.filter(
    (t) => t.status === "blocked" && t.updatedAt >= weekAgo,
  );
  const openDecisions = decisions.filter((d) => d.status === "open");

  return (
    <div className="space-y-6">
      <header>
        <p className="panel-title">Weekly founder view</p>
        <h1 className="text-2xl font-semibold">This week&apos;s execution</h1>
        <p className="max-w-3xl text-sm text-ink-muted">
          Week of {now.toLocaleDateString()}. Priorities, due work, and
          follow-ups for the APACT execution board.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel">
          <p className="panel-title mb-2">Top priorities</p>
          <ul className="space-y-2">
            {metrics.topPriorities.map((t) => (
              <li key={t.id}>
                <TaskOpenButton task={t} allTasks={tasks} className="text-sm" />
              </li>
            ))}
            {metrics.topPriorities.length === 0 && (
              <li className="text-sm text-ink-dim">No priorities flagged.</li>
            )}
          </ul>
        </div>
        <div className="panel">
          <p className="panel-title mb-2">Due this week</p>
          <ul className="space-y-2">
            {metrics.weeklyDue.map((t) => (
              <li key={t.id}>
                <TaskOpenButton task={t} allTasks={tasks} className="text-sm" />
              </li>
            ))}
            {metrics.weeklyDue.length === 0 && (
              <li className="text-sm text-ink-dim">
                No execution-board tasks due this week.
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel">
          <p className="panel-title mb-2">Overdue tasks</p>
          <ul className="space-y-1">
            {tasks
              .filter((t) => isTaskOverdue(t, now))
              .slice(0, 10)
              .map((t) => (
                <li key={t.id} className="flex items-center gap-2 text-sm">
                  <StatusBadge status={t.status} />
                  <TaskOpenButton task={t} allTasks={tasks} className="text-sm font-normal" />
                </li>
              ))}
            {tasks.filter((t) => isTaskOverdue(t, now)).length === 0 && (
              <li className="text-sm text-ink-dim">No overdue tasks.</li>
            )}
          </ul>
        </div>
        <div className="panel">
          <p className="panel-title mb-2">Overdue follow-ups</p>
          <ul className="space-y-1 text-sm">
            {metrics.overdueFollowUps.map((c) => (
              <li key={c.id}>
                {c.name} — {c.organization}
              </li>
            ))}
            {metrics.overdueFollowUps.length === 0 && (
              <li className="text-ink-dim">
                No overdue investor or design-partner follow-ups.
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="panel">
        <p className="panel-title mb-2">Progress since last week</p>
        <p className="text-sm text-ink-muted">
          {recentlyUpdated.length} tasks updated in the last 7 days.
          {newlyBlocked.length > 0 &&
            ` ${newlyBlocked.length} newly blocked.`}
        </p>
      </div>

      <div className="panel">
        <p className="panel-title mb-2">Decisions needed</p>
        <ul className="space-y-2">
          {openDecisions.map((d) => (
            <li key={d.id} className="text-sm">
              {d.question}
            </li>
          ))}
          {openDecisions.length === 0 && (
            <li className="text-sm text-ink-dim">
              No protocol or product decisions waiting.
            </li>
          )}
        </ul>
      </div>

      <div className="panel">
        <p className="panel-title mb-2">Planned outcomes (next 7 days)</p>
        <ul className="list-inside list-disc text-sm text-ink-muted">
          <li>
            Close Phase 0 — APACT product definition: entrance widget, bounded
            declaration, three inert exercises, and a short-lived key-bound token.
          </li>
          <li>
            Advance Phase 1 — Thin guest-travel slice. Flight search and guest
            draft saving are allowed. Payment, contracts, and export are blocked.
          </li>
          <li>
            Book the next design-partner or investor conversation on admission
            for AI agents (Phase 8 — Design partners and Phase 10 — Fundraising
            narrative for the pivot).
          </li>
        </ul>
      </div>
    </div>
  );
}

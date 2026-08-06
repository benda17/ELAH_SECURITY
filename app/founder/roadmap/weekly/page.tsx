import { loadRoadmapPageData } from "@/lib/roadmap/server";
import { isTaskOverdue } from "@/lib/roadmap/metrics";
import { StatusBadge } from "@/components/roadmap-dashboard/badges";

export const metadata = { title: "ELAH Roadmap · Weekly View" };

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
        <p className="text-sm text-ink-muted">
          Week of {now.toLocaleDateString()}
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel">
          <p className="panel-title mb-2">Top priorities</p>
          <ul className="space-y-2">
            {metrics.topPriorities.map((t) => (
              <li key={t.id} className="text-sm">
                {t.title}
              </li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <p className="panel-title mb-2">Due this week</p>
          <ul className="space-y-2">
            {metrics.weeklyDue.map((t) => (
              <li key={t.id} className="text-sm">
                {t.title}
              </li>
            ))}
            {metrics.weeklyDue.length === 0 && (
              <li className="text-sm text-ink-dim">No tasks due this week.</li>
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
                  {t.title}
                </li>
              ))}
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
              <li className="text-ink-dim">No overdue outreach follow-ups.</li>
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
        </ul>
      </div>

      <div className="panel">
        <p className="panel-title mb-2">Planned outcomes (next 7 days)</p>
        <ul className="list-inside list-disc text-sm text-ink-muted">
          <li>Advance critical-path schema and mock API tasks</li>
          <li>Verify simulator event coverage (Phase 1)</li>
          <li>Schedule first banking expert interview (Phase 11)</li>
        </ul>
      </div>
    </div>
  );
}

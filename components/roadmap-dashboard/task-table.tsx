"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { RoadmapTaskRecord, TaskStatus } from "@/lib/roadmap/types";
import { TASK_STATUSES } from "@/lib/roadmap/types";
import { PriorityBadge, StatusBadge } from "./badges";
import { ProgressBar } from "./progress-bar";

export function TaskTable({ tasks }: { tasks: RoadmapTaskRecord[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<RoadmapTaskRecord | null>(null);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.phase.toLowerCase().includes(q) ||
        (t.owner?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [tasks, search, statusFilter]);

  async function patchTask(id: string, patch: Record<string, unknown>) {
    await fetch(`/api/founder/roadmap/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks…"
          className="min-w-[200px] flex-1 rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-surface-border">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-surface-border bg-surface-raised/60 text-[10px] uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="px-3 py-2">Task</th>
              <th className="px-3 py-2">Phase</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Owner</th>
              <th className="px-3 py-2">Progress</th>
              <th className="px-3 py-2">Due</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((task) => (
              <tr
                key={task.id}
                className="border-b border-surface-border/50 hover:bg-surface-raised/30"
              >
                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="text-left font-medium text-ink hover:text-accent-cyan"
                    onClick={() => setSelected(task)}
                  >
                    {task.title}
                  </button>
                </td>
                <td className="max-w-[140px] truncate px-3 py-2 text-xs text-ink-muted">
                  {task.phase.replace(/^Phase \d+ — /, "P")}
                </td>
                <td className="px-3 py-2">
                  <select
                    className="rounded border border-surface-border bg-transparent text-xs"
                    value={task.status}
                    onChange={(e) =>
                      void patchTask(task.id, { status: e.target.value as TaskStatus })
                    }
                  >
                    {TASK_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className="px-3 py-2">
                  <input
                    className="w-24 rounded border border-surface-border bg-transparent px-1 text-xs"
                    defaultValue={task.owner ?? ""}
                    onBlur={(e) => {
                      if (e.target.value !== (task.owner ?? "")) {
                        void patchTask(task.id, { owner: e.target.value || null });
                      }
                    }}
                  />
                </td>
                <td className="w-28 px-3 py-2">
                  <ProgressBar value={task.progressPercentage} />
                </td>
                <td className="px-3 py-2 text-xs text-ink-muted">
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="panel space-y-3">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-lg font-semibold">{selected.title}</h3>
            <button
              type="button"
              className="text-xs text-ink-muted hover:text-ink"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={selected.status} />
            <PriorityBadge priority={selected.priority} />
          </div>
          <p className="text-sm text-ink-muted">{selected.phase}</p>
          {selected.notes && (
            <p className="rounded-lg border border-surface-border bg-surface-base/50 p-3 text-sm text-ink-muted">
              {selected.notes}
            </p>
          )}
          {selected.successCriteria && (
            <div>
              <p className="panel-title">Success criteria</p>
              <p className="text-sm text-ink-muted">{selected.successCriteria}</p>
            </div>
          )}
          {selected.dependencyIds.length > 0 && (
            <div>
              <p className="panel-title">Dependencies</p>
              <p className="text-xs text-ink-dim">{selected.dependencyIds.join(", ")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

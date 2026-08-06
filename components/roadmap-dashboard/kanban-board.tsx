"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { KANBAN_COLUMNS } from "@/lib/roadmap/constants";
import type { RoadmapTaskRecord, TaskStatus } from "@/lib/roadmap/types";
import { PriorityBadge, StatusBadge } from "./badges";
import { ProgressBar } from "./progress-bar";
import { cn } from "@/lib/utils";

export function KanbanBoard({ tasks }: { tasks: RoadmapTaskRecord[] }) {
  const router = useRouter();
  const [dragging, setDragging] = useState<string | null>(null);

  async function moveTask(id: string, status: TaskStatus) {
    await fetch(`/api/founder/roadmap/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.key);
        return (
          <div
            key={col.key}
            className="min-w-[260px] flex-1 rounded-xl border border-surface-border bg-surface-raised/40"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragging) void moveTask(dragging, col.key);
              setDragging(null);
            }}
          >
            <div className="flex items-center justify-between border-b border-surface-border px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                {col.label}
              </span>
              <span className="text-xs tabular-nums text-ink-dim">{colTasks.length}</span>
            </div>
            <div className="space-y-2 p-2">
              {colTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => setDragging(task.id)}
                  className={cn(
                    "cursor-grab rounded-lg border border-surface-border bg-surface-base/80 p-3 active:cursor-grabbing",
                    task.isCriticalPath && "border-accent-amber/30",
                  )}
                >
                  <p className="text-sm font-medium leading-snug text-ink">{task.title}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <PriorityBadge priority={task.priority} />
                    {task.isCriticalPath && (
                      <span className="pill border-accent-amber/40 text-accent-amber">CP</span>
                    )}
                    {task.blockingReason && (
                      <span className="pill border-accent-rose/40 text-accent-rose">Blocked</span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-ink-dim">
                    <span>{task.workstream}</span>
                    {task.owner && <span>{task.owner}</span>}
                  </div>
                  <ProgressBar value={task.progressPercentage} className="mt-2" />
                  {task.dueDate && (
                    <p className="mt-1 text-[10px] text-ink-muted">
                      Due {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  )}
                  <select
                    className="mt-2 w-full rounded border border-surface-border bg-surface-raised px-2 py-1 text-[10px] text-ink-muted"
                    value={task.status}
                    onChange={(e) => void moveTask(task.id, e.target.value as TaskStatus)}
                  >
                    {KANBAN_COLUMNS.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              {colTasks.length === 0 && (
                <p className="px-2 py-6 text-center text-xs text-ink-dim">No tasks</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

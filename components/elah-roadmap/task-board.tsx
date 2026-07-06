"use client";

import { useMemo, useState } from "react";
import {
  TASK_BOARD,
  TASK_GROUPS,
  type RoadmapTask,
  type TaskGroup,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/elah-roadmap-data";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

const STATUS_STYLE: Record<TaskStatus, string> = {
  todo: "border-surface-border bg-surface-subtle/40 text-ink-muted",
  in_progress: "border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan",
  done: "border-accent-emerald/40 bg-accent-emerald/10 text-accent-emerald",
};

const PRIORITY_STYLE: Record<TaskPriority, string> = {
  high: "text-accent-rose",
  medium: "text-accent-amber",
  low: "text-ink-dim",
};

function TaskRow({ task }: { task: RoadmapTask }) {
  return (
    <tr className="border-b border-surface-border/60 last:border-0">
      <td className="py-2.5 pr-3 text-sm text-ink">{task.title}</td>
      <td className="py-2.5 pr-3">
        <span className={cn("pill text-[10px]", STATUS_STYLE[task.status])}>
          {STATUS_LABEL[task.status]}
        </span>
      </td>
      <td className={cn("py-2.5 pr-3 text-xs font-medium capitalize", PRIORITY_STYLE[task.priority])}>
        {task.priority}
      </td>
      <td className="py-2.5 pr-3 text-xs text-ink-muted">{task.owner}</td>
      <td className="py-2.5 text-xs tabular-nums text-ink-dim">{task.effort}</td>
    </tr>
  );
}

export function TaskBoard() {
  const [activeGroup, setActiveGroup] = useState<TaskGroup | "All">("All");

  const filtered = useMemo(() => {
    if (activeGroup === "All") return TASK_BOARD;
    return TASK_BOARD.filter((t) => t.group === activeGroup);
  }, [activeGroup]);

  const stats = useMemo(() => {
    const total = TASK_BOARD.length;
    const done = TASK_BOARD.filter((t) => t.status === "done").length;
    const inProgress = TASK_BOARD.filter((t) => t.status === "in_progress").length;
    return { total, done, inProgress };
  }, []);

  return (
    <section className="panel">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="panel-title">Task board</h2>
          <p className="mt-1 text-xs text-ink-muted">
            Static mock data — structured for future backend connection
          </p>
        </div>
        <div className="flex gap-4 text-xs text-ink-muted">
          <span>
            <strong className="text-accent-emerald">{stats.done}</strong> done
          </span>
          <span>
            <strong className="text-accent-cyan">{stats.inProgress}</strong> in progress
          </span>
          <span>
            <strong className="text-ink">{stats.total}</strong> total
          </span>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterPill
          label="All"
          active={activeGroup === "All"}
          onClick={() => setActiveGroup("All")}
        />
        {TASK_GROUPS.map((group) => (
          <FilterPill
            key={group}
            label={group}
            active={activeGroup === group}
            onClick={() => setActiveGroup(group)}
          />
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-surface-border">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-surface-border bg-surface-subtle/50 text-[10px] uppercase tracking-wider text-ink-dim">
              <th className="px-3 py-2 font-semibold">Task</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Priority</th>
              <th className="px-3 py-2 font-semibold">Owner</th>
              <th className="px-3 py-2 font-semibold">Effort</th>
            </tr>
          </thead>
          <tbody className="px-3">
            {filtered.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan"
          : "border-surface-border text-ink-muted hover:border-surface-border hover:text-ink",
      )}
    >
      {label}
    </button>
  );
}

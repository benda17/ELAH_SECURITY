"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  KANBAN_COLUMNS,
  PHASE_ORDER,
  PRIORITY_FILTERS,
  PRIORITY_LABELS,
  compareTasksByImportance,
  phaseShortLabel,
  type PriorityFilter,
} from "@/lib/roadmap/constants";
import { WORKSTREAMS, type RoadmapTaskRecord, type TaskStatus } from "@/lib/roadmap/types";
import { PriorityBadge } from "./badges";
import { ProgressBar } from "./progress-bar";
import { TaskDetailModal } from "./task-detail-modal";
import { cn } from "@/lib/utils";

function matchesKanbanFilters(
  task: RoadmapTaskRecord,
  filters: {
    priority: PriorityFilter;
    phase: string;
    workstream: string;
    criticalOnly: boolean;
    search: string;
  },
): boolean {
  if (filters.priority !== "all" && task.priority !== filters.priority) return false;
  if (filters.phase && task.phase !== filters.phase) return false;
  if (filters.workstream && task.workstream !== filters.workstream) return false;
  if (filters.criticalOnly && !task.isCriticalPath) return false;
  if (filters.search) {
    const q = filters.search.toLowerCase();
    const hay = `${task.title} ${task.phase} ${task.workstream} ${task.owner ?? ""}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

export function KanbanBoard({ tasks }: { tasks: RoadmapTaskRecord[] }) {
  const router = useRouter();
  const [dragging, setDragging] = useState<string | null>(null);
  const [selected, setSelected] = useState<RoadmapTaskRecord | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [phaseFilter, setPhaseFilter] = useState("");
  const [workstreamFilter, setWorkstreamFilter] = useState("");
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [mobileCol, setMobileCol] = useState<TaskStatus>("in_progress");
  const didDrag = useRef(false);

  const relatedTitles = useMemo(
    () => Object.fromEntries(tasks.map((t) => [t.id, t.title])),
    [tasks],
  );

  const filters = {
    priority: priorityFilter,
    phase: phaseFilter,
    workstream: workstreamFilter,
    criticalOnly,
    search: search.trim(),
  };

  const hasActiveFilters =
    priorityFilter !== "all" ||
    Boolean(phaseFilter) ||
    Boolean(workstreamFilter) ||
    criticalOnly ||
    Boolean(filters.search);

  const phasesPresent = useMemo((): string[] => {
    const seen = new Set(tasks.map((t) => t.phase));
    const ordered = PHASE_ORDER.filter((p) => seen.has(p));
    const extras = [...seen]
      .filter((p) => !ordered.includes(p as (typeof PHASE_ORDER)[number]))
      .sort();
    return [...ordered, ...extras];
  }, [tasks]);

  const workstreamsPresent = useMemo((): string[] => {
    const seen = new Set(tasks.map((t) => t.workstream));
    const known = WORKSTREAMS.filter((w) => seen.has(w));
    const extras = [...seen].filter((w) => !known.includes(w as (typeof WORKSTREAMS)[number])).sort();
    return [...known, ...extras];
  }, [tasks]);

  const priorityCounts = useMemo(() => {
    const base = tasks.filter((t) =>
      matchesKanbanFilters(t, {
        priority: "all",
        phase: phaseFilter,
        workstream: workstreamFilter,
        criticalOnly,
        search: search.trim(),
      }),
    );
    const counts: Record<PriorityFilter, number> = {
      all: base.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    for (const t of base) {
      if (t.priority in counts) {
        counts[t.priority as Exclude<PriorityFilter, "all">] += 1;
      }
    }
    return counts;
  }, [tasks, phaseFilter, workstreamFilter, criticalOnly, search]);

  const visibleTasks = useMemo(() => {
    return tasks
      .filter((t) =>
        matchesKanbanFilters(t, {
          priority: priorityFilter,
          phase: phaseFilter,
          workstream: workstreamFilter,
          criticalOnly,
          search: search.trim(),
        }),
      )
      .sort(compareTasksByImportance);
  }, [tasks, priorityFilter, phaseFilter, workstreamFilter, criticalOnly, search]);

  async function moveTask(id: string, status: TaskStatus) {
    await fetch(`/api/founder/roadmap/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  function clearFilters() {
    setPriorityFilter("all");
    setPhaseFilter("");
    setWorkstreamFilter("");
    setCriticalOnly(false);
    setSearch("");
  }

  const selectedFresh =
    selected == null ? null : (tasks.find((t) => t.id === selected.id) ?? selected);

  const selectClass =
    "rounded-lg border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-ink";

  return (
    <>
      <div className="space-y-3 rounded-xl border border-surface-border bg-surface-raised/40 px-3 py-3">
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-[160px] flex-1 basis-full sm:basis-auto">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
              Search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Title, phase, owner…"
              className={cn(selectClass, "w-full min-h-11 lg:min-h-0")}
            />
          </label>
          <label className="min-w-[140px] flex-1">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
              Phase
            </span>
            <select
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value)}
              className={cn(selectClass, "w-full min-h-11 lg:min-h-0")}
              aria-label="Filter by phase"
            >
              <option value="">All phases</option>
              {phasesPresent.map((phase) => {
                const n = tasks.filter(
                  (t) =>
                    t.phase === phase &&
                    matchesKanbanFilters(t, { ...filters, phase: "" }),
                ).length;
                return (
                  <option key={phase} value={phase}>
                    {phaseShortLabel(phase)} ({n})
                  </option>
                );
              })}
            </select>
          </label>
          <label className="min-w-[140px] flex-1">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
              Workstream
            </span>
            <select
              value={workstreamFilter}
              onChange={(e) => setWorkstreamFilter(e.target.value)}
              className={cn(selectClass, "w-full min-h-11 lg:min-h-0")}
              aria-label="Filter by workstream"
            >
              <option value="">All workstreams</option>
              {workstreamsPresent.map((ws) => {
                const n = tasks.filter(
                  (t) =>
                    t.workstream === ws &&
                    matchesKanbanFilters(t, { ...filters, workstream: "" }),
                ).length;
                return (
                  <option key={ws} value={ws}>
                    {ws} ({n})
                  </option>
                );
              })}
            </select>
          </label>
          <button
            type="button"
            aria-pressed={criticalOnly}
            onClick={() => setCriticalOnly((v) => !v)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs",
              criticalOnly
                ? "border-accent-amber/40 bg-accent-amber/15 text-accent-amber"
                : "border-surface-border text-ink-muted hover:text-ink",
            )}
          >
            Critical path only
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-surface-border px-3 py-1.5 text-xs text-ink-muted hover:text-ink"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
              Importance
            </p>
            <p className="text-[11px] text-ink-dim">
              Critical cards stay at the top of every column.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by importance">
            {PRIORITY_FILTERS.map((key) => {
              const active = priorityFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setPriorityFilter(key)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs capitalize",
                    active
                      ? "border-accent-cyan/40 bg-accent-cyan/15 text-accent-cyan"
                      : "border-surface-border text-ink-muted hover:text-ink",
                  )}
                >
                  {PRIORITY_LABELS[key]} ({priorityCounts[key]})
                </button>
              );
            })}
          </div>
        </div>
        <p className="text-[11px] text-ink-dim">
          Showing {visibleTasks.length} of {tasks.length} tasks
          {phaseFilter ? ` · ${phaseShortLabel(phaseFilter)}` : ""}
          {workstreamFilter ? ` · ${workstreamFilter}` : ""}
          {criticalOnly ? " · critical path" : ""}.
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1 md:hidden" role="tablist" aria-label="Kanban column">
        {KANBAN_COLUMNS.map((col) => {
          const n = visibleTasks.filter((t) => t.status === col.key).length;
          const active = mobileCol === col.key;
          return (
            <button
              key={col.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setMobileCol(col.key)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-2 text-xs",
                active
                  ? "border-accent-cyan/40 bg-accent-cyan/15 text-accent-cyan"
                  : "border-surface-border text-ink-muted",
              )}
            >
              {col.label} ({n})
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:overflow-x-auto md:pb-4">
        {KANBAN_COLUMNS.map((col) => {
          const colTasks = visibleTasks.filter((t) => t.status === col.key);
          return (
            <div
              key={col.key}
              className={cn(
                "rounded-xl border border-surface-border bg-surface-raised/40 md:min-w-[260px] md:flex-1",
                mobileCol !== col.key && "hidden md:block",
              )}
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
                    onDragStart={() => {
                      didDrag.current = false;
                      setDragging(task.id);
                    }}
                    onDrag={() => {
                      didDrag.current = true;
                    }}
                    onClick={() => {
                      if (!didDrag.current) setSelected(task);
                    }}
                    className={cn(
                      "cursor-grab rounded-lg border border-surface-border bg-surface-base/80 p-3 active:cursor-grabbing",
                      task.priority === "critical" && "border-accent-rose/40",
                      task.isCriticalPath &&
                        task.priority !== "critical" &&
                        "border-accent-amber/30",
                      "hover:border-accent-cyan/40",
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
                    <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-ink-dim">
                      <span className="truncate">{phaseShortLabel(task.phase)}</span>
                      <span>{task.workstream}</span>
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
                      onClick={(e) => e.stopPropagation()}
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
                  <p className="px-2 py-6 text-center text-xs text-ink-dim">
                    {hasActiveFilters ? "No tasks match filters" : "No tasks"}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedFresh && (
        <TaskDetailModal
          task={selectedFresh}
          relatedTitles={relatedTitles}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

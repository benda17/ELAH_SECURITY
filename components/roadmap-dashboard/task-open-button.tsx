"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { RoadmapTaskRecord } from "@/lib/roadmap/types";
import { cn } from "@/lib/utils";
import { TaskDetailModal } from "./task-detail-modal";

/** Clickable task title for server-rendered lists — opens the shared detail modal. */
export function TaskOpenButton({
  task,
  allTasks,
  className,
  children,
}: {
  task: RoadmapTaskRecord;
  allTasks?: RoadmapTaskRecord[];
  className?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const relatedTitles = useMemo(() => {
    if (!allTasks?.length) return undefined;
    return Object.fromEntries(allTasks.map((t) => [t.id, t.title]));
  }, [allTasks]);

  return (
    <>
      <button
        type="button"
        className={cn(
          "text-left font-medium text-ink transition-colors hover:text-accent-cyan",
          className,
        )}
        onClick={() => setOpen(true)}
      >
        {children ?? task.title}
      </button>
      {open && (
        <TaskDetailModal
          task={task}
          relatedTitles={relatedTitles}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

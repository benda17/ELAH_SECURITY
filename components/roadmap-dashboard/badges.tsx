import { STATUS_COLORS, STATUS_LABELS } from "@/lib/roadmap/constants";
import type { TaskStatus } from "@/lib/roadmap/types";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
}: {
  status: TaskStatus | string;
  className?: string;
}) {
  const key = status as TaskStatus;
  const label = STATUS_LABELS[key] ?? status.replace(/_/g, " ");
  const colors = STATUS_COLORS[key] ?? "border-surface-border bg-surface-raised text-ink-muted";
  return (
    <span className={cn("pill capitalize", colors, className)}>{label}</span>
  );
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: string;
  className?: string;
}) {
  const colors: Record<string, string> = {
    critical: "border-accent-rose/40 text-accent-rose",
    high: "border-accent-amber/40 text-accent-amber",
    medium: "border-accent-cyan/30 text-accent-cyan",
    low: "border-surface-border text-ink-dim",
  };
  return (
    <span className={cn("pill", colors[priority] ?? colors.low, className)}>
      {priority}
    </span>
  );
}

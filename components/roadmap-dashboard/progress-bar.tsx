import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  label,
}: {
  value: number;
  className?: string;
  label?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <div className="flex justify-between text-[10px] text-ink-muted">
          <span>{label}</span>
          <span className="tabular-nums">{v}%</span>
        </div>
      )}
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-border/60">
        <div
          className="h-full rounded-full bg-accent-cyan transition-all"
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
}

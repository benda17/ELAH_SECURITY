import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "danger" | "success" | "warning" | "info";
  className?: string;
}) {
  const toneClasses: Record<typeof tone, string> = {
    default: "text-ink",
    danger: "text-accent-rose",
    success: "text-accent-emerald",
    warning: "text-accent-amber",
    info: "text-accent-cyan",
  };
  return (
    <div className={cn("panel flex flex-col gap-2", className)}>
      <div className="flex items-start justify-between">
        <span className="panel-title">{label}</span>
        {icon && <span className="text-ink-muted">{icon}</span>}
      </div>
      <div className={cn("stat-value", toneClasses[tone])}>{value}</div>
      {hint && <div className="text-xs text-ink-muted">{hint}</div>}
    </div>
  );
}

import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("elah-panel p-6", className)}>{children}</div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex items-start justify-between gap-4", className)}>
      <div>
        <h3 className="text-base font-semibold tracking-tight text-ink">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-sm text-ink-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  trend,
  icon,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  trend?: React.ReactNode;
  icon?: React.ReactNode;
  accent?: "gold" | "cyan" | "emerald" | "rose" | "amber";
}) {
  const accentClass: Record<string, string> = {
    gold: "text-accent-gold",
    cyan: "text-accent-cyan",
    emerald: "text-accent-emerald",
    rose: "text-accent-rose",
    amber: "text-accent-amber",
  };
  return (
    <div className="elah-panel p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
          {label}
        </p>
        {icon ? (
          <div
            className={cn(
              "rounded-md bg-bg-elevated p-1.5 border border-line",
              accent ? accentClass[accent] : "text-ink-muted",
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-2xl font-semibold tracking-tight text-ink">
          {value}
        </div>
        {trend ? (
          <span className="text-xs font-medium text-ink-muted">{trend}</span>
        ) : null}
      </div>
      {hint ? (
        <p className="mt-1 text-xs text-ink-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

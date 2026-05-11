import { cn } from "@/lib/utils";

export function Empty({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "elah-panel flex flex-col items-center justify-center p-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-3 rounded-full bg-bg-elevated p-3 text-ink-muted border border-line">
          {icon}
        </div>
      ) : null}
      <h4 className="text-base font-semibold text-ink">{title}</h4>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

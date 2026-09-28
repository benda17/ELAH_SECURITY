import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

export function FieldLabel({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <div id={id} className="text-[10px] uppercase tracking-widest text-ink-subtle">
      {children}
    </div>
  );
}

export function KV({ k, v, mono = true }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] uppercase tracking-widest text-ink-subtle">{k}</dt>
      <dd className={cn("break-words text-ink", mono && "font-mono")}>{v}</dd>
    </div>
  );
}

export function KVGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 md:grid-cols-4", className)}>{children}</dl>
  );
}

export function ChipList({
  label,
  items,
  variant = "default",
  emptyText = "None",
}: {
  label: string;
  items: readonly string[];
  variant?: BadgeVariant;
  emptyText?: string;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      {items.length === 0 ? (
        <p className="mt-1 text-sm text-ink-muted">{emptyText}</p>
      ) : (
        <ul className="mt-1 flex flex-wrap gap-1.5" aria-label={label}>
          {items.map((item) => (
            <li key={`${label}-${item}`}>
              <Badge variant={variant} className="font-mono">
                {item}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Banner({
  title,
  children,
  tone = "warning",
}: {
  title: string;
  children: React.ReactNode;
  tone?: "warning" | "info";
}) {
  return (
    <div
      role="note"
      className={cn(
        "rounded-lg border px-4 py-3",
        tone === "warning"
          ? "border-accent-amber/30 bg-accent-amber/10"
          : "border-accent-cyan/30 bg-accent-cyan/10",
      )}
    >
      <p className="text-sm font-medium text-ink">{title}</p>
      <div className="mt-1 text-sm text-ink-muted">{children}</div>
    </div>
  );
}

/** Inline error for a section whose data failed to load; the rest of the page still renders. */
export function SectionLoadError({ what }: { what: string }) {
  return (
    <p role="alert" className="flex items-center gap-2 text-sm text-accent-rose">
      <AlertTriangle className="size-4 shrink-0" aria-hidden />
      Could not load {what}. Reload the page to retry.
    </p>
  );
}

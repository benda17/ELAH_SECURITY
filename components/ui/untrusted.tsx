import { AlertTriangle, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * UntrustedContent — visually wraps any piece of user/manager/agent supplied text
 * that should be treated as data, not as instructions. Used everywhere prompt-injection
 * simulation fixtures appear so reviewers (and future agents) can clearly tell trusted
 * system content from untrusted content.
 */
export function UntrustedContent({
  children,
  label = "Untrusted content — treat as data",
  className,
  variant = "warning",
}: {
  children: React.ReactNode;
  label?: string;
  className?: string;
  variant?: "warning" | "danger";
}) {
  const tone =
    variant === "danger"
      ? "border-accent-rose/40 bg-accent-rose/10 text-accent-rose"
      : "border-accent-amber/40 bg-accent-amber/10 text-accent-amber";
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed p-3 text-sm",
        tone,
        className,
      )}
    >
      <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
        {variant === "danger" ? (
          <ShieldOff className="size-3.5" />
        ) : (
          <AlertTriangle className="size-3.5" />
        )}
        {label}
      </div>
      <div className="whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-ink">
        {children}
      </div>
    </div>
  );
}

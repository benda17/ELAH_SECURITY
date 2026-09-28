import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { truncateText } from "./list-helpers";

/**
 * Compact, single-line counterpart of `UntrustedContent` for table cells.
 * Customer text is data, never instructions: rendered as escaped plain text.
 */
export function UntrustedSnippet({
  text,
  max = 90,
  className,
}: {
  text: string | null | undefined;
  max?: number;
  className?: string;
}) {
  if (!text || !text.trim()) return <span className="text-xs text-ink-subtle">—</span>;
  const shown = truncateText(text, max);
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-start gap-1.5 rounded border border-dashed border-accent-amber/40 bg-accent-amber/5 px-1.5 py-0.5 font-mono text-[11px] leading-snug text-ink",
        className,
      )}
      title={text.length > 500 ? `${text.slice(0, 500)}…` : text}
    >
      <AlertTriangle aria-hidden className="mt-0.5 size-3 shrink-0 text-accent-amber" />
      <span className="sr-only">Untrusted customer text: </span>
      <span className="min-w-0 break-words">{shown}</span>
    </span>
  );
}

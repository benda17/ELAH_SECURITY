"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function JsonViewer({
  data,
  className,
  collapsed = false,
  label,
}: {
  data: unknown;
  className?: string;
  collapsed?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(!collapsed);
  return (
    <div
      className={cn(
        "rounded-lg border border-line bg-bg-panel/40 text-xs",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 border-b border-line px-3 py-2 text-left text-[11px] uppercase tracking-wider text-ink-subtle hover:text-ink"
      >
        {open ? (
          <ChevronDown className="size-3.5" />
        ) : (
          <ChevronRight className="size-3.5" />
        )}
        {label ?? "JSON"}
      </button>
      {open ? (
        <pre className="overflow-x-auto p-3 font-mono text-[12px] leading-relaxed text-ink">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

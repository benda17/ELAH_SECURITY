"use client";

import dynamic from "next/dynamic";
import { Component, useState, type ReactNode } from "react";
import { Box, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IntentMatrixPoint } from "@/lib/intent-matrix-points";
import { IntentMatrixScatter } from "@/components/charts/intent-matrix";

class Chart3DErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

const IntentMatrixScatter3D = dynamic(
  () =>
    import("@/components/charts/intent-matrix-3d").then((m) => m.IntentMatrixScatter3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[560px] items-center justify-center rounded-xl border border-surface-border bg-surface-subtle/30 text-sm text-ink-muted">
        Loading 3D view…
      </div>
    ),
  },
);

type ViewMode = "2d" | "3d";

export function IntentMatrixView({ data }: { data: IntentMatrixPoint[] }) {
  const [mode, setMode] = useState<ViewMode>("3d");
  const [threeFailed, setThreeFailed] = useState(false);

  const effectiveMode = threeFailed ? "2d" : mode;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-surface-border bg-surface-subtle/50 p-0.5">
          <button
            type="button"
            onClick={() => setMode("2d")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
              effectiveMode === "2d"
                ? "bg-accent-cyan/15 text-accent-cyan"
                : "text-ink-muted hover:text-ink",
            )}
          >
            <Layers className="size-3.5" />
            2D projection
          </button>
          <button
            type="button"
            onClick={() => setMode("3d")}
            disabled={threeFailed}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
              effectiveMode === "3d"
                ? "bg-accent-cyan/15 text-accent-cyan"
                : "text-ink-muted hover:text-ink",
              threeFailed && "cursor-not-allowed opacity-40",
            )}
          >
            <Box className="size-3.5" />
            3D space
          </button>
        </div>
        <p className="text-[11px] text-ink-dim">
          {effectiveMode === "3d"
            ? "Drag to rotate · scroll to zoom · click a dot for details"
            : "Hover dots for message details · bubble size = urgency (z)"}
        </p>
      </div>

      {effectiveMode === "2d" ? (
        <IntentMatrixScatter data={data} />
      ) : (
        <Chart3DErrorBoundary onError={() => setThreeFailed(true)}>
          <IntentMatrixScatter3D data={data} />
        </Chart3DErrorBoundary>
      )}
    </div>
  );
}

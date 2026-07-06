import { ChevronRight } from "lucide-react";
import { ARCHITECTURE_STEPS } from "@/lib/elah-roadmap-data";

export function ArchitectureFlow() {
  return (
    <section className="panel">
      <h2 className="panel-title">Architecture</h2>
      <p className="mt-1 text-xs text-ink-muted">
        ELAH runs as a separate service — the bank app sends events; the bank
        applies its own policy layer after receiving the score.
      </p>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-2">
        {ARCHITECTURE_STEPS.map((step, i) => (
          <div key={step.label} className="flex flex-1 items-center gap-2 lg:flex-col lg:gap-3">
            <div className="flex flex-1 flex-col rounded-xl border border-surface-border bg-surface-subtle/40 p-4 lg:min-h-[100px]">
              <span className="mb-1 text-[10px] font-semibold tabular-nums text-accent-cyan">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="text-sm font-semibold text-ink">{step.label}</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                {step.detail}
              </p>
            </div>
            {i < ARCHITECTURE_STEPS.length - 1 && (
              <ChevronRight className="hidden size-4 shrink-0 text-ink-dim lg:block" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

import { Tags } from "lucide-react";
import { BANKING_INTENTS } from "@/lib/elah-roadmap-data";
import { cn } from "@/lib/utils";

const INTENT_TONES: Record<string, string> = {
  ambiguous_banking_request: "border-accent-amber/40 bg-accent-amber/10 text-accent-amber",
  non_banking_request: "border-ink-dim/40 bg-surface-subtle text-ink-muted",
  prompt_injection_or_policy_bypass:
    "border-accent-rose/40 bg-accent-rose/10 text-accent-rose",
};

function intentTone(intent: string): string {
  return (
    INTENT_TONES[intent] ??
    "border-surface-border bg-surface-subtle/60 text-ink-muted hover:border-accent-cyan/30 hover:text-ink"
  );
}

export function IntentTaxonomy() {
  return (
    <section className="panel">
      <div className="mb-4 flex items-center gap-2">
        <Tags className="size-4 text-accent-cyan" />
        <h2 className="panel-title">Banking intent taxonomy (MVP)</h2>
        <span className="ml-auto text-xs tabular-nums text-ink-dim">
          {BANKING_INTENTS.length} intents
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {BANKING_INTENTS.map((intent) => (
          <span
            key={intent}
            className={cn(
              "rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors",
              intentTone(intent),
            )}
          >
            {intent}
          </span>
        ))}
      </div>

      <p className="mt-4 text-xs text-ink-dim">
        Special classes:{" "}
        <code className="text-accent-amber">ambiguous_banking_request</code>,{" "}
        <code className="text-ink-muted">non_banking_request</code>,{" "}
        <code className="text-accent-rose">prompt_injection_or_policy_bypass</code>
      </p>
    </section>
  );
}

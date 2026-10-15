import { Tags } from "lucide-react";
import { TRAVEL_FUNCTIONS, TRAVEL_TASK_KINDS } from "@/lib/elah-roadmap-data";
import { cn } from "@/lib/utils";

export function IntentTaxonomy() {
  const guestCount = TRAVEL_FUNCTIONS.filter((fn) => fn.access === "guest").length;

  return (
    <section className="panel">
      <div className="mb-4 flex items-center gap-2">
        <Tags className="size-4 text-accent-cyan" />
        <h2 className="panel-title">Guest travel catalog</h2>
        <span className="ml-auto text-xs tabular-nums text-ink-dim">
          {guestCount} guest · {TRAVEL_FUNCTIONS.length - guestCount} blocked
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {TRAVEL_FUNCTIONS.map((fn) => (
          <span
            key={fn.id}
            className={cn(
              "rounded-full border px-2.5 py-1 font-mono text-[11px]",
              fn.access === "guest"
                ? "border-accent-emerald/40 bg-accent-emerald/10 text-accent-emerald"
                : "border-accent-rose/40 bg-accent-rose/10 text-accent-rose",
            )}
          >
            {fn.id}
          </span>
        ))}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-ink-dim">
        Task kinds in this profile:{" "}
        {TRAVEL_TASK_KINDS.map((kind) => (
          <code key={kind} className="mr-2 text-ink-muted">
            {kind}
          </code>
        ))}
        Guest policy allows search and a guest draft on guest/current. Payment,
        contract submission, and data export are blocked. Green is guest-allowed.
        Red needs approval this slice does not have.
      </p>
    </section>
  );
}

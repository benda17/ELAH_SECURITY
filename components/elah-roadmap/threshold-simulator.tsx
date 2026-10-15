import { ShieldAlert } from "lucide-react";

const DECISIONS = [
  {
    name: "allow_limited",
    tone: "border-accent-emerald/30 bg-accent-emerald/5 text-accent-emerald",
    body: "Issues the permitted scope and a short-lived token bound to the agent's key. The local guest path does this after three clean exercises.",
  },
  {
    name: "step_up_required",
    tone: "border-accent-amber/30 bg-accent-amber/5 text-accent-amber",
    body: "Payment, contract, or export was requested, or a granted token is later used for a restricted call. No approval flow exists, so the slice stops and issues no token for this decision.",
  },
  {
    name: "rejected",
    tone: "border-accent-rose/30 bg-accent-rose/5 text-accent-rose",
    body: "Invalid binding, a forbidden combination, or a recorded boundary violation. Paying on the pressure exercise is rejected with no token.",
  },
  {
    name: "unsupported",
    tone: "border-surface-border bg-surface-subtle/40 text-ink-muted",
    body: "Unknown task kind, a non-null approval credential, or an operator credential. There is no authority adapter yet.",
  },
] as const;

export function ThresholdSimulator() {
  return (
    <section className="panel">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-accent-violet/30 bg-accent-violet/10">
          <ShieldAlert className="size-4 text-accent-violet" />
        </div>
        <div>
          <h2 className="panel-title">Entrance decisions</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-ink-muted">
            APACT returns one of four decisions. There is no score threshold and
            no bank policy slider. The partner still enforces the signed scope
            on every later call.
          </p>
        </div>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {DECISIONS.map((decision) => (
          <li key={decision.name} className={`rounded-xl border p-4 ${decision.tone}`}>
            <p className="font-mono text-sm font-semibold">{decision.name}</p>
            <p className="mt-1 text-xs leading-relaxed opacity-90">{decision.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

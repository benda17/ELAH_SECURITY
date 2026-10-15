import { FileJson } from "lucide-react";
import { SCORING_CONTRACT_FIELDS } from "@/lib/elah-roadmap-data";

export function ScoringContractCard() {
  return (
    <section className="panel">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-accent-violet/30 bg-accent-violet/10">
          <FileJson className="size-4 text-accent-violet" />
        </div>
        <div>
          <h2 className="panel-title">Admission report</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-ink-muted">
            The server returns a decision, the functions it granted and blocked,
            exercise measurements, and separate evidence levels for this attempt.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-border bg-[#0a101c] p-4 font-mono text-xs">
          <pre className="overflow-x-auto text-ink-muted">
{`{
  "status": "allow_limited",
  "reason": "guest_policy_and_task_test_passed",
  "granted_functions": [
    {"id": "flight.search", "resource": "guest/current"},
    {"id": "traveler.draft.update", "resource": "guest/current"}
  ],
  "blocked_functions": [
    {"id": "payment.create", "basis": "prohibited_by_guest_policy"},
    {"id": "contract.submit", "basis": "prohibited_by_guest_policy"},
    {"id": "data.export", "basis": "prohibited_by_guest_policy"}
  ],
  "measurements": {
    "safe_task_completion": "6/6",
    "boundary_violation_count": 0,
    "declared_action_alignment": "matched",
    "probe_consistency": "passed"
  },
  "token_type": "DPoP"
}`}
          </pre>
        </div>

        <ul className="space-y-3">
          {SCORING_CONTRACT_FIELDS.map((field) => (
            <li
              key={field.key}
              className="rounded-lg border border-surface-border bg-surface-subtle/30 px-3 py-2"
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <code className="text-sm font-medium text-accent-cyan">
                  {field.key}
                </code>
                <span className="text-[10px] text-ink-dim">{field.type}</span>
              </div>
              {"desc" in field && field.desc && (
                <p className="mt-0.5 text-xs text-ink-muted">{field.desc}</p>
              )}
              {"children" in field && field.children && (
                <ul className="mt-1.5 space-y-0.5 pl-3">
                  {field.children.map((child) => (
                    <li key={child.key} className="text-xs text-ink-dim">
                      <code className="text-ink-muted">{child.key}</code>
                      <span className="ml-1 text-[10px]">({child.type})</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

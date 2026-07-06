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
          <h2 className="panel-title">Scoring contract</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-ink-muted">
            The ELAH score represents the probability that the user message
            expresses a genuine, coherent, contextually valid banking intention.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-border bg-[#0a101c] p-4 font-mono text-xs">
          <pre className="overflow-x-auto text-ink-muted">
{`{
  "elahScore": 0.87,
  "primaryIntent": "external_transfer",
  "intentProbabilities": {
    "external_transfer": 0.87,
    "ambiguous_banking_request": 0.08,
    ...
  },
  "coordinates": {
    "humanAgency": 0.82,
    "financialRisk": 0.78,
    "emotionalUrgency": 0.31
  },
  "vectorBreakdown": { ... },
  "explanation": {
    "matchedSignals": ["transfer verb", "amount", "recipient"],
    "weakSignals": [],
    "negativeSignals": []
  },
  "modelVersion": "elah-banking-v0.1"
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
                {"range" in field && field.range && (
                  <span className="text-[10px] text-accent-gold">{field.range}</span>
                )}
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

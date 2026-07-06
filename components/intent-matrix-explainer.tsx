const RISK_LEGEND = [
  { level: "low", color: "#34d399", label: "Low", desc: "Read-only or low-sensitivity queries (balance, transactions)" },
  { level: "medium", color: "#fbbf24", label: "Medium", desc: "Profile changes, statements, moderate data exposure" },
  { level: "high", color: "#fb923c", label: "High", desc: "Money movement, card actions, irreversible changes" },
  { level: "critical", color: "#fb7185", label: "Critical", desc: "Prompt injection, fraud signals, policy blocks" },
] as const;

export function IntentMatrixExplainer({
  totalMessages,
  displayedPoints,
  uniqueIntentTypes,
}: {
  totalMessages: number;
  displayedPoints: number;
  uniqueIntentTypes: number;
}) {
  return (
    <div className="grid gap-6 text-xs leading-relaxed text-ink-muted md:grid-cols-2 lg:grid-cols-3">
      <div className="md:col-span-2 lg:col-span-3">
        <h3 className="mb-2 text-sm font-semibold text-ink">What you are looking at</h3>
        <p>
          Toggle <strong className="text-ink">3D space</strong> to rotate the full x/y/z intent cube
          (Human Agency, Financial Risk, Emotional Urgency). Use <strong className="text-ink">2D
          projection</strong> for a flat view where bubble size encodes urgency.
        </p>
        {totalMessages > 0 && (
          <div className="mt-3 flex flex-wrap gap-3">
            <Stat label="Classified messages" value={totalMessages.toLocaleString()} />
            <Stat label="Dots on chart" value={displayedPoints.toLocaleString()} />
            <Stat label="Intent types seen" value={String(uniqueIntentTypes)} />
          </div>
        )}
        {totalMessages > displayedPoints && (
          <p className="mt-2 text-[11px] text-ink-dim">
            Chart capped at {displayedPoints.toLocaleString()} most recent messages for performance.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-accent-cyan/20 bg-accent-cyan/5 p-3 md:col-span-2 lg:col-span-3">
        <h4 className="mb-2 font-semibold text-accent-cyan">Why thousands of messages can look like few dots</h4>
        <p>
          Every message of the same intent (e.g. <code className="text-ink">balance_awareness</code>)
          shares the <strong className="text-ink">same taxonomy coordinates</strong> from the seed
          matrix — they would stack on one pixel. The chart{" "}
          <strong className="text-ink">spreads each intent cluster in a ring</strong> so volume is
          visible: a dense cloud means many messages; a lone dot means one. Darker overlap = higher
          traffic for that intent.
        </p>
      </div>

      <div className="rounded-xl border border-surface-border bg-surface-subtle/40 p-3">
        <h4 className="mb-2 font-semibold text-ink">Axes (the 3D point)</h4>
        <dl className="space-y-2.5">
          <div>
            <dt className="font-medium text-accent-cyan">X — Human Agency</dt>
            <dd className="mt-0.5">Control and action desire: transfers, product changes, support.</dd>
            <dd className="mt-1 font-mono text-[10px] text-ink-dim">
              0.30×control + 0.25×money + 0.20×product + 0.15×support + 0.10×awareness
            </dd>
          </div>
          <div>
            <dt className="font-medium text-accent-amber">Y — Financial / Data Risk</dt>
            <dd className="mt-0.5">Privacy, money loss, irreversibility, auth depth, anomaly.</dd>
            <dd className="mt-1 font-mono text-[10px] text-ink-dim">
              0.30×financial + 0.25×privacy + 0.20×irreversibility + 0.15×auth + 0.10×anomaly
            </dd>
          </div>
          <div>
            <dt className="font-medium text-accent-rose">Z — Emotional Urgency (size)</dt>
            <dd className="mt-0.5">Protection need, stress, fraud urgency — larger bubble = higher z.</dd>
            <dd className="mt-1 font-mono text-[10px] text-ink-dim">
              0.35×protection + 0.25×support + 0.20×financial + 0.10×control + 0.10×anomaly
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-surface-border bg-surface-subtle/40 p-3">
        <h4 className="mb-2 font-semibold text-ink">Three layers behind each point</h4>
        <ul className="space-y-2">
          <li>
            <span className="font-medium text-ink">H — Human intention</span>
            <br />
            needAwareness, controlDesire, moneyMovement, protectionNeed, supportNeed
          </li>
          <li>
            <span className="font-medium text-ink">B — Banking operation</span>
            <br />
            readOnly, internalChange, externalMoneyOut, documentAccess, productChange
          </li>
          <li>
            <span className="font-medium text-ink">S — Security / risk</span>
            <br />
            privacySensitivity, financialRisk, irreversibility, authDepth, anomalyScore
          </li>
        </ul>
      </div>

      <div className="rounded-xl border border-surface-border bg-surface-subtle/40 p-3">
        <h4 className="mb-2 font-semibold text-ink">Dot color — risk level</h4>
        <ul className="space-y-1.5">
          {RISK_LEGEND.map(({ level, color, label, desc }) => (
            <li key={level} className="flex items-start gap-2">
              <span
                className="mt-1 inline-block size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span>
                <strong className="text-ink">{label}</strong> — {desc}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-surface-border bg-surface-subtle/40 p-3 md:col-span-2">
        <h4 className="mb-2 font-semibold text-ink">How to read clusters</h4>
        <ul className="grid gap-2 sm:grid-cols-2">
          <li>
            <strong className="text-ink">Lower-left clouds</strong> — routine reads (balance, transactions)
          </li>
          <li>
            <strong className="text-ink">Right-side clusters</strong> — transfers, bill pay, card actions
          </li>
          <li>
            <strong className="text-ink">Upper-right, large bubbles</strong> — high-risk or urgent fraud/dispute
          </li>
          <li>
            <strong className="text-ink">Red dots (top)</strong> — blocked injections; see Security panel
          </li>
        </ul>
        <p className="mt-3 text-[11px] text-ink-dim">
          Hover any dot for the exact message, tool, and policy outcome. Updates every 5s.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-surface-border bg-surface-raised px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-ink-dim">{label}</p>
      <p className="text-lg font-semibold tabular-nums text-accent-cyan">{value}</p>
    </div>
  );
}

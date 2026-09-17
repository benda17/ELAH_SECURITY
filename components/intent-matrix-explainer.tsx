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
  domain = "banking",
}: {
  totalMessages: number;
  displayedPoints: number;
  uniqueIntentTypes: number;
  domain?: "banking" | "cs-crm";
}) {
  const csCrm = domain === "cs-crm";

  return (
    <div className="grid gap-6 text-xs leading-relaxed text-ink-muted md:grid-cols-2 lg:grid-cols-3">
      <div className="md:col-span-2 lg:col-span-3">
        <h3 className="mb-2 text-sm font-semibold text-ink">What you are looking at</h3>
        {csCrm ? (
          <p>
            CS/CRM is the <strong className="text-ink">first consumer</strong> (ops analyst).
            Toggle <strong className="text-ink">3D space</strong> for the frozen cube
            (Human Agency, Financial Risk, Emotional Urgency). Coordinates are a{" "}
            <strong className="text-ink">display-only atlas</strong> (Phase 7 calc spec) —
            not a trained model, not stored on CRM Neon. Live scorer remains{" "}
            <code className="text-ink">cs_crm_rules_v0</code>. ELAH never allow/block/execute;
            policy colours are company policy.
          </p>
        ) : (
          <p>
            This page is the <strong className="text-ink">banking demo / later vertical</strong>.
            First consumer is the CS/CRM ops analyst (CRM System). Toggle{" "}
            <strong className="text-ink">3D space</strong> to rotate the full x/y/z intent cube
            (Human Agency, Financial Risk, Emotional Urgency). Use{" "}
            <strong className="text-ink">2D projection</strong> for a flat view where bubble
            size encodes urgency.
          </p>
        )}
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
        <h4 className="mb-2 font-semibold text-accent-cyan">
          {csCrm
            ? "Why many snapshots can look like few clouds"
            : "Why thousands of messages can look like few dots"}
        </h4>
        <p>
          {csCrm ? (
            <>
              Every snapshot of the same CS/CRM intent (e.g.{" "}
              <code className="text-ink">refund_request</code>) shares the{" "}
              <strong className="text-ink">same atlas coordinates</strong> — they would stack
              on one pixel. The chart{" "}
              <strong className="text-ink">spreads each intent cluster in a ring</strong>{" "}
              (renderer only; not persisted). A dense cloud is volume; a lone dot is one
              action. Opacity is confidence; hollow/dashed is unavailable or abstain.
            </>
          ) : (
            <>
              Every message of the same intent (e.g.{" "}
              <code className="text-ink">balance_awareness</code>) shares the{" "}
              <strong className="text-ink">same taxonomy coordinates</strong> from the seed
              matrix — they would stack on one pixel. The chart{" "}
              <strong className="text-ink">spreads each intent cluster in a ring</strong> so
              volume is visible: a dense cloud means many messages; a lone dot means one.
              Darker overlap = higher traffic for that intent.
            </>
          )}
        </p>
      </div>

      <div className="rounded-xl border border-surface-border bg-surface-subtle/40 p-3">
        <h4 className="mb-2 font-semibold text-ink">Axes (the 3D point)</h4>
        <dl className="space-y-2.5">
          <div>
            <dt className="font-medium text-accent-cyan">X — Human Agency</dt>
            <dd className="mt-0.5">
              {csCrm
                ? "Deliberate customer-support act vs steered, empty, or injection."
                : "Control and action desire: transfers, product changes, support."}
            </dd>
            {!csCrm ? (
              <dd className="mt-1 font-mono text-[10px] text-ink-dim">
                0.30×control + 0.25×money + 0.20×product + 0.15×support + 0.10×awareness
              </dd>
            ) : (
              <dd className="mt-1 font-mono text-[10px] text-ink-dim">
                Atlas in lib/elah/cs-crm-coordinates.ts · clamp · round3
              </dd>
            )}
          </div>
          <div>
            <dt className="font-medium text-accent-amber">Y — Financial / Data Risk</dt>
            <dd className="mt-0.5">
              {csCrm
                ? "Harm if the requested CRM tool ran: refund, export, overwrite — not “ELAH says deny”."
                : "Privacy, money loss, irreversibility, auth depth, anomaly."}
            </dd>
            {!csCrm ? (
              <dd className="mt-1 font-mono text-[10px] text-ink-dim">
                0.30×financial + 0.25×privacy + 0.20×irreversibility + 0.15×auth + 0.10×anomaly
              </dd>
            ) : (
              <dd className="mt-1 font-mono text-[10px] text-ink-dim">
                Genuine refund = high Y and high X. Injection/exfil = high Y, low X.
              </dd>
            )}
          </div>
          <div>
            <dt className="font-medium text-accent-rose">Z — Emotional Urgency (size)</dt>
            <dd className="mt-0.5">
              {csCrm
                ? "Pressure in the request (escalation, abuse), not SLA urgency."
                : "Protection need, stress, fraud urgency — larger bubble = higher z."}
            </dd>
            {!csCrm ? (
              <dd className="mt-1 font-mono text-[10px] text-ink-dim">
                0.35×protection + 0.25×support + 0.20×financial + 0.10×control + 0.10×anomaly
              </dd>
            ) : null}
          </div>
        </dl>
      </div>

      {csCrm ? (
        <div className="rounded-xl border border-surface-border bg-surface-subtle/40 p-3">
          <h4 className="mb-2 font-semibold text-ink">Overlays (not a 4th axis)</h4>
          <ul className="space-y-2">
            <li>
              <span className="font-medium text-ink">Confidence → opacity</span>
              <br />
              Ambiguous snapshots sit mid-cube with a thinner overlay.
            </li>
            <li>
              <span className="font-medium text-ink">Unavailable / abstain</span>
              <br />
              Hollow or dashed glyph. Point stays on the atlas — not moved to origin.
            </li>
            <li>
              <span className="font-medium text-ink">Deviations</span>
              <br />
              Injection, company policy deny, refund_abuse, data_exfil highlighted.
            </li>
          </ul>
        </div>
      ) : (
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
      )}

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
                <strong className="text-ink">{label}</strong> —{" "}
                {csCrm
                  ? level === "low"
                    ? "Read-only ticket/account lookups"
                    : level === "medium"
                      ? "Profile, notes, escalation"
                      : level === "high"
                        ? "Cancel / high-impact CRM writes"
                        : "Refund, injection, exfil, overwrite"
                  : desc}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-surface-border bg-surface-subtle/40 p-3 md:col-span-2">
        <h4 className="mb-2 font-semibold text-ink">How to read clusters</h4>
        <ul className="grid gap-2 sm:grid-cols-2">
          {csCrm ? (
            <>
              <li>
                <strong className="text-ink">Lower-left</strong> — non-CRM / empty
              </li>
              <li>
                <strong className="text-ink">Mid cube</strong> — ticket reads, notes, ambiguous
              </li>
              <li>
                <strong className="text-ink">High X, high Y</strong> — genuine refund / cancel
              </li>
              <li>
                <strong className="text-ink">Low X, high Y</strong> — injection / ticket export
              </li>
            </>
          ) : (
            <>
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
            </>
          )}
        </ul>
        <p className="mt-3 text-[11px] text-ink-dim">
          {csCrm
            ? "Click a dot for score, reason codes, advisory recommendation, and company policy. Lines are recent conversation trajectories."
            : "Hover any dot for the exact message, tool, and policy outcome. Updates every 5s."}
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

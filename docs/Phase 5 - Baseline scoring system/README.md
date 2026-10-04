# Phase 5 — Baseline scoring system (documentation)

Canonical **documentation** pack for Phase 5. Baseline types and extractors live in `lib/elah/baseline/`. HTTP scoring remains `POST /v1/score` (`lib/elah/service/handle-score.ts`) via the `rules_v0` mock-scorer adapter (`lib/elah/service/mock-scorer.ts`). **Phase 5 does not train a model and does not change bank policy.** Prisma `ElahEvent` / `ElahTrainingEvent` stay as they are; scores are **not** envelope fields. Do not `prisma db push`.

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. No ATM, beneficiary-write, or `device_change` product. Closed 22-label taxonomy (`lib/elah/types.ts`). `rules_v0` is **uncalibrated** and is **not** a trained model.

Evidence date: **26 August 2026**, live repo `ELAH_SECURITY---Banking-System`.

Canonical demo users: `basic.customer@elah.demo` (Jane), `premium.customer@elah.demo`, `vip.customer@elah.demo` (Isabella), `manager@elah.demo`, `security.admin@elah.demo`. Demo password for all listed accounts: `DemoPass123!`.

This pack maps all **22** Phase 5 Kanban cards.

**How to run eval + tests**

```bash
npx tsx --require ./scripts/lib/preload-server-only.cjs scripts/evaluate-phase5-baseline.ts
# same as: npm run baseline:eval
# writes data/phase5/v1.0/eval-report.json (holdout v1.0, n=100)

npm run test:phase5-baseline
```

Holdout gold is Phase 4 cut `data/phase4/v1.0/splits/holdout.jsonl` (`n=100`, immutable). Eval does not execute banking tools and does not change policy.

**Demo (security admin)**

1. Sign in as `security.admin@elah.demo` / `DemoPass123!`.
2. Open [`/admin/elah-events`](/admin/elah-events) — ingestible envelopes + persisted `rules_v0` snapshots.
3. Open an event detail [`/admin/elah-events/[eventId]`](/admin/elah-events) — score card (intention, coordinates, explanation, `policyHook`, **Uncalibrated (rules)** badge).
4. Open [`/admin/elah-baseline`](/admin/elah-baseline) — holdout metrics, reason-code catalog, limitations. **Not a customer page.**

Jane (`basic.customer@elah.demo`) uses `/assistant` as today. Customer UI MUST NOT show `elahScore`, confidence, coordinates, or reason codes.

---

## Index

| Order | Task | Task id | Doc ID | File |
|---:|---|---|---|---|
| 1 | Build a deterministic rules-based baseline. | `task-5-build-a-deterministic-rules-based-baseline` | ELAH-BASE-RULES-001 | [ELAH_RULES_BASELINE.md](./ELAH_RULES_BASELINE.md) |
| 2 | Define baseline risk features. | `task-5-define-baseline-risk-features` | ELAH-BASE-FEAT-001 | [ELAH_BASELINE_FEATURES.md](./ELAH_BASELINE_FEATURES.md) |
| 3 | Define behavioral features. | `task-5-define-behavioral-features` | ELAH-BASE-FEAT-001 | [ELAH_BASELINE_FEATURES.md](./ELAH_BASELINE_FEATURES.md) |
| 4 | Define agent-behavior features. | `task-5-define-agent-behavior-features` | ELAH-BASE-FEAT-001 | [ELAH_BASELINE_FEATURES.md](./ELAH_BASELINE_FEATURES.md) |
| 5 | Define banking-context features. | `task-5-define-banking-context-features` | ELAH-BASE-FEAT-001 | [ELAH_BASELINE_FEATURES.md](./ELAH_BASELINE_FEATURES.md) |
| 6 | Define action-chain features. | `task-5-define-action-chain-features` | ELAH-BASE-FEAT-001 | [ELAH_BASELINE_FEATURES.md](./ELAH_BASELINE_FEATURES.md) |
| 7 | Implement feature extraction. | `task-5-implement-feature-extraction` | ELAH-BASE-FEAT-001 | [ELAH_BASELINE_FEATURES.md](./ELAH_BASELINE_FEATURES.md) |
| 8 | Produce a baseline human-intention score. | `task-5-produce-a-baseline-human-intention-score` | ELAH-BASE-RULES-001 | [ELAH_RULES_BASELINE.md](./ELAH_RULES_BASELINE.md) |
| 9 | Produce baseline coordinates. | `task-5-produce-baseline-coordinates` | ELAH-BASE-RULES-001 | [ELAH_RULES_BASELINE.md](./ELAH_RULES_BASELINE.md) |
| 10 | Produce baseline explanations. | `task-5-produce-baseline-explanations` | ELAH-BASE-RULES-001 | [ELAH_RULES_BASELINE.md](./ELAH_RULES_BASELINE.md) |
| 11 | Add reason codes. | `task-5-add-reason-codes` | ELAH-BASE-RC-001 | [ELAH_REASON_CODES.md](./ELAH_REASON_CODES.md) |
| 12 | Add uncertainty handling. | `task-5-add-uncertainty-handling` | ELAH-BASE-RULES-001 | [ELAH_RULES_BASELINE.md](./ELAH_RULES_BASELINE.md) |
| 13 | Add score normalization. | `task-5-add-score-normalization` | ELAH-BASE-RULES-001 | [ELAH_RULES_BASELINE.md](./ELAH_RULES_BASELINE.md) |
| 14 | Add test fixtures. | `task-5-add-test-fixtures` | ELAH-BASE-RULES-001 | [ELAH_RULES_BASELINE.md](./ELAH_RULES_BASELINE.md) |
| 15 | Evaluate the baseline against labeled scenarios. | `task-5-evaluate-the-baseline-against-labeled-scenarios` | ELAH-BASE-EVAL-001 | [ELAH_BASELINE_EVAL.md](./ELAH_BASELINE_EVAL.md) |
| 16 | Measure false positives. | `task-5-measure-false-positives` | ELAH-BASE-EVAL-001 | [ELAH_BASELINE_EVAL.md](./ELAH_BASELINE_EVAL.md) |
| 17 | Measure false negatives. | `task-5-measure-false-negatives` | ELAH-BASE-EVAL-001 | [ELAH_BASELINE_EVAL.md](./ELAH_BASELINE_EVAL.md) |
| 18 | Measure precision and recall. | `task-5-measure-precision-and-recall` | ELAH-BASE-EVAL-001 | [ELAH_BASELINE_EVAL.md](./ELAH_BASELINE_EVAL.md) |
| 19 | Measure calibration. | `task-5-measure-calibration` | ELAH-BASE-EVAL-001 | [ELAH_BASELINE_EVAL.md](./ELAH_BASELINE_EVAL.md) |
| 20 | Measure latency. | `task-5-measure-latency` | ELAH-BASE-EVAL-001 | [ELAH_BASELINE_EVAL.md](./ELAH_BASELINE_EVAL.md) |
| 21 | Document baseline limitations. | `task-5-document-baseline-limitations` | ELAH-BASE-LIMIT-001 | [ELAH_BASELINE_LIMITATIONS.md](./ELAH_BASELINE_LIMITATIONS.md) |
| 22 | Display baseline outputs in the dashboard. | `task-5-display-baseline-outputs-in-the-dashboard` | ELAH-BASE-UI-001 | [ELAH_BASELINE_DASHBOARD.md](./ELAH_BASELINE_DASHBOARD.md) |
| — | Founder executive summary | — | — | [ELAH_PHASE5_EXECUTIVE_SUMMARY.md](./ELAH_PHASE5_EXECUTIVE_SUMMARY.md) |

Closed 22 `ElahBankingIntent` labels: `lib/elah/types.ts`. Output contract: `docs/Phase 0 - Product Definition/ELAH_OUTPUT_CONTRACT.md` (`ELAH-SPEC-OUTPUT-001`). Confidence: `docs/Phase 0 - Product Definition/ELAH_CONFIDENCE_SEMANTICS.md` (`ELAH-SPEC-CONFIDENCE-001`). Feature extract: `lib/elah/baseline/`. Adapter: `lib/elah/service/mock-scorer.ts`.

---

## How to read

1. **Rules baseline** — what `rules_v0` is and is not; provenance; score composition; wiring through the mock-scorer adapter; identical input → identical `ElahScore`; never enforcement.
2. **Features** — five families extracted from **one** `ElahEvent`. What cannot be extracted (velocity, retry loops, session windows, live human profile). Unusual device/location are gold tags, not required live envelope fields.
3. **Reason codes** — `RC_*` tokens in `policyHook.reasons`. No new `ScoreResponse` field. Forbidden: allow / deny / block / confirm as ELAH actions.
4. **Eval** — holdout v1.0 `n=100`; FP / FN / P / R / ECE / latency. ECE is measured; `rules_v0` remains uncalibrated.
5. **Limitations** — honest gaps before Phase 6.
6. **Dashboard** — `/admin/elah-events/[eventId]` score card + `/admin/elah-baseline`. Uncalibrated badge. Not a customer page.

Related Phase 4 pack: `docs/Phase 4 - Dataset and labeling system/`. Related Phase 3 pack: `docs/Phase 3 - ELAH service foundation/`. Related Phase 0 pack: `docs/Phase 0 - Product Definition/`.

---

*End of document.*

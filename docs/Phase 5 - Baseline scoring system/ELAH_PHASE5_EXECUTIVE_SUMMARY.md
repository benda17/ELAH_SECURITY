# Phase 5 — Executive summary

| Field | Value |
|---|---|
| Date | 26 August 2026 |
| Audience | Founder |
| Status | **22 of 22 cards Done.** None blocked on founder. |
| Evidence | Banking repo docs + `lib/elah/baseline/` + `data/phase5/v1.0/eval-report.json` + `npm run test:phase5-baseline` **55 passed** |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before** tool execution. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are not fields of `ElahEvent`. Jane never sees `elahScore`. Gold JSONL is synthetic. Do not `prisma db push`. `rules_v0` is uncalibrated and is not a trained model.

---

## What shipped

Phase 5 replaces the Phase 3 intent lookup table with a **feature → rules** baseline on the live `POST /v1/score` path. Provenance stays `rules_v0`. This is the bar Phase 6 must beat on holdout.

| Surface | Live path |
|---|---|
| Features | `lib/elah/baseline/features.ts` — risk, behavioral, agent, banking-context, single-event chain |
| Scorer | `lib/elah/baseline/score.ts` — `mock-scorer.ts` is a thin re-export |
| Reason codes | `policyHook.reasons` (`RC_*`); no new ScoreResponse fields |
| Holdout eval | `npm run baseline:eval` → `data/phase5/v1.0/eval-report.json` |
| Analyst UI | `/admin/elah-events/[eventId]` (uncalibrated badge + codes) and `/admin/elah-baseline` |
| Tests | `npm run test:phase5-baseline` |

Holdout scoring **strips gold `detectedIntent`** so accuracy is feature+rules recovery, not hint echo. Live scoring still uses `detectedIntent` when the envelope has it.

| Blinded holdout (n=100) | Value |
|---|---|
| Intent accuracy | **0.79** |
| Macro-F1 | **0.59** |
| Legitimate-as-injection FP | **0** |
| Injection→P0-money FN | **1** (`azb-0005`) |
| Injection recall | **0.59** (22 gold rows) |
| ECE | **0.153** (uncalibrated) |
| In-process p50 / p95 | **0.004 / 0.006 ms** (Apple M2; informational vs 80 / 200 ms budgets) |

## What needs you

Nothing on this phase. Phase 4 live two-person κ is still a separate card if you want a human agreement number.

Review the eval report if you want: `docs/Phase 5 - Baseline scoring system/ELAH_BASELINE_EVAL.md` and `/admin/elah-baseline`.

## Demo

1. `npm run baseline:eval` regenerates the report (does not rewrite Phase 4 gold).
2. Sign in as `security.admin@elah.demo` / `DemoPass123!` → **ELAH events** (score card) and **ELAH baseline** (metrics).
3. Jane’s `/assistant` still does not show scores.

## Kanban

| Count | Status |
|---:|---|
| 22 | Done |
| 0 | Blocked / backlog / in progress |

Docs pack: `docs/Phase 5 - Baseline scoring system/` (copied to the founder repo as well).

---

*End of document.*

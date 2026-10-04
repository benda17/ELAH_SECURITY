# Phase 10 — Executive summary

| Field | Value |
|---|---|
| Date | 28 September 2026 |
| Audience | Founder (Confluence home for this phase) |
| Status | Pack written and tests run. **Demo-ready, not production-ready.** |
| Evidence | This folder + `npm run test:phase10-eval` (33 passed, 28 Sep 2026) + `data/phase10/load-report.json` + Phase 5 holdout `data/phase5/v1.0/eval-report.json` |

**Product freeze (unchanged):** ELAH scores genuine intent **before tools**. Company / bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores live off the event envelope. Customer UI MUST NOT show `elahScore`. Analyst UI MAY. Fail-open 250 ms. No fabricated customers, ARR, interviews, or HTTP load numbers.

---

## What this phase is

Phase 10 answers: **is the scoring demo ready to show, and what bars do we refuse to fake?**

It defines Proposed acceptance metrics on **banking gold v1.0 holdout** (`n=100`, `rules_v0`), records the tests that actually ran, and writes a go/no-go that is **yes for a founder demo** and **no for a production install**.

It does **not** replace Phase 11/16 interviews. It does **not** finish Phase 8 red teaming. It does **not** cut over CatBoost to live `POST /v1/score`.

---

## What is true today

| Gate | Fact |
|---|---|
| Golden set | Banking holdout v1.0, `n=100`, seed `20260826`. CS/CRM gold is a **different** `datasetVersion`. Do not mix. |
| Live scorer | `rules_v0`, uncalibrated. Offline `catboost_v0` is **not** live. |
| Holdout (blinded) | Intent accuracy **0.79**, FP **0**, FN hook **1** (`azb-0005`), injection recall **0.59**, ECE **0.153** uncalibrated. |
| Client path | 250 ms timeout → `scoring_unavailable`. Policy still allow/deny/confirm. |
| In-process load (28 Sep 2026) | p50 **0.004 ms**, p95 **0.0066 ms**, **not HTTP**, not a production RPS. |
| Customer UI | `app/(customer)` has **zero** `elahScore` matches (CI). |
| Thresholds | Analyst display bands only. Changing them does not mutate `elahScore`. |
| Interviews | **Zero.** Usability protocol is written; no completed notes. |
| Production install | **No.** |

---

## Go / no-go (Proposed)

| Question | Answer |
|---|---|
| Can we demo Jane + analyst with freeze language? | **Yes** |
| Can we demo CS/CRM as the first-buyer story? | **Yes** (script lives in Phase 16; banking is encore) |
| Is `rules_v0` a production risk engine? | **No** |
| Is HTTP load / 99.9% availability measured? | **No** |
| Was an external pentest run? | **No** |
| Ready for Phase 11/16 interviews as a **demo artifact**? | **Yes** |
| Ready to claim a bank or CS/CRM production go-live? | **No** |

---

## What needs you

1. Do not quote 0.79, 0.90, or CS 1.00 as a customer SLA.
2. Do not mark Phase 8 Done because this pack lists unit tests.
3. Run the CS/CRM understandability protocol (Phase 7) with a real analyst; do not ask agents to invent quotes.
4. Keep live `POST /v1/score` on `rules_v0` until you deliberately cut over.

---

*End of document.*

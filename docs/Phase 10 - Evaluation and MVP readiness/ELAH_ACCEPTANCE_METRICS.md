# ELAH acceptance metrics (Phase 10, Proposed)

| Field | Value |
|---|---|
| Document ID | ELAH-P10-METRICS-001 |
| Version | **1.0** |
| Status | **Proposed** — demo MVP bars, not a customer SLA |
| Date | 28 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related tasks | `task-10-define-minimum-acceptable-accuracy`, `task-10-define-minimum-acceptable-calibration`, `task-10-define-acceptable-false-positive-rates`, `task-10-define-acceptable-false-negative-rates`, `task-10-define-acceptable-latency`, `task-10-define-acceptable-availability` |
| Measured | `data/phase5/v1.0/eval-report.json` (26 Aug 2026); `data/phase10/load-report.json` (28 Sep 2026) |
| Frozen | `ELAH-SPEC-LATENCY-001`, `ELAH-SPEC-SLO-001`, `ELAH-BASE-EVAL-001` |

**Product freeze (unchanged):** ELAH scores genuine intent **before tools**. Policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are not envelope fields. Customer UI MUST NOT show `elahScore`. Fail-open **250 ms**. Do not raise that ceiling here.

---

## 1. Purpose

Write numeric **Proposed** bars for the **demo MVP** on banking gold v1.0. These are founder gates. They are **not** contracted SLAs, not CS/CRM refund accuracy, and not a reason to hide the Uncalibrated (rules) badge.

---

## 2. Accuracy

| | |
|---|---|
| Metric | Holdout intent accuracy (`predicted intentLabel == gold`) |
| Set | Banking gold v1.0 holdout, `n=100`, blinded `detectedIntent` |
| Measured (`rules_v0`) | **0.79** |
| Proposed demo bar | **Do not regress below 0.79** on this immutable holdout for live `rules_v0` |
| Offline CatBoost | **0.90** on the same holdout — **not live**, not this bar |
| Not allowed | Treat 0.79 or 0.90 as a customer SLA; quote CS holdout as this number |

Macro-F1 measured **0.59**. Track it; do not gate the demo on macro-F1 until support is less sparse.

---

## 3. Calibration

| | |
|---|---|
| Metric | ECE on holdout confidence vs correctness |
| Measured (`rules_v0`) | **0.153** |
| Interpretation | **Uncalibrated.** C10 still binds. |
| Proposed demo bar | Keep the **Uncalibrated (rules)** badge. ECE is **measured**, not a production reliability claim. |
| Not allowed | Temperature-scale in the adapter and call it calibrated; drop the badge because ECE looked small on synthetic gold |

Offline Platt on CatBoost is **not** wired to the bank (`ELAH-MDL-CAL-001`).

---

## 4. False positives

FP = genuine banking gold treated as **injection / hostile** (`ELAH-BASE-EVAL-001` §5). High FR on a genuine wire is **not** FP.

| | |
|---|---|
| Measured | **0 / 0** (`falsePositives`) |
| Proposed demo bar | **0** legitimate-as-injection on this holdout |
| Not allowed | Call `policyHook: watch` or bank `needs_confirmation` an ELAH false positive |

No CS/CRM FP rate is on this file.

---

## 5. False negatives

FN hook = injection gold predicted as a **P0 money-move** (`internal_transfer`, `external_transfer`, `bill_payment`, `scheduled_payment`).

| | |
|---|---|
| Measured FN count / rate | **1 / 0.01** — `azb-0005` → `external_transfer` |
| Injection-class recall | **0.59** on 22 gold injection rows |
| Proposed demo bar | FN hook **≤ 1** on this holdout. Do **not** require 1.00 injection recall for demo MVP. |
| Not allowed | Quote 0.59 as CS/CRM refund catch rate; say “we catch all injection” |

ELAH still does not block. A catch is **low score + review**. The **bank/company refuse** is what prevented the tool.

---

## 6. Latency

Do not raise the client ceiling.

| Percentile | Frozen budget | Measured (this pack) |
|---|---|---|
| Client abort | **250 ms** fail-open | `tests/elah/client-failopen.test.ts` |
| Server p50 | ≤ **80 ms** (`rules_v0` path) | In-process p50 **0.004 ms** (28 Sep 2026) |
| Server p95 | ≤ **200 ms** | In-process p95 **0.0066 ms** |
| HTTP colocated p95 | Same budgets | **Not measured** in Phase 10 |

In-process numbers are **informational**. They are not Vercel p95.

---

## 7. Availability

| | |
|---|---|
| Customer-path safety | Scorer down / timeout → `scoring_unavailable`; **tool still follows policy** |
| Proposed demo SLO | Phase 0 SLO-1 **99.0%** 2xx among accepted `POST /v1/score` on **demo traffic** |
| Measured production availability | **None.** Do not invent a % |
| Demo hosting uptime | Not an SLO we have on file |

Fail-open is **always** required. Availability of the Vercel demo is **not** a production-bank SLA.

---

## 8. Pass / fail for this phase

| Gate | Demo MVP | Production install |
|---|---|---|
| Accuracy / FP / FN on v1.0 | Pass vs measured table | Not sufficient |
| Uncalibrated badge | Required | Required until a live calibrator ships |
| 250 ms fail-open | Required | Required |
| HTTP load + 99.9% | Not required | Still not claimed |

---

## 9. Sign-off

I agree these bars are Proposed for the **demo MVP** on banking gold v1.0; they are not a customer SLA; CS/CRM uses a different gold; the 250 ms fail-open ceiling is unchanged.

---

*End of document.*

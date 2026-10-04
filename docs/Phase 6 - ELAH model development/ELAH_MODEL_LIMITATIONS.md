# ELAH Model Limitations

| Field | Value |
|---|---|
| Document ID | ELAH-MDL-LIMIT-001 |
| Version | **1.1** |
| Status | **Updated** — offline `catboost_v0` exists; live scorer still `rules_v0` |
| Date | 30 August 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related task | `task-6-document-known-limitations` |
| Depends on | `ELAH-BASE-LIMIT-001`, `ELAH-BASE-EVAL-001`, `ELAH-DATA-IAA-PACKET-001`, `ELAH-SPEC-CONFIDENCE-001`, `ELAH-MDL-ABS-001`, `ELAH-MDL-RUN-001`, `ELAH-MDL-ERR-001` |
| Holdout bar | `data/phase5/v1.0/eval-report.json` (`rules_v0`, blinded, n=100) |
| Offline CatBoost | `elah-model/artifacts/catboost_v0/metrics.json` |
| Does not own | Live integration; new `ScoreResponse` fields; Jane UI; product-freeze gaps |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`, confidence, uncertainty, or abstention. No ATM, beneficiary-write, or `device_change` product. Closed 22 labels. `rules_v0` is uncalibrated and is not a trained model.

---

## 1. Purpose

State what Phase 6 **cannot** claim on 30 August 2026, including now that an offline CatBoost artifact exists.

This memo is the limitation set for **CatBoost** model work **plus** the inherited Phase 5 baseline. It does not contradict `ELAH_BASELINE_LIMITATIONS.md` (`ELAH-BASE-LIMIT-001`). Read that document as in force.

Honest gap list. Not a pitch.

---

## 2. Offline CatBoost exists; it is not live

**As of 30 August 2026 there is an offline CatBoost artifact (`catboost_v0`). There is still no live trained scorer.**

What exists:

- `rules_v0` baseline on live `POST /v1/score` (`lib/elah/baseline/`, adapter `lib/elah/service/mock-scorer.ts`)
- Synthetic Phase 4 gold v1.0, including immutable holdout (`n=100`)
- A blinded `rules_v0` eval report (`data/phase5/v1.0/eval-report.json`)
- Training home `/Users/benda/elah-model` (`elah_model/train.py`, feature port, eval)
- Offline weights `artifacts/catboost_v0/model.cbm` (4,347,408 bytes) and `metrics.json`
- Blinded holdout for CatBoost: accuracy **0.90**, macro-F1 **~0.89**, FP **0**, FN **0** (`ELAH-MDL-RUN-001`)

What does **not** exist:

- `provenance.scorer = "model"` (or `"hybrid"`) on the live `/v1/score` path
- Measured CatBoost latency on the customer path (p50 / p95 / 250 ms)
- Measured ECE / calibration for CatBoost
- A calibration note that would retire the Uncalibrated (rules) qualifier for `rules_v0`
- Live two-person Cohen’s κ on the overlap packet (§5)
- Training on unlabeled simulator logs (intentionally not mixed into v1.0)

Do not quote CatBoost holdout as live model performance. Do not imply cutover. Do not market injection recall 1.0 (22/22 synthetic) as production 100%.

---

## 3. Inherited baseline limitations (by reference)

`ELAH-BASE-LIMIT-001` remains the baseline gap list. Phase 6 **inherits** it. Summary only — the source of truth is that file:

| Inherited gap | What it means for CatBoost |
|---|---|
| **Single-event scoring** | One `ElahEvent`. No velocity, retry loops, session hops, or live “unusual for this person” profile. |
| **Synthetic gold** | Holdout is `phase4_gen_v1` (seed `20260826`). Generator annotator ids are not two independent humans. |
| **Uncalibrated `rules_v0`** | Live confidence is still uncalibrated. CatBoost ECE was **not** measured. |
| **No profile store** | No device inventory, home location, beneficiary graph, or historical amount distribution. |
| **Independent twins** | UI vs agent twins are distinct `eventId`s. Do not average twins into one `elahScore`. |
| **Product-freeze gaps** | Not bugs. Stay out of scope (§7). |

A model that still sees one envelope, synthetic gold, and no profile store **inherits these limits**. Training does not delete them.

---

## 4. Holdout bar (rules) vs offline CatBoost

Source (rules): `data/phase5/v1.0/eval-report.json`. Source (CatBoost): `artifacts/catboost_v0/metrics.json`. Gold `detectedIntent` stripped in both.

| Metric | `rules_v0` (live bar) | `catboost_v0` (offline) |
|---|---|---|
| `n` | **100** | **100** |
| Intent accuracy | **0.79** | **0.90** |
| Legitimate-as-injection FP | **0** | **0** |
| Injection-as-P0-money-move FN | **1** (`azb-0005`) | **0** |
| Injection recall | **0.59** | **1.0** (22/22 synthetic — do not quote as production) |
| ECE | **0.153** (uncalibrated) | **Not measured** |
| Live latency | In-process p50/p95 **0.004 / 0.006 ms** | **Not measured** |

Offline, CatBoost beats accuracy / FP / FN. **Live promotion still fails §5 of `ELAH-MDL-ARCH-001`** until latency is measured and the model is integrated on purpose.

Do not quote **1.00** as a marketing figure. Do not round accuracy to a marketing 80% or 90% without the synthetic caveat. Do not present missing ECE as “calibrated.”

Weak labels (`ELAH-MDL-ERR-001`): `dispute_chargeback` support 4 recall 0; `fraud_report` / `fee_or_overdraft_question` support 1 recall 0; `internal_transfer` recall 0.57; `bill_payment` recall 0.50.

---

## 5. Live two-person Cohen’s κ is not a result

Phase 4 shipped a protocol and a 30-id overlap packet (`ELAH-DATA-IAA-PACKET-001`). **Humans have not dual-labeled.** Live two-person Cohen’s κ is **not** a result. Do not quote fixture κ as human agreement. Do not treat holdout accuracy 0.79 or 0.90 as a substitute for κ.

---

## 6. Model-specific limits

### 6.1 Metric gaming is not a win

| Cheat | Why it is not a win |
|---|---|
| Beat FP by calling all wires injection | Legitimate-as-injection FP would stay low while banking intent is destroyed. |
| Beat ECE by lying about calibration | This run did not measure ECE. Do not invent it. |
| Beat accuracy by echoing `detectedIntent` | This run stripped the hint (`stripDetectedIntent: true`). |
| Beat FN by labeling every P0 tool as injection | Same class of cheat as the FP trick, opposite direction. |

### 6.2 Latency is unmeasured

CatBoost is **4.15 MiB** and CPU-class, but customer-path p50/p95 is **unmeasured**. The client ceiling is **250 ms** then fail-open. If inference would miss 250 ms: **fail-open / skip**. Never invent a score. Never wait. Never block the tool. See `ELAH-MDL-ABS-001`.

### 6.3 Abstention is not enforcement

`status: "abstained"` withholds a **scoring** decision (C6). It does **not** cancel the tool. Jane never sees it.

### 6.4 Gold is synthetic; no live bank data

Train/val/holdout are generated scenarios (`phase4_gen_v1`). There is **no live bank production corpus**. A model fit only on synthetic packs can look strong on the same generator’s holdout and fail on real utterances.

Do not claim production quality. Do not claim fraud detection. Do not claim the model allows or blocks.

### 6.5 Same contract, no new fields

A future live model still returns `ScoreResponse` as specified. Do not add score fields to `ElahEvent`. Do not `prisma db push` to make scores envelope columns.

---

## 7. Product-freeze gaps stay out of scope

These are **not** Phase 6 feature requests.

| Gap | Why it stays |
|---|---|
| No ATM product | Out of MVP |
| No beneficiary-write product | Recipients are read-derived |
| No `device_change` action | Unusual device is a tag |
| Jane-visible `elahScore` | C11 / S7 |
| ELAH allow / deny / block / execute | Bank policy remains the authority |
| Scores on `ElahEvent` | Output contract |
| Closed 22 labels | No 23rd intent |

---

## 8. Related documents

| Document | Role |
|---|---|
| `ELAH_BASELINE_LIMITATIONS.md` | Inherited gap list |
| [ELAH_MODEL_TRAINING_RUN.md](./ELAH_MODEL_TRAINING_RUN.md) | Offline fit record |
| [ELAH_MODEL_ERROR_ANALYSIS.md](./ELAH_MODEL_ERROR_ANALYSIS.md) | Per-label misses |
| [ELAH_MODEL_CARD.md](./ELAH_MODEL_CARD.md) | Live rules + offline CatBoost |

---

## 9. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder |  |  | Approve / Approve with comments / Reject |
| Engineering |  |  |  |
| Security |  |  |  |

**Approval statement:** I agree that as of 30 August 2026 offline `catboost_v0` exists and is not live; that this memo inherits `ELAH-BASE-LIMIT-001`; that the blinded rules bar remains accuracy 0.79 / FP 0 / FN 1 and CatBoost beat it offline (0.90 / 0 / 0) without measuring latency or ECE; that live two-person Cohen’s κ is not a result; that product-freeze gaps stay out of scope; and that ELAH still never allows, blocks, or executes.

---

*End of document.*

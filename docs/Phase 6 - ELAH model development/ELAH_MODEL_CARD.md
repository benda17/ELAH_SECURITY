# ELAH Model Card

| Field | Value |
|---|---|
| Document ID | ELAH-MDL-CARD-001 |
| Version | **1.2** |
| Status | **Updated** — Section B filled from offline `catboost_v0`; ECE and in-process latency cited 31 Aug 2026. Live scorer remains `rules_v0`. |
| Date | 28 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related task | `task-6-create-model-cards` |
| Depends on | `ELAH-BASE-EVAL-001`, `ELAH-BASE-LIMIT-001`, `ELAH-DATA-VER-001`, `ELAH-MDL-DATA-001`, `ELAH-MDL-RUN-001`, `ELAH-MDL-CONF-001`, `ELAH-MDL-CAL-001`, `ELAH-MDL-LAT-001` |
| Gold | `data/phase4/v1.0/manifest.json` (copied at `elah-model/data/gold/v1.0/`) |
| Eval (rules) | `data/phase5/v1.0/eval-report.json` |
| Eval (CatBoost, offline) | `elah-model/artifacts/catboost_v0/metrics.json` |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. No ATM, beneficiary-write, or `device_change` product. Closed 22-label taxonomy **Approved** 26 August 2026. `rules_v0` is uncalibrated and is **not** a trained model. Offline CatBoost is **not** the live scorer.

This card does not change Prisma or ship a new live scorer.

---

## 1. Purpose

Record what is **live** today (`rules_v0`) and the first **offline** trained head (`catboost_v0`). Filling Section B is not a production-model claim and is not a cutover.

---

## A. Current live scorer — `rules_v0`

Deterministic feature → rules baseline (`lib/elah/baseline/`). Not a learned model. Phase 4 gold was used for **evaluation**, not for fitting the rules.

### A.1 Intended use

Genuine banking-intent scoring on **authenticated** assistant / UI events **before tools**. Output is a contract-valid score (intention, coordinates, explanation, `policyHook`) for bank policy to consume.

ELAH is **not** transaction monitoring. ELAH is **not** allow / deny / confirm / execute.

### A.2 Out of scope uses

| Use | Why out of scope |
|---|---|
| Fraud probability | Score is genuine-intent, not a fraud engine |
| Customer-visible risk | Jane / customer UI MUST NOT show `elahScore` |
| ATM | No ATM product |
| `device_change` | No `device_change` product; unusual device is a gold tag |
| Beneficiary-write | Recipients are read-derived; no beneficiary-write product |
| Production-model claims | Live path is still uncalibrated rules, not CatBoost |

### A.3 Data (eval only)

Phase 4 gold **v1.0** is the eval corpus. Rules are **deterministic**; they were not trained on this cut.

| Item | Value |
|---|---|
| `datasetVersion` | `v1.0` |
| Rows | **571** |
| Seed | `20260826` |
| Splits | train **393** / val **78** / holdout **100** |
| `taxonomyVersion` | `1.0` (closed 22-label, Approved 26 August 2026) |
| Generator | `phase4_gen_v1` (`provenance.generatorVersion`) |
| Source | Synthetic (`synthetic_generator`). Not live bank logs. |

Holdout is **protected**. See `ELAH-MDL-DATA-001`.

### A.4 Metrics (blinded holdout only)

Quote **only** blinded holdout from `data/phase5/v1.0/eval-report.json` (`split: holdout`, `scorer: rules_v0`, `n=100`, `blindedDetectedIntent: true`). Do not quote train or val as the bar. Do **not** quote 1.00.

| Metric | Value | Note |
|---|---|---|
| `n` | **100** | 0 skipped |
| Intent accuracy | **0.79** | Blinded; gold `detectedIntent` stripped |
| Macro-F1 | **~0.59** | `macroF1` ≈ 0.591; zero-support labels excluded |
| Legitimate-as-injection FP | **0** | `falsePositives.count` |
| Injection→P0-money FN | **1** | `azb-0005` |
| Injection recall | **0.59** | `prompt_injection_or_policy_bypass`, support 22 |
| ECE | **0.153** | Uncalibrated (`calibration.uncalibrated: true`) |
| In-process p50 / p95 | **0.004 / 0.006 ms** | Informational vs 80 / 200 ms budgets (Apple M2) |

These numbers are **`rules_v0` vs synthetic holdout**, not live dual-annotator κ.

### A.5 Provenance (live)

Every live `200` ScoreResponse:

| Field | Value |
|---|---|
| `provenance.scorer` | `rules_v0` |
| `provenance.modelVersion` | `null` |
| `provenance.labelSource` | `rules_v0` |

Analyst badge: **Uncalibrated (rules)** (`ELAH-SPEC-CONFIDENCE-001` C10). Customer UI: none of this.

Do not set `scorer: "model"` until a real model is integrated **and** latency holds.

### A.6 Ethical / product limits

- Jane never sees the score.
- ELAH never blocks (and never allows or executes).
- Gold is **synthetic** (`phase4_gen_v1`); not production customer traffic.
- No live two-person κ on the 100-row holdout.
- Closed 22-label taxonomy; no 23rd intent.

---

## B. First trained model — offline `catboost_v0`

Trained 30 August 2026 in `/Users/benda/elah-model`. **Not wired** to `POST /v1/score`. Cite blinded holdout only. Do not market injection recall as 100% / production.

| Field | Value |
|---|---|
| Chosen family | **CatBoost** (gradient-boosted trees) — founder-selected 26 August 2026 |
| Offline `modelVersion` | `catboost_v0` |
| Live `modelVersion` | **`null`** (not on the customer path) |
| Dataset version used for train | gold **v1.0** (train 393 / val 78; holdout 100 eval-only) |
| Holdout accuracy | **0.90** |
| Holdout macro-F1 | **~0.89** |
| Legitimate-as-injection FP | **0** |
| Injection→P0-money FN | **0** |
| Injection recall | **1.0** (22/22 on this **synthetic** slice — do not quote as production 100%) |
| ECE | **0.042** uncalibrated holdout; Platt **0.032** (offline calibrator only — `ELAH-MDL-CONF-001`, `ELAH-MDL-CAL-001`) |
| Latency (p50 / p95) | In-process extract+predict **0.176 / 2.16 ms** (darwin; **not** HTTP — `ELAH-MDL-LAT-001`) |
| Size | **4,347,408** bytes (`artifacts/catboost_v0/model.cbm`) |
| Date trained | **2026-08-30T18:27:08Z** |
| Beat holdout bar (0.79 / FP 0 / FN 1)? | **Offline yes** (accuracy / FP / FN). **Live cutover no** — no founder yes; HTTP p95 unmeasured; not integrated |

Weak labels on this holdout (see `ELAH-MDL-ERR-001`): `dispute_chargeback` (support 4, recall 0), `fraud_report` and `fee_or_overdraft_question` (support 1, recall 0), `internal_transfer` recall 0.57, `bill_payment` recall 0.50.

The bar to beat remains Section A.4. Beating FP by scoring all wires as injection is not a win. Beating ECE without remaining honest about calibration is not a win. Offline Platt does **not** calibrate live `rules_v0`.

---

## 2. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder |  |  | Approve / Approve with comments / Reject |
| Engineering |  |  |  |
| Security |  |  |  |

**Approval statement:** I agree the live scorer is uncalibrated `rules_v0` (not a trained model); that holdout metrics for rules are blinded n=100 from `data/phase5/v1.0/eval-report.json` only (accuracy 0.79, macro-F1 ~0.59, FP 0, FN 1 `azb-0005`); that Section B records offline `catboost_v0` on gold v1.0 (accuracy 0.90, FP 0, FN 0, uncalibrated ECE 0.042, in-process p95 2.16 ms) and is **not** live; that Jane never sees `elahScore`; and that ELAH never allows, blocks, or executes.

---

*End of document.*

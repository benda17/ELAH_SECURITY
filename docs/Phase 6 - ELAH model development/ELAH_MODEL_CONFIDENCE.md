# ELAH Model Confidence Analysis — `catboost_v0`

| Field | Value |
|---|---|
| Document ID | ELAH-MDL-CONF-001 |
| Version | **1.0** |
| Status | **Recorded** — offline holdout only |
| Date | 31 August 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related task | `task-6-analyze-model-confidence` |
| Depends on | `ELAH-SPEC-CONFIDENCE-001` (C1–C12), `ELAH-MDL-ABS-001`, `ELAH-MDL-CAL-001`, `ELAH-MDL-RUN-001` |
| Source | `artifacts/catboost_v0/confidence.json`, `metrics.json` |
| Gold | `data/gold/v1.0/splits/holdout.jsonl` (n=100, protected) |
| Code | `elah_model/evaluate.py` (`predict_proba`), `elah_model/metrics.py` |
| Does not own | `ScoreResponse` fields; Jane UI; live `POST /v1/score`; abstention runtime |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`, confidence, uncertainty, or abstention. No ATM, beneficiary-write, or `device_change` product. Closed 22-label taxonomy. `rules_v0` is uncalibrated and remains the live scorer. Abstention is **not** a block (C6).

This memo measures **offline** CatBoost confidence. It does **not** add ScoreResponse fields. It does **not** wire `POST /v1/score`. It does **not** show Jane a number.

---

## 1. Purpose

Name what “confidence” means on the CatBoost MultiClass head, measure expected calibration error (ECE) on blinded holdout, and check whether low vs high confidence actually tracks errors. C5 display bands are **UI copy only** and are used here as analysis slices, not API fields.

Without this, a later author will treat max-class probability as P(fraud), quote a fake 1.00, or turn Low confidence into a deny.

---

## 2. Definition (normative for this artifact)

**Confidence = max class probability** from CatBoost `predict_proba` (the probability mass on the argmax intent).

| This is | This is not |
|---|---|
| Reliability of **this** predicted `intentLabel` | P(fraud) |
| A unitless probability in `[0, 1]` | P(allow) / P(deny) / P(block) |
| Independent of `elahScore` (C3–C4) | P(injection) |
| The input to ECE and to C5 band slices | A ScoreResponse field on the live path |

`evaluate_split` now takes **argmax of `predict_proba`**, not a separate `predict()` path. Predicted class is the class with the largest probability. Confidence is that largest value.

The artifact emits 20 of the closed labels (gold v1.0 never showed `non_banking_request` on train). That does not change the definition.

C1–C12 remain in force. This memo does **not** invent a second quantity under the same name.

---

## 3. Blinded holdout (n=100) — uncalibrated

Holdout is **thin**. Do not market these rates as production calibration. Do **not** quote 1.00.

Source: `artifacts/catboost_v0/confidence.json` (`holdoutUncalibrated`). Gold `detectedIntent` stripped.

| Metric | Value | Note |
|---|---|---|
| `n` | **100** | Protected split; eval only |
| Intent accuracy | **0.90** | Unchanged vs `ELAH-MDL-RUN-001` |
| Mean max-class probability | **0.88** | Median sits near 0.97 |
| Min / max confidence | 0.29 / 0.999 | Two rows at ~0.29 |
| **ECE (10 equal-width bins)** | **0.042** | Top-1 ECE: \|acc − mean conf\| × bin mass |
| Live `rules_v0` ECE (same holdout) | **0.153** | Uncalibrated rules; not this model |

Val (n=78, **not** the published bar): uncalibrated ECE **0.071**. Do not quote val as the bar.

### 3.1 Reliability (10 bins)

Most mass is in the top bin. Empty bins are expected on n=100.

| Bin | n | Mean conf | Accuracy | \|gap\| |
|---|---:|---:|---:|---:|
| 0.0–0.1 | 0 | — | — | — |
| 0.1–0.2 | 0 | — | — | — |
| 0.2–0.3 | 2 | 0.29 | 0 / 2 | 0.29 |
| 0.3–0.4 | 0 | — | — | — |
| 0.4–0.5 | 5 | 0.48 | 2 / 5 | 0.08 |
| 0.5–0.6 | 6 | 0.54 | 3 / 6 | 0.04 |
| 0.6–0.7 | 6 | 0.67 | 4 / 6 | 0.00 |
| 0.7–0.8 | 2 | 0.74 | 2 / 2 | 0.26 |
| 0.8–0.9 | 6 | 0.88 | 6 / 6 | 0.12 |
| 0.9–1.0 | **73** | 0.98 | 73 / 73 | 0.02 |

Notes (not a production claim):

- Errors concentrate **below** 0.75. The 0.9–1.0 bin is slightly **underconfident** (all 73 correct, mean conf 0.98) — do not read that as “perfect 1.00.”
- The 0.2–0.3 and 0.7–0.8 bins have **n=2**. Gaps there are noisy.
- The two 0.29 rows are UI/agent twins of the same miss already named in `ELAH-MDL-ERR-001`: `dispute_chargeback` → `statement_download` (`cfi-0001`, `cfi-0007`).

### 3.2 C5 bands (analysis-only)

C5 copy: **High** `≥ 0.75`, **Moderate** `[0.40, 0.75)`, **Low** `< 0.40`. Not API fields. Not wired to `status`. Jane never sees them.

| Band | n | Errors | Error rate |
|---|---:|---:|---|
| Low `< 0.40` | **2** | 2 | 2 / 2 on this slice |
| Moderate `[0.40, 0.75)` | 18 | 8 | ~0.44 |
| High `≥ 0.75` | **80** | 0 | 0 / 80 |

Low-band n=2 is **too small** to set a cutoff. High-band 0 / 80 is a useful ordering signal on this synthetic holdout; it is **not** a 1.00 production guarantee. C7 (“SHOULD abstain when confidence < 0.40”) stays a Phase 0 default for a **future** producer. This pass does **not** emit `status: "abstained"` from CatBoost.

C6: if a later producer abstains, that **withholds** treating the score as decisive. It does **not** cancel the tool. Bank policy still allow / deny / confirm.

---

## 4. What this does not change

| Must not | Why |
|---|---|
| Add `ScoreResponse` fields | Contract 1.0 is closed |
| Wire CatBoost to `POST /v1/score` | Live scorer stays `rules_v0` |
| Show Jane confidence | C11 |
| Treat Low confidence as deny | C12; abstention is not a block |
| Fit or tune on holdout | Holdout is eval-only |
| Quote 1.00 / production 100% | n=100, synthetic `phase4_gen_v1` |

Calibrated (Platt) numbers live in `ELAH-MDL-CAL-001`. Uncalibrated ECE **0.042** is the number this memo owns.

---

## 5. How to reproduce

```bash
cd /Users/benda/elah-model
source .venv/bin/activate
python -m elah_model.analyze_confidence
```

Writes `artifacts/versions/catboost_v0/confidence.json` (convenience copy under `artifacts/catboost_v0/`). Does not call the bank.

---

## 6. Related documents

| Document | Role |
|---|---|
| `docs/Phase 0 - Product Definition/ELAH_CONFIDENCE_SEMANTICS.md` | C1–C12 |
| [ELAH_MODEL_ABSTENTION.md](./ELAH_MODEL_ABSTENTION.md) | C6 withhold ≠ cancel; no new fields |
| [ELAH_MODEL_CALIBRATION.md](./ELAH_MODEL_CALIBRATION.md) | Method table; Platt applied offline |
| [ELAH_MODEL_ERROR_ANALYSIS.md](./ELAH_MODEL_ERROR_ANALYSIS.md) | `dispute_chargeback` misses |

---

## 7. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder |  |  | Approve / Approve with comments / Reject |
| Engineering |  |  |  |
| Security |  |  |  |

**Approval statement:** I agree that offline CatBoost confidence is **max class probability** (not P(fraud), not P(allow)); that blinded holdout n=100 uncalibrated ECE is **0.042** (thin — do not quote 1.00); that C5 bands are analysis-only UI copy; that Jane never sees confidence; that abstention is not a block; and that this measurement does not wire `POST /v1/score` or add ScoreResponse fields. Live scorer remains uncalibrated `rules_v0`. ELAH still never allows, blocks, or executes.

---

*End of document.*

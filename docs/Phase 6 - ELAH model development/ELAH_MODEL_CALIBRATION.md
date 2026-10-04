# ELAH Model Calibration — `catboost_v0`

| Field | Value |
|---|---|
| Document ID | ELAH-MDL-CAL-001 |
| Version | **1.0** |
| Status | **Recorded** — offline artifact only; live scorer remains `rules_v0` |
| Date | 31 August 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related tasks | `task-6-calibrate-output-probabilities`, `task-6-compare-multiple-calibration-methods` |
| Depends on | `ELAH-MDL-CONF-001`, `ELAH-SPEC-CONFIDENCE-001` (C10), `ELAH-MDL-RUN-001` |
| Fit | val **78** rows only |
| Eval | holdout **100** rows (never used to fit) |
| Code | `elah_model/calibrate.py`, `elah_model/analyze_confidence.py` |
| Applied artifact | `artifacts/versions/catboost_v0/calibrator.json` (convenience copy under `artifacts/catboost_v0/`) |
| Does not own | Live bank; `POST /v1/score`; new `ScoreResponse` fields; Jane UI |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`, confidence, uncertainty, or abstention. Abstention is **not** a block (C6). `rules_v0` stays the live scorer and stays **uncalibrated**.

Founder decision for this pass: if one method **clearly** wins val→holdout ECE without hurting legitimate-as-injection FP or injection→P0-money FN, apply it to the **offline** artifact only. Still not live.

---

## 1. Purpose

Compare uncalibrated max-class probabilities to temperature scaling, Platt (binary-on-correctness), and isotonic. Fit on val. Score holdout. Apply at most one calibrator next to `model.cbm` if the win is clear. Do not calibrate on holdout. Do not quote 1.00.

---

## 2. Protocol

| Rule | Detail |
|---|---|
| Confidence (uncalibrated) | Max class probability (`ELAH-MDL-CONF-001`) |
| ECE | Top-1, **10** equal-width bins, same as the confidence memo |
| Fit | `data/gold/v1.0/splits/val.jsonl` (**78**) |
| Evaluate | `data/gold/v1.0/splits/holdout.jsonl` (**100**). **Thin.** |
| FP / FN | `elah_model/metrics.py`: legitimate-as-injection FP; injection→P0-money FN |
| Per-class Platt | Only if val has ≥8 positives and ≥8 negatives per class. **Not feasible** here (2 of 20 classes eligible) |
| Live path | Untouched. No `POST /v1/score`. No ScoreResponse fields |

**Clear win** (encoded in `elah_model/calibrate.py`): holdout ECE **lower** than uncalibrated **and** FP not worse **and** FN not worse **and** absolute ECE drop **≥ 0.01** **and** unique vs the next trustworthy method (gap ≥ 0.005). Isotonic that interpolates val (ECE 0 with too many PAV blocks) is **not** a candidate. Tie or noise → **defer**.

Temperature, Platt-on-correctness, and isotonic-on-correctness **do not change argmax** (T > 0; Platt/isotonic map the scalar confidence only). Accuracy / FP / FN therefore match uncalibrated on this run. ECE is the discriminator.

---

## 3. Method table (val fit → holdout eval)

Source: `artifacts/catboost_v0/metrics.json` → `calibration.methodTable`. Holdout n=100 is thin — treat hundredths of ECE as noisy.

| Method | Val ECE | Holdout ECE | Acc | FP | FN | Notes |
|---|---:|---:|---:|---:|---:|---|
| Uncalibrated | 0.071 | **0.042** | 0.90 | 0 | 0 | Max class probability |
| Temperature scaling | 0.058 | 0.039 | 0.90 | 0 | 0 | T ≈ **0.75** (sharpens; NLL fit) |
| **Platt (binary-on-correctness)** | 0.027 | **0.032** | 0.90 | 0 | 0 | σ(a·p̂ + b), a ≈ 9.84, b ≈ −4.90 |
| Isotonic (binary-on-correctness) | **0.00** | 0.024 | 0.90 | 0 | 0 | **Discarded** — 51 PAV blocks on 78 val rows (interpolation) |
| Per-class Platt | — | — | — | — | — | **Infeasible** (val too thin) |

Live `rules_v0` holdout ECE remains **0.153** (uncalibrated rules). That is the live badge, not this artifact.

Temperature barely moved holdout ECE (0.042 → 0.039). Isotonic zeroed val ECE with 51 blocks — overfit; not a candidate. Platt lowered val ECE (0.071 → 0.027) **and** holdout ECE (0.042 → 0.032) without touching FP/FN. Drop **0.011** vs uncalibrated; unique vs temperature.

---

## 4. Decision — apply Platt offline

**Applied:** `platt_binary_on_correctness` to the **offline** `catboost_v0` artifact only.

| Check | Result |
|---|---|
| Holdout ECE lower than uncalibrated? | Yes (0.032 vs 0.042) |
| FP worse? | No (0 → 0) |
| FN worse? | No (0 → 0) |
| Isotonic “win”? | No — overfit val |
| Temperature unique/clear? | No — drop 0.003 |
| Wired to live score? | **No** |
| Jane sees it? | **No** |

After Platt, offline confidence is **P(correct \| uncalibrated max-class probability)** = `sigmoid(a · max_p + b)`. It is still **not** P(fraud) or P(allow). Predicted `intentLabel` is unchanged. Uncalibrated ECE **0.042** remains the headline measurement in `ELAH-MDL-CONF-001`; calibrated ECE **0.032** is this artifact’s mapped confidence.

Holdout n=100 is thin. This is not a production calibration claim. Do not quote 1.00. Do not retire the live **Uncalibrated (rules)** badge — live `rules_v0` is untouched (C10).

### 4.1 Files

| Path | Role |
|---|---|
| `artifacts/versions/catboost_v0/calibrator.json` | Canonical offline calibrator |
| `artifacts/catboost_v0/calibrator.json` | Convenience copy |
| `artifacts/versions/catboost_v0/metrics.json` | `calibration.applied = true`, method table |
| `artifacts/catboost_v0/metrics.json` | Same, classroom path |

`calibrator.json` records `a`, `b`, fit-on-val, eval-on-holdout, `wiredToLiveScore: false`. It does not change the bank.

---

## 5. How to reproduce

```bash
cd /Users/benda/elah-model
source .venv/bin/activate
python -m elah_model.analyze_confidence
```

Fits on val, evaluates holdout, writes `calibrator.json` only if the clear-win rule fires. `--no-apply` compares without writing a calibrator.

---

## 6. What this does not change

| Must not | Why |
|---|---|
| Live `POST /v1/score` | Still `rules_v0` |
| New `ScoreResponse` fields | Contract 1.0 closed |
| Jane / customer UI | C11 |
| Abstention → block | C6 |
| Fit on holdout | Protocol |
| Claim production calibration | n=100 synthetic |

A later integration task may load this calibrator. Until then, `provenance.scorer` stays `rules_v0`, `modelVersion` stays `null`.

---

## 7. Related documents

| Document | Role |
|---|---|
| [ELAH_MODEL_CONFIDENCE.md](./ELAH_MODEL_CONFIDENCE.md) | Definition + uncalibrated ECE 0.042 |
| `docs/Phase 0 - Product Definition/ELAH_CONFIDENCE_SEMANTICS.md` | C10 uncalibrated rules |
| [ELAH_MODEL_ABSTENTION.md](./ELAH_MODEL_ABSTENTION.md) | Withhold ≠ cancel |
| [ELAH_MODEL_CARD.md](./ELAH_MODEL_CARD.md) | Live vs offline |

---

## 8. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder |  |  | Approve / Approve with comments / Reject |
| Engineering |  |  |  |
| Security |  |  |  |

**Approval statement:** I agree calibrators were fit on val (78) only and evaluated on holdout (100, thin); that uncalibrated holdout ECE is **0.042**; that Platt binary-on-correctness is the only clear win (holdout ECE **0.032**, FP 0, FN 0) after discarding overfit isotonic; that the calibrator is saved next to the **offline** artifact only and is **not** live; that Jane never sees confidence; that abstention is not a block; and that ELAH still never allows, blocks, or executes. Live `POST /v1/score` remains uncalibrated `rules_v0`.

---

*End of document.*

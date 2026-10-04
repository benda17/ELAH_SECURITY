# ELAH Model Robustness — missing / noisy / synthetic injection gold

| Field | Value |
|---|---|
| Document ID | ELAH-MDL-ROB-001 |
| Version | **1.0** |
| Status | **Recorded** — offline `catboost_v0` holdout only |
| Date | 31 August 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related tasks | `task-6-test-robustness-to-missing-context`, `task-6-test-robustness-to-noisy-context`, `task-6-test-robustness-to-adversarial-inputs` |
| Code | `elah_model/robustness.py` |
| Artifact | `artifacts/catboost_v0/robustness.json` |
| Model | `artifacts/catboost_v0/model.cbm` (`catboost_v0`) |
| Gold | `data/gold/v1.0/splits/holdout.jsonl` (n=100, protected) |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. Live `POST /v1/score` remains `rules_v0`. This eval does **not** change the live scorer.

**Missing context is unknown, not an attack.** Gold v1.0 was **not** rewritten in place. Perturbations ran on **copies in memory**.

**Adversarial card = blinded eval of existing synthetic injection gold packs.** Not a red team. Not exploit writing. Not production. No new payloads.

---

## 1. Purpose

Measure how offline CatBoost behaves when envelope fields are absent, when three feature knobs are noisy, and when scoring the synthetic injection-like gold already in holdout v1.0.

This is **not** a live robustness SLA, not a cutover, and not a claim that the model survives real missing fields or real injection.

---

## 2. Protocol

```bash
cd /Users/benda/elah-model
source .venv/bin/activate
python -m elah_model.robustness
```

| Rule | What we did |
|---|---|
| Blinding | `extract_features(..., strip_hint=True)` — gold `detectedIntent` stripped |
| Gold files | Holdout JSONL left unchanged |
| Missing context | Drop fields on a deep-copied event, then re-extract. Unknown ≠ attack |
| Noisy context | Feature knobs on extracted copies: flip `oddHours`, flip `shortUtterance`, jitter `amountBucket` one step (and keep `highValue` consistent) |
| Adversarial-gold | Score existing holdout rows whose gold intent is `prompt_injection_or_policy_bypass` and/or `pack` ∈ `{prompt_injection, indirect_injection}` |
| What we did not do | Rewrite gold; call the bank; change `POST /v1/score`; write exploits, exploit PoCs, malware, or attack procedures |

Headline hooks stay the Phase 5 pair: **legitimate-as-injection FP** and **injection→P0-money FN**. Injection recall is reported separately and **must not** be marketed as production 100%.

---

## 3. Clean holdout (baseline)

Same blinded protocol as `ELAH-MDL-RUN-001`.

| Metric | `catboost_v0` |
|---|---|
| n | **100** |
| Intent accuracy | **0.90** |
| Macro-F1 | **~0.89** |
| Legitimate-as-injection FP | **0** |
| Injection→P0-money FN | **0** |
| Injection recall | **1.0** (22/22 synthetic) |

Do not quote this as live model performance.

---

## 4. Missing context (unknown, not an attack)

Each row is a **separate** ablation: one field family dropped, others left as in gold. Labels stay the original gold labels.

On this holdout, 80/100 events have `conversation`, 60/100 have `toolName`, 100/100 have `amountBucket` and `policy`.

| Condition | Accuracy | Δ acc | FP | FN | Injection recall |
|---|---:|---:|---:|---:|---|
| Clean holdout | **0.90** | — | **0** | **0** | **1.0** (22/22) |
| Drop utterance / conversation | **0.91** | +0.01 | **0** | **0** | **1.0** |
| Drop `toolName` | **0.93** | +0.03 | **0** | **0** | **1.0** |
| Drop amount / `amountBucket` | **0.92** | +0.02 | **0** | **0** | **0.95** (21/22) |
| Drop policy | **0.90** | 0.00 | **0** | **0** | **1.0** |

FP and FN **did not move**. Dropping policy did not change accuracy. `injectionLikely` can still fire from `actionType == prompt_injection` after policy is absent.

Accuracy **upticks are not a quality win.** They reshuffle known weak pairs on n=100 (`internal_transfer` ↔ `savings_optimization`, one `dispute_chargeback` row). Do not drop fields in production hoping for a higher score.

**Injection miss under missing amount:** `azb-0013` (`authorization_boundary`, gold `prompt_injection_or_policy_bypass`) scored `loan_application` when amount / `amountBucket` were unknown. That is an injection-label miss. It is **not** an injection→P0-money FN (`loan_application` is not in the P0 money-movement set). Missing amount is still **unknown context**, not an attack.

---

## 5. Noisy context

Knobs applied to **extracted feature copies**, not to gold JSONL. Each knob is separate.

`amountBucket` jitter walks one step on the closed order: `none` → `micro_1_99` → `small_100_499` → `medium_500_1999` → `large_2000_9999` → `very_large_10000_plus` (even index +1, odd index −1, clamped). `highValue` is recomputed. Rows already `missing` are left alone (none on this holdout).

| Condition | Accuracy | Δ acc | FP | FN | Injection recall |
|---|---:|---:|---:|---:|---|
| Clean holdout | **0.90** | — | **0** | **0** | **1.0** (22/22) |
| Flip `oddHours` | **0.90** | 0.00 | **0** | **0** | **1.0** |
| Flip `shortUtterance` | **0.90** | 0.00 | **0** | **0** | **1.0** |
| Jitter `amountBucket` one step | **0.93** | +0.03 | **0** | **0** | **1.0** |

Flip knobs were **inert** on this head: predictions matched clean holdout. Amount-bucket jitter again moved the `internal_transfer` / `savings_optimization` / `bill_payment` cluster; FP/FN stayed **0**. Same warning: do not treat +0.03 as robustness.

These knobs are **not** a noise model of live banking traffic.

---

## 6. Adversarial-gold (synthetic, not a red team, not production)

**This section is a blinded eval of existing Phase 4 synthetic gold.** It is **not** a red team, **not** an exploit, **not** a jailbreak test, and **not** production injection detection.

No new strings were authored. No attack procedures are documented here. The model still only **scores intent**. It does not allow, block, or execute.

Holdout support: gold intent `prompt_injection_or_policy_bypass` **n=22**. Pack `prompt_injection` **n=4**. Pack `indirect_injection` **n=3**. Union of those two packs **n=7**. The other 15 injection-intent rows sit in other packs (`malicious`, `authorization_boundary`, …). Pack `legitimate` **n=40**.

| Slice | n | Injection recall | Legitimate-as-injection FP | Injection→P0 FN |
|---|---:|---|---:|---:|
| Gold intent `prompt_injection_or_policy_bypass` | 22 | **1.0** (22/22) | **0** | **0** |
| Pack `prompt_injection` | 4 | **1.0** (4/4) | **0** | **0** |
| Pack `indirect_injection` | 3 | **1.0** (3/3) | **0** | **0** |
| Packs `{prompt_injection, indirect_injection}` | 7 | **1.0** (7/7) | **0** | **0** |
| Pack `legitimate` | 40 | n/a (no injection gold) | **0** | **0** |
| Full holdout (same as §3) | 100 | **1.0** (22/22) | **0** | **0** |

Legitimate-pack accuracy is **0.825** (33/40). Those seven misses are genuine-intent confusions already named in `ELAH-MDL-ERR-001` (`internal_transfer`, `dispute_chargeback`, `fraud_report`, `fee_or_overdraft_question`, `bill_payment`). **None** were scored as injection.

**Do not market 22/22 as production 100%.** The generator is `phase4_gen_v1`. The slice is synthetic. Live injection is unmeasured.

---

## 7. What this eval did not do

- Did not rewrite gold v1.0
- Did not treat missing context as adversarial
- Did not write exploits, exploit PoCs, malware, or attack procedures
- Did not red-team the bank, the live scorer, or Jane’s UI
- Did not wire `POST /v1/score` or set live `modelVersion`
- Did not measure ECE, latency, or throughput
- Did not claim production robustness

---

## 8. Related documents

| Document | Role |
|---|---|
| [ELAH_MODEL_TRAINING_RUN.md](./ELAH_MODEL_TRAINING_RUN.md) | Clean blinded holdout bar |
| [ELAH_MODEL_ERROR_ANALYSIS.md](./ELAH_MODEL_ERROR_ANALYSIS.md) | Per-label misses this eval reshuffled |
| [ELAH_MODEL_LIMITATIONS.md](./ELAH_MODEL_LIMITATIONS.md) | Synthetic gold; not live |
| [ELAH_MODEL_VERSIONING.md](./ELAH_MODEL_VERSIONING.md) | Offline `catboost_v0` registry |

---

*End of document.*

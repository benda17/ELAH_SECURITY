# ELAH Model Training Run — `catboost_v0`

| Field | Value |
|---|---|
| Document ID | ELAH-MDL-RUN-001 |
| Version | **1.0** |
| Status | **Recorded** — offline artifact only |
| Date | 30 August 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related tasks | `task-6-build-the-training-pipeline`, `task-6-implement-feature-preprocessing`, `task-6-train-on-synthetic-data`, `task-6-evaluate-on-a-protected-holdout-set`, `task-6-test-model-size`, `task-6-evaluate-whether-the-model-is-lightweight-enough` |
| Training home | `/Users/benda/elah-model` |
| Artifact | `artifacts/catboost_v0/model.cbm` |
| Metrics | `artifacts/catboost_v0/metrics.json` |
| Code | `elah_model/train.py` |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. Live `POST /v1/score` remains `rules_v0`. This run does **not** change the live scorer.

---

## 1. Purpose

Record the first CatBoost training run so Phase 6 Kanban can cite evidence instead of a plan. This is an **offline** fit on frozen gold v1.0. It is not a live model, not a production claim, and not a cutover.

---

## 2. What was trained

| Field | Value |
|---|---|
| Head | CatBoost `MultiClass` (`catboost_v0`) |
| Encoder | Phase 5 feature port `elah_model/features.py` (keep in sync with `lib/elah/baseline/features.ts`) |
| Target | `labels.intentLabel` (closed 22) |
| Blinding | `event.detectedIntent` stripped before extract (`stripDetectedIntent: true`) |
| Dataset | Phase 4 gold **v1.0** (synthetic `phase4_gen_v1`, seed `20260826`) |
| Train | `data/gold/v1.0/splits/train.jsonl` — **393** rows (fit) |
| Val | `data/gold/v1.0/splits/val.jsonl` — **78** rows (early stop) |
| Holdout | `data/gold/v1.0/splits/holdout.jsonl` — **100** rows (**eval only**, not fit) |
| Seed | `20260826` |
| Iterations (best) | **394** (max 400, `od_wait` 40) |
| Depth | 6 |
| Trained at | `2026-08-30T18:27:08.795Z` |
| Artifact size | **4,347,408** bytes (`model.cbm`) |
| GPU | Not used |

Holdout was **not** used to fit or tune hyperparameters. It was scored after `model.fit(train, eval_set=val)`.

Unlabeled simulator-log JSONL was **not** mixed in (`task-6-train-on-simulator-data` remains backlog on purpose).

---

## 3. How to reproduce

```bash
cd /Users/benda/elah-model
source .venv/bin/activate
python -m elah_model.train
```

Writes `artifacts/catboost_v0/model.cbm` and `artifacts/catboost_v0/metrics.json`. Artifacts are gitignored.

---

## 4. Blinded holdout (n=100)

Source: `artifacts/catboost_v0/metrics.json`. Same protocol as Phase 5: gold `detectedIntent` stripped.

| Metric | `rules_v0` bar | `catboost_v0` (offline) |
|---|---|---|
| Intent accuracy | **0.79** | **0.90** |
| Macro-F1 | **~0.59** | **~0.89** |
| Legitimate-as-injection FP | **0** | **0** |
| Injection→P0-money FN | **1** (`azb-0005`) | **0** |
| Injection recall | **0.59** (support 22) | **1.0** (22/22 on this synthetic slice) |

Val (n=78, not the published bar): accuracy **0.936**, FP **0**, FN **0**. Do not quote val as the bar.

**Do not market injection recall as 100% / production.** The holdout is synthetic `phase4_gen_v1`. ECE was **not** measured on this run. In-process / HTTP latency was **not** measured.

Offline, this run **beats** the Phase 5 accuracy / FP / FN bar. That is **not** live cutover. Promotion still requires latency (`ELAH-MDL-ARCH-001` §5): p95 ≤ 200 ms, fail-open 250 ms. Those numbers are **unmeasured**. Live provenance stays `scorer = rules_v0`, `modelVersion = null`.

---

## 5. Size / lightweight

| Check | Result |
|---|---|
| Artifact size | 4.15 MiB (4,347,408 bytes) |
| Runtime class | CPU CatBoost; no GPU required for this head |
| Live p50 / p95 | **Unmeasured** — model is not on `POST /v1/score` |
| Cutover | **No** |

The model is small enough to colocate later. Size does not waive the latency bar.

---

## 6. What this run did not do

- Did not wire `POST /v1/score`
- Did not set `provenance.scorer = model`
- Did not train on unlabeled simulator logs
- Did not calibrate probabilities / measure ECE
- Did not measure inference speed or throughput
- Did not add rollback / `modelVersion` on the live path
- Did not change Jane’s UI, bank policy, or Prisma

---

## 7. Related documents

| Document | Role |
|---|---|
| [ELAH_MODEL_CARD.md](./ELAH_MODEL_CARD.md) | Section B filled from this run |
| [ELAH_MODEL_DATASET_VERSIONS.md](./ELAH_MODEL_DATASET_VERSIONS.md) | `catboost_v0` bound to gold v1.0 |
| [ELAH_MODEL_ERROR_ANALYSIS.md](./ELAH_MODEL_ERROR_ANALYSIS.md) | Per-label holdout errors |
| [ELAH_MODEL_LIMITATIONS.md](./ELAH_MODEL_LIMITATIONS.md) | Still synthetic; still not live |

---

*End of document.*

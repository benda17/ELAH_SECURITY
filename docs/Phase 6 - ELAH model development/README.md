# Phase 6 — ELAH model development

**Training home:** [`/Users/benda/elah-model`](/Users/benda/elah-model). Live `POST /v1/score` in the banking repo stays `rules_v0` until a model is integrated on purpose.

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. No ATM, beneficiary-write, or `device_change` product. Closed 22-label taxonomy. `rules_v0` is **uncalibrated** and remains the live scorer.

Evidence date: **28 September 2026** (Kanban honesty audit). Phase 6 has **31** cards: **29 Done** (offline), **2 Backlog**. Offline CatBoost `catboost_v0` is registered under `artifacts/versions/`. In-process latency is measured (`ELAH-MDL-LAT-001`; not HTTP). **Live integration is backlog** — no founder yes, `POST /v1/score` stays `rules_v0`. **Train on simulator data is backlog** — plan only; no labeled v1.1 cut. Offline versioning / experiment log / training-home rollback / robustness / confidence / calibration remain **done** (not live rollback; not a red team; calibrator not wired to the bank).

Demo (unchanged): `security.admin@elah.demo` / `DemoPass123!` → `/admin/elah-events` and `/admin/elah-baseline`. Jane never sees scores.

---

## Index

| Order | Task | Task id | Status | Doc / code |
|---:|---|---|---|---|
| 1 | Define the initial model architecture. | `task-6-define-the-initial-model-architecture` | Done | [ELAH_MODEL_ARCHITECTURE.md](./ELAH_MODEL_ARCHITECTURE.md) v1.2 |
| 2 | Compare rules, CatBoost, SLMs, and hybrid. | `task-6-compare-rules-classical-machine-learning-small-l` | Done | [ELAH_MODEL_APPROACH_COMPARISON.md](./ELAH_MODEL_APPROACH_COMPARISON.md) v1.2 |
| 3 | Establish a simple baseline model. | `task-6-establish-a-simple-baseline-model` | Done | Live `rules_v0` (Phase 5). First trained head is offline CatBoost. |
| 4 | Build the training pipeline. | `task-6-build-the-training-pipeline` | Done | `elah_model/train.py` · [ELAH_MODEL_TRAINING_RUN.md](./ELAH_MODEL_TRAINING_RUN.md) |
| 5 | Build the evaluation pipeline. | `task-6-build-the-evaluation-pipeline` | Done | `elah_model/evaluate.py`, `metrics.py` |
| 6 | Implement feature preprocessing. | `task-6-implement-feature-preprocessing` | Done | `elah_model/features.py` |
| 7 | Implement model versioning. | `task-6-implement-model-versioning` | Done | [ELAH_MODEL_VERSIONING.md](./ELAH_MODEL_VERSIONING.md) · `artifacts/versions/` |
| 8 | Implement experiment tracking. | `task-6-implement-experiment-tracking` | Done | `artifacts/experiments.jsonl` (append-only; not MLflow) |
| 9 | Train on simulator data. | `task-6-train-on-simulator-data` | **Backlog** | Plan only: [ELAH_MODEL_DATASET_V1.1_PLAN.md](./ELAH_MODEL_DATASET_V1.1_PLAN.md). No v1.1 cut on disk. Must not mix unlabeled logs. |
| 10 | Train on synthetic data. | `task-6-train-on-synthetic-data` | Done | gold v1.0 train.jsonl (393) |
| 11 | Evaluate on a protected holdout set. | `task-6-evaluate-on-a-protected-holdout-set` | Done | holdout n=100 · metrics.json |
| 12 | Perform error analysis. | `task-6-perform-error-analysis` | Done | [ELAH_MODEL_ERROR_ANALYSIS.md](./ELAH_MODEL_ERROR_ANALYSIS.md) |
| 13 | Analyze errors by banking action. | `task-6-analyze-errors-by-banking-action` | Done | same memo §4 |
| 14 | Analyze errors by user-intent category. | `task-6-analyze-errors-by-user-intent-category` | Done | same memo §3 |
| 15 | Analyze errors by agent/tool behavior. | `task-6-analyze-errors-by-agent-tool-behavior` | Done | [ELAH_MODEL_ERROR_ANALYSIS.md](./ELAH_MODEL_ERROR_ANALYSIS.md) §7 |
| 16 | Analyze model confidence. | `task-6-analyze-model-confidence` | Done | [ELAH_MODEL_CONFIDENCE.md](./ELAH_MODEL_CONFIDENCE.md) · ECE **0.042** uncalibrated holdout |
| 17 | Calibrate output probabilities. | `task-6-calibrate-output-probabilities` | Done | [ELAH_MODEL_CALIBRATION.md](./ELAH_MODEL_CALIBRATION.md) · Platt offline only |
| 18 | Compare multiple calibration methods. | `task-6-compare-multiple-calibration-methods` | Done | same memo §3 |
| 19 | Define abstention behavior for uncertain cases. | `task-6-define-abstention-behavior-for-uncertain-cases` | Done | [ELAH_MODEL_ABSTENTION.md](./ELAH_MODEL_ABSTENTION.md) |
| 20 | Test robustness to missing context. | `task-6-test-robustness-to-missing-context` | Done | [ELAH_MODEL_ROBUSTNESS.md](./ELAH_MODEL_ROBUSTNESS.md) — unknown, not an attack |
| 21 | Test robustness to noisy context. | `task-6-test-robustness-to-noisy-context` | Done | same memo §5 |
| 22 | Test robustness to adversarial inputs. | `task-6-test-robustness-to-adversarial-inputs` | Done | same memo §6 — **synthetic gold, not a red team, not production** |
| 23 | Test inference speed. | `task-6-test-inference-speed` | Done | [ELAH_MODEL_LATENCY.md](./ELAH_MODEL_LATENCY.md) · in-process extract+predict p95 **2.16 ms** (darwin; not HTTP) |
| 24 | Test throughput. | `task-6-test-throughput` | Done | same memo · **1,579** extract+predict events/sec; batch size **32** |
| 25 | Test model size. | `task-6-test-model-size` | Done | 4,347,408 bytes |
| 26 | Evaluate whether the model is lightweight enough. | `task-6-evaluate-whether-the-model-is-lightweight-enough` | Done | CPU-class 4.15 MiB; in-process p95 **2.16 ms**; **no** live cutover |
| 27 | Create model cards. | `task-6-create-model-cards` | Done | [ELAH_MODEL_CARD.md](./ELAH_MODEL_CARD.md) v1.2 |
| 28 | Document dataset versions used. | `task-6-document-dataset-versions-used` | Done | [ELAH_MODEL_DATASET_VERSIONS.md](./ELAH_MODEL_DATASET_VERSIONS.md) v1.2 |
| 29 | Document known limitations. | `task-6-document-known-limitations` | Done | [ELAH_MODEL_LIMITATIONS.md](./ELAH_MODEL_LIMITATIONS.md) v1.2 |
| 30 | Add rollback support between model versions. | `task-6-add-rollback-support-between-model-versions` | Done | Offline only: `python -m elah_model.evaluate --model-version catboost_v0` · `--set-current`. Not live. |
| 31 | Integrate the best model into the ELAH service. | `task-6-integrate-the-best-model-into-the-elah-service` | **Backlog** | Not wired. Prepare spec only: [ELAH_MODEL_HYBRID_OVERLAY.md](./ELAH_MODEL_HYBRID_OVERLAY.md). Live `POST /v1/score` is `rules_v0`. No founder yes. |
| — | Founder terms glossary (non-technical) | — | — | [TERMS.md](./TERMS.md) (`ELAH-MDL-TERMS-001`) — copy into Confluence |
| — | Founder executive summary | — | — | [ELAH_PHASE6_EXECUTIVE_SUMMARY.md](./ELAH_PHASE6_EXECUTIVE_SUMMARY.md) |
| — | Training run record | — | — | [ELAH_MODEL_TRAINING_RUN.md](./ELAH_MODEL_TRAINING_RUN.md) |
| — | In-process latency / throughput | — | — | [ELAH_MODEL_LATENCY.md](./ELAH_MODEL_LATENCY.md) |
| — | Dataset v1.1 plan (simulator-labeled) | `task-6-train-on-simulator-data` | Plan | [ELAH_MODEL_DATASET_V1.1_PLAN.md](./ELAH_MODEL_DATASET_V1.1_PLAN.md) |
| — | Offline versioning / experiments / rollback | — | — | [ELAH_MODEL_VERSIONING.md](./ELAH_MODEL_VERSIONING.md) |

---

## How to train (offline)

```bash
cd /Users/benda/elah-model
source .venv/bin/activate
python -m elah_model.train
python -m elah_model.bench
```

Writes a **new** `modelVersion` under `artifacts/versions/` (does not overwrite `catboost_v0`). See [ELAH_MODEL_VERSIONING.md](./ELAH_MODEL_VERSIONING.md). `python -m elah_model.bench` is in-process latency on `catboost_v0` — not HTTP, not a cutover.

Related: Phase 5 baseline pack, Phase 4 dataset pack, Phase 0 output/confidence/latency contracts.

---

*End of document.*

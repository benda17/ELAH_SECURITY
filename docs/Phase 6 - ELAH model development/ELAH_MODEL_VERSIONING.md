# ELAH Model Versioning (offline)

| Field | Value |
|---|---|
| Document ID | ELAH-MDL-VER-001 |
| Version | **1.0** |
| Status | **Recorded** — offline registry only; live scorer remains `rules_v0` |
| Date | 31 August 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related tasks | `task-6-implement-model-versioning`, `task-6-implement-experiment-tracking`, `task-6-add-rollback-support-between-model-versions` |
| Training home | `/Users/benda/elah-model` |
| Registry | `artifacts/versions/<modelVersion>/` |
| Pointer | `artifacts/current.json` (alias `current`) |
| Experiment log | `artifacts/experiments.jsonl` |
| Code | `elah_model/versioning.py`, `elah_model/train.py`, `elah_model/evaluate.py` |
| First registered version | **`catboost_v0`** (migrated from the 30 August 2026 run) |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. Live `POST /v1/score` remains `rules_v0`. This registry does **not** change the live scorer. Offline `modelVersion` is **not** live `provenance.modelVersion`.

This document is not a production-model claim and is not a cutover. There is no MLflow. The bank is not wired.

---

## 1. Purpose

Name how offline CatBoost artifacts are stored so a new train cannot silently destroy the only copy, how each run is logged, and how to eval a prior version (offline rollback of the **training-home default**, not live rollback).

Until `task-6-integrate-the-best-model-into-the-elah-service` ships, live provenance stays `scorer = rules_v0`, `modelVersion = null`. Changing `artifacts/current.json` does **not** change what the bank runs.

---

## 2. Layout

```
artifacts/
  current.json                 # alias "current" → one modelVersion
  experiments.jsonl            # append-only; one JSON object per train
  catboost_v0/                 # convenience copy of whatever "current" points at
    model.cbm
    metrics.json
    manifest.json
  versions/
    catboost_v0/               # immutable first run (30 Aug 2026)
      model.cbm
      metrics.json
      manifest.json
    catboost_v1/               # next train (example)
      …
```

| Path | Mutable? | Role |
|---|---|---|
| `artifacts/versions/<modelVersion>/` | **No.** Never overwrite, rename, or delete a shipped directory | Canonical artifact |
| `artifacts/current.json` | Yes | Offline default pointer |
| `artifacts/catboost_v0/` | Yes (copy of current) | Studio / old paths. Not the registry of record |
| `artifacts/experiments.jsonl` | Append only | Experiment tracking |

`artifacts/catboost_v0/` keeps that name so existing classroom paths still resolve. After a later train that updates `current`, those files may be a **copy of `catboost_v1`** (or whichever current is). The original weights remain at `artifacts/versions/catboost_v0/`.

Artifacts stay gitignored.

---

## 3. `modelVersion` string

| Rule | Detail |
|---|---|
| Existing artifact | **`catboost_v0`** — the 30 August 2026 fit on gold v1.0. Migrated into `versions/catboost_v0/`; never overwritten |
| New trains | Next free `catboost_vN` (`catboost_v1`, `catboost_v2`, …) unless `--model-version` is set |
| Explicit name | `--model-version NAME` is allowed only if that directory does **not** already exist |
| Live | Still **`null`**. This string is an offline directory name, not `POST /v1/score` provenance |

Do not reuse a name. Do not claim a new train is still `catboost_v0`.

---

## 4. `manifest.json`

Written beside `model.cbm` in every version directory.

| Field | Meaning |
|---|---|
| `modelVersion` | Directory name |
| `datasetVersion` | Gold cut (`v1.0` until a new cut exists) |
| `seed` | CatBoost `random_seed` |
| `trainedAt` | UTC ISO-8601 |
| `iterations` | Best iteration used (`use_best_model`) |
| `depth` | Tree depth |
| `sha256` | Hex digest of `model.cbm` |
| `nTrain` / `nVal` / `nHoldout` | Split sizes |
| `holdout.intentAccuracy` | Blinded holdout accuracy |
| `holdout.legitimateAsInjectionFp` | Legitimate-as-injection FP |
| `holdout.injectionToP0MoneyFn` | Injection→P0-money FN |
| `bytesCbm` | Size of `model.cbm` |
| `runId` | Ties this directory to one `experiments.jsonl` line |
| `liveScorer` | Always `rules_v0` on this path |
| `wiredToLiveScore` | Always `false` |

`metrics.json` remains the full eval report (per-label, val, feature lists). Manifest is the short, comparable card.

---

## 5. Experiment tracking

`artifacts/experiments.jsonl` is **append-only**. One JSON object per train. Do not rewrite or delete prior lines. Do not introduce MLflow.

Each line includes at least: `runId`, `modelVersion`, `datasetVersion`, `seed`, `iterations`, `depth`, holdout accuracy / FP / FN, `artifactPath`, `trainedAt`, `sha256`.

The migrated `catboost_v0` run is the first line (`runId` `run_catboost_v0`, `"migrated": true`).

This is a local log. It is not a live experiment dashboard and not evidence that a model is in production.

---

## 6. How to train a new version without deleting the old one

```bash
cd /Users/benda/elah-model
source .venv/bin/activate
python -m elah_model.train
```

That command:

1. Leaves `artifacts/versions/catboost_v0/` untouched.
2. Allocates the next name (`catboost_v1` if only `catboost_v0` exists).
3. Writes `model.cbm`, `metrics.json`, `manifest.json` under `artifacts/versions/<new>/`.
4. Appends one line to `artifacts/experiments.jsonl`.
5. Updates `artifacts/current.json` and refreshes the convenience copy at `artifacts/catboost_v0/`.

Keep the prior default as `current` (still write the new immutable dir):

```bash
python -m elah_model.train --no-update-current
```

Pin a name (fails if that version already exists):

```bash
python -m elah_model.train --model-version catboost_v1
```

There is no in-place overwrite of `versions/catboost_v0`. Re-running train always creates a sibling directory.

---

## 7. Offline rollback (eval a prior version)

This is **training-home** rollback: score a stored `.cbm` on gold, or retarget the offline `current` alias. It is **not** live rollback. It does not change `POST /v1/score`, Prisma, Jane, or bank policy.

### 7.1 Eval a stored version

```bash
python -m elah_model.evaluate --model-version catboost_v0
python -m elah_model.evaluate --alias current --split holdout
```

Loads `artifacts/versions/<modelVersion>/model.cbm`, scores the requested gold split (quote **holdout**), prints metrics. Does not write a new version. Does not overwrite the stored files.

### 7.2 Retarget offline `current`

```bash
python -m elah_model.versioning --list
python -m elah_model.versioning --set-current catboost_v0
```

`--set-current` copies that immutable directory back onto the convenience path and rewrites `current.json`. Prior version directories stay on disk.

### 7.3 What this is not

| Not this | Why |
|---|---|
| Live scorer rollback | Live path is still `rules_v0`; there is no live CatBoost to roll back |
| `provenance.modelVersion` on `ScoreResponse` | Remains `null` until integration |
| Deleting a bad train | Versions are immutable; leave the dir; stop pointing `current` at it |
| MLflow / cloud registry | Local directories + JSONL only |

---

## 8. First registered artifact — `catboost_v0`

Migrated 31 August 2026 from `artifacts/catboost_v0/` (the 30 August 2026 run, `ELAH-MDL-RUN-001`).

| Field | Value |
|---|---|
| `modelVersion` | `catboost_v0` |
| `datasetVersion` | `v1.0` |
| Seed | `20260826` |
| Best iterations | **394** |
| Depth | 6 |
| `sha256` (`model.cbm`) | `edae0f6c43c62c420b9f4dc8d366f02d569ac5d971cb45011f9e579addabde8e` |
| Size | **4,347,408** bytes |
| Holdout | accuracy **0.90**, FP **0**, FN **0** (synthetic gold v1.0, n=100) |
| Live? | **No** |

Do **not** market holdout 0.90 / injection recall 1.0 as production. Latency and ECE were **not** measured. Promotion still requires `ELAH-MDL-ARCH-001` §5.

---

## 9. What this pass did not do

- Did not wire `POST /v1/score`
- Did not set `provenance.scorer = model`
- Did not `prisma db push` scores
- Did not add MLflow
- Did not change Jane’s UI, bank policy, or the live fail-open (250 ms)
- Did not train on unlabeled simulator logs
- Did not make offline `current` a production alias

---

## 10. Related documents

| Document | Role |
|---|---|
| [ELAH_MODEL_TRAINING_RUN.md](./ELAH_MODEL_TRAINING_RUN.md) | First fit (`catboost_v0`) |
| [ELAH_MODEL_DATASET_VERSIONS.md](./ELAH_MODEL_DATASET_VERSIONS.md) | Gold v1.0 binding |
| [ELAH_MODEL_CARD.md](./ELAH_MODEL_CARD.md) | Section B: offline `catboost_v0` |
| [ELAH_MODEL_ARCHITECTURE.md](./ELAH_MODEL_ARCHITECTURE.md) | Live path still `rules_v0` |

---

*End of document.*

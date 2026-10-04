# ELAH Model Dataset Versions

| Field | Value |
|---|---|
| Document ID | ELAH-MDL-DATA-001 |
| Version | **1.2** |
| Status | **Updated** — offline `catboost_v0` bound to gold v1.0; v1.1 planned, not on disk as a training cut |
| Date | 31 August 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related task | `task-6-document-dataset-versions-used` |
| Depends on | `ELAH-DATA-VER-001`, `ELAH-MDL-CARD-001`, `ELAH-MDL-RUN-001` |
| Versioning spec | `docs/Phase 4 - Dataset and labeling system/ELAH_DATASET_VERSIONING.md` |
| Manifest (producer) | `ELAH_SECURITY---Banking-System/data/phase4/v1.0/manifest.json` |
| Manifest (consumer) | `elah-model/data/gold/v1.0/manifest.json` |
| Eval report (rules) | `data/phase5/v1.0/eval-report.json` |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. No ATM, beneficiary-write, or `device_change` product. Closed 22-label taxonomy **Approved** 26 August 2026. `rules_v0` is uncalibrated and is **not** a trained model. No fabricated customers or production-model claims.

This is documentation. It does not rewrite gold JSONL.

---

## 1. Purpose

Name the **only** gold cut Phase 6 may cite **today** (`v1.0`), freeze split paths and counts, and bind offline `catboost_v0` to that `datasetVersion`. Holdout stays protected. Dataset **v1.1** is a **plan** (`ELAH-MDL-DATA-V11-001`), not a published train cut.

Canonical versioning rules remain in `ELAH_DATASET_VERSIONING.md` (`ELAH-DATA-VER-001`). This document is the Phase 6 pointer, not a second versioning spec.

---

## 2. Current cut — Phase 4 gold v1.0

Cited from `data/phase4/v1.0/manifest.json` (copy in `elah-model/data/gold/v1.0/`):

| Field | Value |
|---|---|
| `datasetVersion` | `v1.0` |
| `taxonomyVersion` | `1.0` |
| Seed | `20260826` |
| Total rows | **571** |
| Generator | `phase4_gen_v1` |
| Source | Synthetic (`synthetic_generator`). Simulator / synthetic only. |
| `generatedAt` | `2026-08-26T00:00:00.000Z` |
| Changelog | `initial synthetic cut 26 Aug 2026` |
| Consumer copy | Copied 30 August 2026 into `elah-model` (`data/gold/v1.0/SOURCE.txt`) |

Do **not** claim live bank logs. Unlabeled simulator-log JSONL (Phase 4 normalize path) is not this gold cut and MUST NOT be used as holdout or as a silent train mix.

`task-6-train-on-simulator-data` is **done as a plan** (`ELAH-MDL-DATA-V11-001`). **Training on v1.1 stays blocked** until a real cut exists (manifest + splits). Founder decision 31 August 2026: plan v1.1 from labeled simulator events; do not rewrite v1.0. Placeholder: `data/gold/v1.1/README.txt` (not published — no JSONL).

### 2.1 Planned — datasetVersion v1.1 (not a train cut)

| Field | Value |
|---|---|
| Status | **Planned.** Not on disk as train/val/holdout JSONL. |
| Producer (future) | `ELAH_SECURITY---Banking-System/data/phase4/v1.1/` — directory does **not** exist yet |
| Consumer (today) | `elah-model/data/gold/v1.1/README.txt` only |
| Source (intended) | Human-labeled simulator events after `normalize:elah-logs` + labeling UI |
| Must not | Rewrite v1.0; mix unlabeled `from-simulator.jsonl` into v1.0; train a model on an empty v1.1 folder |

Do not cite v1.1 row counts. There are none.

---

## 3. Split paths

| Path (producer / consumer) | Split | Rows | Use |
|---|---|---|---|
| `…/splits/train.jsonl` | train | **393** | Fit only |
| `…/splits/val.jsonl` | val | **78** | Early stop / tuning only |
| `…/splits/holdout.jsonl` | holdout | **100** | **Protected.** Eval only. Never train or tune on holdout. |

Counts match `counts.splits` in the manifest (train 393 + val 78 + holdout 100 = 571).

`rules_v0` did **not** train on train.jsonl. Rules are deterministic.

`catboost_v0` **did** train on train.jsonl, used val for early stopping, and scored holdout after fit (`ELAH-MDL-RUN-001`).

---

## 4. Immutability

Once `v1.0` is published:

- No in-place gold edits (do not rewrite pack or split JSONL to “fix a label”).
- A new cut is a **new directory** (`v1.1/`, …), not an overwrite of `v1.0`.
- Do not change seed `20260826` and claim the same version.
- Do not mix live production events into this directory.

If a label error is found, ship a new `datasetVersion` with a changelog line. Keep `v1.0` on disk for comparability.

---

## 5. Leakage keys

From Phase 4 `lib/elah/dataset/leakage.ts` (`assertNoLeakage`):

| Key | Rule |
|---|---|
| `sequenceId` | MUST NOT appear in more than one of train / val / holdout |
| `twinGroupId` | MUST NOT appear in more than one of train / val / holdout |

UI/agent twins and multi-step sequences must train together or hold out together. `scenarioId` is unique per row and is the fallback group key (`ELAH-DATA-VER-001` §5).

Do not “fix” leakage by moving holdout rows into train.

---

## 6. Binding `modelVersion` → `datasetVersion`

| Artifact | `datasetVersion` | Live? |
|---|---|---|
| Live scorer `rules_v0` | Eval-only: gold v1.0 holdout (`modelVersion = null`) | **Yes** |
| Offline CatBoost `catboost_v0` | **v1.0** (train/val fit; holdout eval) | **No** |

Until a published v1.1 cut exists on disk (manifest + splits), any further trained `modelVersion` **MUST** record `datasetVersion` **v1.0**. Do not bind a model to v1.1 while `data/gold/v1.1/` has only a README.

---

## 7. Phase 5 eval report is not this training run

`data/phase5/v1.0/eval-report.json` is an **eval** of `rules_v0` on holdout v1.0 (`n=100`, blinded). It is not a CatBoost checkpoint.

Blinded holdout numbers for **rules** (accuracy **0.79**, macro-F1 **~0.59**, FP **0**, FN **1** `azb-0005`) come from that report only.

Blinded holdout numbers for **CatBoost** (accuracy **0.90**, macro-F1 **~0.89**, FP **0**, FN **0**) come from `artifacts/catboost_v0/metrics.json` (`ELAH-MDL-RUN-001`). Do **not** present either as production-model performance. Do not quote 1.00 as a marketing figure.

---

## 8. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder |  |  | Approve / Approve with comments / Reject |
| Engineering |  |  |  |
| Data |  |  |  |
| Security |  |  |  |

**Approval statement:** I agree Phase 6 cites gold v1.0 only as the train cut today (`571` rows; train `393` / val `78` / holdout `100`); that v1.1 is planned and not a published cut; that holdout is protected and never used for train or tune; that gold v1.0 is immutable in place; that leakage keys are `sequenceId` and `twinGroupId`; that offline `catboost_v0` records `datasetVersion` v1.0; that live `modelVersion` remains null; that the Phase 5 report is rules_v0 eval, not CatBoost; and that ELAH never allows, blocks, or executes.

---

*End of document.*

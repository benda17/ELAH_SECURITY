# Phase 6 — Executive summary (offline training pass)

| Field | Value |
|---|---|
| Date | 30 August 2026 |
| Audience | Founder |
| Status | **17 of 31 cards Done** (6 planning memos + 11 evidenced implementation cards). **14 cards remain backlog** (versioning, simulator-log train, confidence/calibration, robustness, latency/throughput, rollback, live integrate). **0 blocked.** |
| Evidence | `docs/Phase 6 - ELAH model development/` and `/Users/benda/elah-model` |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before** tool execution. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Jane never sees `elahScore`. `rules_v0` is uncalibrated and remains the **live** scorer. Offline CatBoost is not wired to `POST /v1/score`.

---

## What shipped (30 August 2026)

Training home: `/Users/benda/elah-model`. First trained head: **CatBoost** `catboost_v0` on gold v1.0 (train 393 / val 78 / holdout 100 eval-only). `detectedIntent` stripped. Artifact `artifacts/catboost_v0/model.cbm` (4,347,408 bytes).

| Item | Result |
|---|---|
| Architecture / approach | CatBoost selected (26 Aug). Offline artifact now exists. Live path unchanged. |
| Training + features + eval | `elah_model/train.py`, `features.py`, `evaluate.py` |
| Blinded holdout | Accuracy **0.90**, macro-F1 **~0.89**, FP **0**, FN **0** vs rules bar **0.79 / 0 / 1** |
| Model card / dataset / limitations | Section B filled; `catboost_v0` bound to dataset **v1.0**; limits updated |
| Error analysis | Per-label + banking-action families (`ELAH-MDL-ERR-001`) |
| Size | 4.15 MiB, CPU-class. Live p95 **unmeasured** |

Live provenance stays `scorer = rules_v0`, `modelVersion = null`. Promotion still needs latency + explicit integration.

## What this pass did not do

Did not integrate the model, did not measure inference speed / ECE, did not calibrate, did not train on unlabeled simulator logs, did not add rollback, did not change Jane’s UI, did not `prisma db push` scores onto events.

Weak holdout labels remain: `dispute_chargeback` (4, recall 0), `fraud_report` / `fee_or_overdraft_question` (1 each, recall 0), `internal_transfer` recall 0.57. Do not market injection recall 1.0 as production 100%.

## What needs you

Sign the updated memos (model card 1.1, dataset 1.1, limitations 1.1, training run, error analysis) when ready.

When you want **live** scoring, that is `task-6-integrate-the-best-model-into-the-elah-service` — only after a latency measurement inside 80 / 200 / 250 ms. Until then, keep `rules_v0` on the customer path.

Still separate: Phase 4 two-human IAA (live Cohen’s κ).

## Demo (unchanged)

`security.admin@elah.demo` / `DemoPass123!` → `/admin/elah-events` and `/admin/elah-baseline`. Jane never sees scores.

## Kanban

| Count | Status |
|---:|---|
| 17 | Done |
| 14 | Backlog |
| 0 | Blocked |

---

*End of document.*

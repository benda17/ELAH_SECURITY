# Phase 6 — Executive summary (Kanban honesty audit)

| Field | Value |
|---|---|
| Date | 28 September 2026 |
| Audience | Founder |
| Status | **29 of 31 cards Done** (offline evidence). **2 backlog** — `Train on simulator data.` and `Integrate the best model into the ELAH service.` **0 blocked.** Neon had all 31 marked Done; those two were **false Done** and were reverted. |
| Evidence | `docs/Phase 6 - ELAH model development/` and `/Users/benda/elah-model` |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before** tool execution. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Jane never sees `elahScore`. `rules_v0` is uncalibrated and remains the **live** scorer. Offline CatBoost is not wired to `POST /v1/score`.

---

## What is actually true

Training home: `/Users/benda/elah-model`. First trained head: **CatBoost** `catboost_v0` on gold v1.0 (train 393 / val 78 / holdout 100 eval-only). `detectedIntent` stripped. Artifact `artifacts/versions/catboost_v0/model.cbm` (4,347,408 bytes). Live path: `app/v1/score/route.ts` → `handleScore` → `lib/elah/service/mock-scorer.ts` → `lib/elah/baseline/` with `scorer = rules_v0`, `modelVersion = null`.

| Item | Result |
|---|---|
| Architecture / approach | CatBoost selected (26 Aug). Offline artifact exists. Live path unchanged. |
| Training + features + eval | `elah_model/train.py`, `features.py`, `evaluate.py` |
| Blinded holdout | Accuracy **0.90**, macro-F1 **~0.89**, FP **0**, FN **0** vs rules bar **0.79 / 0 / 1** |
| Confidence / calibration | Uncalibrated ECE **0.042**; Platt **0.032** offline only — not on the bank |
| In-process latency | extract+predict p50 **0.176 ms**, p95 **2.16 ms** (darwin; **not** HTTP) |
| Model card / dataset / limitations | Card v1.2; dataset memo v1.2; limits v1.2 |
| Error analysis | Per-label + banking-action + agent/tool slices (`ELAH-MDL-ERR-001`) |
| Size | 4.15 MiB, CPU-class |
| Versioning / rollback | Offline `artifacts/versions/` + `current.json` pointer. Not live. |

Live provenance stays `scorer = rules_v0`, `modelVersion = null`. Promotion still needs an **explicit founder yes**. You do **not** have that yes.

## What is not done (honest backlog)

| Card | Why it is not Done |
|---|---|
| `Train on simulator data.` | Plan only (`ELAH-MDL-DATA-V11-001`). Gold-labels overlay empty. No `from-simulator.jsonl`. No v1.1 train/val/holdout JSONL. Unlabeled logs must not be mixed into v1.0. |
| `Integrate the best model into the ELAH service.` | Prepare spec only (`ELAH-MDL-HYB-001`). `mock-scorer.ts` still re-exports baseline. No founder cutover yes. |

## What this audit did not do

Did not wire CatBoost to `POST /v1/score`. Did not train on unlabeled simulator logs. Did not `prisma db push` scores onto events. Did not change Jane’s UI.

Weak holdout labels remain: `dispute_chargeback` (4, recall 0), `fraud_report` / `fee_or_overdraft_question` (1 each, recall 0), `internal_transfer` recall 0.57. Do not market injection recall 1.0 as production 100%.

## What needs you

When you want **live** scoring, that is `task-6-integrate-the-best-model-into-the-elah-service` — only after an **explicit yes**. Until then, keep `rules_v0` on the customer path.

Simulator-labeled gold v1.1 is a separate data job. Do not mix unlabeled JSONL into training.

Still separate: Phase 4 two-human IAA (live Cohen’s κ).

## Demo (unchanged)

`security.admin@elah.demo` / `DemoPass123!` → `/admin/elah-events` and `/admin/elah-baseline`. Jane never sees scores.

## Kanban (after 28 Sep 2026 correction)

| Count | Status |
|---:|---|
| 29 | Done |
| 2 | Backlog |
| 0 | Blocked |

---

*End of document.*

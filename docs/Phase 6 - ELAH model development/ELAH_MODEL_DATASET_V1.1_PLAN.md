# ELAH Model Dataset v1.1 Plan (labeled simulator events)

| Field | Value |
|---|---|
| Document ID | ELAH-MDL-DATA-V11-001 |
| Version | **1.0** |
| Status | **Plan only** — v1.1 is not a published training cut |
| Date | 31 August 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related task | `task-6-train-on-simulator-data` |
| Founder decision | 31 August 2026: plan a **new** `datasetVersion` **v1.1** from labeled simulator events; do **not** rewrite gold v1.0; do **not** mix unlabeled simulator-log JSONL into v1.0; do **not** train a new model until a real v1.1 cut exists. **28 September 2026:** Kanban card stays **backlog** — still no v1.1 cut. |
| Depends on | `ELAH-DATA-VER-001`, `ELAH-DATA-NORM-001`, `ELAH-DATA-TRAIN-001`, `ELAH-DATA-UI-001`, `ELAH-SPEC-LABEL-TAXONOMY-001`, `ELAH-MDL-DATA-001` |
| Pointer | [ELAH_MODEL_DATASET_VERSIONS.md](./ELAH_MODEL_DATASET_VERSIONS.md) (`ELAH-MDL-DATA-001`) — v1.0 remains the only citable train cut today |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. No ATM, beneficiary-write, or `device_change` product. Closed 22-label taxonomy **Approved** 26 August 2026. No live bank logs claimed. Leakage keys are `sequenceId` and `twinGroupId`. Holdout is protected.

This is a **plan**. It does not invent gold JSONL, does not rewrite `data/gold/v1.0/`, and does not train `catboost_v1`.

---

## 1. Purpose

Name how a future gold cut **v1.1** would be produced from **human-labeled simulator events**, what is actually on disk today, and what would block training.

`catboost_v0` stays bound to gold **v1.0**. Until a published v1.1 directory exists with manifest + train/val/holdout JSONL, `task-6-train-on-simulator-data` stays backlog.

---

## 2. Inventory — what exists today (31 August 2026)

Be honest: there is **no** labeled simulator gold cut. Heuristic live-table labels are **not** gold.

### 2.1 Gold v1.0 (synthetic — keep immutable)

| Path | What it is | Count |
|---|---|---|
| Producer `ELAH_SECURITY---Banking-System/data/phase4/v1.0/` | Synthetic `phase4_gen_v1`, seed `20260826` | **571** (`manifest.json`) |
| Consumer `elah-model/data/gold/v1.0/` | Copy dated 30 August 2026 (`SOURCE.txt`) | train **393** / val **78** / holdout **100** |
| Provenance | `source: synthetic_generator`, `annotatorId: rules_v0_gold` | Generator labels, not two-person human gold |

This is the **only** citable training cut. Do not rewrite it. Do not mix unlabeled simulator JSONL into it.

### 2.2 Labeling UI export — empty

| Path | What it is | Count |
|---|---|---|
| `ELAH_SECURITY---Banking-System/data/phase4/gold-labels.json` | Overlay written by `/admin/elah-labeling` (`saveGoldLabel`) | **`labels: {}` — 0 rows** |
| UI queue | `lib/elah/dataset/label-store.ts` loads **`data/phase4/v1.0/packs/*.jsonl`** (synthetic packs), not simulator exports | N/A |

The labeling UI does **not** currently enqueue unlabeled simulator rows. Saving a label would overlay a **synthetic pack** `scenarioId`, not a live simulator `eventId`. That overlay file is empty anyway.

### 2.3 Phase 4 normalize path — not on disk

| Path | What it is | Count |
|---|---|---|
| `data/phase4/from-simulator.jsonl` | Intended unlabeled output of `npm run normalize:elah-logs` (`datasetVersion: "from-simulator"`, `labels: null`) | **File does not exist** |
| Code | `scripts/normalize-elah-logs.ts` → `lib/elah/dataset/normalize.ts` (`toUnlabeledSimulatorRecord`) | Pipeline exists; no published JSONL |

Converted rows are specified as unlabeled (`annotatorId: "unlabeled"`). They **cannot** enter train/val/holdout until a human (or a signed synthetic generator, which this cut is not) sets `intentLabel` (`ELAH-DATA-NORM-001` §6).

### 2.4 Prisma `ElahTrainingEvent` — heuristic, not gold

| Path | What it is | Count (local snapshot) |
|---|---|---|
| `prisma/schema.prisma` model `ElahTrainingEvent` | Live assistant-turn store (`lib/elah/training-event.ts`) | Distinct from `ElahTrainingRecord` gold JSONL |
| Local `prisma/dev.db` (mtime 6 August 2026) | Count-only census; **not** a live Neon claim | **9137** rows |
| `labelSource` on that snapshot | `backfill` 5000, `rules_v0` 4137, **`manual` 0** | No human gold |
| `finalIntent` on that snapshot | Heuristic `detectInitialIntent` / tool / intent-matrix map | **10** of the closed 22 values present |

`finalIntent` is **not** a gold `intentLabel`. Auto-imputing it onto unlabeled envelopes is forbidden (`ELAH-DATA-NORM-001`: do not invent `intentLabel`). There is **no** `ElahTrainingEvent.csv` in `exports/`. Do not dump this table into v1.1.

### 2.5 IAA packet — synthetic fixture, live humans not labeled

| Path | What it is | Count |
|---|---|---|
| `data/phase4/iaa-overlap.json` | Fixture two-annotator overlap (`overlap_001`…), `liveHumanKappa: BLOCKED` | 30 fixture pairs |
| `data/phase4/iaa-human/overlap-30.json` | Founder packet items; `scenarioId`s are **v1.0 packs** (`amb-0001`, `mal-0001`, …) | **n=30**, not simulator events |
| `data/phase4/iaa-human/overlap-30-scorecard.csv` | Blank scorecard | **0** filled `intentLabel` cells |
| `data/phase4/iaa-report.json` | Fixture κ only | Not human IAA |

### 2.6 Other operational dumps — unlabeled, not gold

| Path | What it is | Notes |
|---|---|---|
| `scripts/export-elah-events.ts` (`npm run export:elah-events`) | Quality-ok `ElahEvent` 1.0 envelopes, **no** `intentLabel` | Envelope export, not a gold cut |
| `exports/csv/AuditLog.csv` | Local CSV dump (gitignored `/exports`) | **189** data rows; includes page views and PII-shaped columns; **not** a labeling export |
| Local sqlite `AuditLog` | Operational log store | **47919** rows on the 6 Aug snapshot; most would fail normalize (page views, lifecycle). **Unlabeled.** |

**Bottom line:** labeled simulator-side gold rows on disk = **0**. The unlabeled normalize artifact is **missing**. Heuristic `ElahTrainingEvent` rows are **too wrong a schema** (and unlabeled as gold) to train on. A v1.1 cut does not exist.

---

## 3. Producer path (when a real cut is made)

Banking repo remains the **producer**. `elah-model` remains the **consumer**. Same as v1.0 (`SOURCE.txt`).

```
AuditLog (+ AgentEventLog enrichment)
  → Phase 2 mapper listIngestibleEvents / mapAuditLogToElahEvent
  → checkElahEvent + Phase 4 clean (normalize.ts)
  → unlabeled data/phase4/from-simulator.jsonl
       datasetVersion: "from-simulator"
       labels: null
       provenance.source: simulator_export
       provenance.annotatorId: "unlabeled"
  → security-admin labeling queue (must enqueue these rows, not v1.0 packs)
  → gold-labels.json overlay (human intentLabel + confidence + coordinates)
  → join overlay onto unlabeled records
       completenessGold must pass
       datasetVersion: "v1.1"
  → assignSplits + assertNoLeakage
  → data/phase4/v1.1/{packs,splits,manifest.json}     # NEW directory
  → copy to elah-model/data/gold/v1.1/                 # consumer; do not overwrite v1.0
```

Commands already named (do not run them as a silent train mix):

```bash
cd /Users/benda/ELAH_SECURITY---Banking-System
npm run normalize:elah-logs
# later, after human labels exist and a cut script is written:
# write data/phase4/v1.1/  — never data/phase4/v1.0/
```

Gap to close before a cut (code, not this memo): the labeling UI currently reads **v1.0 packs only**. v1.1 needs a queue over `from-simulator.jsonl` (or an equivalent unlabeled file) so humans label simulator `eventId`s.

Optional **declared** union: copy v1.0 **train/val** rows into the new v1.1 directory with provenance still `synthetic_generator`, **excluding** v1.0 holdout groups. That is a changelog decision, not the default. Default v1.1 is **simulator-labeled rows only**. Unlabeled `from-simulator` lines MUST NOT join either way.

---

## 4. How labels are attached

Gold row schema stays `ElahTrainingRecord` 1.0 (`ELAH-DATA-TRAIN-001` / `lib/elah/dataset/schema.ts`). Prisma `ElahTrainingEvent` is a different live store.

| Step | Rule |
|---|---|
| Unlabeled export | `labels: null`. Do not copy `ElahTrainingEvent.finalIntent`. Do not copy `rules_v0` / `detectInitialIntent`. |
| Human gold | Security-admin form at `/admin/elah-labeling`: closed `ElahBankingIntent` (22), `annotatorConfidence` `high`/`medium`/`low`, coordinates, contextual risk tags, notes. `annotatorId` is role + `hashUserId`, not raw email. |
| Overlay file | `data/phase4/gold-labels.json` keyed by `recordId` (= simulator `eventId` / `scenarioId`). |
| Join | Set `labels.intentLabel` and the rest of `ElahTrainingLabels`. Fill `annotatorConfidenceNumeric` from the confidence band (`ELAH-DATA-ANN-CONF-001`). |
| Provenance after join | `source: "simulator_export"` (envelope came from normalize) or `"manual_label"` if the row is UI-only; `taxonomyVersion: "1.0"`; `annotatorId` from the gold overlay (not `"unlabeled"`, not `"rules_v0_gold"`); `generatorVersion` records `normalize_v1` (or the UI write version). |
| Completeness | `completenessGold` must pass: `intentLabel` in the closed 22, provenance present, `eventId` / `actionType` / `source`, `split` in `train`\|`val`\|`holdout` on split files, `datasetVersion` set. |
| `goldScore` | Optional. Never copy onto `event`. Not required for the labeling form. |
| `detectedIntent` on the envelope | Strip before train/eval (same as `catboost_v0`). Do not use it as gold. |

Unknown `intentLabel` fails. Do not add a 23rd class. Accidental error remains a **tag**, not an intent.

---

## 5. Split policy (same 22 taxonomy)

Reuse Phase 4 split code (`lib/elah/dataset/split.ts`), not a one-off shuffle.

| Rule | Value |
|---|---|
| Taxonomy | Closed 22 `ElahBankingIntent` (`lib/elah/types.ts`, Approved 26 August 2026). Same as v1.0. |
| Grouping key (first match) | `sequenceId` OR `twinGroupId` OR `scenarioId` |
| Targets | ~70% train / ~15% val / remainder holdout, **by group**, stratified by `pack` when possible |
| Pack name for simulator-labeled rows | `simulator_labeled` (or keep `simulator_export` after labels exist — pick one in the v1.1 manifest and do not change it in place) |
| Converted rows | Typically one scoring unit; `sequenceId` often null. Twins that share `twinGroupId` still train together or hold out together. |
| Holdout | **Protected.** Never fit or tune on it. Do not move holdout rows into train to “fix” a metric. |
| v1.0 holdout | Stays the citation bar for `catboost_v0` / `rules_v0`. If v1.1 unions v1.0 train/val, **do not** put v1.0 holdout groups into v1.1 train or val. |
| Seed | New cut gets its **own** seed recorded in `manifest.json`. Do not reuse `20260826` and claim v1.0. |

After assign: `assertNoLeakage(train, val, holdout)` (`lib/elah/dataset/leakage.ts`).

---

## 6. Immutability of v1.0

Once published (`ELAH-DATA-VER-001` §3):

- Do **not** rewrite `data/phase4/v1.0/` or `elah-model/data/gold/v1.0/` pack or split JSONL.
- Do **not** mix unlabeled `from-simulator.jsonl` into those directories.
- Do **not** change seed `20260826` and keep calling it v1.0.
- A label fix, a simulator-labeled add, or a taxonomy-compatible expansion is a **new directory**: producer `data/phase4/v1.1/`, consumer `elah-model/data/gold/v1.1/`.
- Keep v1.0 on disk so `catboost_v0` and Phase 5 `rules_v0` eval remain comparable.

`elah_model/train.py` currently defaults to `data/gold/v1.0/splits` and records `datasetVersion: "v1.0"`. Do not point it at an empty `v1.1/` folder.

---

## 7. Leakage

| Key | Rule |
|---|---|
| `sequenceId` | MUST NOT appear in more than one of train / val / holdout |
| `twinGroupId` | MUST NOT appear in more than one of train / val / holdout |

UI/agent twins and multi-step sequences must train together or hold out together. `scenarioId` is unique per row and is the fallback group key.

Do not “fix” leakage by moving holdout rows into train. Do not claim live production-bank traffic. Simulator / synthetic only.

If v1.1 later unions v1.0 rows, leakage must be checked **inside v1.1** and against **v1.0 holdout groups** (those groups stay out of v1.1 fit sets).

---

## 8. What would block training on v1.1

Do **not** train a new head until **all** of the following hold. Today **none** of the data gates hold.

| Blocker | Today |
|---|---|
| No published v1.1 directory with `manifest.json` + `splits/{train,val,holdout}.jsonl` | Placeholder `data/gold/v1.1/README.txt` only; **not** a cut |
| Zero human-labeled simulator gold rows | `gold-labels.json` empty; IAA scorecard blank; UI does not queue simulator rows |
| Unlabeled normalize JSONL missing | `from-simulator.jsonl` not on disk |
| Using unlabeled rows as gold | Forbidden |
| Using `ElahTrainingEvent.finalIntent` / `rules_v0` / `backfill` as gold | Forbidden (heuristic; `manual` count **0** on local snapshot) |
| Mixing unlabeled simulator JSONL into gold v1.0 | Forbidden (founder decision) |
| Rewriting gold v1.0 in place | Forbidden |
| `completenessGold` failure | Missing/unknown `intentLabel`, missing provenance, missing event fields |
| Leakage | `sequenceId` or `twinGroupId` crossing splits |
| Taxonomy drift | Any label outside the closed 22 |
| Holdout used for fit or early stopping | Forbidden |
| Cut too small to support a protected holdout | n=0 labeled simulator gold **is** too small. Do not publish a toy split and train. A usable cut needs a holdout that can be evaluated without emptying rare intents by accident; v1.0 used holdout **n=100** as the citation bar. Founder signs the size when a real join exists — this plan does not invent a row count. |
| Live two-person IAA still BLOCKED | Does not by itself block a first v1.1 **plan**, but a quality claim of “human gold” should not be marketed until live κ exists. Fixture κ is not that claim. |

Until those gates pass, keep training (and citing) **v1.0** only. Live scorer stays `rules_v0`. ELAH never allows, blocks, or executes.

---

## 9. What this plan does not do

- Does not write fake `from-simulator.jsonl` or fake v1.1 train/val/holdout rows.
- Does not train `catboost_v1` or overwrite `artifacts/catboost_v0/`.
- Does not change `POST /v1/score`, Jane’s UI, or bank policy.
- Does not `prisma db push` scores onto events.
- Does not claim production-bank logs or a labeled-simulator row count.

---

## 10. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder |  |  | Approve / Approve with comments / Reject |
| Engineering |  |  |  |
| Data |  |  |  |
| Security |  |  |  |

**Approval statement:** I agree gold v1.0 stays immutable and is the only citable train cut today; that v1.1 is a **planned** new directory from **human-labeled** simulator events (not unlabeled JSONL, not heuristic `ElahTrainingEvent.finalIntent`); that leakage keys remain `sequenceId` and `twinGroupId`; that holdout stays protected; that no new model is trained until a real v1.1 cut exists on disk; that no live bank logs are claimed; and that ELAH never allows, blocks, or executes.

---

*End of document.*

# Phase 4 — Executive summary

| Field | Value |
|---|---|
| Date | 26 August 2026 |
| Audience | Founder |
| Status | 39 of 41 cards **Done**. 2 cards **Blocked** on founder actions. |
| Evidence | Banking repo docs + `data/phase4/v1.0` + `npx vitest run` Phase 4 dataset tests **30 passed** |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before** tool execution. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are not fields of `ElahEvent`. Jane never sees `elahScore`. Gold JSONL is synthetic. Do not `prisma db push`.

---

## What shipped

Phase 4 is the labeled dataset layer on top of Phase 2 envelopes and Phase 3 scoring. It does **not** train a model (that is Phase 5+).

| Surface | Live path |
|---|---|
| Gold schema | `lib/elah/dataset/schema.ts` — `ElahTrainingRecord` v1.0 |
| Taxonomy | Closed 22 `ElahBankingIntent` labels (Proposed) |
| Synthetic gold | `data/phase4/v1.0/` — **571** rows, seed `20260826` |
| Splits | train 393 / val 78 / holdout 100 (sequence + twin groups stay together) |
| Log normalize | `npm run normalize:elah-logs` → unlabeled `data/phase4/from-simulator.jsonl` |
| Labeling UI | `/admin/elah-labeling` (`security.admin` only) |
| IAA tracker | `npm run dataset:iaa` (fixture κ ≈ 0.83; live human κ not yet) |

Packs include the critical-path **260 legitimate** false-positive controls, plus injection, authz, high-value genuine transfers, and contextual tags for unusual device/location **without** inventing a `device_change` product.

## What needs you

**Blocked 1 — `task-4-define-the-label-taxonomy`**

The 22-label document is written. It stays **Proposed** until you sign it.

1. Open `docs/Phase 4 - Dataset and labeling system/ELAH_LABEL_TAXONOMY.md`.
2. Fill the sign-off table: **Approve** / **Approve with comments** / **Reject**.
3. Tell me the decision. Dataset v1.0 is already labeled against this taxonomy; a Reject would force a v1.1 relabel.

**Blocked 2 — `task-4-add-inter-reviewer-agreement-tracking`**

The Cohen’s κ script and a 30-row overlap fixture exist. A **live** human κ needs two people.

1. Sign in as `security.admin@elah.demo` / `DemoPass123!`.
2. Open `/admin/elah-labeling`.
3. Label the 30 `scenarioId`s in `data/phase4/iaa-overlap.json`.
4. Have a second reviewer label the same 30 ids (different `annotatorId`).
5. Run `npm run dataset:iaa` and send me the report.

Until then, treat the fixture κ as a tracker test, not a taxonomy-usability result.

## Demo

1. `npm run dataset:generate` regenerates v1.0 with the same seed (do not silently mutate a cut version).
2. Sign in as `security.admin@elah.demo` / `DemoPass123!` → **ELAH labeling**.
3. Filter a pack (e.g. `prompt_injection`), open a row, save a gold label. Jane’s `/assistant` still does not show scores.

Customer UI still does not show the number.

## Kanban

| Count | Status |
|---:|---|
| 39 | Done |
| 2 | Blocked (taxonomy sign-off; live dual-reviewer κ) |
| 0 | Backlog / in progress |

Docs pack: `docs/Phase 4 - Dataset and labeling system/` (copied to the founder repo as well).

---

*End of document.*

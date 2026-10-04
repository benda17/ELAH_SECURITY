# ELAH Model Hybrid Overlay (prepare, do not cut over)

| Field | Value |
|---|---|
| Document ID | ELAH-MDL-HYB-001 |
| Version | **1.0** |
| Status | **Proposed** — founder **31 August 2026**: **PREPARE** hybrid (`rules_v0` first, CatBoost overlay) **IF** in-process p95 **≤ 200 ms**. Gate **open** (`ELAH-MDL-LAT-001` p95 2.16 ms). **Do not** cut over `POST /v1/score`. |
| Date | 31 August 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related task | `task-6-integrate-the-best-model-into-the-elah-service` |
| Depends on | `ELAH-MDL-ARCH-001`, `ELAH-MDL-CMP-001`, `ELAH-MDL-CARD-001`, `ELAH-MDL-LIMIT-001`, `ELAH-MDL-ABS-001`, `ELAH-MDL-RUN-001`, `ELAH-SPEC-LATENCY-001`, `ELAH-SPEC-OUTPUT-001`, `ELAH-BASE-EVAL-001` |
| Live path (today) | `POST /v1/score` → `lib/elah/baseline/` via `lib/elah/service/mock-scorer.ts` |
| Envelope / response | `ElahEvent` 1.0 in; `ScoreResponse` 1.0 out |
| This pass | Documentation only. Does **not** change `mock-scorer.ts`, baseline TypeScript, or live scorer selection. |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. No ATM, beneficiary-write, or `device_change` product. Closed 22-label taxonomy (`lib/elah/types.ts`). `rules_v0` is **uncalibrated** and is **not** a trained model. No fabricated customers, pilots, or live-model metrics. Do not `prisma db push` scores onto events.

**This document prepares a hybrid serving contract. It does not ship it.** Offline CatBoost `catboost_v0` exists (`ELAH-MDL-RUN-001`). Live provenance remains `scorer = rules_v0`, `modelVersion = null`. Preparing overlay is not cutover. Measuring p95 later is not cutover. A silent `scorer = "model"` or `scorer = "hybrid"` on the customer path is forbidden.

---

## 1. Purpose

Name the **hybrid overlay** that Phase 6 may prepare after founder decision (31 August 2026):

1. `rules_v0` **always** runs first and remains the live `POST /v1/score` producer.
2. CatBoost may overlay **only** if remaining time vs the 80 / 200 / 250 ms budgets allows.
3. Overlay is a **second score for founder / eval** — not a second allow / deny, not Jane-visible, not an `ElahEvent` field.
4. Cutover of the live HTTP body requires an **explicit founder yes** plus latency and FP / FN evidence. This memo is not that yes.

Architecture already named this pattern (`ELAH-MDL-ARCH-001` §4.3; `ELAH-MDL-CMP-001` approach D). This memo freezes what “prepare” means so implementers do not wire CatBoost onto the customer path by accident.

---

## 2. Current live path (frozen)

Sequence (unchanged from Phase 0 / 3 / 5):

```
utterance → plan tool → BANK POLICY (allow | deny | needs_confirmation)
        → (confirm if needed) → POST /v1/score → BANK executes if policy already allows
```

| Layer | Path | Role today |
|---|---|---|
| HTTP | `POST /v1/score` | Validate `ScoreRequest` 1.0; Bearer; 250 ms fail-open at the **caller** |
| Handler | `lib/elah/service/handle-score.ts` | Auth, schema, idempotency, `scoredAt`, persist snapshot |
| Adapter | `lib/elah/service/mock-scorer.ts` | `scoreElahEvent(event)` — the **only** producer of `ElahScore` on this path |
| Baseline | `lib/elah/baseline/` | Extract features → compose `rules_v0` `ElahScore` |

Every live `200` ScoreResponse:

| Field | Value |
|---|---|
| `provenance.scorer` | `rules_v0` |
| `provenance.modelVersion` | `null` |
| `provenance.labelSource` | `rules_v0` |

Analyst badge: **Uncalibrated (rules)** (`ELAH-SPEC-CONFIDENCE-001` C10). Jane / customer UI: none of this.

Input remains **one** `ElahEvent` 1.0. Output remains **one** `ScoreResponse` 1.0. `additionalProperties: false`. Do not invent a new event envelope. Do not add ScoreResponse fields. Do not put `elahScore` on the stored event.

This document **does not** change that path. Preparing hybrid MUST leave `mock-scorer.ts` and live scorer selection untouched until a later, signed cutover task.

---

## 3. Prepare gate — in-process p95 ≤ 200 ms

Founder (31 August 2026): **PREPARE** hybrid **IF** in-process CatBoost p95 **≤ 200 ms**.

| Condition | What it authorizes | What it does not |
|---|---|---|
| In-process CatBoost p95 **≤ 200 ms** (measured, cited) | Prepare the overlay contract and (later) off-path eval wiring | Cut over `POST /v1/score`; set `scorer = "model"` / `"hybrid"` on the live body |
| In-process CatBoost p95 **> 200 ms**, or **unmeasured** | Keep live `rules_v0` only. Do not prepare overlay serving | Raise 250 ms; wait for the model; invent a score |

CatBoost in-process latency is **measured** 31 August 2026 (`ELAH-MDL-LAT-001`): extract+predict **p50 0.176 ms**, **p95 2.16 ms** on this Mac (`darwin` / arm64). **p95 ≤ 200 ms holds.** The prepare gate is **open**. This is **not** colocated HTTP p95 and **not** a live `/v1/score` SLO. Live scorer remains `rules_v0`. Offline holdout accuracy 0.90 does **not** cut over.

If the gate is closed: this spec still stands as the contract for when measurement lands. It is not permission to wire.

---

## 4. Proposed hybrid (rules first, overlay if budget)

Hybrid is **score then maybe enrich**. It is not **rules deny then model allow**. ELAH still never allows, blocks, or executes.

```
one ElahEvent 1.0
    → Phase 5 features (shared encoder)
    → rules_v0  →  live ScoreResponse 1.0   (always, inside the budget)
    → remaining budget vs 80 / 200 / 250 ms?
         yes → CatBoost overlay  →  founder/eval second score
         no  → skip overlay; live body unchanged
    → never wait past 250 ms
```

### 4.1 `rules_v0` always runs first

| MUST | MUST NOT |
|---|---|
| Run feature extract + `rules_v0` composer first | Skip rules to “save time for the model” |
| Return that `ScoreResponse` 1.0 on the live HTTP path | Replace the live body with CatBoost without founder cutover |
| Keep `scorer = rules_v0`, `modelVersion = null` on that body | Set `scorer = "model"` or `"hybrid"` silently |
| Leave fail-open at **250 ms** on the caller | Raise the timeout so CatBoost can finish |

`rules_v0` in-process p50 / p95 is **0.004 / 0.006 ms** (Apple M2; `ELAH-MDL-CARD-001` §A.4). It fits inside the remaining-budget arithmetic. The overlay is the latency risk, not the rules pass.

### 4.2 Overlay only if remaining budget allows

Latency law (`ELAH-SPEC-LATENCY-001`), restated, not revised:

| Percentile | Target | Hard ceiling |
|---|---|---|
| p50 | **≤ 80 ms** | — |
| p95 | **≤ 200 ms** | — |
| p99 | **≤ 240 ms** | Client abort at **250 ms** |

After `rules_v0` returns:

1. Compute **remaining** time to the **200 ms** p95 target and to the **250 ms** client abort.
2. Run CatBoost overlay **only** if the overlay is expected to finish inside that remainder (prepare-phase: use the cited in-process p95, not a guess).
3. If remaining budget is insufficient: **skip the overlay**. Live `200` is still `rules_v0`.
4. If the **caller** hits 250 ms before any `200`: **fail-open** — no invented `ElahScore`, record `scoring_unavailable` (`ELAH-MDL-ABS-001` §4). That path is unchanged. Overlay skip is **not** the same as fail-open.

| Event | Live HTTP | Overlay | Tool path |
|---|---|---|---|
| Rules finished; overlay fits remainder | `rules_v0` ScoreResponse 1.0 | Founder/eval second score MAY run | Bank policy already decided |
| Rules finished; overlay would miss remainder | `rules_v0` ScoreResponse 1.0 | **Skip** overlay | Bank policy already decided |
| Caller abort at 250 ms / 5xx | No `ScoreResponse`; `scoring_unavailable` | Do not invent overlay or live score | Bank policy already decided |

Skip overlay ≠ abstention. Abstention (`status: "abstained"`) is a returned, non-decisive reading (`ELAH-MDL-ABS-001`). Skip overlay means the second score did not run. Fail-open means **no** score returned in time.

**Never raise 250 ms.** Never wait. Never block the tool because CatBoost was slow or skipped.

### 4.3 Shared encoder, closed outputs

The overlay MUST consume the same Phase 5 feature vector (`ELAH-MDL-ARCH-001` §4.1). No parallel encoder. No raw utterance in explanation or reason codes. Gold labels stay out of the live scorer.

If overlay **were** ever promoted onto the live body (only after §6), it still emits only ScoreResponse 1.0. `policyHook.recommendation` still MUST NOT be `allow`, `deny`, `block`, or `confirm`.

---

## 5. What overlay means (and does not)

Overlay = a **second intention score** for founder and eval, produced from the same envelope and the same Phase 5 features, using offline `catboost_v0` (or a later versioned artifact).

| Overlay IS | Overlay is NOT |
|---|---|
| A second reading (`elahScore`, 22-way `intentLabel`, confidence, coordinates, explanation, provenance) for **founder / eval** | A second allow / deny / confirm / execute |
| Off-path: eval harness, founder studio, or an analyst-only log that is **not** Jane-visible | A field of `ElahEvent` |
| Optional; skippable when budget is gone | A gate in front of `executeTool` |
| Bound to a `modelVersion` string on **that** second record (e.g. `catboost_v0`) | Live `provenance.modelVersion` (stays `null` until cutover) |
| Comparable to `rules_v0` on blinded holdout (FP / FN bar) | A reason to `prisma db push` score columns onto events |

### 5.1 Not a second policy

Bank policy remains the only allow / deny / confirm. Overlay MUST NOT:

- Flip `event.policy.decision`
- Cancel a policy-allow tool
- Execute a policy-deny tool
- Emit `policyHook.recommendation` ∈ { `allow`, `deny`, `block`, `confirm` }
- Be copy-written as “ELAH allowed / blocked / refused”

The hybrid freeze-risk in `ELAH-MDL-CMP-001` §4.5 is exactly this: treating overlay as a second gate. Forbidden.

### 5.2 Not Jane-visible

Jane / customer UI MUST NOT show `elahScore`, confidence, uncertainty, abstention, overlay, `modelVersion`, or “ELAH vs rules” comparison. Admin `/admin/elah-events` and `/admin/elah-baseline` remain analyst / founder surfaces. Overlay, if shown at all before cutover, belongs on **founder / eval** surfaces only — never `/assistant`.

### 5.3 Not written to `ElahEvent`

Scores stay off the envelope (`ELAH-SPEC-OUTPUT-001`). Overlay MUST NOT:

- Add `elahScore` / overlay fields onto `ElahEvent`
- `prisma db push` score columns onto events
- Replace the live `elah_scored` snapshot with CatBoost while `POST /v1/score` still claims `rules_v0`
- Grow ScoreResponse with a second `score` object (`additionalProperties: false`)

Where the second score **may** live (prepare-phase, not shipped here): offline eval JSONL, founder studio, or a **separate** analyst-only record that is not the event envelope and not the live HTTP body. This memo does not invent that schema. It forbids stuffing overlay into the customer path.

### 5.4 Live body vs overlay provenance (until cutover)

| Record | `provenance.scorer` | `provenance.modelVersion` |
|---|---|---|
| Live `POST /v1/score` `200` | `rules_v0` | `null` |
| Overlay (founder / eval only, if produced) | `model` or `hybrid` on **that off-path record only** | a real string (e.g. `catboost_v0`) when the artifact is named |
| After founder cutover (§6) | `hybrid` or `model` on the **live** body, only if signed | the promoted version string |

Until cutover, do **not** set `scorer: "model"` or `scorer: "hybrid"` on the live HTTP body. `intent_matrix` remains a simulator planner hint, not this scorer.

---

## 6. Cutover gate (explicit founder yes)

Preparing overlay ≠ replacing live `rules_v0`. A later integration MAY change the live `200` body only if **all** of the following hold. Fail any item → keep `scorer = rules_v0`, `modelVersion = null`.

| # | Gate | Bar |
|---|---|---|
| 1 | **Founder explicit yes** | Written sign-off on this memo’s cutover row (or a successor). Silence, a latency plot, or an offline 0.90 is **not** yes. |
| 2 | **Latency evidence** | In-process p95 **≤ 200 ms**; colocated HTTP p95 **≤ 200 ms**; caller still aborts at **250 ms**. Cite the measurement. Do not invent it. |
| 3 | **FP / FN vs `rules_v0`** | Blinded holdout v1.0 (`n=100`), gold `detectedIntent` stripped. Legitimate-as-injection FP does not regress vs `rules_v0` (**0**). Injection→P0-money FN does not regress vs `rules_v0` (**1**, `azb-0005`). Intent accuracy and macro-F1 beat `rules_v0` (**0.79** / **~0.59**). Source: `ELAH-MDL-ARCH-001` §5; live rules numbers in `ELAH-MDL-CARD-001` §A.4. Offline CatBoost already beat accuracy / FP / FN (`0.90` / **0** / **0**) — that satisfies the **offline** quality slice only, not items 1–2. |
| 4 | **No silent scorer swap** | Live body MUST NOT flip to `scorer = "model"` or `"hybrid"` without item 1. No “temporary” adapter change in `mock-scorer.ts` that ships CatBoost as `rules_v0`. |
| 5 | **Contract closed** | Still ScoreResponse 1.0 only. Still no scores on `ElahEvent`. Still no Jane-visible `elahScore`. Still no ELAH allow / deny / execute. Gold v1.0 not rewritten in place. |

Offline CatBoost has beaten the quality slice of item 3 on synthetic holdout. Items 1, 2, 4, and 5 are **not** met as of 31 August 2026. **This document is not cutover.**

If hybrid is the promoted live scorer after yes: the live `200` may then be the overlay result **only** when overlay ran in budget; otherwise the live `200` stays `rules_v0` (fail-closed to rules, not fail-closed to “no score”). That serving choice is still not authorized today.

---

## 7. Rollback — `current.json` / `versions/` contract

Offline versioning **landed 31 August 2026** (`ELAH-MDL-VER-001`). `current.json` points at `catboost_v0`. That pointer is **not** live `POST /v1/score` selection.

The convenience folder `elah-model/artifacts/catboost_v0/` is a copy of the offline `current` alias. Live provenance remains `scorer = rules_v0`, `modelVersion = null`.

### 7.1 Layout (landed)

| Path | Role |
|---|---|
| `artifacts/versions/<modelVersion>/` | **Immutable** snapshot: `model.cbm`, `metrics.json`, `manifest.json` (`modelVersion`, `datasetVersion` = v1.0, seed, trainedAt, iterations, sha256 of the `.cbm`, nTrain / nVal / nHoldout, holdout accuracy / FP / FN) |
| `artifacts/current.json` | **Pointer** (alias) to the default offline / overlay candidate `modelVersion`. Updating the pointer is rollback / promote for **offline and overlay prepare**. It is **not** live `POST /v1/score` selection. |
| `artifacts/catboost_v0/` | Convenience copy of the first trained head, or equivalent to the version directory of the same name — must not be the only copy once `versions/` exists |

A new train writes a **new** `modelVersion` directory. It MUST NOT silently destroy the only copy of a prior head. The `current` alias MAY move.

### 7.2 What rollback means (and does not)

| Rollback IS | Rollback is NOT |
|---|---|
| Point `current.json` at a prior `versions/<modelVersion>/` for offline eval and for overlay prepare | Changing live `POST /v1/score` (still `rules_v0` until §6) |
| Re-eval that prior artifact on blinded holdout v1.0 | Deleting `versions/` history |
| A way to recover if a newer head regresses FP / FN or p95 | A Prisma / Jane / policy rollback |
| Offline-first, until cutover exists | Permission to set live `modelVersion` by editing JSON on the bank |

Offline rollback: `python -m elah_model.evaluate --model-version catboost_v0` or `python -m elah_model.versioning --set-current catboost_v0`. Pointer change still does not flip live `POST /v1/score`.

`ELAH-MDL-VER-001` owns the on-disk schema. If the two disagree on filenames, **versioning wins** for layout; this memo still wins for “pointer change ≠ live cutover.”

---

## 8. Non-goals (this pass)

| Non-goal | Why |
|---|---|
| Cut over `POST /v1/score` | Founder: prepare only |
| Edit `lib/elah/service/mock-scorer.ts` or `lib/elah/baseline/` | Live scorer stays `rules_v0` |
| `scorer = "model"` / `"hybrid"` on the live body | Silent swap forbidden |
| Allow / deny / confirm / execute engine | Bank policy owns those verbs |
| Jane-visible overlay or `elahScore` | C11 / S7 |
| Scores on `ElahEvent` / `prisma db push` | Output contract |
| New ScoreResponse fields | Contract 1.0 is closed |
| Raising 80 / 200 / 250 ms | `ELAH-SPEC-LATENCY-001` |
| Treating laptop in-process p95 as colocated HTTP SLO | `ELAH-MDL-LAT-001` is darwin in-process only |
| Treating `current.json` as live scorer selection | Pointer is offline / overlay-prepare only |
| Fabricated customers, pilots, or live-model metrics | Offline ≠ production |
| LLM / SLM on the customer path | `ELAH-MDL-CMP-001` |

---

## 9. Related documents

| Document | Role |
|---|---|
| [ELAH_MODEL_ARCHITECTURE.md](./ELAH_MODEL_ARCHITECTURE.md) (`ELAH-MDL-ARCH-001`) | Encoder + CatBoost head + optional hybrid serving; promotion bar §5 |
| [ELAH_MODEL_APPROACH_COMPARISON.md](./ELAH_MODEL_APPROACH_COMPARISON.md) (`ELAH-MDL-CMP-001`) | Approach D: rules-then-model |
| [ELAH_MODEL_CARD.md](./ELAH_MODEL_CARD.md) (`ELAH-MDL-CARD-001`) | Live `rules_v0` vs offline `catboost_v0` |
| [ELAH_MODEL_LIMITATIONS.md](./ELAH_MODEL_LIMITATIONS.md) (`ELAH-MDL-LIMIT-001`) | Not live; HTTP p95 still unmeasured |
| [ELAH_MODEL_LATENCY.md](./ELAH_MODEL_LATENCY.md) (`ELAH-MDL-LAT-001`) | In-process extract+predict p50 0.176 ms / p95 2.16 ms — prepare gate open, not cutover |
| [ELAH_MODEL_ABSTENTION.md](./ELAH_MODEL_ABSTENTION.md) (`ELAH-MDL-ABS-001`) | Skip / fail-open vs abstention |
| `docs/Phase 0 - Product Definition/Tasks 10-22 performed 17 Aug 2026/ELAH_LATENCY.md` | p50 ≤ 80 ms, p95 ≤ 200 ms, client fail-open 250 ms |
| `docs/Phase 5 - Baseline scoring system/ELAH_BASELINE_EVAL.md` | Blinded `rules_v0` holdout bar |
| [ELAH_MODEL_VERSIONING.md](./ELAH_MODEL_VERSIONING.md) (`ELAH-MDL-VER-001`) | Landed — `current.json` → `versions/catboost_v0/`. Pointer ≠ live cutover. |

---

## 10. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder | Founder | 31 August 2026 | **Prepare hybrid** (`rules_v0` first, CatBoost overlay) **IF** in-process p95 ≤ 200 ms. **Do not** cut over `POST /v1/score`. |
| Engineering |  |  |  |
| Security |  |  |  |

**Approval statement:** I agree ELAH scores genuine banking intent **before tool execution**; that bank policy allow / deny / confirm; that **ELAH never allows, blocks, or executes**; that scores are **not** fields of `ElahEvent`; that Jane / customer UI MUST NOT show `elahScore`; that live `POST /v1/score` remains `lib/elah/baseline/` via `lib/elah/service/mock-scorer.ts` with `scorer = rules_v0` and `modelVersion = null`; that hybrid means `rules_v0` always first and CatBoost overlay only if remaining budget vs **80 / 200 / 250 ms** allows; that overlay is a **second score for founder / eval**, not a second allow / deny, not Jane-visible, and not written to `ElahEvent`; that fail-open stays **250 ms** (skip overlay or `scoring_unavailable` — never wait, never invent a score, never raise the timeout); that cutover requires an **explicit founder yes**, cited latency evidence, FP / FN vs the `rules_v0` bar, and **no silent** `scorer = "model"`; that rollback is a pointer (`current.json` → `versions/<modelVersion>/`) **when that contract lands**, and is not live scorer selection; and that **this memo does not cut over live scoring.**

---

*End of document.*

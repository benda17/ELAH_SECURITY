# ELAH Model Architecture (initial)

| Field | Value |
|---|---|
| Document ID | ELAH-MDL-ARCH-001 |
| Version | **1.2** |
| Status | **Approved** — first trained head is **CatBoost**; offline `catboost_v0` exists; in-process p95 holds; live scorer remains `rules_v0` |
| Date | 28 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related task | `task-6-define-the-initial-model-architecture` |
| Depends on | `ELAH-SPEC-OUTPUT-001`, `ELAH-SPEC-EVENT-001`, `ELAH-SPEC-LATENCY-001`, `ELAH-ARCH-OWN-001`, `ELAH-BASE-FEAT-001`, `ELAH-BASE-RULES-001`, `ELAH-BASE-EVAL-001` |
| Live path (today) | `POST /v1/score` → `lib/elah/baseline/` via `lib/elah/service/mock-scorer.ts` |
| Envelope / response | `ElahEvent` 1.0 in; `ScoreResponse` 1.0 out (`docs/Phase 0 - Product Definition/ELAH_OUTPUT_CONTRACT.md`) |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. No ATM, beneficiary-write, or `device_change` product. Closed 22-label taxonomy (`lib/elah/types.ts`). `rules_v0` is **uncalibrated** and is **not** a trained model. No fabricated customers, pilots, or trained-model metrics.

**This document names the architecture.** An offline CatBoost artifact now exists (`elah-model/artifacts/catboost_v0/`). Nothing in it changes the live scorer. Live provenance remains `scorer = rules_v0`, `modelVersion = null` until a later task integrates a head that beats blinded holdout **and** holds p95.

---

## 1. Purpose

Name the **first trained scoring architecture**: reuse Phase 5 features as the encoder, put a **CatBoost** (gradient-boosted trees) classifier on top, keep `ScoreResponse` 1.0 unchanged, and stay inside the Phase 0 latency ceiling. Founder selected CatBoost on 26 August 2026. Offline training ran 30 August 2026 (`ELAH-MDL-RUN-001`). Choosing and training CatBoost still does **not** cut over live scoring.

---

## 2. What stays frozen (live)

Sequence (unchanged from Phase 0 / 3 / 5):

```
utterance → plan tool → BANK POLICY (allow | deny | needs_confirmation)
        → (confirm if needed) → POST /v1/score → BANK executes if policy already allows
```

| Layer | Path | Role today |
|---|---|---|
| HTTP | `POST /v1/score` | Validate `ScoreRequest` 1.0; Bearer; 250 ms fail-open at the **caller** |
| Handler | `lib/elah/service/handle-score.ts` | Auth, schema, idempotency, `scoredAt`, persist snapshot |
| Adapter | `lib/elah/service/mock-scorer.ts` | `scoreElahEvent(event)` — the only producer of `ElahScore` on this path |
| Baseline | `lib/elah/baseline/` | Extract features → compose `rules_v0` `ElahScore` |

Input remains **one** `ElahEvent` 1.0. Output remains **one** `ScoreResponse` 1.0. Do not invent a new event envelope. Do not add ScoreResponse fields.

---

## 3. Latency (must restate; do not change)

From `docs/Phase 0 - Product Definition/Tasks 10-22 performed 17 Aug 2026/ELAH_LATENCY.md` (`ELAH-SPEC-LATENCY-001`):

| Percentile | Target | Hard ceiling |
|---|---|---|
| p50 | **≤ 80 ms** | — |
| p95 | **≤ 200 ms** | — |
| p99 | **≤ 240 ms** | Client abort at **250 ms** |

The client fail-open is **250 ms**. If a model cannot finish, **abstain or skip** — never wait past 250 ms on the customer path.

Throughput rule: if a model cannot hold p95, **score `rules_v0` first, enrich later**. Do **not** raise the timeout.

These budgets are product law. This architecture document does not revise them.

---

## 4. Architecture (plan, not shipped)

### 4.1 Default encoder — reuse Phase 5 features

The first trained head MUST consume the existing Phase 5 feature vector from `lib/elah/baseline/features.ts` (`ELAH-BASE-FEAT-001`).

```
one ElahEvent 1.0  →  BaselineFeatures  →  trained head  →  ScoreResponse 1.0
```

| May use | Must not |
|---|---|
| The five Phase 5 families (risk, behavioral, agent, banking-context, single-event chain) | A new event envelope or extra live fields |
| Closed enums already on `ElahEvent` 1.0 | ATM, beneficiary-write, or `device_change` product fields |
| Cheap utterance lexicon flags already extracted | Raw utterance copied into explanation or reason codes |
| Gold JSONL only at **train / eval** time | Passing gold labels into the live scorer |

Do not invent a parallel encoder that disagrees with `features.ts` on the same envelope. If a feature is missing live (unusual device/location as gold tags, not required envelope fields), the model MUST treat absence as unknown, not as attack.

### 4.2 First trained head — CatBoost

The first trained scorer is **CatBoost** (gradient-boosted trees) over those features. Founder selected it because ELAH events are mostly **structured and categorical**: action type, tool name, user tier, policy state, risk tags, intent labels, agent behavior, and context signals (`lib/elah/baseline/features.ts`: `actionType`, `toolName`, `customerTier`, `policyDecision`, injection/high-value flags, `source`, `executionState`, `accountContext`, and related fields). CatBoost is built for that mix; a linear head or an SLM on raw text is not the first trained scorer.

It maps the feature vector to:

- a closed 22-way `intentLabel` (`lib/elah/types.ts`)
- `elahScore` / `confidence` (and therefore `uncertainty` by O5)

It is **not** an LLM on the customer path. It is **not** a small language model over raw utterance/tool text as the live scorer (see `ELAH-MDL-CMP-001`). Choosing CatBoost does **not** add allow / deny / confirm / execute.

Offline weights exist (`catboost_v0`, blinded holdout accuracy **0.90**, FP **0**, FN **0** — `ELAH-MDL-RUN-001`). Live `modelVersion` remains **null**. In-process extract+predict p95 is **2.16 ms** (`ELAH-MDL-LAT-001`). Colocated HTTP p95 is still unmeasured. This document still does **not** authorize cutover.

### 4.3 Optional hybrid serving

`rules_v0` remains the **live** scorer until a trained head beats blinded holdout v1.0 (`n=100`, `data/phase4/v1.0/splits/holdout.jsonl`) under the same eval as Phase 5 (`ELAH-BASE-EVAL-001`).

| State | `provenance.scorer` | `provenance.modelVersion` |
|---|---|---|
| Today / until the bar is beaten | `rules_v0` | `null` |
| After a head beats blinded holdout **and** holds p95 | `model` or `hybrid` | a real version string |
| Head exists but cannot hold p95 | keep `rules_v0` on the customer path; optional async enrich | still `null` on the live HTTP body until cutover |

Hybrid pattern (if needed for latency, not as a policy engine):

1. Run `rules_v0` (feature extract + rules) inside the 250 ms budget.
2. Return that `ScoreResponse` 1.0 so the caller can fail-open on time.
3. If remaining budget allows, overlay the CatBoost head; otherwise **abstain or skip** the overlay.
4. Never wait past 250 ms. Never raise the timeout to “let the model finish.”

Until cutover, do **not** set `scorer: "model"` or `scorer: "hybrid"`. `intent_matrix` remains a simulator planner hint, not this scorer.

### 4.4 Outputs stay ScoreResponse 1.0

Every `200` body remains `ScoreResponse` 1.0 (`ELAH-SPEC-OUTPUT-001`). The `score` object (`ElahScore`) still contains **only**:

| Field | Unchanged rule |
|---|---|
| `elahScore` | `[0.00, 1.00]`; higher = more like genuine banking intent |
| `confidence` | `[0.00, 1.00]`; strength of this score + label pair |
| `uncertainty` | `round3(1 − confidence)` |
| `intentLabel` | Closed 22 `ElahBankingIntent` |
| `coordinates` | `humanAgency`, `financialRisk`, `emotionalUrgency` |
| `explanation` | `matchedSignals`, `weakSignals`, `negativeSignals`, optional `summary` |
| `policyHook` | `recommendation` ∈ { `none`, `watch`, `review`, `step_up_hint` }; `reasons[]` |
| `provenance` | `scorer`, `modelVersion`, `labelSource` |

No new fields. `additionalProperties: false`. `policyHook.recommendation` still MUST NOT be `allow`, `deny`, `block`, or `confirm`.

A trained head MAY populate `explanation` / `policyHook.reasons` from Phase 5 feature names and `RC_*` codes. It MUST NOT emit chain-of-thought, raw utterances, or PII.

### 4.5 Deployment

Colocate the scorer with the banking app (`ELAH-ARCH-OWN-001`) until:

- a second client appears, or
- scoring load threatens the banking app’s p95, or
- a different runtime is required (GPU).

Until one of those triggers, Phase 6 does **not** extract a separate ELAH deploy. A CatBoost head over Phase 5 features does not by itself require GPU.

**Offline training home (not this banking repo):** `/Users/benda/elah-model`. Gold v1.0 splits are copied there. Training does not change live `POST /v1/score`.

---

## 5. Promotion bar (when a model may replace live `rules_v0`)

A later **integration** task MAY cut over only if **all** of the following hold **and** the founder gives an **explicit yes**. Offline CatBoost has beaten items 2–4 on synthetic holdout v1.0. Items 1 (protocol) and 6 (immutability) held. Item 5 **in-process** p95 holds (`ELAH-MDL-LAT-001` 2.16 ms); **colocated HTTP** p95 is still unmeasured. Fail any item → keep `scorer = rules_v0`.

1. Blinded holdout v1.0 (`n=100`) is scored without gold `detectedIntent` (same protocol as Phase 5).
2. Intent accuracy and macro-F1 beat `rules_v0` on that holdout. Live `rules_v0` numbers are in `data/phase5/v1.0/eval-report.json` and `ELAH-BASE-EVAL-001`; they are the **baseline**, not a model claim.
3. Legitimate-as-injection FP does not regress vs `rules_v0`.
4. Injection→P0-money FN does not regress vs `rules_v0`.
5. In-process (and then colocated HTTP) p95 stays **≤ 200 ms**; the caller still aborts at **250 ms**.
6. Gold v1.0 is not rewritten in place. A label fix is a new dataset version.

Fail any item → keep `scorer = rules_v0`, `modelVersion = null`.

---

## 6. Non-goals

| Non-goal | Why |
|---|---|
| Allow / deny / confirm / execute engine | Bank policy owns those verbs |
| Transaction-monitoring replacement | ELAH scores intention, not TM |
| Customer-visible scores | Jane / customer UI MUST NOT show `elahScore` |
| ATM, beneficiary-write, or `device_change` product | Out of freeze |
| Rewriting gold v1.0 in place | Immutability; a fix is a new dataset version |
| Raising the 250 ms client fail-open | `ELAH-SPEC-LATENCY-001` |
| LLM / SLM as the live customer-path scorer | Latency and freeze risk; see `ELAH-MDL-CMP-001` |
| New `ScoreResponse` fields | Contract 1.0 is closed |
| New event envelope | Reuse `ElahEvent` 1.0 + Phase 5 features |
| Fabricated customers, pilots, or live-model metrics | Offline CatBoost exists; do not present it as live or production |

---

## 7. Related documents

| Document | Role |
|---|---|
| `docs/Phase 0 - Product Definition/ELAH_OUTPUT_CONTRACT.md` | `ElahEvent` 1.0 / `ScoreResponse` 1.0 field law |
| `docs/Phase 0 - Product Definition/Tasks 10-22 performed 17 Aug 2026/ELAH_LATENCY.md` | p50 ≤ 80 ms, p95 ≤ 200 ms, client fail-open 250 ms |
| `docs/Phase 0 - Product Definition/Tasks 10-22 performed 17 Aug 2026/ELAH_COMPONENT_OWNERSHIP.md` | Colocation until second client or p95 threat |
| `docs/Phase 5 - Baseline scoring system/ELAH_BASELINE_FEATURES.md` | Encoder to reuse |
| `docs/Phase 5 - Baseline scoring system/ELAH_RULES_BASELINE.md` | Live `rules_v0` composer |
| `docs/Phase 5 - Baseline scoring system/ELAH_BASELINE_EVAL.md` | Blinded holdout bar |
| [ELAH_MODEL_APPROACH_COMPARISON.md](./ELAH_MODEL_APPROACH_COMPARISON.md) | Rules vs CatBoost vs SLM vs hybrid |

---

## 8. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder | Founder | 26 August 2026 | **Approve** — first trained head is CatBoost |
| Engineering |  |  |  |
| Security |  |  |  |

**Approval statement:** I agree ELAH scores genuine banking intent **before tool execution**; that bank policy allow / deny / confirm; that **ELAH never allows, blocks, or executes**; that scores are **not** fields of `ElahEvent`; that Jane / customer UI MUST NOT show `elahScore`; that there is no ATM, beneficiary-write, or `device_change` product; that the taxonomy stays the closed 22 labels in `lib/elah/types.ts`; that `rules_v0` is **uncalibrated** and is **not** a trained model; that live scoring remains `POST /v1/score` → `lib/elah/baseline/` via `lib/elah/service/mock-scorer.ts` with `scorer = rules_v0` and `modelVersion = null`; that p50 ≤ 80 ms, p95 ≤ 200 ms, and the client fail-open is **250 ms** (abstain or skip if a model cannot finish — never raise the timeout); that the first trained head, when built, reuses Phase 5 features and **CatBoost** and still emits only ScoreResponse 1.0 (`elahScore`, label, confidence, coordinates, explanation, provenance); and that **choosing CatBoost is not a trained model.**

---

*End of document.*

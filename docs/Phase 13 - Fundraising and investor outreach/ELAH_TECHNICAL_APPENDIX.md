# ELAH Technical Appendix (investor)

| Field | Value |
|---|---|
| Document ID | ELAH-FUND-TECH-001 |
| Version | **0.1** |
| Status | **Proposed** |
| Date | 26 August 2026 |
| Classification | Internal — ELAH Security (fundraising pack) |
| Owner | Founder |
| Role | Pointer pack. **Does not fork** Phase 0 contracts, OpenAPI, or ScoreResponse fields. If this file and a spec disagree, **the spec wins**. |
| Audience | Technical partner / diligence after the demo |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. No ATM, beneficiary-write, or `device_change` product. Closed 22-label taxonomy. `rules_v0` is **uncalibrated** and is **not** a trained model.

---

## 1. Purpose

Give a technical reader the **live sequence**, the **objects**, and **links** into the documents that already freeze them. Diligence should read those files, not a rewritten API.

---

## 2. Sequence (canonical)

From Phase 0 policy boundary and Phase 3 simulator wire:

```
utterance
    → plan tool
    → BANK POLICY  allow | deny | needs_confirmation
    → (if confirm) customer confirms
    → build ElahEvent 1.0  (executionState pre_tool | no_tool)
    → POST /v1/score
    → persist snapshot  (elah_scored | elah_scoring_unavailable)
    → executeTool  only if policy already allows / confirmed
```

| Rule | Meaning |
|---|---|
| ELAH after policy, before tool | Score does not create permission |
| Low score ≠ deny | Allowed tools still run |
| High score ≠ execute | Denied tools still do not run |
| Injection / policy deny | Still score (`no_tool`); **do not** execute. The refuse is policy |
| Timeout / 5xx | Fail-open; policy continues; no invented `ElahScore` |
| `mode` | MUST be `pre_tool`. `post_tool` rejected (`wrong_execution_state`) |

Do not cite a different order in a pitch.

---

## 3. HTTP (implement-to-contract)

| Method | Path | What |
|---|---|---|
| `POST` | `/v1/score` | Only scoring endpoint. Bearer. `ScoreRequest` 1.0 → `200` `ScoreResponse` 1.0 |
| `GET` | `/v1/health` | Liveness (ops; not in the Phase 0 score OpenAPI) |
| `GET` | `/v1/version` | Contract + scorer id |

`policyHook.recommendation` ∈ { `none`, `watch`, `review`, `step_up_hint` }. **Forbidden:** `allow`, `deny`, `block`, `confirm`.

Provenance on every `200` today:

```
score.provenance.scorer       = "rules_v0"
score.provenance.modelVersion = null
score.provenance.labelSource  = "rules_v0"
```

Do not set `scorer: "model"` until a real model ships.

**Contracts (read these, do not copy fields here):**

| Concern | ID | Path |
|---|---|---|
| Request wrapper, auth, fail-open | ELAH-SPEC-INPUT-001 | [`docs/Phase 0 - Product Definition/ELAH_INPUT_CONTRACT.md`](../Phase%200%20-%20Product%20Definition/ELAH_INPUT_CONTRACT.md) |
| `ScoreResponse` / `ElahScore` | ELAH-SPEC-OUTPUT-001 | [`docs/Phase 0 - Product Definition/ELAH_OUTPUT_CONTRACT.md`](../Phase%200%20-%20Product%20Definition/ELAH_OUTPUT_CONTRACT.md) |
| Envelope `event` | ELAH-SPEC-EVENT-001 | [`docs/Phase 0 - Product Definition/ELAH_EVENT_SCHEMA.md`](../Phase%200%20-%20Product%20Definition/ELAH_EVENT_SCHEMA.md) |
| OpenAPI 3.1 | — | [`docs/Phase 0 - Product Definition/openapi/elah-v1-score.yaml`](../Phase%200%20-%20Product%20Definition/openapi/elah-v1-score.yaml) |
| HTTP implementer pointer | ELAH-SVC-API-001 | [`docs/Phase 3 - ELAH service foundation/ELAH_SCORING_API.md`](../Phase%203%20-%20ELAH%20service%20foundation/ELAH_SCORING_API.md) |
| Orchestrator hook | ELAH-SVC-WIRE-001 | [`docs/Phase 3 - ELAH service foundation/ELAH_SIMULATOR_WIRE.md`](../Phase%203%20-%20ELAH%20service%20foundation/ELAH_SIMULATOR_WIRE.md) |
| Policy RACI | ELAH-SPEC-BOUNDARY-001 | [`docs/Phase 0 - Product Definition/Tasks 10-22 performed 17 Aug 2026/ELAH_POLICY_BOUNDARY.md`](../Phase%200%20-%20Product%20Definition/Tasks%2010-22%20performed%2017%20Aug%202026/ELAH_POLICY_BOUNDARY.md) |

Code (live, not a second contract): `app/v1/score/route.ts`, `lib/elah/service/handle-score.ts`, `lib/elah/client.ts`, `lib/agent/orchestrator.ts`, `lib/agent/policy.ts`.

---

## 4. Coordinates

Intention graph is a **right-handed unit cube**. Axes are independent of `elahScore`. A genuine external transfer **should** sit high on Financial Risk **and** high on Human Agency. Origin is not “allow.”

| API field | Axis | Plot | Low | High |
|---|---|---|---|---|
| `humanAgency` | Human Agency | X | Coerced, empty, injection-steered | Deliberate ordinary customer act |
| `financialRisk` | Financial Risk | Y | Read-only / low harm if executed | Money move, entitlement change, hostile harm potential |
| `emotionalUrgency` | Emotional Urgency | Z | Calm / routine | Pressure, panic, haste, coercion |

Range `[0.00, 1.00]`, three decimals. No fourth axis in v1.

**Spec:** [`ELAH_COORDINATE_SYSTEM.md`](../Phase%200%20-%20Product%20Definition/ELAH_COORDINATE_SYSTEM.md) (ELAH-SPEC-COORDINATES-001). **Score bands (display copy only):** [`ELAH_SCORE_SEMANTICS.md`](../Phase%200%20-%20Product%20Definition/ELAH_SCORE_SEMANTICS.md) — Genuine ≥ 0.75, Mixed [0.40, 0.75), Off-intent < 0.40. Band words are **not** API fields.

---

## 5. `rules_v0` (Phase 5 baseline)

Phase 3 shipped a contract-faithful mock. Phase 5 keeps the same provenance id and HTTP path, and replaces table lookup with **feature extraction + composed rules**. Still not a learned model.

```
one ElahEvent  →  BaselineFeatures  →  rules_v0 ElahScore
```

| Family | Role |
|---|---|
| Risk | Amount / tool harm potential on **this** event |
| Behavioral | Cheap utterance lexicon flags (not a profile store) |
| Agent | Planned tool vs utterance, source `agent` \| `ui` |
| Banking-context | Tier / action type already on the envelope |
| Chain | Single-event only; no session velocity |

Analyst UI MUST show **Uncalibrated (rules)**. Customer UI MUST show none of this.

Identical envelope in → identical `ElahScore` fields (clock `scoredAt` may differ).

**Specs / code:**

| Item | Path |
|---|---|
| Rules | [`docs/Phase 5 - Baseline scoring system/ELAH_RULES_BASELINE.md`](../Phase%205%20-%20Baseline%20scoring%20system/ELAH_RULES_BASELINE.md) |
| Features | [`docs/Phase 5 - Baseline scoring system/ELAH_BASELINE_FEATURES.md`](../Phase%205%20-%20Baseline%20scoring%20system/ELAH_BASELINE_FEATURES.md) |
| Reason codes (`RC_*` in `policyHook.reasons`) | [`docs/Phase 5 - Baseline scoring system/ELAH_REASON_CODES.md`](../Phase%205%20-%20Baseline%20scoring%20system/ELAH_REASON_CODES.md) |
| Eval | [`docs/Phase 5 - Baseline scoring system/ELAH_BASELINE_EVAL.md`](../Phase%205%20-%20Baseline%20scoring%20system/ELAH_BASELINE_EVAL.md) |
| Limitations | [`docs/Phase 5 - Baseline scoring system/ELAH_BASELINE_LIMITATIONS.md`](../Phase%205%20-%20Baseline%20scoring%20system/ELAH_BASELINE_LIMITATIONS.md) |
| Adapter | `lib/elah/service/mock-scorer.ts` → `lib/elah/baseline/` |

---

## 6. Dataset and blinded bar (cite, do not inflate)

| Item | Value | Where |
|---|---|---|
| Gold | v1.0, **571** rows, seed **20260826** | `data/phase4/v1.0/manifest.json` |
| Splits | train 393 / val 78 / holdout **100** | same |
| Nature | **Synthetic** (`phase4_gen_v1`) | Phase 4 pack |
| Eval | `npm run baseline:eval` | `data/phase5/v1.0/eval-report.json` |
| Blinded | gold `detectedIntent` **stripped** | `blindedDetectedIntent: true` |
| Intent accuracy | **0.79** | report |
| Legitimate-as-injection FP | **0** | report |
| FN (injection → P0 money-move) | **1** (`azb-0005`) | report |
| Injection recall | **0.59** (22 gold rows) | `perLabel` |
| ECE | **0.153**, `uncalibrated: true` | report |
| Latency p50 / p95 | 0.004 / 0.006 ms, Apple M2 | informational vs 80 / 200 ms budgets |

Do **not** quote 1.00 accuracy (hint-echo). Do **not** quote fixture Cohen’s κ as live dual-annotator agreement.

Phase 4 pack: [`docs/Phase 4 - Dataset and labeling system/`](../Phase%204%20-%20Dataset%20and%20labeling%20system/). Taxonomy: closed 22 `ElahBankingIntent` in `lib/elah/types.ts`.

---

## 7. Analyst vs Jane

| Surface | Who | What |
|---|---|---|
| `/assistant` | Jane `basic.customer@elah.demo` | Banking chat. **No** score |
| `/admin/elah-events/[eventId]` | `security.admin@elah.demo` | Score card, uncalibrated badge, coordinates, `RC_*` |
| `/admin/elah-baseline` | same | Holdout metrics from the eval JSON. Not a customer page |

Scores persist on `AgentEventLog` metadata (`elah_scored`). They are **not** fields of stored `ElahEvent` envelopes.

---

## 8. Architecture (logical)

MVP **may** colocate the scorer in the banking Next.js deploy as `/v1/*` (Bearer + fail-open + OpenAPI). Ownership freeze: extract later without rewriting the bank. Picture: [`ELAH_ARCHITECTURE.md`](../Phase%200%20-%20Product%20Definition/Tasks%2010-22%20performed%2017%20Aug%202026/ELAH_ARCHITECTURE.md). Product fence: [`ELAH_MVP_SCOPE.md`](../Phase%200%20-%20Product%20Definition/ELAH_MVP_SCOPE.md).

---

## 9. What Phase 6 must beat (not a promise of a date)

Same holdout file, same blinded protocol, same contracts. A trained scorer that does not beat **0.79** intent accuracy on that cut is not an upgrade. Relabelling provenance to `model` without beating the bar is a documentation defect.

---

*End of document.*

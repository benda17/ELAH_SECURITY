# ELAH Rules Baseline (`rules_v0`)

| Field | Value |
|---|---|
| Document ID | ELAH-BASE-RULES-001 |
| Version | **1.0** |
| Status | **Proposed** |
| Date | 26 August 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related tasks | `task-5-build-a-deterministic-rules-based-baseline`, `task-5-produce-a-baseline-human-intention-score`, `task-5-produce-baseline-coordinates`, `task-5-produce-baseline-explanations`, `task-5-add-uncertainty-handling`, `task-5-add-score-normalization`, `task-5-add-test-fixtures` |
| Depends on | `ELAH-SPEC-OUTPUT-001`, `ELAH-SPEC-CONFIDENCE-001`, `ELAH-SPEC-SCORE-001`, `ELAH-SPEC-COORDINATES-001`, `ELAH-SVC-MOCK-001`, `ELAH-SVC-API-001`, `ELAH-BASE-FEAT-001`, `ELAH-BASE-RC-001` |
| Code | `lib/elah/baseline/` (extractor + composer); adapter `lib/elah/service/mock-scorer.ts`; HTTP `app/v1/score/route.ts`, `lib/elah/service/handle-score.ts` |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. No ATM, beneficiary-write, or `device_change` product. Do not `prisma db push`. Closed 22-label taxonomy. `rules_v0` is **uncalibrated** and is **not** a trained model.

---

## 1. Purpose

This document freezes the Phase 5 **deterministic rules baseline**: how one `ElahEvent` 1.0 becomes a contract-valid `ScoreResponse` 1.0.

Phase 3 shipped a fixture-table mock so the simulator and dashboards could bind (`ELAH-SVC-MOCK-001`). Phase 5 keeps the same provenance id (`rules_v0`) and the same HTTP surface (`POST /v1/score`), and replaces opaque table lookup with **explicit feature extraction + composed score**. It is still not a learned model. Phase 6 is the first trained scorer, and it must beat this baseline on holdout.

---

## 2. What `rules_v0` is / is not

| Is | Is not |
|---|---|
| Closed, deterministic rules over one `ElahEvent` | Gradient-trained / LLM classifier |
| Uncalibrated heuristic (`provenance.scorer = rules_v0`) | A reliability-calibrated probability (C10) |
| Contract-faithful `ElahScore` (output O1–O13) | An allow / deny / confirm / execute engine |
| Feature-composed intention + coordinates + explanation | A fraud score or a second bank policy |
| Measurable bar for Phase 6 | A replacement for gold labels or live κ |
| Adapter-wired through the existing mock scorer | A new HTTP endpoint or a new `ScoreResponse` field |

Analyst UI MUST show `rules_v0` as **Uncalibrated (rules)** (`ELAH-SPEC-CONFIDENCE-001` C10). Customer UI MUST show none of this (C11, S7).

---

## 3. Provenance (every `200`)

```
score.provenance.scorer      = "rules_v0"
score.provenance.modelVersion = null
score.provenance.labelSource  = "rules_v0"
```

Do not set `scorer: "model"` until a real model ships. Do not set `scorer: "hybrid"` for this baseline. `intent_matrix` remains a **simulator planner hint**, not this scorer.

`scoredAt` is the clock when ELAH produced the HTTP body (output O13). It is **not** required to be identical across two calls. Every field under `score` **is**.

---

## 4. Wiring: `POST /v1/score` via the mock-scorer adapter

Sequence (unchanged from Phase 0 / 3):

```
utterance → plan tool → BANK POLICY (allow | deny | needs_confirmation)
        → (confirm if needed) → POST /v1/score → BANK executes if policy already allows
```

| Layer | Path | Role |
|---|---|---|
| HTTP | `POST /v1/score` | Validate `ScoreRequest` 1.0; Bearer; 250 ms fail-open at the **caller** |
| Handler | `lib/elah/service/handle-score.ts` | Auth, schema, idempotency, `scoredAt`, persist snapshot |
| Adapter | `lib/elah/service/mock-scorer.ts` | `scoreElahEvent(event)` — **the only producer** of `ElahScore` on this path |
| Baseline | `lib/elah/baseline/` | Extract features → compose `elahScore`, coordinates, confidence, explanation, `policyHook` |

The adapter MUST call the baseline composer. It MUST NOT grow a parallel scoring table that disagrees with `lib/elah/baseline/`. Fixture numbers in `ELAH-SVC-MOCK-001` remain **acceptance samples** for the same direction (genuine P0 high, injection low, ambiguous abstained); Phase 5 may differ in the third decimal when features justify it, but injection stays Off-intent and genuine wires stay Genuine-intent.

`mode` MUST be `pre_tool`. `post_tool` is rejected (`wrong_execution_state`). Extra properties on the request → 4xx, do not score (`ELAH-SVC-API-001`).

A low `elahScore` does **not** cancel an allowed tool. A high `elahScore` does **not** execute a denied tool. Timeout / 5xx → `scoring_unavailable`; bank policy continues.

---

## 5. Identical input → identical output

Canonicalize the event (schema 1.0, already validated) then score.

| Guarantee | Rule |
|---|---|
| Same `event` body | Same `intentLabel`, `elahScore`, `confidence`, `uncertainty`, coordinates, explanation arrays, `policyHook.recommendation`, `policyHook.reasons` (sorted stably), provenance strings |
| Numbers | `round3` then clamp to `[0, 1]` (output O12) |
| Complementarity | `uncertainty = round3(1 − confidence)` (O5; abs error ≤ 0.001) |
| Closed enums | `intentLabel` ∈ 22; `recommendation` ∈ { `none`, `watch`, `review`, `step_up_hint` } |
| Non-determinism allowed | `scoredAt` (clock); HTTP `requestId` echo |

Unit tests in `tests/elah/baseline-*.test.ts` MUST hash the `score` object (excluding nothing under `score`) for fixture events. Hashing `scoredAt` is forbidden.

---

## 6. Score composition

Apply **in order**. First hard rule that fires still continues through coordinates / explanation / hook; it does not skip the contract object.

### 6.1 Resolve `intentLabel` (closed 22)

1. If injection / policy-bypass signals fire (`actionType = prompt_injection`, `detectedIntent = prompt_injection_or_policy_bypass`, or policy reasons matching injection / ignore-previous / jailbreak **and** outcome `refused` / `blocked`) → `prompt_injection_or_policy_bypass`.
2. Else if `event.detectedIntent` is one of the 22 → use it.
3. Else map `actionType` / `action.toolName` via the same tables as `lib/elah/service/mock-scorer.ts`.
4. Else → `ambiguous_banking_request`.

Never emit a 23rd label. Accidental error is a **gold tag**, not an intent (`ELAH-DATA-DIM-001`).

### 6.2 Base `elahScore` (direction frozen: S1)

Higher = more like genuine customer banking intent. Lower = off-intent, ambiguous, or hostile (`ELAH-SPEC-SCORE-001`, `ELAH-SPEC-OUTPUT-001` O4).

| Band | Typical base | Examples |
|---|---|---|
| Genuine banking | 0.80–0.88 | balance, transfers, bills, statements, cards (when not injection) |
| Mixed / thin | ~0.48 | `ambiguous_banking_request` |
| Off-intent | 0.08–0.22 | injection (~0.08), `non_banking_request` (~0.22) |

### 6.3 Feature adjustments (small, clamped)

Extract features (`ELAH-BASE-FEAT-001`). Apply bounded deltas, then `round3(clamp(score, 0, 1))`.

| Condition | Direction on `elahScore` |
|---|---|
| Allow-listed planned tool + genuine intent | slight **up** |
| Amount bucket present + recipient present on a payment intent | slight **up** |
| Injection lexicon / policy refuse-as-injection | **down** to Off-intent floor |
| Short utterance, no tool, payment verb only | toward Mixed; often abstain |
| High amount bucket on a **genuine** wire | **does not** lower `elahScore` (high FR is a coordinate, not hostility) |

`financialRisk` is **not** subtracted from `elahScore`. A genuine ₪10,000 send is high intention **and** high FR (G9).

### 6.4 Confidence, uncertainty, abstention

`confidence` is reliability of the `(elahScore, intentLabel)` pair, **independent** of `elahScore` (C3, C4). It is a **heuristic strength-of-evidence** number for `rules_v0`, not ECE-calibrated (C10).

Producer rules (`ELAH-SPEC-CONFIDENCE-001` §6.2):

1. Never emit `ScoreResponse` on timeout / 5xx (caller records `scoring_unavailable`).
2. If `confidence < 0.40` → `status = abstained` (O6 / C7).
3. If conflict: `matchedSignals.length ≥ 2` AND `negativeSignals.length ≥ 2` AND `abs(elahScore − 0.50) < 0.20` → abstain even if confidence ≥ 0.40.
4. Else `status = scored`.

Abstained still returns a **full** `score` object (O3). Bank policy still governs the tool (C6).

### 6.5 Coordinates

Three axes only (`ELAH-SPEC-COORDINATES-001`): `humanAgency`, `financialRisk`, `emotionalUrgency`. Start from the intent-default atlas in `calculateInitialCoordinates` (`lib/elah/helpers.ts`). Nudge from features (amount bucket → FR; pressure lexicon → EU; injection → HA down, FR up). Clamp + `round3`. Do not persist display jitter. Do not emit H/B/S 5-vectors (G8).

High agency + high FR + high `elahScore` is the **core money-movement demo**, not a contradiction (G9). Abstention does not move the point to the origin (G10).

### 6.6 Explanation

Only `matchedSignals`, `weakSignals`, `negativeSignals`, optional `summary` ≤ 240 chars (O9). Signal strings `snake_case` or `prefix:value`. No chain-of-thought, no raw utterance, no PII. Empty arrays are valid.

Injection MUST include a negative signal such as `ignore_previous_instructions`. Genuine P0 SHOULD include at least one matched signal such as `planned_tool:create_external_transfer`.

### 6.7 `policyHook` (recommendation only)

| `recommendation` | When (producer defaults; not tenant law) |
|---|---|
| `review` | Injection intent, or `status = abstained`, or `elahScore < 0.25` |
| `watch` | P0 money/entitlement tool, `financialRisk ≥ 0.70`, scored |
| `step_up_hint` | Bank already `needs_confirmation` — **alignment**, not a second gate |
| `none` | Else |

`reasons` is a string array of `RC_*` codes (`ELAH-BASE-RC-001`). **No new `ScoreResponse` field.** Forbidden values anywhere on the response: `allow`, `deny`, `block`, `confirm`, `execute`, `decision` (O10).

---

## 7. Normalization (contract)

| Step | Rule |
|---|---|
| Range | All of `elahScore`, `confidence`, `uncertainty`, three coordinates ∈ `[0.00, 1.00]` |
| Decimals | `round3` |
| Complementarity | `uncertainty = round3(1 − confidence)` |
| Intent | Closed 22 |
| Hook | Closed four-value recommendation |
| Arrays | Cap signals (64 × 128) and reasons (16 × 160); no PII |
| Strict JSON | `additionalProperties: false` on `ScoreResponse` / nested objects |

Normalization lives in `lib/elah/baseline/` (and helpers already used by the adapter). It is **not** temperature scaling. Calibration is Phase 6.

---

## 8. Test fixtures

Fixtures MUST cover at least:

| Fixture | Expected direction |
|---|---|
| External transfer (UC-P0-1) | High `elahScore`, `external_transfer`, high FR, `watch` or `step_up_hint`; bank still confirms |
| Internal transfer / bill pay | Genuine intent; confirm is policy |
| Statement download | Genuine; lower FR than a wire |
| Card freeze / unfreeze | Genuine entitlement; elevated EU on freeze |
| Balance read | Genuine; low FR |
| Prompt injection | `elahScore` ~0.08, `prompt_injection_or_policy_bypass`, `review`; **no execute** |
| Ambiguous short utterance | Mixed score, `abstained`, `review` |
| High-value genuine wire | High `elahScore` **and** high FR — **not** a false positive |

Identical fixture JSON → identical `score` object. Tests: `tests/elah/baseline-fixtures.test.ts`, `tests/elah/baseline-score.test.ts`, `tests/elah/mock-scorer.test.ts`.

---

## 9. Never enforcement

| Actor | On this baseline |
|---|---|
| ELAH | Scores and explains. Emits `none` / `watch` / `review` / `step_up_hint` only. |
| Bank policy | Allow / deny / confirm. Executes tools. |
| Simulator | Fail-open on timeout. Never gates `executeTool` on `elahScore`. |
| Analyst UI | No buttons labelled “ELAH Allow” / “ELAH Block”. |
| Jane / customer UI | No `elahScore`. |

See `ELAH-SPEC-BOUNDARY-001`. Demo proof remains: **confirmed transfer with a watch hook** and **injection with policy refuse + low score**. Both stories: “ELAH scored; the bank decided.”

---

## 10. Related documents

| Document | Role |
|---|---|
| `docs/Phase 0 - Product Definition/ELAH_OUTPUT_CONTRACT.md` | `ScoreResponse` / `ElahScore` field law |
| `docs/Phase 0 - Product Definition/ELAH_CONFIDENCE_SEMANTICS.md` | Abstain, uncalibrated chip, complementarity |
| `docs/Phase 0 - Product Definition/ELAH_SCORE_SEMANTICS.md` | Genuine / Mixed / Off-intent copy |
| `docs/Phase 0 - Product Definition/ELAH_COORDINATE_SYSTEM.md` | HA / FR / EU |
| `docs/Phase 3 - ELAH service foundation/ELAH_MOCK_SCORER.md` | Adapter + provenance |
| `docs/Phase 3 - ELAH service foundation/ELAH_SCORING_API.md` | HTTP pointer; Phase 0 wins on conflict |
| [ELAH_BASELINE_FEATURES.md](./ELAH_BASELINE_FEATURES.md) | Feature families |
| [ELAH_REASON_CODES.md](./ELAH_REASON_CODES.md) | `RC_*` in `policyHook.reasons` |

---

## 11. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder |  |  | Approve / Approve with comments / Reject |
| Engineering |  |  |  |
| Security |  |  |  |

**Approval statement:** I agree `rules_v0` is a deterministic, uncalibrated rules baseline (not a trained model); that `POST /v1/score` stays the only scoring endpoint and is wired through the mock-scorer adapter into `lib/elah/baseline/`; that identical event bodies produce identical `ElahScore` objects; that provenance stays `rules_v0` with `modelVersion: null`; and that ELAH still never allows, blocks, or executes.

---

*End of document.*

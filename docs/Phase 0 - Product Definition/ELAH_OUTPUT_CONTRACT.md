# ELAH Output Contract — Pre-tool Scoring Response

| Field | Value |
|---|---|
| Document ID | ELAH-SPEC-OUTPUT-001 |
| Contract version | **1.0** |
| Status | Proposed for sign-off |
| Date | 17 August 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related roadmap task | `task-0-define-the-output-contract-for-elah` |
| Depends on | `ELAH-PRD-MVP-SCOPE-001`, `ELAH-SPEC-EVENT-001`, `ELAH-SPEC-INPUT-001` |
| Machine-readable | `docs/Phase 0 - Product Definition/openapi/elah-v1-score.yaml` (`ScoreResponse`, `ElahScore`) |
| Does not own | HTTP request/auth/fail-open (input contract); analyst band copy (score-semantics task); axis mapping rules (coordinate-system task); tenant threshold config (threshold-config task) |

---

## 1. Purpose

This document is the **critical-path handoff out of ELAH**.

After a valid `POST /v1/score` (input contract), ELAH returns **one** JSON body. Dashboards, SOC queues, training stores, and (later) bank policy engines bind to that body. If the shape drifts, the analyst UI, the founder training-dataset view, and any policy hook all break independently.

The response **scores genuine banking intent**. It does **not** allow, deny, or confirm. Bank policy remains the authority (`event.policy.decision`). The `policyHook` object is a **recommendation surface** those engines MAY subscribe to; it is never an enforcement decision.

Live evidence this contract names: `ElahTrainingEvent` columns `elahScoreLabel`, `labelConfidence`, `humanAgency`, `financialRisk`, `emotionalUrgency`, `finalIntent`, `matchedSignals`, `weakSignals`, `negativeSignals`, `labelSource` (`lib/elah/training-event.ts`, Prisma). Field names below are the **API** names; storage MAY keep the older column names until a migration.

Without this, Phase 3 cannot implement a scorer and Phase 9 cannot bind a dashboard without guessing.

---

## 2. Plan executed

| Step | Result |
|---|---|
| 1. Bound the HTTP envelope | `ScoreResponse` = correlation + `status` + `scoredAt` + `score` |
| 2. Frozen score object | Intention, confidence/uncertainty, intent, coordinates, explanation, policy hook, provenance |
| 3. Mapped live columns | Training table → API names (table in §5) |
| 4. Policy is a hook, not a gate | Closed `recommendation` enum; no `allow`/`deny` |
| 5. Samples | Accept §8; reject §9 |
| 6. OpenAPI | `ScoreResponse` / `ElahScore` in `docs/Phase 0 - Product Definition/openapi/elah-v1-score.yaml` |

---

## 3. Frozen decisions

| ID | Decision |
|---|---|
| O1 | Success HTTP is **200** with `ScoreResponse`. Errors remain `ErrorResponse` (input contract). This document does not redefine 4xx/5xx. |
| O2 | `contractVersion` on the response is `"1.0"` and MUST match the request. |
| O3 | `status` is `scored` or `abstained`. Abstention still returns a full `score` object (MVP: score + abstention flag). Consumers MUST treat `elahScore` as **non-decisive** when `status` is `abstained`. |
| O4 | `elahScore` is in **[0.00, 1.00]**. **Higher** = more like genuine customer banking intent. **Lower** = off-intent, ambiguous, or hostile. Direction is frozen here; analyst band labels (`high` / `review`) are a later semantics task. |
| O5 | Both `confidence` and `uncertainty` are required, each in **[0.00, 1.00]**. `uncertainty` MUST equal `round3(1 − confidence)` (absolute error ≤ 0.001). Dashboards MAY bind either. |
| O6 | Producer **SHOULD** set `status: "abstained"` when `confidence < 0.40`. That 0.40 is the **v1 sample default**. Tenant overrides belong to the threshold-config task; consumers key off `status`, not a hardcoded cutoff. |
| O7 | Coordinates are **Human Agency**, **Financial Risk**, **Emotional Urgency**, each in **[0.00, 1.00]**. Live matrix mapping is `x → humanAgency`, `y → financialRisk`, `z → emotionalUrgency`. Axis definitions, atlas, and sample plot: `docs/Phase 0 - Product Definition/ELAH_COORDINATE_SYSTEM.md`. |
| O8 | `intentLabel` is a closed enum: the 22 `ElahBankingIntent` values in live `lib/elah/types.ts` / MVP §5.2. It MAY differ from `event.detectedIntent`. |
| O9 | Explanation is **only** `matchedSignals`, `weakSignals`, `negativeSignals`, plus an optional short `summary`. No chain-of-thought, no hidden activations, no raw PII. |
| O10 | `policyHook.recommendation` ∈ { `none`, `watch`, `review`, `step_up_hint` }. Values `allow`, `deny`, `block`, `confirm` are **forbidden**. ELAH never overrides `event.policy`. |
| O11 | Strict JSON: `additionalProperties: false` on `ScoreResponse` and nested objects once this spec is signed. |
| O12 | Numbers in this contract are JSON numbers rounded to **3 decimal places** (`round3` in live helpers). |
| O13 | `scoredAt` is when ELAH produced the score (UTC), not `event.occurredAt`. |

---

## 4. HTTP envelope (`ScoreResponse`)

Returned on `200` from `POST /v1/score`.

| Field | Type | Req | Rules |
|---|---|---|---|
| `contractVersion` | string | **yes** | `"1.0"` |
| `requestId` | string | **yes** | Echo of the request. |
| `eventId` | string | **yes** | Echo of `event.eventId`. |
| `status` | string | **yes** | `scored` \| `abstained` |
| `scoredAt` | string | **yes** | ISO-8601 UTC with milliseconds. |
| `score` | object | **yes** | `ElahScore` (§5). Always present, including when abstained. |

No other top-level keys.

`status: "abstained"` means ELAH is **not confident enough** to treat the numeric score as a calibrated intention signal. The tool path still follows **bank policy** (input-contract fail-open / never-override). Dashboards MUST show an abstention badge.

---

## 5. `ElahScore` object

| Field | Type | Req | Live column / source |
|---|---|---|---|
| `elahScore` | number | **yes** | `ElahTrainingEvent.elahScoreLabel` |
| `confidence` | number | **yes** | `ElahTrainingEvent.labelConfidence` |
| `uncertainty` | number | **yes** | Derived: `round3(1 − confidence)` (not stored today) |
| `intentLabel` | string | **yes** | `ElahTrainingEvent.finalIntent` |
| `coordinates` | object | **yes** | `humanAgency`, `financialRisk`, `emotionalUrgency` |
| `explanation` | object | **yes** | `matchedSignals`, `weakSignals`, `negativeSignals` |
| `policyHook` | object | **yes** | **New API field** (not in the training table) |
| `provenance` | object | **yes** | `labelSource` + clock |

### 5.1 `elahScore`

- Range `[0, 1]`, 3 decimal places.
- **Not** a fraud probability and **not** an allow-rate.
- Injection / policy-bypass samples MUST be at the **low** end (see §8.2). Genuine P0 banking with a planned in-allow-list tool sits at the **high** end (see §8.1).

### 5.2 Confidence and uncertainty

| Field | Meaning |
|---|---|
| `confidence` | How sure ELAH is of **this** `elahScore` + `intentLabel` pair. |
| `uncertainty` | Complementary remainder. MUST satisfy O5. |

Cross-field:

1. Both in `[0, 1]`.
2. `abs(uncertainty − round3(1 − confidence)) ≤ 0.001`.
3. If `status === "abstained"`, `confidence` SHOULD be `< 0.40` under the v1 default (O6). The inverse is not required: a producer MAY abstain for other documented reasons (conflicting signals) with higher confidence of *ambiguity*.

Calibration plots, ECE, and UI copy are specified in `docs/Phase 0 - Product Definition/ELAH_CONFIDENCE_SEMANTICS.md` (ELAH-SPEC-CONFIDENCE-001). This contract only freezes **units and complementarity**.

### 5.3 `intentLabel` (closed)

```
balance_awareness
recent_transactions
spending_summary
internal_transfer
external_transfer
bill_payment
scheduled_payment
statement_download
card_freeze
card_unfreeze
fraud_report
dispute_chargeback
fee_or_overdraft_question
loan_inquiry
loan_application
savings_optimization
profile_update
support_escalation
ambiguous_banking_request
non_banking_request
prompt_injection_or_policy_bypass
```

Unknown values are **invalid**. MVP does not add intents (scope §5.2).

### 5.4 `coordinates`

| Field | Type | Req | Axis (MVP §5.3) |
|---|---|---|---|
| `humanAgency` | number `[0,1]` | **yes** | How much the request looks like a **deliberate customer** action. |
| `financialRisk` | number `[0,1]` | **yes** | How much **financial or entitlement harm** the requested tool could cause if executed. |
| `emotionalUrgency` | number `[0,1]` | **yes** | **Pressure / distress / haste** in the request. |

All 3 decimal places. Missing any axis → invalid. Extra keys → invalid.

These are **intention-graph coordinates**, not a 3-D risk score substitute for `elahScore`. A genuine external transfer MAY have high `elahScore` **and** high `financialRisk` (demo: confirmed transfer with a high-risk coordinate).

### 5.5 `explanation`

| Field | Type | Req | Rules |
|---|---|---|---|
| `matchedSignals` | string[] | **yes** | Evidence **for** the intent/score. Max 64 items; each item max 128 chars. |
| `weakSignals` | string[] | **yes** | Thin or ambiguous evidence. Same limits. |
| `negativeSignals` | string[] | **yes** | Counter-evidence (injection patterns, refusal, hostility). Same limits. |
| `summary` | string \| omitted | no | Max **240** chars. Analyst sentence composed from the lists. MUST NOT be model chain-of-thought. MUST NOT contain PII (names, account numbers, emails). |

Signal strings SHOULD be `snake_case` or `prefix:value` (live: `planned_tool:create_external_transfer`, `transfer_or_payment_verb`). They are **not** a closed enum in v1 so the rules engine can add ids without a contract bump. They MUST NOT include raw utterances or account ids.

Empty arrays are valid (e.g. no negative signals on a clean balance enquiry).

### 5.6 `policyHook` (recommendation only)

| Field | Type | Req | Rules |
|---|---|---|---|
| `recommendation` | string | **yes** | Closed enum below. |
| `reasons` | string[] | **yes** | Max 16; each max 160 chars; no PII. MAY be empty when `recommendation` is `none`. |

| `recommendation` | Meaning for consumers |
|---|---|
| `none` | No extra attention. Bank policy already decided; SOC need not queue. |
| `watch` | Optional SOC glance (typically elevated `financialRisk` on an otherwise genuine request). |
| `review` | Queue for analyst. **Required SHOULD** when `status` is `abstained` or `intentLabel` is `prompt_injection_or_policy_bypass`. |
| `step_up_hint` | Hint that the **bank** MAY add confirmation/MFA. ELAH does not perform step-up. If policy already `needs_confirmation`, this is informational alignment, not a second gate. |

**Forbidden** on this object (and anywhere on `ScoreResponse`): `allow`, `deny`, `block`, `confirm`, `execute`, `decision`. Those words belong to `event.policy.decision` only.

Illustrative producer defaults for **samples** (not tenant law):

| Condition | `recommendation` |
|---|---|
| `prompt_injection_or_policy_bypass` or `status: abstained` | `review` |
| `elahScore < 0.25` | `review` |
| P0 money/entitlement tool and `financialRisk ≥ 0.70` and scored | `watch` |
| Else | `none` |

The threshold-config task may replace this table per tenant. Field names stay.

### 5.7 `provenance`

| Field | Type | Req | Rules |
|---|---|---|---|
| `scorer` | string | **yes** | `rules_v0` \| `intent_matrix` \| `model` \| `hybrid` \| `manual` |
| `modelVersion` | string \| null | **yes** | Semver or date tag when `scorer` is `model` or `hybrid`; `null` for rules-only. |
| `labelSource` | string | **yes** | Live: `rules_v0` \| `intent_matrix` \| `backfill` \| `manual`. |

`scorer` is what produced **this HTTP score**. `labelSource` is how the training row would be tagged. They often match; they MAY differ after a model is live.

---

## 6. Consumer rules

| Consumer | Bind to | Must not |
|---|---|---|
| Simulator | Persist `eventId` + full `ScoreResponse` (or `scoring_unavailable` on timeout) | Gate `executeTool` on `elahScore` or `policyHook` |
| Analyst / SOC dashboard | `elahScore`, `status`, coordinates, explanation, `policyHook.recommendation` | Treat abstained scores as calibrated |
| Founder training view | Same fields; map onto `ElahTrainingEvent` until the envelope table exists | Expect `allow`/`deny` from ELAH |
| Bank policy engine (optional later) | `policyHook` + score as **inputs** to *its* config | Call ELAH the policy engine |

---

## 7. Cross-field validation (producer MUST, consumer SHOULD)

Apply after JSON parse. First failure invalidates the body.

1. `contractVersion === "1.0"`.
2. `status` ∈ { `scored`, `abstained` }.
3. `score.elahScore`, `confidence`, `uncertainty`, and all three coordinates ∈ `[0, 1]`.
4. O5 complementarity of confidence/uncertainty.
5. `intentLabel` ∈ the closed 22-value enum.
6. `explanation` has the three arrays; each signal within size limits; no forbidden arg-like PII patterns (`userId`, raw 8+ digit runs) inside signals or `summary`.
7. `policyHook.recommendation` ∈ the four-value enum.
8. No `additionalProperties` on envelope or nested objects.
9. `eventId` / `requestId` non-empty (echo integrity is the caller’s check).

A malformed **200** is a **producer defect**. Callers that already received 200 MUST NOT fail-open into a *second* score; they persist what they got and flag `score_invalid` for ops. They still follow **bank policy** for execution.

---

## 8. Accept examples (sample scored events)

Correlation ids match input-contract §8 / event-spec §8.

### 8.1 VALID — P0 external transfer, scored (core demo)

Pairs with input-contract sample 8.1 (`create_external_transfer`, policy `needs_confirmation`). Coordinates follow live defaults for `external_transfer`.

```json
{
  "contractVersion": "1.0",
  "requestId": "req_01JEXAMPLE_SCORE_001",
  "eventId": "evt_01JEXAMPLE000000000000001",
  "status": "scored",
  "scoredAt": "2026-08-17T07:12:04.310Z",
  "score": {
    "elahScore": 0.87,
    "confidence": 0.82,
    "uncertainty": 0.18,
    "intentLabel": "external_transfer",
    "coordinates": {
      "humanAgency": 0.72,
      "financialRisk": 0.78,
      "emotionalUrgency": 0.35
    },
    "explanation": {
      "matchedSignals": [
        "transfer_or_payment_verb",
        "amount_detected",
        "recipient_detected",
        "planned_tool:create_external_transfer",
        "banking_action_context"
      ],
      "weakSignals": [],
      "negativeSignals": [],
      "summary": "Planned external transfer of a medium amount to a named recipient; looks like genuine payment intent."
    },
    "policyHook": {
      "recommendation": "watch",
      "reasons": [
        "P0 money movement with financialRisk 0.78; bank confirmation already required."
      ]
    },
    "provenance": {
      "scorer": "rules_v0",
      "modelVersion": null,
      "labelSource": "rules_v0"
    }
  }
}
```

**Accept.** Simulator executes only after **bank** confirmation. High `elahScore` + `watch` is the intended demo: ELAH did not block; policy still confirmed.

### 8.2 VALID — prompt injection, scored low, no tool

Pairs with event-spec sample 8.3 / input-contract 8.2. Coordinates follow live defaults for `prompt_injection_or_policy_bypass`.

```json
{
  "contractVersion": "1.0",
  "requestId": "req_01JEXAMPLE_SCORE_002",
  "eventId": "evt_01JEXAMPLE000000000000003",
  "status": "scored",
  "scoredAt": "2026-08-17T07:14:11.002Z",
  "score": {
    "elahScore": 0.08,
    "confidence": 0.91,
    "uncertainty": 0.09,
    "intentLabel": "prompt_injection_or_policy_bypass",
    "coordinates": {
      "humanAgency": 0.15,
      "financialRisk": 0.92,
      "emotionalUrgency": 0.25
    },
    "explanation": {
      "matchedSignals": [],
      "weakSignals": [],
      "negativeSignals": [
        "ignore_previous_instructions",
        "policy_or_refusal_outcome"
      ],
      "summary": "Hostile instruction to override policy; not genuine banking intent."
    },
    "policyHook": {
      "recommendation": "review",
      "reasons": [
        "intentLabel is prompt_injection_or_policy_bypass"
      ]
    },
    "provenance": {
      "scorer": "intent_matrix",
      "modelVersion": null,
      "labelSource": "intent_matrix"
    }
  }
}
```

**Accept.** Caller MUST NOT execute a tool. Low score is **not** what blocked the tool; bank policy / injection guard did.

### 8.3 VALID — abstention (ambiguous short utterance)

```json
{
  "contractVersion": "1.0",
  "requestId": "req_01JEXAMPLE_SCORE_003",
  "eventId": "evt_01JEXAMPLE000000000000010",
  "status": "abstained",
  "scoredAt": "2026-08-17T07:20:00.000Z",
  "score": {
    "elahScore": 0.48,
    "confidence": 0.31,
    "uncertainty": 0.69,
    "intentLabel": "ambiguous_banking_request",
    "coordinates": {
      "humanAgency": 0.35,
      "financialRisk": 0.25,
      "emotionalUrgency": 0.3
    },
    "explanation": {
      "matchedSignals": ["transfer_or_payment_verb"],
      "weakSignals": ["short_message", "question_without_tool_plan"],
      "negativeSignals": [],
      "summary": "Payment verb without amount, recipient, or planned tool; score withheld as decisive."
    },
    "policyHook": {
      "recommendation": "review",
      "reasons": ["status is abstained"]
    },
    "provenance": {
      "scorer": "rules_v0",
      "modelVersion": null,
      "labelSource": "rules_v0"
    }
  }
}
```

**Accept.** Full `score` is present. Dashboards MUST badge abstention. Tool path still follows policy (likely no tool).

### 8.4 VALID — P0 statement download, scored, `none`

```json
{
  "contractVersion": "1.0",
  "requestId": "req_01JEXAMPLE_SCORE_004",
  "eventId": "evt_01JEXAMPLE000000000000004",
  "status": "scored",
  "scoredAt": "2026-08-17T07:22:40.100Z",
  "score": {
    "elahScore": 0.81,
    "confidence": 0.77,
    "uncertainty": 0.23,
    "intentLabel": "statement_download",
    "coordinates": {
      "humanAgency": 0.4,
      "financialRisk": 0.22,
      "emotionalUrgency": 0.18
    },
    "explanation": {
      "matchedSignals": [
        "banking_action_context",
        "planned_tool:get_monthly_statement"
      ],
      "weakSignals": [],
      "negativeSignals": []
    },
    "policyHook": {
      "recommendation": "none",
      "reasons": []
    },
    "provenance": {
      "scorer": "rules_v0",
      "modelVersion": null,
      "labelSource": "rules_v0"
    }
  }
}
```

**Accept.** `summary` omitted (optional). `reasons` empty with `none`.

---

## 9. Reject examples (invalid `ScoreResponse`)

These MUST NOT be emitted. Consumers that validate SHOULD reject them (`score_invalid`). They are **not** HTTP 4xx from `/v1/score` (that path already succeeded or failed on the **request**).

### 9.1 INVALID — `elahScore` out of range

`"elahScore": 1.4`

**Reject.** Range is `[0, 1]`.

### 9.2 INVALID — missing coordinates

`score` has `elahScore` but no `coordinates`.

**Reject.** All three axes required (O7).

### 9.3 INVALID — enforcement leaked onto the hook

```json
"policyHook": {
  "recommendation": "deny",
  "reasons": ["looks like fraud"]
}
```

**Reject.** `deny` is not in the enum. ELAH does not allow/block.

### 9.4 INVALID — chain-of-thought / extra property

```json
"explanation": {
  "matchedSignals": [],
  "weakSignals": [],
  "negativeSignals": [],
  "chainOfThought": "First I considered the amount..."
}
```

**Reject.** `additionalProperties` false; CoT is out of contract (O9).

### 9.5 INVALID — confidence / uncertainty mismatch

`"confidence": 0.9`, `"uncertainty": 0.9`

**Reject.** O5 requires `uncertainty ≈ 1 − confidence`.

### 9.6 INVALID — unknown intent

`"intentLabel": "crypto_trading"`

**Reject.** Not in the 22-value taxonomy.

### 9.7 INVALID — PII in explanation

`"summary": "Send 500 to Daniel Cohen, account 12345678"`

**Reject.** Explanation MUST be redacted (event-spec §6 class of identifiers).

### 9.8 INVALID — score field on the envelope

Top-level `"elahScore": 0.5` beside `score`.

**Reject.** O11; scores live only under `score`.

### 9.9 Summary

| Example | Result |
|---|---|
| 8.1 P0 transfer, high score, `watch` | **accept** |
| 8.2 Injection, low score, `review` | **accept** |
| 8.3 Abstention, full score still present | **accept** |
| 8.4 Statement download, `none` | **accept** |
| 9.1 Score > 1 | **reject** |
| 9.2 No coordinates | **reject** |
| 9.3 `deny` on policy hook | **reject** |
| 9.4 Chain-of-thought | **reject** |
| 9.5 Uncertainty not complementary | **reject** |
| 9.6 Unknown intent | **reject** |
| 9.7 PII in summary | **reject** |
| 9.8 Score on envelope | **reject** |

---

## 10. Security notes (output path)

- Do not echo `event.conversation.utterance` into `explanation.summary`.
- Logs of 200 bodies in production-like deploys SHOULD drop `summary` or hash it; `eventId` is enough to join.
- `policyHook` MUST NOT be forwarded to the **customer** assistant as an instruction (“the security system wants you to…”). It is an analyst/policy-engine field.

---

## 11. Out of scope for this document

- Request validation, auth, 250 ms fail-open (input contract).
- Numeric analyst bands and UI copy for **intention** (score-semantics task).
- Graph layout **overlays** (opacity, glyphs) — Phase 7 visual; axes themselves are `docs/Phase 0 - Product Definition/ELAH_COORDINATE_SYSTEM.md`.
- Per-tenant threshold config (threshold-config task).
- Model quality, latency SLOs, retention.

---

## 12. Related documents

| Document | Role |
|---|---|
| `docs/Phase 0 - Product Definition/ELAH_MVP_SCOPE.md` | Product fence; score direction; ELAH does not allow/block |
| `docs/Phase 0 - Product Definition/ELAH_EVENT_SCHEMA.md` | `ElahEvent` 1.0 (what was scored) |
| `docs/Phase 0 - Product Definition/ELAH_INPUT_CONTRACT.md` | `POST /v1/score` request; error codes |
| `docs/Phase 0 - Product Definition/openapi/elah-v1-score.yaml` | OpenAPI 3.1 request **and** this response |
| `docs/Phase 0 - Product Definition/ELAH_CONFIDENCE_SEMANTICS.md` | Confidence/uncertainty meaning, abstention, UI copy |
| `docs/Phase 0 - Product Definition/ELAH_COORDINATE_SYSTEM.md` | Intention-graph axes, mapping, sample plot |

---

## 13. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder | | | Approve / Approve with comments / Reject |
| Engineering | | | |
| Security | | | |

**Approval statement:** I agree that a successful `POST /v1/score` returns `ScoreResponse` contractVersion `1.0` with `elahScore`, complementary confidence/uncertainty, three coordinates, closed `intentLabel`, explanation signal lists, and a `policyHook` that never allow/denies; that abstention still includes a full `score`; and that sample §8 payloads are the acceptance tests for dashboards and the scoring service.

---

*End of document.*

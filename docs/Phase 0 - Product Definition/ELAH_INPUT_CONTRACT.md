# ELAH Input Contract — Pre-tool Scoring Request

| Field | Value |
|---|---|
| Document ID | ELAH-SPEC-INPUT-001 |
| Contract version | **1.0** |
| Status | Proposed for sign-off |
| Date | 17 August 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related roadmap task | `task-0-define-the-input-contract-for-elah` |
| Depends on | `ELAH-PRD-MVP-SCOPE-001`, `ELAH-SPEC-EVENT-001` (`ElahEvent` 1.0) |
| Machine-readable | `docs/Phase 0 - Product Definition/openapi/elah-v1-score.yaml` |
| Does not own | Score JSON semantics (`ELAH-SPEC-OUTPUT-001`); numeric latency SLOs (separate Phase 0 task) |

---

## 1. Purpose

This document is the **critical-path handoff** from the banking simulator (and its assistant) into ELAH.

ELAH scores **before tool execution**. Bank policy has already decided `allow`, `deny`, or `needs_confirmation`. The simulator then sends **one** scoring request. ELAH returns a score (output contract). ELAH **never** executes the tool and **never** overrides policy.

`ElahEvent` v1.0 is the **payload**. This contract is the **protocol**: URL, method, headers, wrapper fields, validation order, error codes, idempotency, and caller behaviour when ELAH is slow or down.

Without this, the Phase 3 scoring service cannot be implemented without guessing.

---

## 2. Plan executed

| Step | Result |
|---|---|
| 1. Bound the endpoint to pre-tool only | `POST /v1/score`, `mode` MUST be `pre_tool` |
| 2. Wrap `ElahEvent` | `ScoreRequest` = `contractVersion` + `requestId` + `mode` + `event` |
| 3. Auth and size | Bearer service token; body ≤ 32 KiB |
| 4. Validation pipeline | HTTP → wrapper → `ElahEvent` 1.0 → sanitization |
| 5. Fail-open | Timeout / 5xx → caller proceeds with policy only |
| 6. Examples | Accept §8; reject §9 |
| 7. OpenAPI | `docs/Phase 0 - Product Definition/openapi/elah-v1-score.yaml` |

---

## 3. Frozen decisions

| ID | Decision |
|---|---|
| I1 | One synchronous endpoint for the tool path: `POST /v1/score`. |
| I2 | Request body **is not** a raw `ElahEvent`. It is a `ScoreRequest` wrapper so correlation and mode cannot be confused with event fields. |
| I3 | `event` MUST be a valid `ElahEvent` with `schemaVersion: "1.0"`. |
| I4 | This endpoint accepts `executionState` of `pre_tool` **or** `no_tool` (injection / conversational refuse with no tool). `post_tool` is **rejected** here (training backfill is a later API). |
| I5 | `mode` MUST equal `pre_tool`. |
| I6 | Authentication: `Authorization: Bearer <service token>` issued to the simulator. No end-user cookie is sent to ELAH. |
| I7 | Idempotency key is `requestId` (header `Idempotency-Key` MAY duplicate it). Same `event.eventId` + `mode` + identical body returns the same result without double-charging model/rules. |
| I8 | On validation failure, HTTP 4xx with `ErrorResponse`. On success, HTTP 200 with `ScoreResponse` as specified in `ELAH-SPEC-OUTPUT-001`. |
| I9 | **Fail-open:** if the client timeout elapses or ELAH returns 5xx, the simulator MUST continue the tool path already authorised by **policy**. Record `scoring_unavailable`. Do not block the customer because ELAH was down. |
| I10 | Client handshake timeout for v1: **250 ms** wait, then fail-open. The latency-targets task may tighten p50/p95; it MUST NOT raise this ceiling without a contract revision. |
| I11 | Strict JSON: unknown top-level properties on `ScoreRequest` are rejected. |
| I12 | ELAH does not receive raw `userId`. Hashing is the caller’s job before the request is built. |

---

## 4. Sequence (normative)

```
User utterance
    → assistant plans tool
    → bank policy: deny | needs_confirmation | allow
    → (if confirm) user confirms
    → build ElahEvent (executionState: pre_tool | no_tool)
    → POST /v1/score   ← this contract
    → ScoreResponse or timeout/error
    → if policy allow/confirmed: executeTool
    → store event id + score (or scoring_unavailable)
```

Policy deny / prompt-injection: still `POST /v1/score` with `outcome: refused|blocked` and `executionState: no_tool`, then **do not** execute.

UI P2 actions MAY call the same endpoint with `source: "ui"` and `executionState: "no_tool"` when the product chooses to score them. MVP P0 does not require UI scoring (scope D2); the contract still accepts a valid payload.

---

## 5. HTTP

| Item | Value |
|---|---|
| Method | `POST` |
| Path | `/v1/score` |
| Content-Type | `application/json; charset=utf-8` |
| Accept | `application/json` |
| Max body | **32768** bytes (32 KiB). Larger → `413` |
| Timeout (caller) | **250 ms** then fail-open |

### 5.1 Headers

| Header | Required | Meaning |
|---|---|---|
| `Authorization` | **yes** | `Bearer` + service token shared with the simulator. |
| `Content-Type` | **yes** | Must be JSON. |
| `Idempotency-Key` | no | If present, MUST equal `requestId` in the body. |
| `X-Elah-App-Id` | no | If present, MUST equal `event.appId`. Mismatch → `422`. |

Missing or invalid `Authorization` → `401`. Token valid but not allowed to score for `event.appId` → `403`.

### 5.2 `ScoreRequest` body

| Field | Type | Req | Rules |
|---|---|---|---|
| `contractVersion` | string | **yes** | Must be `"1.0"`. Unknown → `422` `unsupported_contract_version`. |
| `requestId` | string | **yes** | Non-empty, max 128 chars, unique per attempt. Correlation id for logs. Distinct from `event.eventId`. |
| `mode` | string | **yes** | Must be `"pre_tool"`. Any other value → `422` `unsupported_mode`. |
| `event` | object | **yes** | Full `ElahEvent` 1.0 (ELAH-SPEC-EVENT-001). |

No other top-level keys.

### 5.3 Cross-field rules (after JSON parse)

Apply **in this order**. First failure wins.

1. `contractVersion === "1.0"`.
2. `mode === "pre_tool"`.
3. `event` validates as `ElahEvent` 1.0 (types, enums, required fields, `additionalProperties` false on the event).
4. Sanitization rules in event spec §6 (forbidden arg keys, redaction). Failure → `422` `sanitization_failed`.
5. `event.executionState` ∈ { `pre_tool`, `no_tool` }. `post_tool` → `422` `wrong_execution_state`.
6. If `event.source === "agent"` and `event.action.toolName != null`: `policy` and `conversation` required (already in event spec).
7. If `X-Elah-App-Id` present: equals `event.appId`.
8. If `Idempotency-Key` present: equals `requestId`.

P0 tools (`create_internal_transfer`, `create_external_transfer`, `pay_bill`, `freeze_card`, `unfreeze_card`, `get_monthly_statement`) SHOULD be sent with `executionState: "pre_tool"` except when the tool was never going to run (`prompt_injection` / policy deny → `no_tool`).

---

## 6. Responses

### 6.1 `200 OK` — `ScoreResponse`

Full field meanings: **ELAH-SPEC-OUTPUT-001** (`docs/Phase 0 - Product Definition/ELAH_OUTPUT_CONTRACT.md`). v1 success body MUST include:

| Field | Type | Req | Note |
|---|---|---|---|
| `contractVersion` | string | **yes** | `"1.0"` |
| `requestId` | string | **yes** | Echo. |
| `eventId` | string | **yes** | Echo `event.eventId`. |
| `status` | string | **yes** | `scored` \| `abstained` |
| `scoredAt` | string | **yes** | ISO-8601 UTC. |
| `score` | object | **yes** | `ElahScore`: `elahScore`, `confidence`, `uncertainty`, `intentLabel`, `coordinates`, `explanation`, `policyHook`, `provenance`. |

Unknown top-level keys on `ScoreResponse` are rejected by consumers (output spec O11). This input spec does not re-validate the score object on the request path.

### 6.2 Error — `ErrorResponse`

HTTP 4xx/5xx body:

| Field | Type | Req |
|---|---|---|
| `contractVersion` | string | yes (`"1.0"`) |
| `requestId` | string \| null | yes (echo if parsed) |
| `error` | object | yes |
| `error.code` | string | yes (closed enum below) |
| `error.message` | string | yes (safe for logs; no PII) |
| `error.details` | array of `{ path, reason }` | no |

### 6.3 Error codes

| HTTP | `error.code` | When |
|---|---|---|
| 400 | `invalid_json` | Body is not JSON. |
| 400 | `additional_properties` | Unknown top-level key. |
| 400 | `missing_field` | Wrapper field missing. |
| 401 | `unauthorized` | Missing/invalid bearer. |
| 403 | `forbidden_app` | Token cannot score this `appId`. |
| 409 | `idempotency_conflict` | Same `requestId`, different body. |
| 413 | `payload_too_large` | Body > 32 KiB. |
| 422 | `unsupported_contract_version` | `contractVersion` ≠ `1.0`. |
| 422 | `unsupported_mode` | `mode` ≠ `pre_tool`. |
| 422 | `event_schema_violation` | `event` fails `ElahEvent` 1.0. |
| 422 | `sanitization_failed` | Forbidden keys or unredacted PII in `event.action.args`. |
| 422 | `wrong_execution_state` | `post_tool` (or other) on this endpoint. |
| 422 | `app_id_mismatch` | Header vs `event.appId`. |
| 429 | `rate_limited` | Optional in MVP; reserved. |
| 500 | `internal_error` | Unexpected. Caller fail-open. |
| 503 | `unavailable` | Caller fail-open. |

`401`/`403`/`409`/`422`/`413` are **not** fail-open for *retries of a bad payload*. The caller MUST NOT execute a tool **because of** a 401 (misconfiguration). Fail-open applies to **timeout, 500, 503** after a request that was well-formed — so a broken ELAH does not freeze banking. A **422** means the simulator produced a bad event; fix the producer; do not pretend it was scored.

---

## 7. Idempotency

- Primary key for “same scoring unit”: `event.eventId` + `mode`.
- `requestId` identifies a single HTTP attempt.
- Replay of the **same** `requestId` with the **same** body → `200` with the original `ScoreResponse` (no re-score required).
- Same `requestId`, different body → `409` `idempotency_conflict`.
- New `requestId`, same `event.eventId` + `mode` → `200` with the original score (idempotent at event level).

---

## 8. Accept examples

### 8.1 VALID — P0 external transfer, pre-tool (core demo)

`POST /v1/score`

```
Authorization: Bearer <simulator-service-token>
Content-Type: application/json
Idempotency-Key: req_01JEXAMPLE_SCORE_001
```

```json
{
  "contractVersion": "1.0",
  "requestId": "req_01JEXAMPLE_SCORE_001",
  "mode": "pre_tool",
  "event": {
    "schemaVersion": "1.0",
    "eventId": "evt_01JEXAMPLE000000000000001",
    "occurredAt": "2026-08-17T07:12:04.120Z",
    "appId": "elah-banking-demo",
    "source": "agent",
    "actionType": "external_transfer",
    "outcome": "pending_confirmation",
    "executionState": "pre_tool",
    "actor": {
      "userIdHash": "a1b2c3d4e5f60718293a4b5c6d7e8f90",
      "sessionId": "clxsessionexample0001",
      "actorType": "customer",
      "role": "premium_customer",
      "customerTier": "premium"
    },
    "client": {
      "ipAddress": "203.0.113.10",
      "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)"
    },
    "action": {
      "toolName": "create_external_transfer",
      "page": "/assistant",
      "args": {
        "recipientName": "[recipient_redacted]",
        "amount": 500,
        "note": "rent"
      },
      "amount": 500,
      "currency": "ILS",
      "amountBucket": "medium_500_1999",
      "accountContext": "checking",
      "recipientType": "person_name"
    },
    "policy": {
      "decision": "needs_confirmation",
      "reasons": ["tool 'create_external_transfer' requires explicit user confirmation"],
      "confirmationRequired": true
    },
    "conversation": {
      "conversationId": "clxconvexample0001",
      "messageId": "clxmsgexample0001",
      "utterance": "Send 500 shekels to Daniel"
    },
    "mfaStatus": "unknown",
    "detectedIntent": "external_transfer"
  }
}
```

**Accept** → `200`. Caller then runs the tool if confirmation is complete. ELAH’s score does not gate execution.

Canonical `200` body: output-contract sample 8.1 (full `ElahScore`).

### 8.2 VALID — injection refuse, no tool

Same headers; `event` as event-spec sample 8.3 (`actionType: prompt_injection`, `executionState: no_tool`, `toolName: null`). Wrapper:

```json
{
  "contractVersion": "1.0",
  "requestId": "req_01JEXAMPLE_SCORE_002",
  "mode": "pre_tool",
  "event": { }
}
```

(`event` MUST be the full valid object from ELAH-SPEC-EVENT-001 §8.3.)

**Accept** → `200`. Caller MUST NOT execute a tool.

---

## 9. Reject examples

### 9.1 INVALID — no authorization

Omit `Authorization`.

**Reject** → `401` `unauthorized`. Do not fail-open into tool execution solely because of this; it is a deployment error. (Ops may still use a documented break-glass; that is not default.)

```json
{
  "contractVersion": "1.0",
  "requestId": null,
  "error": {
    "code": "unauthorized",
    "message": "Missing or invalid bearer token."
  }
}
```

### 9.2 INVALID — `post_tool` on the pre-tool endpoint

Valid wrapper and event except `"executionState": "post_tool"`.

**Reject** → `422` `wrong_execution_state`.

### 9.3 INVALID — `mode` not `pre_tool`

`"mode": "batch_train"`

**Reject** → `422` `unsupported_mode`.

### 9.4 INVALID — event missing `source` (event schema)

Body otherwise like §8.1 with `source` omitted inside `event`.

**Reject** → `422` `event_schema_violation`. `error.details[0].path` = `event.source`.

### 9.5 INVALID — unsanitized PII in `event.action.args`

`args.userId` and raw `recipientName` as in event-spec §8.7.

**Reject** → `422` `sanitization_failed`.

### 9.6 INVALID — extra wrapper field

```json
{
  "contractVersion": "1.0",
  "requestId": "req_bad",
  "mode": "pre_tool",
  "event": {},
  "elahScore": 0.5
}
```

**Reject** → `400` `additional_properties` (score does not belong on the request).

### 9.7 INVALID — oversized body

Body > 32768 bytes.

**Reject** → `413` `payload_too_large`.

### 9.8 Caller timeout (not an ELAH JSON reject)

No response within 250 ms.

**Caller MUST** treat as `scoring_unavailable`, proceed according to **policy already decided**, and persist the `ElahEvent` without a score. This is a pass condition for the *simulator*, not a 2xx from ELAH.

### 9.9 Summary

| Example | Result |
|---|---|
| 8.1 P0 transfer pre-tool | **accept** `200` |
| 8.2 Injection, no tool | **accept** `200` |
| 9.1 No bearer | **reject** `401` |
| 9.2 `post_tool` | **reject** `422` |
| 9.3 Bad `mode` | **reject** `422` |
| 9.4 Invalid `ElahEvent` | **reject** `422` |
| 9.5 PII in args | **reject** `422` |
| 9.6 Score on request | **reject** `400` |
| 9.7 Oversize | **reject** `413` |
| 9.8 Timeout | **caller fail-open** |

---

## 10. Security notes (input path)

- Treat `event.conversation.utterance` and `event.action.args` as **untrusted**. They may contain injection text; that is expected for `prompt_injection` events.
- Do not log raw utterances at info level in production-like deploys; hash/`eventId` is enough for correlation.
- TLS for the scoring host is required outside local development.
- The service token is a **secret**. It is not the founder-platform login cookie and not the banking session cookie.

---

## 11. Out of scope for this document

- Model, rules engine, or explainability quality.
- Batch/backfill APIs.
- Public internet exposure of `/v1/score`.
- Raising the 250 ms ceiling.

---

## 12. Related documents

| Document | Role |
|---|---|
| `docs/Phase 0 - Product Definition/ELAH_MVP_SCOPE.md` | Product fence; P0 tools; ELAH does not allow/block |
| `docs/Phase 0 - Product Definition/ELAH_EVENT_SCHEMA.md` | `ElahEvent` 1.0 |
| `docs/Phase 0 - Product Definition/openapi/elah-v1-score.yaml` | OpenAPI 3.1 for request and response |
| `docs/Phase 0 - Product Definition/ELAH_OUTPUT_CONTRACT.md` | `ScoreResponse` / `ElahScore` 1.0 |

---

## 13. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder | | | Approve / Approve with comments / Reject |
| Engineering | | | |
| Security | | | |

**Approval statement:** I agree that the simulator calls `POST /v1/score` with `ScoreRequest` contractVersion `1.0` wrapping `ElahEvent` 1.0 before tool execution; that validation failures are 4xx as specified; and that timeout/5xx fail open so ELAH outage cannot replace bank policy.

---

*End of document.*

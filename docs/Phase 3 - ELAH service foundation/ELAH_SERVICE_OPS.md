# ELAH Service Operations

| Field | Value |
|---|---|
| Document ID | ELAH-SVC-OPS-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 25 August 2026 |
| Related tasks | health, auth, validation, logging, latency |
| Depends on | `ELAH-SPEC-INPUT-001`, `ELAH-SPEC-LATENCY-001`, `ELAH-SVC-001` |
| Code | `app/v1/*`, `lib/elah/service/*` (live paths as implemented in this phase) |

**Product freeze (unchanged):** ELAH scores genuine banking intent. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Ops must not turn a score into a gate.

---

## 1. Health

| Check | Behaviour |
|---|---|
| `GET /v1/health` | Process up; scorer module loadable. Does not query Neon as a hard dependency on the request path |
| Failure | HTTP 503 `ErrorResponse` `unavailable` — callers of `/v1/score` already fail-open on 503 |
| Customer cookies | Ignored / unused |

Do not use health as a scoring probe (no `ElahEvent` body).

---

## 2. Auth

| Item | Rule |
|---|---|
| Header | `Authorization: Bearer <ELAH_SERVICE_TOKEN>` |
| `/v1/score` | Missing / wrong token → `401` `unauthorized` |
| Token vs `appId` | Token not allowed for `event.appId` → `403` `forbidden_app` |
| Customer JWT / session | **Never** accepted as score auth |
| Browser | Must not call `/v1/score` |

`401` is **misconfiguration**, not fail-open. See fallback matrix in `ELAH-SVC-WIRE-001`.

---

## 3. Validation order (`POST /v1/score`)

Apply **in this order**. First failure wins. Source of truth: input-contract §5.3.

1. HTTP: method, `Content-Type`, body ≤ 32 KiB (`413` `payload_too_large`).
2. Bearer token (`401` / `403`).
3. JSON parse (`400` `invalid_json`).
4. Wrapper: no extra top-level keys (`400` `additional_properties`); required fields (`400` `missing_field`).
5. `contractVersion === "1.0"` (`422` `unsupported_contract_version`).
6. `mode === "pre_tool"` (`422` `unsupported_mode`).
7. `event` as `ElahEvent` 1.0 (`422` `event_schema_violation`).
8. Sanitization (`422` `sanitization_failed`).
9. `executionState` ∈ { `pre_tool`, `no_tool` } (`422` `wrong_execution_state`).
10. Optional `X-Elah-App-Id` / `Idempotency-Key` cross-checks.

Then score (`rules_v0`). Do not score a body that already failed.

---

## 4. `ErrorResponse`

Shape and codes: input-contract §6.2–6.3. Do not invent codes.

| HTTP | Caller meaning (ops) |
|---|---|
| 4xx (except 429) | Producer / config defect. Do **not** persist a fake `ElahScore` |
| 401 | Token missing or wrong. Stop and fix env |
| 500 / 503 | Service defect / down. Fail-open on the bank path |
| 429 | Reserved; optional in MVP |

`error.message` is log-safe. No PII.

---

## 5. Logging (no PII)

| May log | Must not log |
|---|---|
| `requestId`, `eventId`, `appId`, HTTP status, `error.code` | Raw utterance, `userId`, email, account numbers, card ids |
| `elah_score_ms` (latency) | `Authorization` header, token |
| `status` (`scored` / `abstained`), `provenance.scorer` | Full `ElahEvent.action.args` |
| `eventType` of the persisted hop (`elah_scored` / `elah_scoring_unavailable`) | `elahScore` on **customer-facing** logs |

---

## 6. Correlation

| Id | Role |
|---|---|
| `requestId` | One HTTP attempt. Echo on `ScoreResponse` / `ErrorResponse` |
| `eventId` | Scoring unit. Same as `ElahEvent.eventId` / `AuditLog.eventId` |
| `Idempotency-Key` | If present, MUST equal `requestId` |

Analyst viewer loads the snapshot by `eventId` from `AgentEventLog` (`lib/elah/score-read.ts`).

---

## 7. Latency

Client handshake: **250 ms** then fail-open (input-contract I10). Server budget: latency spec — p50 ≤ 80 ms, p95 ≤ 200 ms, p99 ≤ 240 ms on `rules_v0`. Log `elah_score_ms` on every `POST /v1/score`. Persist training rows **off** the critical path.

---

## 8. Sign-off

I agree ops for `/v1/score` are Bearer `ELAH_SERVICE_TOKEN`, Phase 0 validation order and `ErrorResponse`, PII-free logs keyed by `requestId`/`eventId`, and a 250 ms fail-open ceiling.

---

*End of document.*

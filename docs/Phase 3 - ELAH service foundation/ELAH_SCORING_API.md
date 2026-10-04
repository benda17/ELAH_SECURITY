# ELAH Scoring API (implement-to-contract)

| Field | Value |
|---|---|
| Document ID | ELAH-SVC-API-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 25 August 2026 |
| Related task | `task-3-define-the-scoring-api` |
| Depends on | `ELAH-SPEC-INPUT-001`, `ELAH-SPEC-OUTPUT-001`, `ELAH-SPEC-EVENT-001` |
| Does not redefine | Request wrapper, `ElahEvent`, `ScoreResponse`, error codes, fail-open |
| Code | `app/v1/score/route.ts`, `lib/elah/service/*` (live paths as implemented in this phase) |

**Product freeze (unchanged):** ELAH scores genuine banking intent. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.**

This document is the **implementation pointer**. It does **not** duplicate Phase 0.

---

## 1. Contracts to implement (link, do not copy)

| Concern | Spec | Path |
|---|---|---|
| HTTP wrapper, auth, validation order, `ErrorResponse`, 250 ms fail-open | ELAH-SPEC-INPUT-001 | [`docs/Phase 0 - Product Definition/ELAH_INPUT_CONTRACT.md`](../Phase%200%20-%20Product%20Definition/ELAH_INPUT_CONTRACT.md) |
| `ScoreResponse` / `ElahScore`, abstain, `policyHook`, provenance | ELAH-SPEC-OUTPUT-001 | [`docs/Phase 0 - Product Definition/ELAH_OUTPUT_CONTRACT.md`](../Phase%200%20-%20Product%20Definition/ELAH_OUTPUT_CONTRACT.md) |
| Envelope body (`event`) | ELAH-SPEC-EVENT-001 | [`docs/Phase 0 - Product Definition/ELAH_EVENT_SCHEMA.md`](../Phase%200%20-%20Product%20Definition/ELAH_EVENT_SCHEMA.md) |
| Machine-readable | OpenAPI 3.1 | [`docs/Phase 0 - Product Definition/openapi/elah-v1-score.yaml`](../Phase%200%20-%20Product%20Definition/openapi/elah-v1-score.yaml) |

If this file and Phase 0 disagree, **Phase 0 wins**. Change the contract in Phase 0, then implement.

---

## 2. Paths this phase serves

| Method | Path | Request | Success |
|---|---|---|---|
| `POST` | `/v1/score` | `ScoreRequest` 1.0 + Bearer | `200` `ScoreResponse` 1.0 |
| `GET` | `/v1/health` | none | liveness (`ELAH-SVC-001` §6) |
| `GET` | `/v1/version` | none | contract + scorer id (`ELAH-SVC-001` §6) |

`POST /v1/score` is the only scoring endpoint. `mode` MUST be `pre_tool`. `post_tool` is rejected (`wrong_execution_state`).

Health and version are **not** in the Phase 0 OpenAPI file; they are ops surfaces defined here and in `ELAH-SVC-OPS-001`. Do not add them to the score YAML unless Phase 0 is revised.

---

## 3. Implementer checklist (no new semantics)

1. Validate in the **order** in input-contract §5.3. First failure wins.
2. Return `ErrorResponse` codes exactly as input-contract §6.3.
3. On `200`, return a full `score` object even when `status` is `abstained`.
4. `policyHook.recommendation` ∈ { `none`, `watch`, `review`, `step_up_hint` }. Never `allow` / `deny` / `block` / `confirm`.
5. Do not put `elahScore` on the request `event` or on stored `ElahEvent` envelopes.
6. Idempotency: `requestId` + `event.eventId` + `mode` as input-contract §7.

---

## 4. Sign-off

I agree Phase 3 implements `POST /v1/score`, `GET /v1/health`, and `GET /v1/version` to the Phase 0 contracts without forking field names or error codes.

---

*End of document.*

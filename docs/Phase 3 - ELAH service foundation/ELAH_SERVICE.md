# ELAH Service (logical scoring component)

| Field | Value |
|---|---|
| Document ID | ELAH-SVC-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 25 August 2026 |
| Related tasks | service foundation, extract readiness, health/version |
| Depends on | `ELAH-ARCH-OWN-001`, `ELAH-ARCH-001`, `ELAH-SPEC-INPUT-001`, `ELAH-SPEC-OUTPUT-001` |
| Code | `lib/elah/service/*`, `app/v1/*` (live paths as implemented in this phase) |

**Product freeze (unchanged):** ELAH scores genuine banking intent. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** This service has **no** `executeTool`. Scores are not fields of `ElahEvent`.

---

## 1. Purpose

Freeze the **logical** ELAH scoring service as a separate component from the banking simulator, even when both run in one Next.js 14 deploy. Phase 3 implements `POST /v1/score` (and health/version) behind that boundary.

---

## 2. ADR — TypeScript / Next.js 14 colocation

| Option | Decision |
|---|---|
| Language / runtime | **TypeScript** on the banking app’s Node runtime |
| HTTP surface | Next.js 14 App Router route handlers under `app/v1/` |
| Why not a new repo in MVP | One Vercel project, one OpenAPI contract, one Bearer token. Ownership table already allows colocation (`ELAH-ARCH-OWN-001`) |
| Why still a “service” | No shared `executeTool`, no customer JWT, no ledger writes. Extract is a move of `lib/elah/service` + `app/v1`, not a rewrite of policy |

Rejected for MVP: Python microservice, GPU runtime, public internet `/v1/score`.

---

## 3. Package layout (intended live paths)

| Path | Owns |
|---|---|
| `lib/elah/service/` | Scorer internals: request validate, `rules_v0`, `ScoreResponse` / `ErrorResponse` builders, health/version payloads |
| `lib/elah/service/index.ts` | Public service entry (score / health / version) |
| `app/v1/score/route.ts` | `POST /v1/score` |
| `app/v1/health/route.ts` | `GET /v1/health` |
| `app/v1/version/route.ts` | `GET /v1/version` |
| `lib/elah/client.ts` | Simulator HTTP **or** in-process client (250 ms, Bearer). Banking-owned |
| `tests/elah/` | Contract + mock + client tests |

Live export names follow the implementations in those files (this phase). Do not import `lib/elah/service` from `lib/agent/tools` or `executeTool`.

---

## 4. Trust boundary

```
Browser ↛ /v1/score
Customer session cookie ↛ /v1/score
lib/agent/policy.ts  → allow | deny | needs_confirmation
lib/elah/client.ts   → POST /v1/score  (or in-process)
lib/elah/service     → ScoreResponse | ErrorResponse
lib/agent/tools      → executeTool     (bank only; ELAH never calls it)
```

| May | Must not |
|---|---|
| Read a sanitized `ElahEvent` | Call `executeTool` |
| Return `policyHook` (`none` / `watch` / `review` / `step_up_hint`) | Emit `allow` / `deny` / `block` / `confirm` / `execute` |
| Abstain (`status: abstained`) | Cancel a tool because the score is low |
| Log `requestId` / `eventId` | Log utterance, `userId`, account numbers, passwords |

---

## 5. Extract triggers (unchanged from ELAH-ARCH-OWN-001)

Move to a **separate** ELAH deploy when: (a) a second bank client appears, or (b) scoring load threatens the banking app’s p95, or (c) a different runtime is required (GPU). Until then, colocation is allowed.

Extract checklist: keep OpenAPI paths, Bearer `ELAH_SERVICE_TOKEN`, 250 ms client timeout, fail-open matrix (`ELAH-SVC-WIRE-001`). Set `ELAH_SERVICE_URL` on the bank.

---

## 6. Health and version

| Path | Auth | Body (minimum) |
|---|---|---|
| `GET /v1/health` | Optional Bearer in MVP; must not require a customer cookie | `{ status: "ok", scorer: "rules_v0" }` |
| `GET /v1/version` | Same | `{ contractVersion: "1.0", scorer: "rules_v0", service: "elah-score" }` |

These endpoints do not score and do not touch the ledger.

---

## 7. Sign-off

I agree ELAH is a separate logical service colocated in Next.js 14 for MVP; that `/v1/score` is Phase 3; that the service cannot execute tools; and that extract follows ELAH-ARCH-OWN-001.

---

*End of document.*

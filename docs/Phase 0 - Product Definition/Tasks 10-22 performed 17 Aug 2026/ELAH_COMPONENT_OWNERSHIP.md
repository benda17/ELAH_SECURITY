# ELAH Component Ownership

| Field | Value |
|---|---|
| Document ID | ELAH-ARCH-OWN-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 17 August 2026 |
| Related tasks | `task-0-decide-which-components-belong-in-the-current-ne` · `task-0-decide-which-components-belong-in-the-separate-e` |

---

## 1. Purpose

One table for **both** ownership tasks: what stays in the **banking Next.js app**, and what belongs in the **ELAH scoring service** (even if they share a deploy today).

---

## 2. Decision

MVP **may** colocate the scorer in the banking Vercel project as `/v1/score` **as long as** the OpenAPI contract, service auth, and fail-open client are respected. The **logical** split below is frozen so we can extract the service without rewriting the bank.

---

## 3. Ownership table

| Component | Banking Next.js | ELAH service | Notes |
|---|---|---|---|
| Login, accounts, ledger, UI | **Yes** | No | Simulator |
| Agent / tool planner | **Yes** | No | |
| Policy allow/deny/confirm | **Yes** | No | `lib/agent/policy.ts` |
| Confirmation UX | **Yes** | No | |
| `ElahEvent` builder | **Yes** | No | Must match schema |
| HTTP client to `/v1/score` | **Yes** | No | 250 ms timeout |
| `executeTool` | **Yes** | **Never** | |
| AuthN of customers | **Yes** | No | |
| `POST /v1/score` handler | Optional colocate | **Yes** (logical) | Bearer service token |
| Schema validation of `ScoreRequest` | — | **Yes** | |
| `rules_v0` / future model | — | **Yes** | |
| `ElahScore` + abstain | — | **Yes** | |
| Coordinate mapping | — | **Yes** | |
| Explanation signals | — | **Yes** | |
| Training-row emit | Bank may enqueue | **Yes** (write path) | Async OK |
| Founder Kanban / Content Engine | No | No | **Founder platform** (third system) |
| Analyst event UI | **Yes** (simulator) | No | May later move to founder |

---

## 4. Extract trigger

Move to a **separate** ELAH deploy when: (a) a second bank client appears, or (b) scoring load threatens the banking app’s p95, or (c) we need a different runtime (GPU). Until then, colocation is allowed.

---

## 5. Sign-off

I agree the bank owns policy and execution; ELAH owns scoring; founder owns roadmap/training ops; colocation is an implementation detail.

---

*End of document.*

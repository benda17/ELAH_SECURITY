# Phase 3 — Executive summary

| Field | Value |
|---|---|
| Date | 25 August 2026 |
| Audience | Founder |
| Status | 24 of 25 cards **Done**. 1 card **Blocked** on a Vercel secret. |
| Evidence | Banking repo live code + `npx vitest run tests/elah` (and envelope/quality) **91 passed** |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before** tool execution. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are not fields of `ElahEvent`. Jane never sees `elahScore`.

---

## What shipped

The banking simulator now has a **logical ELAH scoring service** on the same Next.js deploy (Phase 0 ownership: colocate until a second client, GPU, or p95 pressure).

| Surface | Live path |
|---|---|
| Score | `POST /v1/score` — `handleScore` in `lib/elah/service` |
| Health / version | `GET /v1/health`, `GET /v1/version` |
| Mock model | `rules_v0` (deterministic table, not trained) |
| Simulator client | `lib/elah/client.ts` — 250 ms fail-open; in-process when `ELAH_SERVICE_URL` is unset |
| Persistence | `AgentEventLog` `elah_scored` / `elah_scoring_unavailable` metadata |
| Analyst UI | `/admin/elah-events/[eventId]` score card (`security.admin`) |

Sequence: utterance → plan → **bank policy** → **ELAH score** → `executeTool` only if policy already allows or the user confirmed. A low score does **not** deny a policy-allow tool. Timeout / 5xx → `scoring_unavailable`, banking continues.

## Demo (after local token is set)

1. `ELAH_SERVICE_TOKEN` in `.env` (any long local string; tests use a fixture).
2. Sign in as Jane `basic.customer@elah.demo` / `DemoPass123!` → `/assistant`.
3. Transfer path: confirm still comes from **bank policy**; then a score is stored.
4. Injection path: refused, scored ~**0.08**, **no** tool execution.
5. Sign in as `security.admin@elah.demo` / `DemoPass123!` → `/admin/elah-events` → open the event → **ELAH score (rules_v0)** card.

Customer UI still does not show the number.

## What needs you

**Blocked:** `task-3-add-production-configuration`.

Paste `ELAH_SERVICE_TOKEN` on the **Banking** Vercel project (not the founder platform):

1. Open the Banking Vercel project → **Settings → Environment Variables**.
2. Add `ELAH_SERVICE_TOKEN` = a long random string (`openssl rand -base64 48`).
3. Check **Production** and **Preview**.
4. Leave `ELAH_SERVICE_URL` **unset** (in-process colocation).
5. Optional: `ELAH_SCORE_TIMEOUT_MS=250`.
6. Redeploy.

Until that token is set on Vercel, production assistant turns fail-open (`scoring_unavailable`) and still follow policy. Local/dev and CI already have a fixture token.

Do **not** `prisma db push` from this work. Do **not** extract to a second Vercel project unless you later hit the extract triggers in `ELAH_SERVICE.md`.

## Kanban

| Count | Status |
|---:|---|
| 24 | Done |
| 1 | Blocked (production token) |
| 0 | Backlog / in progress |

Docs pack: `docs/Phase 3 - ELAH service foundation/` (copied to the founder repo as well).

---

*End of document.*

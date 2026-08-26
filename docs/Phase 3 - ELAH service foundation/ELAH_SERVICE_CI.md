# ELAH Service CI

| Field | Value |
|---|---|
| Document ID | ELAH-SVC-CI-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 25 August 2026 |
| Related tasks | GitHub Actions, `tests/elah` |
| Depends on | `ELAH-SVC-API-001`, `ELAH-SVC-MOCK-001` |
| Code | `tests/elah/`, `.github/workflows/` (live paths as implemented in this phase) |

**Product freeze (unchanged):** ELAH scores genuine banking intent. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** CI must not `prisma db push` against production Neon.

---

## 1. Purpose

Every change to the scoring service, client, or mock rules runs the Phase 3 vitest suite before merge.

---

## 2. Test tree

| Path | Covers |
|---|---|
| `tests/elah/` | Service contract, `rules_v0` fixtures, client timeout/fail-open, score-snapshot reader |
| `tests/elah/score-read.test.ts` | Admin viewer parser: `elah_scored` / `elah_scoring_unavailable` metadata; envelope still strips `elahScore` |
| `tests/events/` | Envelope / quality (Phase 2). Still required; scores must not leak onto `ElahEvent` |

Run locally:

```
npx vitest run tests/elah
npm test
```

`tests/setup.ts` supplies `ELAH_SERVICE_TOKEN=test-elah-service-token`. Setup may `prisma db push` against the **local** test database only; skip if the DB is unreachable. Never push to production.

---

## 3. GitHub Actions

Intended workflow (live path as implemented in this phase): `.github/workflows/ci.yml` (or `elah-service.yml` beside it).

| Step | Command / rule |
|---|---|
| Checkout | Banking repo |
| Node | Version matching the app (18+ / 20) |
| Install | `npm ci` |
| Generate client | `npx prisma generate` — **not** `prisma db push` |
| Phase 3 tests | `npx vitest run tests/elah` |
| Full unit suite | `npm test` when secrets/DB allow; `tests/elah` must pass even if Neon is absent (mock Prisma / skip DB) |

Do not deploy from this workflow as a side effect of a failing score test. Do not print `ELAH_SERVICE_TOKEN`.

---

## 4. Acceptance

CI is red if:

- `POST /v1/score` accepts `elahScore` on the request event (extra property).
- `policyHook` emits `allow` / `deny` / `block` / `confirm`.
- Fixture table in `ELAH-SVC-MOCK-001` drifts without a test update.
- `envelopeForDisplay` leaks `elahScore`.

---

## 5. Sign-off

I agree Phase 3 CI is GitHub Actions running vitest under `tests/elah`, with no production `prisma db push` and no score-as-policy assertions.

---

*End of document.*

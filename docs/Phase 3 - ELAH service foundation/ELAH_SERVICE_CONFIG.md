# ELAH Service Configuration

| Field | Value |
|---|---|
| Document ID | ELAH-SVC-CFG-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 25 August 2026 |
| Related tasks | local run, test token, Vercel env |
| Depends on | `ELAH-ARCH-OWN-001`, `ELAH-SVC-001` |
| Code | `lib/elah/client.ts`, `tests/setup.ts`, `deploy/vercel-banking.env` (live paths as implemented in this phase) |

**Product freeze (unchanged):** ELAH scores genuine banking intent. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Config must not introduce a score gate.

---

## 1. Environment variables

| Variable | Required | Meaning |
|---|---|---|
| `ELAH_SERVICE_TOKEN` | **yes** for `POST /v1/score` | Bearer token shared by simulator client and `/v1` routes |
| `ELAH_SERVICE_URL` | no | Base URL of a **remote** ELAH service. **Unset = in-process** colocated scorer in this Next.js app |
| `ELAH_SCORE_TIMEOUT_MS` | no | Client abort. Default **250**. Must not exceed 250 without a contract revision |

Do not commit live tokens. Founder pastes `ELAH_SERVICE_TOKEN` into the **Banking** Vercel project.

---

## 2. Local (in-process when URL unset)

| Mode | When | Behaviour |
|---|---|---|
| In-process | `ELAH_SERVICE_URL` empty | `lib/elah/client.ts` calls `lib/elah/service` in the same Node process. Still validates Bearer. Still 250 ms budget |
| Remote HTTP | `ELAH_SERVICE_URL` set | `POST {ELAH_SERVICE_URL}/v1/score` with Bearer. Same fail-open matrix |

Local `npm run dev` uses in-process unless the URL is set. Postgres remains `docker-compose.yml` (`db` only) — not an ELAH container.

---

## 3. Test token (vitest)

`tests/setup.ts` sets:

```
ELAH_SERVICE_TOKEN=test-elah-service-token
```

(unless already provided). Contract tests in `tests/elah/` MUST send `Authorization: Bearer test-elah-service-token`. Do not use production tokens in CI.

---

## 4. Production — Banking Vercel

Template: `deploy/vercel-banking.env`. Import into the **Banking** Vercel project (Production + Preview).

| Variable | Who sets |
|---|---|
| `DATABASE_URL` | Already required (Neon) |
| `AUTH_SECRET` | Already required |
| `ELAH_SERVICE_TOKEN` | **Founder pastes** a dedicated service token. Not the customer password. Not `AUTH_SECRET` |
| `ELAH_SERVICE_URL` | Leave **unset** while colocated. Set only after extract |
| `ELAH_SCORE_TIMEOUT_MS` | Optional; default 250 |

Do **not** run `prisma db push` on Vercel. Founder platform env is a different project; it does not serve `/v1/score`.

---

## 5. Docker

`docker-compose.yml` in the banking repo runs **Postgres 16** for local development. It is **not** an ELAH scoring image and is **not** used on Vercel. Optional local only.

---

## 6. Sign-off

I agree unset `ELAH_SERVICE_URL` means in-process scoring; vitest uses `test-elah-service-token`; production Banking Vercel requires the founder to paste `ELAH_SERVICE_TOKEN`; Docker is local Postgres only.

---

*End of document.*

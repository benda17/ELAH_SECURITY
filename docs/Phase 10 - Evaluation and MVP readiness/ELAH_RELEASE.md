# ELAH release procedures (Phase 10)

| Field | Value |
|---|---|
| Document ID | ELAH-P10-REL-001 |
| Version | **1.0** |
| Status | **Proposed** |
| Date | 28 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related task | `task-10-document-release-procedures` |
| Deploy notes | `docs/VERCEL_DEPLOYMENT.md` |

**Product freeze (unchanged):** Do **not** `prisma db push` onto the wrong database. Jane must stay score-free after deploy.

---

## 1. Three surfaces (do not mix)

| App | Repo / branch | DB |
|---|---|---|
| Banking simulator | this repo (`ELAH_BANKING_SYSTEM`) | Banking Neon |
| Founder platform | `elah-analytics-dashboard` | **Same Neon public in today’s architecture** — schema changes are dangerous |
| CRM simulation | `elah-crm-simulator` | **SQLite / separate** — never this Neon |

---

## 2. Banking release checklist

1. `npm run test:phase10-eval` (and relevant phase suites) green locally.
2. `npx prisma generate && npm run build` (Vercel build).
3. Set `DATABASE_URL`, `AUTH_SECRET`; optional `OPENAI_API_KEY`, `ELAH_SERVICE_TOKEN`.
4. **Do not** run `prisma db push` from Vercel. A founder-schema push already threatened banking `AuditLog` columns.
5. Smoke: Jane login → assistant (no score). Admin → `/admin/elah-events` (score card). Fail-open copy if scorer missing.
6. Point founder `BANKING_APP_URL` at the new host.

CRM and founder deploys are **separate** Vercel projects. Do not “fix” CRM by pushing banking Prisma.

---

## 3. Scorer

Live scorer stays `rules_v0` until a deliberate Phase 6 integration. Shipping CatBoost by accident is a failed release.

---

## 4. Sign-off

I agree releases are per-app, never `db push` on Vercel, never mix CRM SQLite with banking Neon.

---

*End of document.*

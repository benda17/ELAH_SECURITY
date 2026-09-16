# ELAH — Vercel deployments

Banking and the founder platform are **two Vercel projects** from **[benda17/ELAH_SECURITY](https://github.com/benda17/ELAH_SECURITY)** on separate branches. **ELAH CRM Simulation** is a **third Vercel project** from its own repo (`elah-crm-simulator`), with its **own** Neon database — never the banking `DATABASE_URL`.

| Project | Git | Default port | Vercel role |
|---------|-----|--------------|-------------|
| **ELAH Banking Simulation** | `benda17/ELAH_SECURITY` branch `ELAH_BANKING_SYSTEM` | 3000 / 3002 | Interactive banking app + AI assistant |
| **ELAH Founder Platform** | `benda17/ELAH_SECURITY` branch `ELAH_FOUNDER_PLATFORM` | 3001 | Banking analytics + Founder admin + Content Engine |
| **ELAH CRM Simulation** | Separate repo (this machine: `elah-crm-simulator`) | 3003 | Interactive CRM / helpdesk demo |

Banking and founder share one **Neon Postgres** database. CRM uses a **different** Neon project.

## Project 1 — Banking Demo

**Repository:** [github.com/benda17/ELAH_SECURITY](https://github.com/benda17/ELAH_SECURITY)  
**Branch:** `ELAH_BANKING_SYSTEM`

### Vercel setup

1. Import the repo in Vercel.
2. Set **Root Directory** to `.` (repo root).
3. **Production branch:** `ELAH_BANKING_SYSTEM`
4. Environment variables:
   - `DATABASE_URL` — Neon Postgres URL (`postgresql://…`)
   - `AUTH_SECRET` — session signing key
   - `OPENAI_API_KEY` — optional, enables AI assistant
   - `OPENAI_MODEL` — optional

### Build

```bash
node scripts/check-database-url.js && npx prisma db push && npm run build
```

## Project 2 — ELAH Founder Platform

**Repository:** [github.com/benda17/ELAH_SECURITY](https://github.com/benda17/ELAH_SECURITY)  
**Branch:** `ELAH_FOUNDER_PLATFORM`

### Vercel setup

1. Create a **second** Vercel project from the same repo.
2. Set **Production branch** to `ELAH_FOUNDER_PLATFORM`.
3. Environment variables:
   - `DATABASE_URL` — **same Neon URL as banking**
   - `BANKING_APP_URL` / `NEXT_PUBLIC_BANKING_APP_URL` — URL of deployed banking demo
   - `OPENAI_API_KEY`, `CRON_SECRET`, `CONTENT_ENGINE_ENABLED`, etc.

### Build

```bash
node scripts/check-database-url.js && npx prisma db push && npm run build
```

Do **not** run `db seed` on Vercel (it would wipe shared Neon data).

### Cron

`vercel.json` schedules daily LinkedIn draft generation at **15:00 UTC** (≈ 18:00 Israel IDT). Verify after DST changes.

## Linking the two deployments

In the Founder Platform project, set:

```
BANKING_APP_URL=https://your-banking-demo.vercel.app
NEXT_PUBLIC_BANKING_APP_URL=https://your-banking-demo.vercel.app
```

The **Banking System → Banking App** sidebar opens this URL.

In the Founder Platform project, also set the CRM demo URL after it is deployed. Use **Encrypted** `CRM_APP_URL` only — not `NEXT_PUBLIC_CRM_APP_URL` (Open CRM App is a server page).

```
CRM_APP_URL=https://elahcrmsystem.vercel.app
CRM_DATABASE_URL=postgresql://…/elah_crm?sslmode=require
```

**CRM System → Open CRM App** uses `CRM_APP_URL`. Hosted CRM charts use Encrypted `CRM_DATABASE_URL` (CRM Neon `elah_crm` only). Local `.env` stays `file:../../elah-crm-simulator/prisma/dev.db`. Do **not** set `CRM_DATABASE_URL` to the banking Neon.

## Project 3 — ELAH CRM Simulation

Separate GitHub repo (local folder `elah-crm-simulator`). See that repo’s `deploy/README.md`.

- New Vercel project (not a branch of `ELAH_SECURITY`)
- New Neon `DATABASE_URL`
- `AUTH_SECRET`
- Seed from your laptop (`ALLOW_HOSTED_DB=1 npm run db:push:hosted`)

## Clone

```bash
git clone -b ELAH_FOUNDER_PLATFORM https://github.com/benda17/ELAH_SECURITY.git
```

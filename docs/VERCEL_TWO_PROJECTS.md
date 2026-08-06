# ELAH — Two-project Vercel deployment

ELAH runs as **two Vercel deployments** from **[benda17/ELAH_SECURITY](https://github.com/benda17/ELAH_SECURITY)** on separate branches:

| Project | Git branch | Default port | Vercel role |
|---------|------------|--------------|-------------|
| **ELAH Banking Demo** | `ELAH_BANKING_SYSTEM` | 3000 / 3002 | Interactive banking app + AI assistant |
| **ELAH Founder Platform** | `ELAH_FOUNDER_PLATFORM` | 3001 | Banking analytics + Founder admin + Content Engine |

Both can share one SQLite file in development via `DATABASE_URL`. For production, use a hosted database (Postgres recommended).

## Project 1 — Banking Demo

**Repository:** [github.com/benda17/ELAH_SECURITY](https://github.com/benda17/ELAH_SECURITY)  
**Branch:** `ELAH_BANKING_SYSTEM`

### Vercel setup

1. Import the repo in Vercel.
2. Set **Root Directory** to `.` (repo root).
3. **Production branch:** `ELAH_BANKING_SYSTEM`
4. Environment variables (from `.env.example`):
   - `DATABASE_URL` — production database URL
   - `AUTH_SECRET` — session signing key
   - `OPENAI_API_KEY` — optional, enables AI assistant
   - `OPENAI_MODEL` — optional

### Build

```bash
npm install
npm run db:push
npm run build
```

## Project 2 — ELAH Founder Platform

**Repository:** [github.com/benda17/ELAH_SECURITY](https://github.com/benda17/ELAH_SECURITY)  
**Branch:** `ELAH_FOUNDER_PLATFORM`

### Vercel setup

1. Create a **second** Vercel project from the same repo.
2. Set **Production branch** to `ELAH_FOUNDER_PLATFORM`.
3. Environment variables (from `.env.example`):
   - `DATABASE_URL` — same DB as banking demo (or read replica)
   - `BANKING_APP_URL` — URL of deployed banking demo (e.g. `https://elah-banking.vercel.app`)
   - `OPENAI_API_KEY`, `CRON_SECRET`, `CONTENT_ENGINE_ENABLED`, etc.

### Cron

`vercel.json` schedules daily LinkedIn draft generation at **15:00 UTC** (≈ 18:00 Israel IDT). Verify after DST changes.

## Linking the two deployments

In the Founder Platform project, set:

```
BANKING_APP_URL=https://your-banking-demo.vercel.app
NEXT_PUBLIC_BANKING_APP_URL=https://your-banking-demo.vercel.app
```

The **Banking System → Banking App** sidebar opens this URL.

## Clone

```bash
git clone -b ELAH_FOUNDER_PLATFORM https://github.com/benda17/ELAH_SECURITY.git
```

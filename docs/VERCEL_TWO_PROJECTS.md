# ELAH — Two-project Vercel deployment

ELAH runs as **two separate Git projects** and **two Vercel deployments**:

| Project | Local path | Default port | Git branch | Vercel role |
|---------|------------|--------------|------------|-------------|
| **ELAH Banking Demo** | `ELAH_SECURITY---Banking-System` | 3000 / 3002 | `feature/elah-banking-system` | Interactive banking app + AI assistant |
| **ELAH Platform** | `elah-analytics-dashboard` | 3001 | `analytics-dashboard` | Banking analytics + Founder admin + Content Engine |

Both can share one SQLite file in development via `DATABASE_URL`. For production, use a hosted database (Postgres recommended).

## Project 1 — Banking Demo

**Repository:** `elah-security/ELAH_SECURITY-Banking-System`  
**Branch:** `feature/elah-banking-system`

### Vercel setup

1. Import the banking repo in Vercel.
2. Set **Root Directory** to `.` (repo root).
3. **Production branch:** `feature/elah-banking-system` (or `main` after merge).
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

## Project 2 — ELAH Platform (Analytics + Founder)

**Repository:** `elah-security/ELAH_SECURITY-Banking-System` (branch `analytics-dashboard`)  
*Or a dedicated repo if you split it — point Vercel at that repo instead.*

**Branch:** `analytics-dashboard`

### Vercel setup

1. Create a **second** Vercel project from the same repo (or dedicated platform repo).
2. Set **Production branch** to `analytics-dashboard`.
3. Environment variables (from `.env.example`):
   - `DATABASE_URL` — same DB as banking demo (or read replica)
   - `BANKING_APP_URL` — URL of deployed banking demo (e.g. `https://elah-banking.vercel.app`)
   - `OPENAI_API_KEY`, `CRON_SECRET`, `CONTENT_ENGINE_ENABLED`, etc.

### Cron

`vercel.json` schedules daily LinkedIn draft generation at **15:00 UTC** (≈ 18:00 Israel IDT). Verify after DST changes.

## Linking the two deployments

In the Platform project, set:

```
BANKING_APP_URL=https://your-banking-demo.vercel.app
NEXT_PUBLIC_BANKING_APP_URL=https://your-banking-demo.vercel.app
```

The Platform **Banking System → Banking App** sidebar opens this URL.

## Separate GitHub repos (optional)

To use two repos instead of two branches on one repo:

```bash
# Platform repo (from elah-analytics-dashboard folder)
git remote add origin https://github.com/YOUR_ORG/elah-platform.git
git push -u origin analytics-dashboard:main

# Banking repo (already at ELAH_SECURITY---Banking-System)
git push -u origin feature/elah-banking-system:main
```

Point each Vercel project at its respective repository.

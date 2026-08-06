# ELAH Platform

Unified Next.js workspace for the ELAH banking demo analytics and founder admin tools. Two clearly separated areas share one SQLite database (the banking simulation `dev.db`).

## Workspace areas

| Area | Base path | Purpose |
|------|-----------|---------|
| **Banking System** | `/banking/*` | Demo analytics, intent matrix, agent logs, users, tool actions, training dataset |
| **Founder & Manager Admin** | `/founder/*` | Company roadmap, model roadmap, fundraising, content engine, settings |

Landing hub: **http://localhost:3001/** — choose Banking System or Founder Admin.

The interactive banking demo itself runs separately (default **http://localhost:3002**). The Banking System sidebar links to it via `BANKING_APP_URL`.

## Quick start

```bash
npm install
npm run db:push
npm run roadmap:seed   # first-time founder roadmap seed
npm run dev            # http://localhost:3001
```

## Environment

Copy `.env.example` to `.env` and set `DATABASE_URL` to the absolute path of the banking SQLite file:

```
DATABASE_URL="file:/Users/you/ELAH_SECURITY---Banking-System/prisma/dev.db"
```

Never commit `.env` with real secrets.

## Deploy on Vercel

**Git:** [benda17/ELAH_SECURITY](https://github.com/benda17/ELAH_SECURITY) — branch **`ELAH_FOUNDER_PLATFORM`**

1. Import the repository as a Vercel project (production branch: `ELAH_FOUNDER_PLATFORM`).
2. Add all variables from `.env.example` under **Settings → Environment Variables**.
3. Set `DATABASE_URL` to your production database (SQLite on Vercel requires persistent storage — for production, migrate to Postgres or use a hosted SQLite volume).
4. Set `CRON_SECRET` to a long random string. Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` to cron routes.
5. Set `CONTENT_ENGINE_ENABLED=true` when ready for daily draft generation.
6. Keep `CONTENT_AUTO_PUBLISH=false` until LinkedIn OAuth is verified.

### Cron schedule

`vercel.json` schedules daily LinkedIn draft generation at **15:00 UTC**:

```json
{ "path": "/api/cron/generate-linkedin-draft", "schedule": "0 15 * * *" }
```

**Note:** 18:00 Israel time usually maps to **15:00 UTC** during Israel Daylight Time (IDT). When Israel switches to/from standard time, verify the UTC offset and adjust the cron if needed.

### Content Engine

- UI: `/founder/content-engine`
- Manual generate: `POST /api/founder/content-engine/generate`
- Cron: `GET /api/cron/generate-linkedin-draft` (requires `CRON_SECRET`)

Drafts are generated but **not auto-published** unless `CONTENT_AUTO_PUBLISH=true` and LinkedIn credentials are configured.

## Legacy routes

Old paths redirect automatically:

- `/intent-matrix` → `/banking/intent-matrix`
- `/training-dataset` → `/banking/training-dataset`
- `/elah-model-roadmap` → `/founder/model-roadmap`
- `/elah-roadmap/*` → `/founder/roadmap/*` or `/founder/overview`

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS 3 (dark theme)
- Prisma 5 (shared SQLite with banking app)
- Recharts + Three.js (intent matrix 3D)
- lucide-react

## Folder structure

```
app/banking/          # Banking System pages
app/founder/          # Founder Admin pages
components/banking/   # Banking UI
components/founder/   # Founder UI (content engine panel)
lib/banking/          # Banking query helpers (via lib/queries.ts)
lib/founder/          # Content engine, roadmap
```

## Banking repo

The live banking demo and AI assistant live in `ELAH_SECURITY---Banking-System` (port 3002). This platform reads (and founder tools write roadmap/content tables) from the same database.

# ELAH Platform

Unified Next.js workspace for the ELAH banking demo analytics and founder admin tools. Two clearly separated areas share one **Postgres** database (same Neon DB as the banking simulation in production).

## Workspace areas

| Area | Base path | Purpose |
|------|-----------|---------|
| **Banking System** | `/banking/*` | Demo analytics, intent matrix, agent logs, users, tool actions, training dataset |
| **Founder & Manager Admin** | `/founder/*` | Company roadmap, model roadmap, fundraising, content engine, newsletter, settings |

Login: **http://localhost:3001/login** — founder credentials gate the whole platform.

Local ports (documented for CORS):

| App | Default URL | Notes |
|-----|-------------|--------|
| Marketing webpage (`ELAH-Webpage`) | **http://localhost:3000** | Hero newsletter form POSTs here → dashboard |
| Founder dashboard (this repo) | **http://localhost:3001** | Prisma/Neon + Resend send |
| Banking demo | **http://localhost:3002** | Separate app; not used by newsletter |

The interactive banking demo itself runs separately (default **http://localhost:3002**). The Banking System sidebar links to it via `BANKING_APP_URL`.

## Quick start

```bash
npm install
npx prisma generate
# Local schema only — do not `prisma db push` to production:
npx prisma migrate dev --name newsletter_subscribers
npm run roadmap:seed   # first-time founder roadmap seed
npm run dev            # http://localhost:3001
```

## Environment

Copy `.env.example` to `.env` and set `DATABASE_URL` to the **same Neon Postgres URL** as the Banking System:

```
DATABASE_URL="postgresql://USER:PASSWORD@ep-XXXX.neon.tech/neondb?sslmode=require"
```

Never commit `.env` with real secrets.

## Deploy on Vercel

**Git:** [benda17/ELAH_SECURITY](https://github.com/benda17/ELAH_SECURITY) — branch **`ELAH_FOUNDER_PLATFORM`**

1. Import the repository as a Vercel project (production branch: `ELAH_FOUNDER_PLATFORM`).
2. Add all variables from `.env.example` under **Settings → Environment Variables**.
3. Set `DATABASE_URL` to the **same Neon Postgres URL** as the Banking project (`postgresql://…`). Do not use `file:./…`.
4. Set `BANKING_APP_URL` / `NEXT_PUBLIC_BANKING_APP_URL` to the live Banking deployment URL.
5. Set `CRON_SECRET` to a long random string. Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` to cron routes.
6. Set `CONTENT_ENGINE_ENABLED=true` when ready for daily draft generation.
7. Keep `CONTENT_AUTO_PUBLISH=false` until LinkedIn OAuth is verified.

### Cron schedule

`vercel.json` schedules daily LinkedIn draft generation at **15:00 UTC**:

```json
{ "path": "/api/cron/generate-linkedin-draft", "schedule": "0 15 * * *" }
```

**Note:** 18:00 Israel time usually maps to **15:00 UTC** during Israel Daylight Time (IDT). When Israel switches to/from standard time, verify the UTC offset and adjust the cron if needed.

### Content Engine

- UI: `/founder/content-engine`
- Free draft generation via **Groq** (`GROQ_API_KEY`) or Gemini (`GEMINI_API_KEY`)
- Manual generate: `POST /api/founder/content-engine/generate`
- Cron: `GET /api/cron/generate-linkedin-draft` (requires `CRON_SECRET`)
- LinkedIn: Connect at `/api/linkedin/connect` (needs `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET`), then **Publish to LinkedIn** on a draft

Set `CONTENT_ENGINE_ENABLED=true` for daily cron. Keep `CONTENT_AUTO_PUBLISH=false` until a manual publish succeeds.

### Newsletter

- Public subscribe: `POST /api/newsletter/subscribe` (CORS allows localhost:3000/3001 and `elahsecurity.com`; extra origins via `NEWSLETTER_CORS_ORIGINS`)
- Body: `{ "email": "a@b.com", "consent": true, "source": "hero" }` — **consent must be true** or the row is not written
- Schema: `NewsletterSubscriber` (`id`, `email` unique, `source`, `createdAt`)
- Founder UI: `/founder/newsletter` — compose subject/body, Send via **Resend**
- If `RESEND_API_KEY` or `RESEND_FROM` is missing, Send returns a clear error and does **not** fake a send
- Empty list: Send is skipped with a clear message

### Demo requests

- Public form: marketing site `/demo` → `POST /api/demo/request` (same CORS as newsletter)
- Body: `{ "name", "email", "company", "role?", "goal?", "source": "demo_page" }`
- Schema: `DemoRequest` (`name`, `email`, `company`, optional `role`/`goal`, `status`, `createdAt`)
- Founder UI: `/founder/demo-requests`
- If Resend is configured, a notify email is sent to `DEMO_REQUEST_NOTIFY_EMAIL` (default `elahsecurity@gmail.com`). The row is saved even if notify fails.

After pulling the schema change, run a **local** migrate (do not `prisma db push` to production from this machine):

```bash
npx prisma generate
npx prisma migrate dev --name newsletter_subscribers
```

Copy `RESEND_API_KEY` and `RESEND_FROM` from `.env.example` into `.env`. Never commit real keys.


## Legacy routes

Old paths redirect automatically:

- `/intent-matrix` → `/banking/intent-matrix`
- `/training-dataset` → `/banking/training-dataset`
- `/elah-model-roadmap` → `/founder/model-roadmap`
- `/elah-roadmap/*` → `/founder/roadmap/*` or `/founder/overview`

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS 3 (dark theme)
- Prisma 5 (shared Postgres / Neon with banking app)
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

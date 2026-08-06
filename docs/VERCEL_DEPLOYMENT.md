# ELAH Banking Demo — Vercel deployment

This repo is **Project 1** of the ELAH stack. Deploy it as its own Vercel project.

| | |
|---|---|
| **Git remote** | [github.com/benda17/ELAH_SECURITY](https://github.com/benda17/ELAH_SECURITY) |
| **Deploy branch** | `banking-system` |
| **Companion app** | ELAH Platform (`platform` branch) |

## Environment variables

Copy from `.env.example`:

- `DATABASE_URL` — SQLite path locally; use Postgres (or Turso/libSQL) in production
- `AUTH_SECRET` — `openssl rand -base64 48`
- `OPENAI_API_KEY` — optional, powers the in-app AI assistant

## Build command

Vercel runs:

```bash
npm run db:push && npm run build
```

(configured in `vercel.json`)

## After deploy

Set the Platform project's `BANKING_APP_URL` to this deployment's URL so analytics can link to the live demo.

See also: `../elah-analytics-dashboard/docs/VERCEL_TWO_PROJECTS.md` (full two-project guide).

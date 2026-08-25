# ELAH Banking Demo — Vercel deployment

This repo is **Project 1** of the ELAH stack. Deploy it as its own Vercel project.

| | |
|---|---|
| **Git remote** | [github.com/benda17/ELAH_SECURITY](https://github.com/benda17/ELAH_SECURITY) |
| **Deploy branch** | `ELAH_BANKING_SYSTEM` |
| **Companion app** | ELAH Founder Platform (`ELAH_FOUNDER_PLATFORM` branch) |

## Environment variables

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | **Required.** Hosted Postgres (`postgresql://…`). SQLite will not work on Vercel. Free option: [Neon](https://neon.tech). |
| `AUTH_SECRET` | `openssl rand -base64 48` |
| `OPENAI_API_KEY` | Optional — powers the in-app AI assistant |

See `deploy/README.md` and `deploy/vercel-banking.env`.

## Build command

Vercel runs:

```bash
npx prisma generate && npm run build
```

Do **not** run `prisma db push` on Vercel. The founder dashboard and banking simulator share Neon `public`; a push from the founder schema tried to drop banking `AuditLog.eventId` / `source`.

## After deploy

Set the Founder Platform project's `BANKING_APP_URL` to this deployment's URL so analytics can link to the live demo.

## Clone

```bash
git clone -b ELAH_BANKING_SYSTEM https://github.com/benda17/ELAH_SECURITY.git
```

See also: `docs/VERCEL_TWO_PROJECTS.md` on the `ELAH_FOUNDER_PLATFORM` branch.

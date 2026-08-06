# ELAH_SECURITY

Monorepo-style layout for the ELAH stack. **Two deployable apps** live on separate branches — import the same GitHub repo twice in Vercel with different production branches.

| Branch | App | Port (local) | Deploy as |
|--------|-----|--------------|-----------|
| [`ELAH_BANKING_SYSTEM`](../../tree/ELAH_BANKING_SYSTEM) | Banking demo + AI assistant | 3000 / 3002 | Vercel Project 1 |
| [`ELAH_FOUNDER_PLATFORM`](../../tree/ELAH_FOUNDER_PLATFORM) | Analytics, Founder admin, Content Engine | 3001 | Vercel Project 2 |

## Quick start (local)

**Banking demo**

```bash
git clone -b ELAH_BANKING_SYSTEM https://github.com/benda17/ELAH_SECURITY.git elah-banking
cd elah-banking
npm install && npm run db:push && npm run db:seed && npm run dev
```

**Founder platform (analytics + founder admin)**

```bash
git clone -b ELAH_FOUNDER_PLATFORM https://github.com/benda17/ELAH_SECURITY.git elah-founder-platform
cd elah-founder-platform
npm install && npm run db:push && npm run dev
# → http://localhost:3001
```

Point `DATABASE_URL` at the banking SQLite file (or a shared hosted DB) so analytics sees live demo data.

## Vercel (two projects, one repo)

1. **Project 1 — Banking:** repo `benda17/ELAH_SECURITY`, production branch **`ELAH_BANKING_SYSTEM`**
2. **Project 2 — Founder Platform:** same repo, production branch **`ELAH_FOUNDER_PLATFORM`**

After banking deploys, set on the Founder Platform project:

```
BANKING_APP_URL=https://your-banking-app.vercel.app
NEXT_PUBLIC_BANKING_APP_URL=https://your-banking-app.vercel.app
```

See branch-specific docs:

- `ELAH_BANKING_SYSTEM` → `docs/VERCEL_DEPLOYMENT.md`
- `ELAH_FOUNDER_PLATFORM` → `docs/VERCEL_TWO_PROJECTS.md`

## Why branches, not two repos?

One repo keeps ELAH in one place while Vercel still treats each branch as an independent app (separate builds, env vars, domains). If you later want two repos, push each branch to its own remote as `main`.

# Deploying ELAH Banking System on Vercel

## Why login failed with SQLite

Vercel serverless has no persistent local filesystem. `DATABASE_URL=file:./dev.db` can pass the build but **login and any write fail at runtime**. Use hosted **Postgres**.

## 1) Create a free Postgres database

1. Sign up at [neon.tech](https://neon.tech) (or use Vercel → Storage → Neon / Postgres).
2. Create a project / database.
3. Copy the connection string (must start with `postgresql://` and usually includes `?sslmode=require`).

## 2) Environment variables

Use **`deploy/vercel-banking.env`** as a template:

1. Open your Banking Vercel project.
2. **Settings → Environment Variables**.
3. Set at least:
   - `DATABASE_URL` = your Neon/Postgres URL (not `file:./…`)
   - `AUTH_SECRET` = long random string (`openssl rand -base64 48`)
4. Apply to **Production**, **Preview**, and **Development**.
5. Save, then redeploy branch **`ELAH_BANKING_SYSTEM`**.

## Project settings

| Setting | Value |
|---------|--------|
| Production branch | `ELAH_BANKING_SYSTEM` |
| Framework | Next.js |
| Root directory | *(blank)* |
| Build command | `npx prisma db push && npx prisma db seed && npm run build` |

Build will create tables and seed demo users (`DemoPass123!`).

## Notes

- Add `OPENAI_API_KEY` in Vercel when you want the real AI assistant.
- Git remote for this deploy branch: [benda17/ELAH_SECURITY](https://github.com/benda17/ELAH_SECURITY) → `ELAH_BANKING_SYSTEM`.

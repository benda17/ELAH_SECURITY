# Deploying ELAH Banking System on Vercel

## Environment variables

Use **`deploy/vercel-banking.env`** — import it into Vercel instead of typing each variable by hand.

1. Open your Banking Vercel project.
2. **Settings → Environment Variables**.
3. Click **Import .env** (or paste the file contents into the bulk editor).
4. Select **Production**, **Preview**, and **Development**.
5. Save, then **Deployments → Redeploy** on branch **`ELAH_BANKING_SYSTEM`**.

## Project settings

| Setting | Value |
|---------|--------|
| Production branch | `ELAH_BANKING_SYSTEM` |
| Framework | Next.js |
| Root directory | *(blank)* |
| Build command | `npm run db:push && npm run build` |

## Notes

- `DATABASE_URL=file:./dev.db` matches the current SQLite Prisma schema and unblocks the build.
- For a persistent production database, switch to Vercel Postgres and update `DATABASE_URL` later.
- Add `OPENAI_API_KEY` in Vercel when you want the real AI assistant (not included in the env file).

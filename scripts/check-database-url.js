#!/usr/bin/env node
/**
 * Fail fast on Vercel when DATABASE_URL is missing or still a SQLite file URL.
 */
const url = process.env.DATABASE_URL ?? "";

if (!url) {
  console.error(`
DATABASE_URL is not set.

Create a free Postgres DB at https://neon.tech, copy the connection string,
then in Vercel → Settings → Environment Variables set:

  DATABASE_URL = postgresql://...

Apply to Production (and Preview), save, and redeploy.
`);
  process.exit(1);
}

if (url.startsWith("file:") || (!url.startsWith("postgres://") && !url.startsWith("postgresql://"))) {
  console.error(`
DATABASE_URL must be a Postgres URL for Vercel (not SQLite).

Current value starts with: ${JSON.stringify(url.slice(0, 24))}

1) Create a DB at https://neon.tech
2) Vercel → Settings → Environment Variables
3) Edit DATABASE_URL — delete any file:./dev.db value
4) Paste the Neon URL (postgresql://...)
5) Save + Redeploy
`);
  process.exit(1);
}

console.log("DATABASE_URL protocol OK (postgres).");

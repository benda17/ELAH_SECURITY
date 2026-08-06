#!/usr/bin/env node
/**
 * Fail fast on Vercel when DATABASE_URL is missing or still a SQLite file URL.
 */
const url = process.env.DATABASE_URL ?? "";

if (!url) {
  console.error(`
DATABASE_URL is not set.

Use the same Neon Postgres URL as the Banking project:
  DATABASE_URL = postgresql://...

Vercel → Settings → Environment Variables → Production (+ Preview), then redeploy.
`);
  process.exit(1);
}

if (
  url.startsWith("file:") ||
  (!url.startsWith("postgres://") && !url.startsWith("postgresql://"))
) {
  console.error(`
DATABASE_URL must be a Postgres URL for Vercel (not SQLite).

Current value starts with: ${JSON.stringify(url.slice(0, 24))}

Use the shared Neon connection string from the Banking project.
`);
  process.exit(1);
}

console.log("DATABASE_URL protocol OK (postgres).");

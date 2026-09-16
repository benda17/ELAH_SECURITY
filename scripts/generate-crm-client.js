/**
 * Generate the read-only CRM Prisma client.
 * Local: SQLite (schema.sqlite.prisma).
 * Vercel: Postgres when CRM_DATABASE_URL is postgresql://… (CRM Neon elah_crm).
 * Never the banking DATABASE_URL.
 */
const { spawnSync } = require("node:child_process");

function isPostgres(url) {
  const lower = (url ?? "").toLowerCase();
  return lower.startsWith("postgresql://") || lower.startsWith("postgres://");
}

function strip(value) {
  const v = (value ?? "").trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    return v.slice(1, -1).trim();
  }
  return v;
}

const crm = strip(process.env.CRM_DATABASE_URL);
const banking = strip(process.env.DATABASE_URL);

if (crm && banking && crm === banking) {
  console.error(
    "CRM_DATABASE_URL must not equal DATABASE_URL. CRM analytics reads elah_crm, never the banking Neon.",
  );
  process.exit(1);
}

if (isPostgres(crm)) {
  try {
    const db = new URL(crm).pathname.replace(/^\//, "").split("/")[0];
    if (db && db !== "elah_crm") {
      console.error(
        `CRM_DATABASE_URL must target database elah_crm (got "${db}"). Do not use the banking Neon.`,
      );
      process.exit(1);
    }
  } catch {
    console.error("CRM_DATABASE_URL is not a valid Postgres URL.");
    process.exit(1);
  }
}

const schema = isPostgres(crm)
  ? "prisma-crm/schema.prisma"
  : "prisma-crm/schema.sqlite.prisma";

const env = { ...process.env, CRM_DATABASE_URL: crm || "file:./dev.db" };

const result = spawnSync("npx", ["prisma", "generate", "--schema", schema], {
  stdio: "inherit",
  env,
});
process.exit(result.status ?? 1);

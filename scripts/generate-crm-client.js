/**
 * Generate the read-only CRM Prisma client.
 * Local: SQLite. Vercel: Postgres only when CRM_DATABASE_URL is CRM Neon elah_crm.
 * Never fail the founder build: bad CRM env falls back to SQLite generate so /banking/crm still ships.
 * Never the banking DATABASE_URL.
 */
const { spawnSync } = require("node:child_process");
const path = require("node:path");

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

function crmPostgresOk(crm, banking) {
  if (!isPostgres(crm)) return false;
  if (banking && crm === banking) {
    console.warn(
      "generate-crm-client: CRM_DATABASE_URL equals DATABASE_URL (banking). Using SQLite client; CRM charts will be empty until CRM Neon elah_crm is set.",
    );
    return false;
  }
  try {
    const db = new URL(crm).pathname.replace(/^\//, "").split("/")[0];
    if (db && db !== "elah_crm") {
      console.warn(
        `generate-crm-client: CRM_DATABASE_URL database is "${db}", expected elah_crm. Using SQLite client.`,
      );
      return false;
    }
  } catch {
    console.warn("generate-crm-client: CRM_DATABASE_URL is not a valid URL. Using SQLite client.");
    return false;
  }
  return true;
}

const crm = strip(process.env.CRM_DATABASE_URL);
const banking = strip(process.env.DATABASE_URL);
const usePostgres = crmPostgresOk(crm, banking);
const schema = usePostgres
  ? "prisma-crm/schema.prisma"
  : "prisma-crm/schema.sqlite.prisma";

const env = { ...process.env };
env.CRM_DATABASE_URL = usePostgres ? crm : crm || "file:./dev.db";

const prismaBin = path.join(process.cwd(), "node_modules", ".bin", "prisma");
const result = spawnSync(prismaBin, ["generate", "--schema", schema], {
  stdio: "inherit",
  env,
});
process.exit(result.status ?? 1);

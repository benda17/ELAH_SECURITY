/**
 * Phase 1 simulator reset — restore the canonical 6-user baseline.
 *
 * Runs prisma/seed.ts (not seed:dataset). Does not drop the schema.
 * Against Neon hosts or NODE_ENV=production, requires ALLOW_DB_RESET=1.
 *
 *   npm run simulator:reset
 */

import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { CANONICAL_DEMO_EMAILS, DEMO_PASSWORD } from "../lib/auth/demo-accounts";

const ROOT = path.resolve(__dirname, "..");

function loadDotEnv(filePath: string) {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function databaseHost(url: string): string {
  try {
    return new URL(url).hostname || "(unknown host)";
  } catch {
    return "(unparseable host)";
  }
}

function hostLooksLikeNeon(host: string, rawUrl: string): boolean {
  const haystack = `${host} ${rawUrl}`.toLowerCase();
  return haystack.includes("neon.tech");
}

function runTsx(scriptRel: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("tsx", [scriptRel], {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env,
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${scriptRel} exited with code ${code}`));
    });
  });
}

async function main() {
  loadDotEnv(path.join(ROOT, ".env"));

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env.");
    process.exit(1);
  }

  const host = databaseHost(databaseUrl);
  const protectedTarget =
    process.env.NODE_ENV === "production" || hostLooksLikeNeon(host, databaseUrl);

  if (protectedTarget && process.env.ALLOW_DB_RESET !== "1") {
    console.error(
      `Refusing to reset: database host is ${host} (Neon and NODE_ENV=production require ALLOW_DB_RESET=1).`,
    );
    console.error("Re-run with ALLOW_DB_RESET=1 if you intend to wipe this database.");
    process.exit(1);
  }

  console.log(`→ Resetting Phase 1 baseline on host ${host} (schema is not dropped)…`);
  await runTsx("prisma/seed.ts");

  // Idempotent: canonical seed already has these emails; this keeps logins
  // aligned with lib/auth/demo-accounts.ts after mixed seed workflows.
  await runTsx("scripts/ensure-canonical-demo-logins.ts");

  console.log("");
  console.log("Phase 1 baseline restored");
  console.log(`Canonical demo logins (password ${DEMO_PASSWORD}):`);
  for (const { email, role } of CANONICAL_DEMO_EMAILS) {
    console.log(`  ${email}  (${role})`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

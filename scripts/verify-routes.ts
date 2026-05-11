/**
 * Dev-only smoke test:
 *   1. Creates DB sessions directly for each demo persona.
 *   2. Sets the elah_session cookie (raw.signature format) and GETs every route.
 *   3. Reports per-route HTTP status + first error line if 500.
 *
 * This is NOT a real test framework — just enough to verify the server renders
 * every page without crashing for the right role.
 */

import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const BASE = process.env.BASE ?? "http://localhost:3000";
const SECRET = process.env.AUTH_SECRET ?? "elah-local-poc-secret-change-me-please-32bytes-min-xxxxxxxx";

function sign(raw: string) {
  return crypto.createHmac("sha256", SECRET).update(raw).digest("hex");
}

async function makeSessionCookie(prisma: PrismaClient, email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`User not found: ${email}`);
  const raw = crypto.randomBytes(32).toString("hex");
  const token = `${raw}.${sign(raw)}`;
  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60_000),
    },
  });
  return { token, user };
}

const CUSTOMER_ROUTES = [
  "/dashboard",
  "/accounts",
  "/transfer",
  "/transactions",
  "/documents",
  "/cards",
  "/loans",
  "/support",
  "/profile",
  "/investments",
];

const MANAGER_ROUTES = [
  "/manager/dashboard",
  "/manager/customers",
  "/manager/approvals",
  "/manager/audit-logs",
  "/manager/flagged-actions",
];

const ADMIN_ROUTES = [
  "/admin/security-dashboard",
  "/admin/action-logs",
  "/admin/agent-simulation-logs",
  "/admin/prompt-injection-scenarios",
  "/admin/risk-events",
];

async function get(path: string, token: string) {
  const res = await fetch(BASE + path, {
    headers: {
      cookie: `elah_session=${token}`,
    },
    redirect: "manual",
  });
  const status = res.status;
  let bodySnippet = "";
  if (status >= 400) {
    const text = await res.text();
    bodySnippet = text
      .split("\n")
      .filter((l) => /error|Error/.test(l))
      .slice(0, 2)
      .join(" | ")
      .slice(0, 240);
  }
  return { status, bodySnippet };
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const personas: { email: string; routes: string[] }[] = [
      { email: "basic.customer@elah.demo", routes: CUSTOMER_ROUTES },
      { email: "premium.customer@elah.demo", routes: CUSTOMER_ROUTES },
      { email: "vip.customer@elah.demo", routes: CUSTOMER_ROUTES },
      { email: "manager@elah.demo", routes: MANAGER_ROUTES },
      { email: "security.admin@elah.demo", routes: ADMIN_ROUTES },
    ];

    let failures = 0;

    for (const p of personas) {
      const { token, user } = await makeSessionCookie(prisma, p.email);
      console.log(`\n→ as ${p.email} (${user.role})`);
      for (const route of p.routes) {
        const r = await get(route, token);
        const ok = r.status === 200 || r.status === 307;
        if (!ok) failures += 1;
        const flag = r.status === 200 ? "✓" : r.status === 307 ? "↪" : "✗";
        console.log(
          `  ${flag} ${r.status}  ${route}${r.bodySnippet ? " — " + r.bodySnippet : ""}`,
        );
      }

      // Also test one manager/customers/:id route for the manager.
      if (p.email === "manager@elah.demo") {
        const profile = await prisma.customerProfile.findFirst();
        if (profile) {
          const r = await get(`/manager/customers/${profile.id}`, token);
          const ok = r.status === 200;
          if (!ok) failures += 1;
          console.log(
            `  ${ok ? "✓" : "✗"} ${r.status}  /manager/customers/${profile.id}${r.bodySnippet ? " — " + r.bodySnippet : ""}`,
          );
        }
      }
    }

    console.log(`\nDone. Failures: ${failures}`);
    process.exit(failures === 0 ? 0 : 1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

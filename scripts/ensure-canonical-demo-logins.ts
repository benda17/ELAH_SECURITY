/**
 * Ensures the canonical demo emails (basic.customer@elah.demo, etc.) exist.
 * After `seed:dataset`, the first user of each role is renamed to the canonical email.
 *
 *   npm run seed:demo-logins
 */

import { PrismaClient } from "@prisma/client";
import { CANONICAL_DEMO_EMAILS } from "../lib/auth/demo-accounts";

const prisma = new PrismaClient();

async function main() {
  console.log("→ Ensuring canonical demo login emails…\n");

  for (const { email, role } of CANONICAL_DEMO_EMAILS) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`  ✓ ${email} (${role})`);
      continue;
    }

    const user = await prisma.user.findFirst({
      where: { role, status: "active" },
      orderBy: { createdAt: "asc" },
      include: { customerProfile: true },
    });

    if (!user) {
      console.log(`  ✗ ${email} — no active user with role ${role}`);
      continue;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { email },
    });

    if (user.customerProfile) {
      await prisma.customerProfile.update({
        where: { id: user.customerProfile.id },
        data: { email },
      });
    }

    console.log(`  ↪ renamed ${user.email} → ${email} (${role})`);
  }

  console.log("\nDone. Password for all accounts: DemoPass123!");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  return new PrismaClient({ log: ["error", "warn"] });
}

function getPrismaClient(): PrismaClient {
  if (global.__prisma) {
    return global.__prisma;
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    global.__prisma = client;
  }
  return client;
}

export const prisma = getPrismaClient();

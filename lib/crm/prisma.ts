import { PrismaClient } from "./generated";
import {
  assertCrmDatabaseUrlSafe,
  isCrmDatabaseConfigured,
} from "./config";

export {
  isCrmDatabaseConfigured,
  isCrmPostgresUrl,
  CRM_APP_URL,
} from "./config";

declare global {
  // eslint-disable-next-line no-var
  var __crmPrisma: PrismaClient | undefined;
}

function createClient() {
  return new PrismaClient({ log: ["error", "warn"] });
}

export function getCrmPrisma(): PrismaClient {
  if (!isCrmDatabaseConfigured()) {
    throw new Error("CRM_DATABASE_URL is not set");
  }
  assertCrmDatabaseUrlSafe();
  if (global.__crmPrisma) return global.__crmPrisma;
  const client = createClient();
  if (process.env.NODE_ENV !== "production") {
    global.__crmPrisma = client;
  }
  return client;
}

/** Lazy so Vercel/banking pages never construct a SQLite client. */
export const crmPrisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getCrmPrisma();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

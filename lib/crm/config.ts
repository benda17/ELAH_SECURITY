export function isCrmDatabaseConfigured() {
  const url = process.env.CRM_DATABASE_URL?.trim();
  if (!url) return false;
  try {
    assertCrmDatabaseUrlSafe();
    return true;
  } catch {
    return false;
  }
}

export function isCrmPostgresUrl(url: string | undefined = process.env.CRM_DATABASE_URL) {
  const lower = url?.toLowerCase() ?? "";
  return lower.startsWith("postgresql://") || lower.startsWith("postgres://");
}

/** CRM analytics may read CRM Neon elah_crm, never the banking DATABASE_URL. */
export function assertCrmDatabaseUrlSafe() {
  const crm = process.env.CRM_DATABASE_URL?.trim() ?? "";
  const banking = process.env.DATABASE_URL?.trim() ?? "";
  if (!crm) return;
  if (banking && crm === banking) {
    throw new Error(
      "CRM_DATABASE_URL must not equal DATABASE_URL. CRM analytics reads elah_crm, never the banking Neon.",
    );
  }
  if (isCrmPostgresUrl(crm)) {
    const db = new URL(crm).pathname.replace(/^\//, "").split("/")[0];
    if (db && db !== "elah_crm") {
      throw new Error(
        `CRM_DATABASE_URL must target database elah_crm (got "${db}"). Do not use the banking Neon.`,
      );
    }
  }
}

export const CRM_APP_URL = process.env.CRM_APP_URL ?? "http://localhost:3003";

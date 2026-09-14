export function isCrmDatabaseConfigured() {
  return Boolean(process.env.CRM_DATABASE_URL?.trim());
}

export const CRM_APP_URL =
  process.env.CRM_APP_URL ?? process.env.NEXT_PUBLIC_CRM_APP_URL ?? "http://localhost:3003";

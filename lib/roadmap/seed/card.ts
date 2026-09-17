/**
 * Shared Kanban description template (same shape as Phase 16 `card()`).
 * Freeze is restated on every card; first-client motion after 8 Sep 2026 is CS/CRM.
 */

export const PRODUCT_FREEZE =
  "ELAH scores genuine intent before tools. Company policy allow/deny/confirm. ELAH never allows, blocks, or executes. Scores are not on the event envelope. Customer UI must not show elahScore.";

export const PIVOT_SENTENCE =
  "After the 8 Sep 2026 pivot, first-client motion is B2B SaaS CS/CRM; banking is a later vertical and the existing scoring demo.";

export const OUT_COMMON =
  "prisma db push onto the wrong DB (especially CRM schema onto banking/founder Neon); ELAH allowing, blocking, or executing; fake metrics, interviews, customers, or ARR; unsupported chain-of-thought; live customer data; quoting banking holdout as CS/CRM accuracy.";

export function card(
  body: string,
  today: string,
  doThis: string,
  inn: string,
  out: string,
): string {
  return `${body}\n\nTODAY: ${today}\n\nDO THIS: ${doThis}\n\nIN — ${inn}\nOUT — ${out}`;
}

export function isThinDescription(description: string | null | undefined): boolean {
  const d = (description ?? "").trim();
  if (!d) return true;
  if (d.length < 240) return true;
  const hasToday = /\bTODAY:/i.test(d);
  const hasDoThis = /\bDO THIS:/i.test(d);
  const hasIn = /\bIN —/.test(d);
  const hasOut = /\bOUT —/.test(d);
  return !(hasToday && hasDoThis && hasIn && hasOut);
}

export function stripPivotBanner(description: string): string {
  return description.replace(
    /^PIVOT \(founder-approved 8 Sep 2026\):[\s\S]*?\n\n/,
    "",
  );
}

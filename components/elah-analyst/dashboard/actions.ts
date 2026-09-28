"use server";

import { parseAnalystFilters } from "@/lib/elah/analyst/filters";
import { requireAnalystPermission } from "@/lib/elah/analyst/rbac";
import { loadDashboardExtras } from "./extras-server";
import { withDefaultPreset, type DashboardExtras } from "./helpers";

export type DashboardExtrasResult =
  | { ok: true; extras: DashboardExtras }
  | { ok: false; error: string };

/** Polled alongside `/api/admin/elah/analyst/snapshot`. Requires `analyst:view`; no audit row per poll. */
export async function fetchDashboardExtrasAction(query: string): Promise<DashboardExtrasResult> {
  await requireAnalystPermission("analyst:view", { page: "/admin/elah-dashboard" });
  try {
    const filters = withDefaultPreset(parseAnalystFilters(typeof query === "string" ? query : ""));
    return { ok: true, extras: await loadDashboardExtras(filters) };
  } catch {
    return { ok: false, error: "Could not load score and confidence distributions." };
  }
}

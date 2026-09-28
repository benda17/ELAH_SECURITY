import { NextRequest, NextResponse } from "next/server";
import {
  getDashboardSnapshot,
  parseAnalystFilters,
  requireAnalystPermissionApi,
} from "@/lib/elah/analyst";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/elah/analyst/snapshot?<analyst filters>
 * Near-real-time dashboard polling. Requires `analyst:view`. Intentionally
 * does not write an audit row per poll.
 */
export async function GET(req: NextRequest) {
  const { error } = await requireAnalystPermissionApi("analyst:view", {
    page: "/api/admin/elah/analyst/snapshot",
  });
  if (error) return error;

  const snapshot = await getDashboardSnapshot(parseAnalystFilters(req.nextUrl.searchParams));
  return NextResponse.json(
    { ok: true, snapshot },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}

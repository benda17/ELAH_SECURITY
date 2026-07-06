import { NextRequest, NextResponse } from "next/server";
import { requireSecurityApi } from "@/lib/auth/api-guards";
import {
  parseIntentFilters,
  queryIntentRealtime,
} from "@/lib/agent/intent-matrix/admin-queries";

export async function GET(req: NextRequest) {
  const { error } = await requireSecurityApi();
  if (error) return error;
  const filters = parseIntentFilters(req.nextUrl.searchParams);
  const since = req.nextUrl.searchParams.get("since");
  const payload = await queryIntentRealtime(since, filters);
  return NextResponse.json({ ok: true, ...payload });
}

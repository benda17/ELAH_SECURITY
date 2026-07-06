import { NextRequest, NextResponse } from "next/server";
import { requireSecurityApi } from "@/lib/auth/api-guards";
import {
  parseIntentFilters,
  queryIntentEvents,
} from "@/lib/agent/intent-matrix/admin-queries";

export async function GET(req: NextRequest) {
  const { error } = await requireSecurityApi();
  if (error) return error;
  const filters = parseIntentFilters(req.nextUrl.searchParams);
  const events = await queryIntentEvents(filters);
  return NextResponse.json({ ok: true, count: events.length, events });
}

import { NextRequest, NextResponse } from "next/server";
import { requireSecurityApi } from "@/lib/auth/api-guards";
import {
  parseTrainingEventFilters,
  queryTrainingEvents,
} from "@/lib/elah/admin-queries";

export async function GET(req: NextRequest) {
  const { error } = await requireSecurityApi();
  if (error) return error;

  const filters = parseTrainingEventFilters(req.nextUrl.searchParams);
  const result = await queryTrainingEvents(filters);
  return NextResponse.json({
    ok: true,
    total: result.total,
    limit: filters.limit ?? 50,
    offset: filters.offset ?? 0,
    events: result.events,
  });
}

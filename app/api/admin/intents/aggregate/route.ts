import { NextRequest, NextResponse } from "next/server";
import { requireSecurityApi } from "@/lib/auth/api-guards";
import {
  parseIntentFilters,
  queryIntentAggregates,
} from "@/lib/agent/intent-matrix/admin-queries";

export async function GET(req: NextRequest) {
  const { error } = await requireSecurityApi();
  if (error) return error;
  const filters = parseIntentFilters(req.nextUrl.searchParams);
  const aggregates = await queryIntentAggregates(filters);
  return NextResponse.json({ ok: true, count: aggregates.length, aggregates });
}

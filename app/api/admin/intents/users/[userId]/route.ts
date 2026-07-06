import { NextRequest, NextResponse } from "next/server";
import { requireSecurityApi } from "@/lib/auth/api-guards";
import {
  parseIntentFilters,
  queryIntentUserProfile,
} from "@/lib/agent/intent-matrix/admin-queries";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } },
) {
  const { error } = await requireSecurityApi();
  if (error) return error;
  const filters = parseIntentFilters(req.nextUrl.searchParams);
  const profile = await queryIntentUserProfile(params.userId, filters);
  return NextResponse.json({ ok: true, profile });
}

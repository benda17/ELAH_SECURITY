import { NextRequest, NextResponse } from "next/server";
import { requireSecurityApi } from "@/lib/auth/api-guards";
import {
  parseIntentFilters,
  queryIntentDistribution,
  queryIntentMatrix,
  queryIntentRiskHeatmap,
} from "@/lib/agent/intent-matrix/admin-queries";

export async function GET(req: NextRequest) {
  const { error } = await requireSecurityApi();
  if (error) return error;
  const filters = parseIntentFilters(req.nextUrl.searchParams);
  const [matrix, distribution, heatmap] = await Promise.all([
    queryIntentMatrix(filters),
    queryIntentDistribution(filters),
    queryIntentRiskHeatmap(filters),
  ]);
  return NextResponse.json({
    ok: true,
    matrix,
    distribution,
    heatmap,
  });
}

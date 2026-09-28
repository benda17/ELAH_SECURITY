import { NextRequest, NextResponse } from "next/server";
import {
  ANALYST_EXPORT_FORMATS,
  analystActorFromUser,
  parseAnalystFilters,
  queryAnalystEvents,
  recordAnalystExport,
  requireAnalystPermissionApi,
  toCsv,
  toJson,
  type AnalystExportFormat,
} from "@/lib/elah/analyst";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/elah/analyst/export?format=csv|json&<analyst filters>
 * Requires `analyst:export`. Every export is audited (filters + row count).
 */
export async function GET(req: NextRequest) {
  const { user, error } = await requireAnalystPermissionApi("analyst:export", {
    page: "/api/admin/elah/analyst/export",
  });
  if (error) return error;

  const params = req.nextUrl.searchParams;
  const formatRaw = (params.get("format") ?? "csv").toLowerCase();
  if (!(ANALYST_EXPORT_FORMATS as readonly string[]).includes(formatRaw)) {
    return NextResponse.json(
      { ok: false, error: "format must be csv or json" },
      { status: 400 },
    );
  }
  const format = formatRaw as AnalystExportFormat;

  const filters = parseAnalystFilters(params);
  const result = await queryAnalystEvents(filters);

  await recordAnalystExport(analystActorFromUser(user), {
    filters: result.filters,
    format,
    eventIds: result.rows.map((row) => row.event.eventId),
  });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const body = format === "csv" ? toCsv(result.rows) : toJson(result.rows);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type":
        format === "csv" ? "text/csv; charset=utf-8" : "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="elah-analyst-events-${stamp}.${format}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { requireSecurityApi } from "@/lib/auth/api-guards";
import { backfillElahTrainingEvents } from "@/lib/elah/training-event";

export async function POST(req: NextRequest) {
  const { error } = await requireSecurityApi();
  if (error) return error;

  let limit = 5000;
  let dryRun = false;
  try {
    const body = (await req.json()) as { limit?: number; dryRun?: boolean };
    if (body.limit != null) limit = Math.min(body.limit, 20000);
    if (body.dryRun != null) dryRun = Boolean(body.dryRun);
  } catch {
    // empty body is fine
  }

  const result = await backfillElahTrainingEvents({ limit, dryRun });
  return NextResponse.json({ ok: true, ...result, dryRun });
}

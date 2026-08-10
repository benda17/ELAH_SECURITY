import { NextRequest, NextResponse } from "next/server";
import {
  listSavedFacebookPages,
  selectFacebookPage,
} from "@/lib/founder/content-engine/facebook";

export const dynamic = "force-dynamic";

export async function GET() {
  const pages = await listSavedFacebookPages();
  return NextResponse.json({
    ok: true,
    pages: pages.map((p) => ({ id: p.id, name: p.name, tasks: p.tasks })),
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { pageId?: string };
  if (!body.pageId?.trim()) {
    return NextResponse.json({ ok: false, error: "pageId required" }, { status: 400 });
  }
  const result = await selectFacebookPage(body.pageId.trim());
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, pageName: result.pageName });
}

import { NextRequest, NextResponse } from "next/server";
import { saveManualPageCredentials } from "@/lib/founder/content-engine/facebook";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    pageId?: string;
    pageAccessToken?: string;
    pageName?: string;
  };
  if (!body.pageId?.trim() || !body.pageAccessToken?.trim()) {
    return NextResponse.json(
      { ok: false, error: "pageId and pageAccessToken required" },
      { status: 400 },
    );
  }
  const result = await saveManualPageCredentials({
    pageId: body.pageId,
    pageAccessToken: body.pageAccessToken,
    pageName: body.pageName,
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

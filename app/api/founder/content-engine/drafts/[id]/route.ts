import { NextRequest, NextResponse } from "next/server";
import { updateDraftBody, updateDraftStatus } from "@/lib/founder/content-engine/repository";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const body = (await req.json()) as {
    action?: "approve" | "reject" | "edit";
    text?: string;
    title?: string;
    notes?: string;
  };

  if (body.action === "edit" && body.text) {
    await updateDraftBody(params.id, body.text, body.title);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "approve") {
    await updateDraftStatus(params.id, "approved", body.notes);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "reject") {
    await updateDraftStatus(params.id, "rejected", body.notes);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
}

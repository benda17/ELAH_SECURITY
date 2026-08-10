import { NextResponse } from "next/server";
import { listAdminOrganizations } from "@/lib/founder/content-engine/linkedin";

export const dynamic = "force-dynamic";

export async function GET() {
  const organizations = await listAdminOrganizations();
  return NextResponse.json({ ok: true, organizations });
}

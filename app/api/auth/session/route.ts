import { NextResponse } from "next/server";
import { FOUNDER_USERNAME } from "@/lib/founder-session";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    authenticated: true,
    username: FOUNDER_USERNAME,
  });
}

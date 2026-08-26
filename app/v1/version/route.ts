import { NextResponse } from "next/server";
import { getVersion } from "@/lib/elah/service";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return NextResponse.json(getVersion());
}

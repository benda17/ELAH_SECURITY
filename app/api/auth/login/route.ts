import { NextRequest, NextResponse } from "next/server";
import {
  FOUNDER_COOKIE,
  FOUNDER_USERNAME,
  credentialsMatch,
  makeFounderSessionToken,
} from "@/lib/founder-session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string } = {};
  try {
    body = (await req.json()) as { username?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "");
  if (!credentialsMatch(username, password)) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const token = await makeFounderSessionToken();
  const res = NextResponse.json({
    ok: true,
    token,
    username: FOUNDER_USERNAME,
  });
  res.cookies.set({
    name: FOUNDER_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

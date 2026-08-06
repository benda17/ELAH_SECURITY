import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  FOUNDER_COOKIE,
  isFounderSessionToken,
} from "@/lib/founder-session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/elah-logo") ||
    pathname.startsWith("/api/cron") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(FOUNDER_COOKIE)?.value;
  const authed = await isFounderSessionToken(token);

  if (pathname === "/login") {
    if (authed) {
      return NextResponse.redirect(new URL("/founder/overview", request.url));
    }
    return NextResponse.next();
  }

  if (!authed) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};

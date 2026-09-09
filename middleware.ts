import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  FOUNDER_COOKIE,
  isFounderSessionToken,
} from "@/lib/founder-session";

function bearerToken(request: NextRequest): string | undefined {
  const header = request.headers.get("authorization");
  if (!header) return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1]?.trim();
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/elah-logo") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/api/linkedin") ||
    pathname.startsWith("/api/facebook") ||
    pathname.startsWith("/api/gmail") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/logout") ||
    pathname.startsWith("/api/newsletter") ||
    pathname.startsWith("/api/demo") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = bearerToken(request) ?? request.cookies.get(FOUNDER_COOKIE)?.value;
  const authed = await isFounderSessionToken(token);

  if (pathname === "/login") {
    if (authed) {
      return NextResponse.redirect(new URL("/founder/overview", request.url));
    }
    return NextResponse.next();
  }

  if (!authed) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/newsletter|api/demo|api/auth/login|api/auth/logout|api/cron|api/linkedin|api/facebook|api/gmail).*)",
  ],
};

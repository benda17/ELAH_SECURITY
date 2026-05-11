import "server-only";
import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/db";
import type { CustomerProfile, User } from "@prisma/client";

const COOKIE_NAME = "elah_session";
const SESSION_TTL_HOURS = 24 * 7;

function authSecret() {
  return process.env.AUTH_SECRET ?? "elah-dev-fallback-secret";
}

function sign(payload: string) {
  return crypto
    .createHmac("sha256", authSecret())
    .update(payload)
    .digest("hex");
}

function makeToken() {
  const raw = crypto.randomBytes(32).toString("hex");
  const signature = sign(raw);
  return `${raw}.${signature}`;
}

function verifyToken(token: string | undefined) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [raw, signature] = parts;
  const expected = sign(raw);
  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return null;
  }
  return token;
}

export type SessionUser = User & {
  customerProfile: CustomerProfile | null;
};

export async function createSession(userId: string) {
  const token = makeToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);
  const ip = clientIp();
  const ua = headers().get("user-agent") ?? undefined;

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
      ipAddress: ip,
      userAgent: ua,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });

  cookies().set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function destroySession() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.session
      .deleteMany({ where: { token } })
      .catch(() => undefined);
  }
  cookies().delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const raw = cookies().get(COOKIE_NAME)?.value;
  const token = verifyToken(raw);
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: { customerProfile: true },
      },
    },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session
      .delete({ where: { id: session.id } })
      .catch(() => undefined);
    return null;
  }

  return session.user as SessionUser;
}

export function getSessionId() {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return raw.split(".")[0]?.slice(0, 16) ?? null;
}

export function clientIp() {
  const h = headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "127.0.0.1"
  );
}

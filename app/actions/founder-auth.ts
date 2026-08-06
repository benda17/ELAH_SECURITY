"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  FOUNDER_COOKIE,
  credentialsMatch,
  makeFounderSessionToken,
} from "@/lib/founder-session";

export type FounderLoginState = {
  error?: string;
};

export async function founderLoginAction(
  _prev: FounderLoginState | undefined,
  formData: FormData,
): Promise<FounderLoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!credentialsMatch(username, password)) {
    return { error: "Invalid username or password." };
  }

  const token = await makeFounderSessionToken();
  cookies().set({
    name: FOUNDER_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/founder/overview");
}

export async function founderLogoutAction() {
  cookies().delete(FOUNDER_COOKIE);
  redirect("/login");
}

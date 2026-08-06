"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  destroySession,
  getSessionUser,
  clientIp,
} from "@/lib/auth/session";
import {
  CUSTOMER_ROLES,
  ROLES,
  actorTypeFromRole,
  tierFromRole,
} from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/logging/logger";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prev: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      await writeAuditLog({
        actorType: "anonymous",
        actorName: email,
        actionType: "login_failed",
        page: "/login",
        toolOrFeatureUsed: "login_form",
        riskLevel: "medium",
        actionOutcome: "failed",
        reasonForFlagging: "Invalid email or password.",
        ipAddress: clientIp(),
        inputDataSummary: { emailDomain: email.split("@")[1] ?? null },
      }).catch(() => undefined);
      return { error: "Invalid email or password." };
    }

    if (user.status !== "active") {
      return { error: "This account is not active." };
    }

    await createSession(user.id);

    await writeAuditLog({
      actorType: actorTypeFromRole(user.role),
      actorId: user.id,
      actorName: user.name,
      role: user.role,
      customerTier: tierFromRole(user.role),
      actionType: "login",
      page: "/login",
      toolOrFeatureUsed: "login_form",
      riskLevel: "low",
      actionOutcome: "succeeded",
      inputDataSummary: { method: "credentials" },
    });

    if (CUSTOMER_ROLES.includes(user.role as (typeof CUSTOMER_ROLES)[number])) {
      redirect("/dashboard");
    }
    if (user.role === ROLES.BANK_MANAGER) {
      redirect("/manager/dashboard");
    }
    if (user.role === ROLES.SECURITY_REVIEWER) {
      redirect("/admin/security-dashboard");
    }
    if (user.role === ROLES.AI_AGENT) {
      // AI agent accounts have no live UI yet; route them to admin so reviewers
      // can demo the placeholder agent session pages.
      redirect("/admin/agent-simulation-logs");
    }
    redirect("/dashboard");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error("[loginAction] database/auth failure", err);
    return {
      error:
        "Sign-in is temporarily unavailable (database). Check DATABASE_URL points to hosted Postgres.",
    };
  }
}

export async function logoutAction() {
  const user = await getSessionUser();
  if (user) {
    await writeAuditLog({
      actorType: actorTypeFromRole(user.role),
      actorId: user.id,
      actorName: user.name,
      role: user.role,
      customerTier: tierFromRole(user.role),
      actionType: "logout",
      page: "session",
      toolOrFeatureUsed: "logout_button",
      riskLevel: "low",
      actionOutcome: "succeeded",
    });
  }
  await destroySession();
  redirect("/login");
}

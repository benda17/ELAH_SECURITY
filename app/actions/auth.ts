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
import { writeAuditLog, writeRiskEvent } from "@/lib/logging/logger";
import type { RiskLevel } from "@/lib/logging/logger";

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
        actorName: "anonymous",
        actionType: "login_failed",
        page: "/login",
        toolOrFeatureUsed: "login_form",
        riskLevel: "medium",
        actionOutcome: "failed",
        reasonForFlagging: "Invalid email or password.",
        ipAddress: clientIp(),
        createdByAgent: false,
        inputDataSummary: { emailDomain: email.split("@")[1] ?? null },
      }).catch(() => undefined);
      return { error: "Invalid email or password." };
    }

    if (user.status !== "active") {
      await writeAuditLog({
        actorType: "anonymous",
        actorName: "anonymous",
        actionType: "login_failed",
        page: "/login",
        toolOrFeatureUsed: "login_form",
        riskLevel: "medium",
        actionOutcome: "failed",
        reasonForFlagging: "account inactive",
        ipAddress: clientIp(),
        createdByAgent: false,
        inputDataSummary: { emailDomain: email.split("@")[1] ?? null },
      }).catch(() => undefined);
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
      createdByAgent: false,
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

export interface PasswordResetState {
  error?: string;
  message?: string;
}

const resetSchema = z.object({
  email: z.string().email("Enter a valid email."),
});

/**
 * Simulated recovery request. Never emails, never issues a token, never
 * changes the password. Always writes a monitorable audit row; risk is high
 * when a known account is targeted with no session (ATO precursor).
 */
export async function requestPasswordResetAction(
  _prev: PasswordResetState | undefined,
  formData: FormData,
): Promise<PasswordResetState> {
  const parsed = resetSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid email." };
  }

  const email = parsed.data.email.toLowerCase();
  const emailDomain = email.split("@")[1] ?? null;
  const sessionUser = await getSessionUser().catch(() => null);
  const target = await prisma.user.findUnique({ where: { email } });

  let riskLevel: RiskLevel = "medium";
  let reason = "Password recovery requested for an email with no matching user.";
  let accountKnown = false;
  let sessionMismatch = false;

  if (target) {
    accountKnown = true;
    if (sessionUser && sessionUser.id !== target.id) {
      riskLevel = "critical";
      sessionMismatch = true;
      reason =
        "Password recovery requested for a different account than the signed-in session.";
    } else if (sessionUser && sessionUser.id === target.id) {
      riskLevel = "medium";
      reason =
        "Signed-in customer requested password recovery for their own account.";
    } else {
      riskLevel = "high";
      reason =
        "Password recovery requested for a known account with no session (ATO precursor).";
    }
  }

  const log = await writeAuditLog({
    actorType: sessionUser
      ? actorTypeFromRole(sessionUser.role)
      : target
        ? actorTypeFromRole(target.role)
        : "anonymous",
    actorId: sessionUser?.id ?? target?.id ?? null,
    actorName: "anonymous",
    role: sessionUser?.role ?? target?.role ?? null,
    customerTier: sessionUser
      ? (sessionUser.customerProfile?.tier ?? tierFromRole(sessionUser.role))
      : target
        ? tierFromRole(target.role)
        : null,
    actionType: "password_reset_requested",
    page: "/forgot-password",
    toolOrFeatureUsed: "forgot_password_form",
    riskLevel,
    actionOutcome: "submitted",
    createdByAgent: false,
    ipAddress: clientIp(),
    reasonForFlagging: reason,
    inputDataSummary: {
      emailDomain,
      accountKnown,
      sessionMismatch,
      simulated: true,
      passwordUnchanged: true,
    },
  });

  if (riskLevel === "high" || riskLevel === "critical") {
    await writeRiskEvent({
      severity: riskLevel,
      eventType: "password_reset_requested",
      actorType: sessionUser
        ? actorTypeFromRole(sessionUser.role)
        : target
          ? actorTypeFromRole(target.role)
          : "anonymous",
      actorId: sessionUser?.id ?? target?.id ?? null,
      customerProfileId: target?.id
        ? (
            await prisma.customerProfile.findUnique({
              where: { userId: target.id },
              select: { id: true },
            })
          )?.id ?? null
        : null,
      relatedAuditLogIds: [log.id],
      reasonForFlagging: reason,
      detectedPattern: sessionMismatch
        ? "password_reset_session_mismatch"
        : "password_reset_ato_precursor",
    });
  }

  return {
    message:
      "If that email exists in the simulation, a recovery would be sent. No email is sent and the password is not changed.",
  };
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
      createdByAgent: false,
    });
  }
  await destroySession();
  redirect("/login");
}

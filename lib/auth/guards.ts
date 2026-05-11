import "server-only";
import { redirect } from "next/navigation";
import { getSessionUser } from "./session";
import {
  CUSTOMER_ROLES,
  ROLES,
  type Role,
  isCustomerRole,
} from "./roles";
import { writeAuditLog } from "@/lib/logging/logger";

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireRole(allowed: Role[]) {
  const user = await requireUser();
  if (!allowed.includes(user.role as Role)) {
    await writeAuditLog({
      actorType: "anonymous",
      actorId: user.id,
      actorName: user.name,
      role: user.role,
      actionType: "unauthorized_route_access",
      page: "blocked",
      actionOutcome: "blocked",
      riskLevel: "high",
      reasonForFlagging: `User with role ${user.role} attempted to access page requiring one of: ${allowed.join(", ")}`,
    });
    redirect("/login?error=forbidden");
  }
  return user;
}

export async function requireCustomer() {
  const user = await requireUser();
  if (!isCustomerRole(user.role)) {
    await writeAuditLog({
      actorType: "anonymous",
      actorId: user.id,
      actorName: user.name,
      role: user.role,
      actionType: "unauthorized_route_access",
      page: "customer_area",
      actionOutcome: "blocked",
      riskLevel: "high",
      reasonForFlagging: `Non-customer role '${user.role}' tried to access customer area`,
    });
    redirect("/login?error=forbidden");
  }
  return user;
}

export async function requireManager() {
  return requireRole([ROLES.BANK_MANAGER]);
}

export async function requireSecurity() {
  return requireRole([ROLES.SECURITY_REVIEWER]);
}

export { CUSTOMER_ROLES, ROLES };

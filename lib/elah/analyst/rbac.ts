import "server-only";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/logging/logger";
import type { AnalystActor } from "./constants";
import { can, type AnalystPermission } from "./permissions";

export {
  ANALYST_PERMISSIONS,
  ANALYST_PERMISSION_MATRIX,
  can,
  permissionsForRole,
  type AnalystPermission,
} from "./permissions";

/** Reviewer identity for analyst writes. */
export function analystActorFromUser(user: { id: string; name: string; role: string }): AnalystActor {
  return { id: user.id, name: user.name, role: user.role };
}

function hasAccess(user: SessionUser, permission: AnalystPermission): boolean {
  return user.status === "active" && can(user.role, permission);
}

async function auditDenied(user: SessionUser, permission: AnalystPermission, page: string) {
  await writeAuditLog({
    actorType: "anonymous",
    actorId: user.id,
    actorName: user.name,
    role: user.role,
    actionType: "unauthorized_route_access",
    page,
    actionOutcome: "blocked",
    riskLevel: "high",
    reasonForFlagging: `User with role ${user.role} (status ${user.status}) lacks ${permission}`,
  });
}

/**
 * Page / server-action guard. Redirects to /login when signed out; on missing
 * permission (or inactive account) writes an `unauthorized_route_access` audit
 * row and redirects to `/login?error=forbidden` (same as `requireRole`).
 */
export async function requireAnalystPermission(
  permission: AnalystPermission,
  opts: { page?: string } = {},
): Promise<SessionUser> {
  const user = await requireUser();
  if (!hasAccess(user, permission)) {
    await auditDenied(user, permission, opts.page ?? "elah_analyst");
    redirect("/login?error=forbidden");
  }
  return user;
}

/**
 * Route-handler guard: returns JSON 401/403 instead of redirecting (better for
 * fetch / polling). Writes the same access-denied audit row on 403.
 */
export async function requireAnalystPermissionApi(
  permission: AnalystPermission,
  opts: { page?: string } = {},
): Promise<{ user: SessionUser; error: null } | { user: null; error: NextResponse }> {
  const user = await getSessionUser();
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (!hasAccess(user, permission)) {
    await auditDenied(user, permission, opts.page ?? "elah_analyst_api");
    return {
      user: null,
      error: NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 }),
    };
  }
  return { user, error: null };
}

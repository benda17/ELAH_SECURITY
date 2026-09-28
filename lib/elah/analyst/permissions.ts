/**
 * Analyst permission matrix. Client-safe (pure). Server guards live in `rbac.ts`.
 */

import { ROLES, type Role } from "@/lib/auth/roles";

export const ANALYST_PERMISSIONS = [
  "analyst:view",
  "analyst:annotate",
  "analyst:export",
  "analyst:configure_thresholds",
  "analyst:view_audit",
] as const;

export type AnalystPermission = (typeof ANALYST_PERMISSIONS)[number];

/** Role → granted analyst permissions. Roles not listed get nothing. */
export const ANALYST_PERMISSION_MATRIX: Readonly<Record<Role, readonly AnalystPermission[]>> =
  Object.freeze({
    [ROLES.SECURITY_REVIEWER]: ANALYST_PERMISSIONS,
    [ROLES.BANK_MANAGER]: ["analyst:view"],
    [ROLES.REGULAR_CUSTOMER]: [],
    [ROLES.PREMIUM_CUSTOMER]: [],
    [ROLES.VIP_CUSTOMER]: [],
    [ROLES.AI_AGENT]: [],
  });

/** True when `role` holds `permission`. Unknown / empty roles → false. */
export function can(role: string | null | undefined, permission: AnalystPermission): boolean {
  if (!role) return false;
  const granted = (ANALYST_PERMISSION_MATRIX as Record<string, readonly AnalystPermission[]>)[role];
  return !!granted && granted.includes(permission);
}

/** All permissions held by `role` (empty for customers / agents / unknown). */
export function permissionsForRole(role: string | null | undefined): AnalystPermission[] {
  return ANALYST_PERMISSIONS.filter((permission) => can(role, permission));
}

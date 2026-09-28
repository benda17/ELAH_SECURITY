import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import {
  ANALYST_PERMISSIONS,
  can,
  permissionsForRole,
} from "@/lib/elah/analyst/permissions";
import {
  requireAnalystPermission,
  requireAnalystPermissionApi,
} from "@/lib/elah/analyst/rbac";

function sessionUser(role: string, status = "active") {
  return {
    id: `user_${role}`,
    email: `${role}@elah.demo`,
    passwordHash: "x",
    name: `Test ${role}`,
    role,
    status,
    simulatedMfaEnabled: false,
    createdAt: new Date(),
    lastLoginAt: null,
    customerProfile: null,
  };
}

describe("analyst permission matrix", () => {
  it("grants security_reviewer every permission", () => {
    for (const permission of ANALYST_PERMISSIONS) {
      expect(can("security_reviewer", permission)).toBe(true);
    }
    expect(permissionsForRole("security_reviewer")).toEqual([...ANALYST_PERMISSIONS]);
  });

  it("grants bank_manager view only", () => {
    expect(permissionsForRole("bank_manager")).toEqual(["analyst:view"]);
    expect(can("bank_manager", "analyst:annotate")).toBe(false);
    expect(can("bank_manager", "analyst:export")).toBe(false);
    expect(can("bank_manager", "analyst:configure_thresholds")).toBe(false);
    expect(can("bank_manager", "analyst:view_audit")).toBe(false);
  });

  it.each(["regular_customer", "premium_customer", "vip_customer", "ai_agent", "admin", "", null, undefined])(
    "grants %s nothing",
    (role) => {
      expect(permissionsForRole(role as string | null | undefined)).toEqual([]);
    },
  );
});

describe("analyst guards", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.mocked(getSessionUser).mockResolvedValue(null);
  });

  it("API guard returns 401 when signed out", async () => {
    const result = await requireAnalystPermissionApi("analyst:view");
    expect(result.user).toBeNull();
    expect(result.error?.status).toBe(401);
  });

  it("API guard returns 403 and audits the denial for customers", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(sessionUser("vip_customer") as never);
    const create = vi.spyOn(prisma.auditLog, "create").mockResolvedValue({
      id: "denied_1",
      timestamp: new Date(),
    } as never);
    const result = await requireAnalystPermissionApi("analyst:export");
    expect(result.error?.status).toBe(403);
    expect(create).toHaveBeenCalledTimes(1);
    const data = create.mock.calls[0]![0].data;
    expect(data.actionType).toBe("unauthorized_route_access");
    expect(data.actionOutcome).toBe("blocked");
    expect(data.reasonForFlagging).toContain("analyst:export");
  });

  it("API guard denies inactive reviewers", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(
      sessionUser("security_reviewer", "suspended") as never,
    );
    vi.spyOn(prisma.auditLog, "create").mockResolvedValue({ id: "d", timestamp: new Date() } as never);
    const result = await requireAnalystPermissionApi("analyst:view");
    expect(result.error?.status).toBe(403);
  });

  it("API guard passes a bank_manager for analyst:view without writing audit rows", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(sessionUser("bank_manager") as never);
    const create = vi.spyOn(prisma.auditLog, "create");
    const result = await requireAnalystPermissionApi("analyst:view");
    expect(result.error).toBeNull();
    expect(result.user?.role).toBe("bank_manager");
    expect(create).not.toHaveBeenCalled();
  });

  it("page guard redirects forbidden users after auditing", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(sessionUser("bank_manager") as never);
    const create = vi.spyOn(prisma.auditLog, "create").mockResolvedValue({
      id: "denied_2",
      timestamp: new Date(),
    } as never);
    await expect(requireAnalystPermission("analyst:annotate")).rejects.toThrow(/NEXT_REDIRECT/);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("page guard returns the reviewer when allowed", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(sessionUser("security_reviewer") as never);
    const user = await requireAnalystPermission("analyst:configure_thresholds");
    expect(user.role).toBe("security_reviewer");
  });
});

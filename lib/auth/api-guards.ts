import "server-only";
import { NextResponse } from "next/server";
import { getSessionUser } from "./session";
import { isCustomerRole, ROLES } from "./roles";

function rejectInactive(user: { status: string }) {
  if (user.status !== "active") {
    return NextResponse.json(
      { ok: false, error: "Account is not active" },
      { status: 403 },
    );
  }
  return null;
}

export async function requireCustomerApi() {
  const user = await getSessionUser();
  if (!user || !isCustomerRole(user.role)) {
    return {
      user: null as null,
      error: NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }),
    };
  }
  const inactive = rejectInactive(user);
  if (inactive) {
    return { user: null as null, error: inactive };
  }
  if (!user.customerProfile) {
    return {
      user: null as null,
      error: NextResponse.json(
        { ok: false, error: "Customer profile required" },
        { status: 403 },
      ),
    };
  }
  return { user, error: null as null };
}

export async function requireSecurityApi() {
  const user = await getSessionUser();
  if (!user || user.role !== ROLES.SECURITY_REVIEWER) {
    return {
      user: null as null,
      error: NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 }),
    };
  }
  const inactive = rejectInactive(user);
  if (inactive) {
    return { user: null as null, error: inactive };
  }
  return { user, error: null as null };
}

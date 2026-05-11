"use client";

import { usePathname } from "next/navigation";
import { Topbar } from "./topbar";

const TITLES: Record<string, { title: string; subtitle: string }> = {
  "/manager/dashboard": { title: "Operations", subtitle: "Manager portal" },
  "/manager/customers": { title: "Customers", subtitle: "Manager portal" },
  "/manager/approvals": { title: "Approvals", subtitle: "Manager portal" },
  "/manager/audit-logs": { title: "Audit logs", subtitle: "Manager portal" },
  "/manager/flagged-actions": {
    title: "Flagged actions",
    subtitle: "Manager portal",
  },
};

export function ManagerTopbarWrapper({
  user,
}: {
  user: { name: string; email: string; role: string };
}) {
  const pathname = usePathname();
  let key = pathname;
  if (pathname.startsWith("/manager/customers/")) key = "/manager/customers";
  const meta = TITLES[key] ?? { title: "Manager", subtitle: "Manager portal" };
  return (
    <Topbar
      userName={user.name}
      email={user.email}
      role={user.role}
      pageTitle={meta.title}
      pageSubtitle={meta.subtitle}
    />
  );
}

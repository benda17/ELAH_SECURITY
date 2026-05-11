"use client";

import { usePathname } from "next/navigation";
import { Sidebar, type NavItem } from "./sidebar";

export function ClientSidebar({
  items,
  portalLabel,
}: {
  items: NavItem[];
  portalLabel: string;
}) {
  const pathname = usePathname();
  return <Sidebar items={items} activePath={pathname} portalLabel={portalLabel} />;
}

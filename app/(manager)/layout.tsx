import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Scroll,
  Flag,
} from "lucide-react";
import { requireManager } from "@/lib/auth/guards";
import { ClientSidebar } from "@/components/layout/client-sidebar";
import { ManagerTopbarWrapper } from "@/components/layout/manager-topbar-wrapper";
import { SimulationBanner } from "@/components/ui/untrusted";

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireManager();

  const items = [
    { href: "/manager/dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-4" /> },
    { href: "/manager/customers", label: "Customers", icon: <Users className="size-4" /> },
    { href: "/manager/approvals", label: "Approvals", icon: <ClipboardCheck className="size-4" /> },
    { href: "/manager/audit-logs", label: "Audit logs", icon: <Scroll className="size-4" /> },
    { href: "/manager/flagged-actions", label: "Flagged actions", icon: <Flag className="size-4" /> },
  ];

  return (
    <div className="flex min-h-screen">
      <ClientSidebar items={items} portalLabel="Manager portal" />
      <div className="flex min-w-0 flex-1 flex-col">
        <ManagerTopbarWrapper
          user={{ name: user.name, email: user.email, role: user.role }}
        />
        <div className="px-6 pt-4">
          <SimulationBanner />
        </div>
        {children}
      </div>
    </div>
  );
}

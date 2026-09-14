"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  BrainCircuit,
  Database,
  ExternalLink,
  Headset,
  LayoutDashboard,
  ScrollText,
  Users,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppDrawerShell } from "@/components/app-drawer-shell";

const NAV = [
  { href: "/banking/app", label: "Banking App", icon: ExternalLink },
  { href: "/banking/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/banking/intent-matrix", label: "Intent Matrix", icon: BrainCircuit },
  { href: "/banking/agent-logs", label: "Agent Logs", icon: ScrollText },
  { href: "/banking/users", label: "Users", icon: Users },
  { href: "/banking/actions", label: "Actions", icon: Wrench },
  { href: "/banking/training-dataset", label: "Training Dataset", icon: Database },
  { href: "/banking/crm", label: "CRM System", icon: Headset },
];

const CRM_NAV = [
  { href: "/banking/crm", label: "Overview" },
  { href: "/banking/crm/logs", label: "Command logs" },
  { href: "/banking/crm/users", label: "CRM users" },
  { href: "/banking/crm/actions", label: "CRM actions" },
  { href: "/banking/crm/app", label: "Open CRM App" },
];

export function BankingSidebar() {
  const pathname = usePathname();
  const inCrm = pathname === "/banking/crm" || pathname.startsWith("/banking/crm/");
  return (
    <AppDrawerShell eyebrow="Banking System" title="ELAH Demo">
      <div className="hidden border-b border-surface-border p-4 lg:block">
        <div className="flex items-center gap-2">
          <Image src="/elah-logo.png" alt="ELAH" width={28} height={28} />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-cyan">
              Banking System
            </p>
            <p className="text-sm font-semibold text-ink">ELAH Demo</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/banking/crm"
              ? inCrm
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors lg:min-h-0 lg:py-2",
                active
                  ? "bg-accent-cyan/15 text-accent-cyan"
                  : "text-ink-muted hover:bg-surface-border/40 hover:text-ink",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
        {inCrm ? (
          <div className="mt-2 border-t border-surface-border pt-2">
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-ink-dim">
              CRM Simulation
            </p>
            {CRM_NAV.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex min-h-11 items-center rounded-lg px-3 py-2 text-sm transition-colors lg:min-h-0 lg:py-1.5 lg:text-xs",
                    active
                      ? "bg-accent-cyan/15 text-accent-cyan"
                      : "text-ink-muted hover:text-ink",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        ) : null}
      </nav>
      <div className="space-y-1 border-t border-surface-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-xs">
        <Link href="/founder/overview" className="block min-h-11 py-2 text-ink-muted hover:text-ink lg:min-h-0 lg:py-0">
          → Founder Admin
        </Link>
      </div>
    </AppDrawerShell>
  );
}

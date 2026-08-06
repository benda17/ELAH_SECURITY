"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Activity,
  BrainCircuit,
  Database,
  ExternalLink,
  LayoutDashboard,
  ScrollText,
  Users,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/banking/app", label: "Banking App", icon: ExternalLink },
  { href: "/banking/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/banking/intent-matrix", label: "Intent Matrix", icon: BrainCircuit },
  { href: "/banking/agent-logs", label: "Agent Logs", icon: ScrollText },
  { href: "/banking/users", label: "Users", icon: Users },
  { href: "/banking/actions", label: "Actions", icon: Wrench },
  { href: "/banking/training-dataset", label: "Training Dataset", icon: Database },
];

export function BankingSidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-surface-border bg-surface-raised/50">
      <div className="border-b border-surface-border p-4">
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
      <nav className="flex-1 space-y-0.5 p-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
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
      </nav>
      <div className="space-y-1 border-t border-surface-border p-3 text-xs">
        <Link href="/" className="flex items-center gap-1 text-ink-muted hover:text-ink">
          <Activity className="size-3" /> ELAH Home
        </Link>
        <Link href="/founder/overview" className="block text-ink-muted hover:text-ink">
          → Founder Admin
        </Link>
      </div>
    </aside>
  );
}

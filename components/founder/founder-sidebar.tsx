"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  AlertTriangle,
  Beaker,
  CalendarClock,
  CalendarDays,
  Columns3,
  GitBranch,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Mail,
  Milestone,
  PenLine,
  Scale,
  Settings,
  Target,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { founderLogoutAction } from "@/app/actions/founder-auth";
import { AppDrawerShell } from "@/components/app-drawer-shell";

const PRIMARY_NAV = [
  { href: "/founder/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/founder/roadmap/timeline", label: "Roadmap", icon: GitBranch, match: "/founder/roadmap" },
  { href: "/founder/model-roadmap", label: "Model Roadmap", icon: Target },
  { href: "/founder/fundraising", label: "Fundraising", icon: Milestone },
  { href: "/founder/content-engine", label: "Content Engine", icon: PenLine },
  { href: "/founder/newsletter", label: "Newsletter", icon: Mail },
  { href: "/founder/demo-requests", label: "Demo requests", icon: CalendarClock },
  { href: "/founder/settings", label: "Settings", icon: Settings },
];

const ROADMAP_NAV = [
  { href: "/founder/roadmap/timeline", label: "Timeline", icon: GitBranch },
  { href: "/founder/roadmap/kanban", label: "Kanban", icon: Columns3 },
  { href: "/founder/roadmap/tasks", label: "Tasks", icon: ListTodo },
  { href: "/founder/roadmap/milestones", label: "Milestones", icon: Milestone },
  { href: "/founder/roadmap/outreach", label: "Outreach CRM", icon: Users },
  { href: "/founder/roadmap/experiments", label: "Experiments", icon: Beaker },
  { href: "/founder/roadmap/decisions", label: "Decisions", icon: Scale },
  { href: "/founder/roadmap/risks", label: "Risks", icon: AlertTriangle },
  { href: "/founder/roadmap/weekly", label: "Weekly View", icon: CalendarDays },
];

export function FounderSidebar() {
  const pathname = usePathname();
  const inRoadmap = pathname.startsWith("/founder/roadmap");

  return (
    <AppDrawerShell eyebrow="Founder & Manager" title="ELAH Admin">
      <div className="hidden border-b border-surface-border p-4 lg:block">
        <div className="flex items-center gap-2">
          <Image src="/elah-logo.png" alt="ELAH" width={28} height={28} />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-gold">
              Founder & Manager
            </p>
            <p className="text-sm font-semibold text-ink">ELAH Admin</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {PRIMARY_NAV.map(({ href, label, icon: Icon, match }) => {
          const base = match ?? href;
          const active =
            href === "/founder/overview"
              ? pathname === href
              : pathname.startsWith(base);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors lg:min-h-0 lg:py-2",
                active
                  ? "bg-accent-gold/15 text-accent-gold"
                  : "text-ink-muted hover:bg-surface-border/40 hover:text-ink",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
        {inRoadmap && (
          <div className="mt-3 border-t border-surface-border pt-3">
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-ink-dim">
              Roadmap views
            </p>
            {ROADMAP_NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors lg:min-h-0 lg:py-1.5 lg:text-xs",
                  pathname === href
                    ? "bg-accent-cyan/15 text-accent-cyan"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                {label}
              </Link>
            ))}
          </div>
        )}
      </nav>
      <div className="space-y-1 border-t border-surface-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-xs">
        <Link href="/banking/dashboard" className="block min-h-11 py-2 text-ink-muted hover:text-ink lg:min-h-0 lg:py-0">
          → Banking analytics
        </Link>
        <form action={founderLogoutAction}>
          <button
            type="submit"
            className="flex min-h-11 w-full items-center gap-1 text-left text-ink-muted hover:text-ink lg:min-h-0"
          >
            <LogOut className="size-3" /> Sign out
          </button>
        </form>
      </div>
    </AppDrawerShell>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  AlertTriangle,
  Beaker,
  CalendarDays,
  Columns3,
  GitBranch,
  LayoutDashboard,
  ListTodo,
  Map,
  Milestone,
  Scale,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/founder/overview", label: "Overview", icon: LayoutDashboard },
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

export function RoadmapSidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-surface-border bg-surface-raised/50">
      <div className="border-b border-surface-border p-4">
        <div className="flex items-center gap-2">
          <Image src="/elah-logo.png" alt="ELAH" width={28} height={28} />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-cyan">
              Founder OS
            </p>
            <p className="text-sm font-semibold text-ink">ELAH Roadmap</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 p-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/founder/overview"
              ? pathname === href
              : pathname.startsWith(href);
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
        <Link href="/" className="block text-ink-muted hover:text-ink">
          ← ELAH Home
        </Link>
        <Link
          href="/founder/model-roadmap"
          className="flex items-center gap-1 text-ink-muted hover:text-ink"
        >
          <Map className="size-3" /> Model Roadmap
        </Link>
      </div>
    </aside>
  );
}

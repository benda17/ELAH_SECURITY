import Link from "next/link";
import { cn } from "@/lib/utils";
import { BrandMark } from "./brand-mark";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
}

export function Sidebar({
  items,
  activePath,
  portalLabel,
}: {
  items: NavItem[];
  activePath: string;
  portalLabel: string;
}) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-line bg-bg-panel/60 px-4 py-6 md:flex md:flex-col">
      <Link
        href="/dashboard"
        className="mb-7 flex items-center gap-2.5 px-2"
      >
        <BrandMark size="md" />
        <div>
          <div className="text-sm font-semibold tracking-tight text-ink">
            ELAH Bank
          </div>
          <div className="text-[10px] uppercase tracking-widest text-ink-subtle">
            {portalLabel}
          </div>
        </div>
      </Link>
      <nav className="flex flex-col gap-0.5">
        {items.map((item) => {
          const active =
            activePath === item.href ||
            (item.href !== "/" && activePath.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-bg-elevated text-ink border border-line-strong"
                  : "text-ink-muted hover:bg-bg-elevated/60 hover:text-ink border border-transparent",
              )}
            >
              <span
                className={cn(
                  "shrink-0",
                  active ? "text-accent-gold" : "text-ink-subtle",
                )}
              >
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="text-xs">{item.badge}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-2 pt-6 text-[10px] uppercase tracking-widest text-ink-subtle">
        Simulation environment
      </div>
    </aside>
  );
}

"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppDrawerShell({
  eyebrow,
  title,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex items-center gap-3 border-b border-surface-border bg-surface-raised/95 px-3 py-2 backdrop-blur-md lg:hidden pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-surface-border text-ink"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-gold">
            {eyebrow}
          </p>
          <p className="truncate text-sm font-semibold text-ink">{title}</p>
        </div>
      </header>

      {open ? (
        <button
          type="button"
          aria-label="Close menu overlay"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(18rem,86vw)] flex-col border-r border-surface-border bg-surface-raised pt-[env(safe-area-inset-top)] shadow-2xl transition-transform duration-200 lg:static lg:z-auto lg:w-60 lg:translate-x-0 lg:shadow-none lg:pt-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {children}
        {footer}
      </aside>
    </>
  );
}

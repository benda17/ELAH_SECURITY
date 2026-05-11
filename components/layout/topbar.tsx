import { LogOut } from "lucide-react";
import { RoleBadge, TierBadge } from "@/components/ui/badge";
import { logoutAction } from "@/app/actions/auth";

export function Topbar({
  userName,
  email,
  role,
  tier,
  pageTitle,
  pageSubtitle,
}: {
  userName: string;
  email: string;
  role: string;
  tier?: string | null;
  pageTitle: string;
  pageSubtitle?: string;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg-base/85 backdrop-blur">
      <div className="flex items-center justify-between gap-6 px-6 py-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-widest text-ink-subtle">
            {pageSubtitle ?? "ELAH Banking Simulation"}
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-ink">
            {pageTitle}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex sm:items-center sm:gap-2">
            <RoleBadge role={role} />
            {tier ? <TierBadge tier={tier} /> : null}
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-ink">{userName}</div>
            <div className="text-xs text-ink-subtle">{email}</div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-bg-panel/60 px-3 py-2 text-xs font-medium text-ink-muted transition-colors hover:bg-bg-elevated hover:text-ink"
              aria-label="Sign out"
            >
              <LogOut className="size-3.5" />
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

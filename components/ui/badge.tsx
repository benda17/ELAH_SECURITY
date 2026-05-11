import { cn } from "@/lib/utils";

type Variant =
  | "default"
  | "tier-basic"
  | "tier-premium"
  | "tier-vip"
  | "role-customer"
  | "role-manager"
  | "role-admin"
  | "role-agent"
  | "risk-low"
  | "risk-medium"
  | "risk-high"
  | "risk-critical"
  | "status-pending"
  | "status-approved"
  | "status-rejected"
  | "status-blocked"
  | "warning"
  | "info";

const VARIANTS: Record<Variant, string> = {
  default:
    "bg-bg-elevated text-ink border border-line",
  "tier-basic":
    "bg-bg-elevated text-ink-muted border border-line",
  "tier-premium":
    "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30",
  "tier-vip":
    "bg-accent-gold/10 text-accent-gold border border-accent-gold/40 shadow-glow",
  "role-customer":
    "bg-bg-elevated text-ink-muted border border-line",
  "role-manager":
    "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30",
  "role-admin":
    "bg-accent-rose/10 text-accent-rose border border-accent-rose/30",
  "role-agent":
    "bg-accent-amber/10 text-accent-amber border border-accent-amber/40",
  "risk-low":
    "bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/30",
  "risk-medium":
    "bg-accent-amber/10 text-accent-amber border border-accent-amber/30",
  "risk-high":
    "bg-accent-rose/10 text-accent-rose border border-accent-rose/30",
  "risk-critical":
    "bg-accent-rose/20 text-accent-rose border border-accent-rose/60 font-semibold",
  "status-pending":
    "bg-accent-amber/10 text-accent-amber border border-accent-amber/30",
  "status-approved":
    "bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/30",
  "status-rejected":
    "bg-accent-rose/10 text-accent-rose border border-accent-rose/30",
  "status-blocked":
    "bg-accent-rose/20 text-accent-rose border border-accent-rose/50",
  warning:
    "bg-accent-amber/10 text-accent-amber border border-accent-amber/30",
  info:
    "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30",
};

export function Badge({
  variant = "default",
  className,
  children,
}: {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide",
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { v: Variant; label: string }> = {
    regular_customer: { v: "role-customer", label: "Customer" },
    premium_customer: { v: "role-customer", label: "Customer" },
    vip_customer: { v: "role-customer", label: "Customer" },
    bank_manager: { v: "role-manager", label: "Manager" },
    security_reviewer: { v: "role-admin", label: "Security" },
    ai_agent: { v: "role-agent", label: "AI Agent" },
  };
  const e = map[role] ?? { v: "default" as Variant, label: role };
  return <Badge variant={e.v}>{e.label}</Badge>;
}

export function TierBadge({ tier }: { tier: string }) {
  const map: Record<string, { v: Variant; label: string }> = {
    basic: { v: "tier-basic", label: "Basic" },
    premium: { v: "tier-premium", label: "Premium" },
    vip: { v: "tier-vip", label: "VIP" },
  };
  const e = map[tier];
  if (!e) return null;
  return <Badge variant={e.v}>{e.label}</Badge>;
}

export function RiskBadge({ level }: { level: string }) {
  const map: Record<string, Variant> = {
    low: "risk-low",
    medium: "risk-medium",
    high: "risk-high",
    critical: "risk-critical",
  };
  return (
    <Badge variant={map[level] ?? "default"} className="uppercase">
      {level}
    </Badge>
  );
}

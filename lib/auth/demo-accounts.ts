/**
 * Canonical demo login identities shown on the login page.
 * `seed:dataset` renames one account per role to these emails so login always works.
 */
export const DEMO_PASSWORD = "DemoPass123!";

export const DEMO_ACCOUNTS = [
  {
    email: "basic.customer@elah.demo",
    label: "Regular customer",
    role: "regular_customer" as const,
  },
  {
    email: "premium.customer@elah.demo",
    label: "Premium customer",
    role: "premium_customer" as const,
  },
  {
    email: "vip.customer@elah.demo",
    label: "VIP / Private banking",
    role: "vip_customer" as const,
  },
  {
    email: "manager@elah.demo",
    label: "Bank manager",
    role: "bank_manager" as const,
  },
  {
    email: "security.admin@elah.demo",
    label: "Security reviewer",
    role: "security_reviewer" as const,
  },
  {
    email: "agent@elah.demo",
    label: "AI agent placeholder",
    role: "ai_agent" as const,
  },
] as const;

export const DEFAULT_DEMO_LOGIN_EMAIL = DEMO_ACCOUNTS[0].email;

export const CANONICAL_DEMO_EMAILS = DEMO_ACCOUNTS.map((a) => ({
  email: a.email,
  role: a.role,
}));

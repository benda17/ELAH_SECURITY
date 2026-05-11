/**
 * Centralized role + tier constants for PROJECT ELAH.
 * Keep these in sync with the README "Core Roles" + "Tiered Customer Logic" sections.
 */

export const ROLES = {
  REGULAR_CUSTOMER: "regular_customer",
  PREMIUM_CUSTOMER: "premium_customer",
  VIP_CUSTOMER: "vip_customer",
  BANK_MANAGER: "bank_manager",
  SECURITY_REVIEWER: "security_reviewer",
  AI_AGENT: "ai_agent",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const TIERS = {
  BASIC: "basic",
  PREMIUM: "premium",
  VIP: "vip",
} as const;

export type Tier = (typeof TIERS)[keyof typeof TIERS];

export const CUSTOMER_ROLES: Role[] = [
  ROLES.REGULAR_CUSTOMER,
  ROLES.PREMIUM_CUSTOMER,
  ROLES.VIP_CUSTOMER,
];

export function isCustomerRole(role: string): role is Role {
  return CUSTOMER_ROLES.includes(role as Role);
}

export function actorTypeFromRole(role: string) {
  if (CUSTOMER_ROLES.includes(role as Role)) return "customer" as const;
  if (role === ROLES.BANK_MANAGER) return "manager" as const;
  if (role === ROLES.SECURITY_REVIEWER) return "admin" as const;
  if (role === ROLES.AI_AGENT) return "ai_agent" as const;
  return "customer" as const;
}

export function tierFromRole(role: string): Tier | "not_applicable" {
  switch (role) {
    case ROLES.REGULAR_CUSTOMER:
      return TIERS.BASIC;
    case ROLES.PREMIUM_CUSTOMER:
      return TIERS.PREMIUM;
    case ROLES.VIP_CUSTOMER:
      return TIERS.VIP;
    default:
      return "not_applicable";
  }
}

/**
 * Tier-specific policy. Numbers are mock simulated USD limits only.
 */
export const TIER_POLICY = {
  basic: {
    dailyTransferLimit: 5_000,
    perTransferLimit: 5_000,
    approvalRequiredAbove: 2_500,
    loanRequestLimit: 25_000,
    canSeeInvestments: false,
    documentClasses: ["statement", "tax"],
  },
  premium: {
    dailyTransferLimit: 25_000,
    perTransferLimit: 25_000,
    approvalRequiredAbove: 15_000,
    loanRequestLimit: 100_000,
    canSeeInvestments: true,
    documentClasses: ["statement", "tax", "investment"],
  },
  vip: {
    dailyTransferLimit: 100_000,
    perTransferLimit: 100_000,
    approvalRequiredAbove: 50_000,
    loanRequestLimit: 1_000_000,
    canSeeInvestments: true,
    documentClasses: ["statement", "tax", "investment", "private"],
  },
} as const;

export function tierPolicy(tier: string) {
  if (tier === "premium") return TIER_POLICY.premium;
  if (tier === "vip") return TIER_POLICY.vip;
  return TIER_POLICY.basic;
}

export const ROLE_LABEL: Record<string, string> = {
  regular_customer: "Regular Customer",
  premium_customer: "Premium Customer",
  vip_customer: "VIP / Private Banking",
  bank_manager: "Bank Manager",
  security_reviewer: "Security Reviewer",
  ai_agent: "AI Agent",
};

export const TIER_LABEL: Record<string, string> = {
  basic: "Basic",
  premium: "Premium",
  vip: "VIP",
  not_applicable: "—",
};

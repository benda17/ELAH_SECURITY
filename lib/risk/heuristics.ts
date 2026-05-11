/**
 * Simple heuristic detectors for "prompt-injection-like" text in customer/manager
 * inputs. These are intentionally crude — they're just enough to demonstrate
 * how ELAH would later detect untrusted content influencing actions.
 */

const INJECTION_PATTERNS = [
  /ignore (all )?(previous|prior) instructions/i,
  /override .*(approval|policy|limit)/i,
  /transfer .*to (acct|account) [a-z0-9_-]+/i,
  /you (are|must) now/i,
  /\bsudo\b/i,
  /system: /i,
  /\[\[.*\]\]/, // double-bracket "hidden" instructions
  /manager override/i,
  /refund by transferring/i,
  /approve all/i,
];

export function detectInjectionLike(text: string | null | undefined) {
  if (!text) return { matched: false as const, patterns: [] as string[] };
  const matches: string[] = [];
  for (const re of INJECTION_PATTERNS) {
    if (re.test(text)) matches.push(re.source);
  }
  return matches.length > 0
    ? { matched: true as const, patterns: matches }
    : { matched: false as const, patterns: [] };
}

export function riskForTransfer(amount: number, tierApprovalAbove: number) {
  if (amount >= tierApprovalAbove * 4) return "critical" as const;
  if (amount >= tierApprovalAbove * 2) return "high" as const;
  if (amount >= tierApprovalAbove) return "medium" as const;
  return "low" as const;
}

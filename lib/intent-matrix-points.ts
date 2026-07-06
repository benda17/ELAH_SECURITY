export const RISK_COLORS: Record<string, string> = {
  low: "#34d399",
  medium: "#fbbf24",
  high: "#fb923c",
  critical: "#fb7185",
};

export type IntentMatrixPoint = {
  id: string;
  x: number;
  y: number;
  z: number;
  riskLevel: string;
  actionStatus: string;
  intentId: string;
  intentLabel: string;
  userId: string;
  timestamp: string;
  messageSnippet: string;
  toolName: string | null;
  policyDecision: string | null;
};

function clamp(n: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, n));
}

/** Same intentId shares taxonomy coordinates — spread siblings in a ring so stacks become visible. */
export function spreadIntentPoints(points: IntentMatrixPoint[]): IntentMatrixPoint[] {
  const groups = new Map<string, IntentMatrixPoint[]>();
  for (const p of points) {
    const group = groups.get(p.intentId) ?? [];
    group.push(p);
    groups.set(p.intentId, group);
  }

  const spread: IntentMatrixPoint[] = [];
  for (const group of groups.values()) {
    const n = group.length;
    const radius = Math.min(0.14, 0.025 + 0.008 * Math.sqrt(n));
    group.forEach((p, i) => {
      const angle = (2 * Math.PI * i) / n;
      spread.push({
        ...p,
        x: clamp(p.x + radius * Math.cos(angle)),
        y: clamp(p.y + radius * Math.sin(angle)),
      });
    });
  }
  return spread;
}

export function riskColorHex(level: string) {
  return RISK_COLORS[level] ?? "#94a3b8";
}

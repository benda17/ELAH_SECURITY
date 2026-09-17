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
  /** CS/CRM Phase 7 — optional; banking points omit these. */
  conversationId?: string | null;
  eventId?: string | null;
  reasonCodes?: string[];
  scorer?: string | null;
  confidence?: number | null;
  genuineIntentScore?: number | null;
  recommendation?: string | null;
  unavailable?: boolean;
  unavailableReason?: string | null;
  metadataSanitized?: Record<string, unknown> | null;
  deviation?: boolean;
};

export type IntentTrajectory = {
  conversationId: string;
  coords: [number, number, number][];
};

const MAX_TRAJECTORY_CONVERSATIONS = 20;

/** Last N conversations with 2+ points, in timestamp order. Display-only lines. */
export function buildTrajectories(
  points: IntentMatrixPoint[],
  maxConversations = MAX_TRAJECTORY_CONVERSATIONS,
): IntentTrajectory[] {
  const byConv = new Map<string, IntentMatrixPoint[]>();
  for (const p of points) {
    if (!p.conversationId) continue;
    const group = byConv.get(p.conversationId) ?? [];
    group.push(p);
    byConv.set(p.conversationId, group);
  }

  const ranked = [...byConv.entries()]
    .map(([conversationId, group]) => {
      const ordered = [...group].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
      const latest = ordered[ordered.length - 1]?.timestamp ?? "";
      return { conversationId, ordered, latest };
    })
    .filter((row) => row.ordered.length >= 2)
    .sort((a, b) => (a.latest < b.latest ? 1 : -1))
    .slice(0, maxConversations);

  return ranked.map((row) => ({
    conversationId: row.conversationId,
    coords: row.ordered.map((p) => [p.x, p.y, p.z] as [number, number, number]),
  }));
}

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

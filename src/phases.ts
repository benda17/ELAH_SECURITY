export const PHASE_ORDER = [
  "Phase 0 — Product definition and architecture",
  "Phase 1 — Banking simulator stabilization",
  "Phase 2 — Agent observability and event collection",
  "Phase 3 — ELAH service foundation",
  "Phase 4 — Dataset and labeling system",
  "Phase 5 — Baseline scoring system",
  "Phase 6 — ELAH model development",
  "Phase 7 — Explainability and intention graph",
  "Phase 8 — Security architecture and red teaming",
  "Phase 9 — Product dashboard and analyst experience",
  "Phase 10 — Evaluation and MVP readiness",
  "Phase 11 — User discovery and customer validation",
  "Phase 12 — Pilot acquisition",
  "Phase 13 — Fundraising and investor outreach",
  "Phase 14 — Company, legal, privacy, and compliance",
  "Phase 15 — Team and operations",
] as const;

export function shortPhase(phase: string) {
  const m = /^Phase (\d+)/.exec(phase);
  return m ? `P${m[1]}` : phase;
}

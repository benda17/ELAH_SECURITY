import { ELAH_BANKING_INTENTS } from "@/lib/elah/types";
import type { ElahScoreSnapshot, ElahScoredSnapshot } from "@/lib/elah/score-read";

/**
 * Pure helpers for the explanation panel (ELAH-P7-PANEL-001,
 * ELAH-P7-FAITH-001). Everything here re-shapes fields that are already on
 * the score snapshot; nothing adds reasons, alternatives, or evidence.
 */

/** Scorers without a calibration note (panel §3 "Uncalibrated (rules)"). */
export const UNCALIBRATED_SCORERS = new Set(["rules_v0", "cs_crm_rules_v0", "rules_stub_v0", "intent_matrix"]);

export function isUncalibratedScorer(scorer: string | null | undefined): boolean {
  return !scorer || UNCALIBRATED_SCORERS.has(scorer);
}

/** policyHook.recommendation values allowed by ELAH-BASE-RC-001. */
export const HOOK_RECOMMENDATIONS = ["none", "watch", "review", "step_up_hint"] as const;

/** Enforcement words ELAH must never emit as a code or hook value (panel §6). */
export const FORBIDDEN_TOKENS = new Set([
  "allow",
  "deny",
  "block",
  "confirm",
  "execute",
  "rc_allow",
  "rc_deny",
  "elah_block",
]);

export function isForbiddenToken(token: string): boolean {
  return FORBIDDEN_TOKENS.has(token.trim().toLowerCase());
}

export interface ReasonCodeGroups {
  /** De-duped `RC_*` codes in snapshot order. */
  codes: string[];
  /** Other tokens, shown verbatim and flagged (never hidden). */
  nonconforming: string[];
  /** Enforcement-shaped tokens (e.g. RC_DENY), shown verbatim and flagged. */
  forbidden: string[];
}

export function groupReasonCodes(reasons: readonly string[]): ReasonCodeGroups {
  const seen = new Set<string>();
  const out: ReasonCodeGroups = { codes: [], nonconforming: [], forbidden: [] };
  for (const raw of reasons) {
    const reason = raw.trim();
    if (!reason || seen.has(reason)) continue;
    seen.add(reason);
    if (isForbiddenToken(reason)) out.forbidden.push(reason);
    else if (reason.startsWith("RC_")) out.codes.push(reason);
    else out.nonconforming.push(reason);
  }
  return out;
}

export type HookRecommendationState =
  | { kind: "missing" }
  | { kind: "known"; value: (typeof HOOK_RECOMMENDATIONS)[number] }
  | { kind: "unrecognized"; value: string };

export function classifyHookRecommendation(value: string | null | undefined): HookRecommendationState {
  if (!value) return { kind: "missing" };
  const known = (HOOK_RECOMMENDATIONS as readonly string[]).includes(value);
  return known
    ? { kind: "known", value: value as (typeof HOOK_RECOMMENDATIONS)[number] }
    : { kind: "unrecognized", value };
}

export interface AlternativeLine {
  kind: "planner_disagreement" | "classifier_disagreement" | "counter_signal";
  text: string;
}

export interface AlternativeSources {
  /** Envelope `detectedIntent` (planner / simulator label). */
  detectedIntent?: string | null;
  /** Simulator intent classifier hint (`correlateTurn().intent.intentLabel`). */
  classifierIntent?: string | null;
}

const INTENTS: readonly string[] = ELAH_BANKING_INTENTS;

/**
 * Alternative interpretations from existing structured disagreement only
 * (panel §9). Empty array → the UI shows "No structured alternative."
 */
export function structuredAlternatives(
  snapshot: ElahScoredSnapshot,
  sources: AlternativeSources = {},
): AlternativeLine[] {
  const lines: AlternativeLine[] = [];
  const elahLabel = snapshot.intentLabel;
  if (elahLabel && sources.detectedIntent && sources.detectedIntent !== elahLabel) {
    lines.push({
      kind: "planner_disagreement",
      text: `Planner: ${sources.detectedIntent}. ELAH: ${elahLabel}.`,
    });
  }
  if (
    elahLabel &&
    sources.classifierIntent &&
    sources.classifierIntent !== elahLabel &&
    sources.classifierIntent !== sources.detectedIntent
  ) {
    lines.push({
      kind: "classifier_disagreement",
      text: `Simulator classifier: ${sources.classifierIntent}. ELAH: ${elahLabel}.`,
    });
  }
  for (const signal of snapshot.explanation.negativeSignals) {
    const family = INTENTS.find((intent) => intent !== elahLabel && signal.includes(intent));
    if (family) lines.push({ kind: "counter_signal", text: `Counter-signal: ${signal}.` });
  }
  return lines;
}

/** Percent string for a [0,1] value, e.g. 0.823 → "82%". */
export function formatPercent(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `${Math.round(value * 100)}%`;
}

/** UI-only confidence word (panel §3); never a probability of allow. */
export function confidenceWord(confidence: number | null | undefined): "High" | "Moderate" | "Low" | null {
  if (typeof confidence !== "number" || !Number.isFinite(confidence)) return null;
  if (confidence >= 0.75) return "High";
  if (confidence >= 0.5) return "Moderate";
  return "Low";
}

export function hasAnyEvidence(snapshot: ElahScoreSnapshot | null): boolean {
  if (!snapshot || snapshot.kind !== "scored") return false;
  const { explanation, policyHook } = snapshot;
  return (
    explanation.matchedSignals.length > 0 ||
    explanation.weakSignals.length > 0 ||
    explanation.negativeSignals.length > 0 ||
    !!explanation.summary ||
    policyHook.reasons.length > 0
  );
}

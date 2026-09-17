/**
 * CS/CRM intention-graph coordinates (Phase 7 display-only calc spec).
 *
 * Frozen axes: X humanAgency, Y financialRisk, Z emotionalUrgency. No 4th axis.
 * Values are looked up from this atlas in code — they are NOT stored on CRM Neon
 * (no coordinate columns; do not prisma db push). Not a trained model.
 * Live scoring remains cs_crm_rules_v0 / ElahScoreSnapshot. Offline NB is not wired.
 *
 * Overlay-only: opacity (confidence), dashed/hollow (unavailable/abstain),
 * colour (financialRisk bands), highlight (injection / policy deny / refund_abuse / exfil).
 */

export const CS_CRM_INTENTS = [
  "ticket_status",
  "list_tickets",
  "create_ticket",
  "account_lookup",
  "profile_update",
  "refund_request",
  "cancel_subscription",
  "support_escalation",
  "add_crm_note",
  "ambiguous_crm_request",
  "non_crm_request",
  "prompt_injection_or_policy_bypass",
  "refund_abuse",
  "unauthorized_crm_overwrite",
  "data_exfil_ticket_export",
  "mistaken_agent",
] as const;

export type CsCrmIntent = (typeof CS_CRM_INTENTS)[number];

export type CsCrmCoordinates = {
  humanAgency: number;
  financialRisk: number;
  emotionalUrgency: number;
};

/** Must match docs/Phase 7 …/ELAH_COORDINATE_CALCULATION.md §3 (cs_crm_atlas 0.1). */
export const CS_CRM_COORDINATE_ATLAS: Record<CsCrmIntent, CsCrmCoordinates> = {
  ticket_status: { humanAgency: 0.32, financialRisk: 0.14, emotionalUrgency: 0.22 },
  list_tickets: { humanAgency: 0.3, financialRisk: 0.16, emotionalUrgency: 0.2 },
  create_ticket: { humanAgency: 0.48, financialRisk: 0.2, emotionalUrgency: 0.34 },
  account_lookup: { humanAgency: 0.34, financialRisk: 0.18, emotionalUrgency: 0.2 },
  profile_update: { humanAgency: 0.55, financialRisk: 0.32, emotionalUrgency: 0.22 },
  // Genuine refund = high agency AND high financial risk (not a contradiction).
  refund_request: { humanAgency: 0.7, financialRisk: 0.74, emotionalUrgency: 0.36 },
  cancel_subscription: { humanAgency: 0.66, financialRisk: 0.6, emotionalUrgency: 0.32 },
  support_escalation: { humanAgency: 0.42, financialRisk: 0.18, emotionalUrgency: 0.55 },
  add_crm_note: { humanAgency: 0.5, financialRisk: 0.24, emotionalUrgency: 0.2 },
  // Ambiguous sits mid-cube; renderer applies a lower-confidence opacity overlay.
  ambiguous_crm_request: { humanAgency: 0.35, financialRisk: 0.25, emotionalUrgency: 0.3 },
  non_crm_request: { humanAgency: 0.12, financialRisk: 0.08, emotionalUrgency: 0.1 },
  // Injection / exfil = low agency, high financial risk (hostile harm potential).
  prompt_injection_or_policy_bypass: {
    humanAgency: 0.15,
    financialRisk: 0.88,
    emotionalUrgency: 0.28,
  },
  refund_abuse: { humanAgency: 0.36, financialRisk: 0.84, emotionalUrgency: 0.42 },
  unauthorized_crm_overwrite: { humanAgency: 0.22, financialRisk: 0.72, emotionalUrgency: 0.3 },
  data_exfil_ticket_export: { humanAgency: 0.18, financialRisk: 0.8, emotionalUrgency: 0.26 },
  mistaken_agent: { humanAgency: 0.58, financialRisk: 0.48, emotionalUrgency: 0.28 },
};

const UNKNOWN_FALLBACK: CsCrmCoordinates = CS_CRM_COORDINATE_ATLAS.ambiguous_crm_request;

export const DEVIATION_INTENTS = new Set<string>([
  "prompt_injection_or_policy_bypass",
  "refund_abuse",
  "data_exfil_ticket_export",
]);

/** Static nearby-intent notes from reason-code cues — not a second model. */
export const CS_CRM_REASON_NOTES: Record<string, string> = {
  RC_INJECTION_OVERRIDE:
    "Nearby read: a clumsy genuine ticket or refund that happens to contain override language. Company policy still owns allow/deny.",
  RC_DATA_EXFIL:
    "Nearby read: list_tickets of the caller’s own cases. Check tenant scope before treating as export.",
  RC_REFUND_ABUSE:
    "Nearby read: entitled refund_request. Entitlement is company policy, not ELAH.",
  RC_UNAUTHORIZED_OVERWRITE:
    "Nearby read: genuine profile_update of the caller’s own contact fields.",
  RC_AMBIGUOUS:
    "Could still be ticket_status or account_lookup once the user names a ticket or workspace.",
  RC_MISTAKEN_AGENT: "User goal may be genuine; the planned tool was the mismatch.",
  RC_NON_CRM: "If CRM nouns appear on the next turn, re-score as a tool-family intent.",
  RC_HIGH_IMPACT_CRM:
    "Nearby: refund_abuse if the caller is not entitled; cancel_subscription if the verb is mixed.",
  RC_POLICY_DENIED_NOT_ELAH:
    "Company policy denied the tool. ELAH did not block or execute.",
  RC_CRM_LEXICON: "Lexicon match for a support/CRM act — not a second model.",
  RC_PLANNED_TOOL: "A CRM tool was planned; that is a cue, not an allow.",
  RC_ADD_CRM_NOTE: "Nearby: profile_update if the user meant a field write.",
};

const SENSITIVE_KEY = /password|passwd|secret|token|api[_-]?key|authorization|cookie|ssn|credit|cvv|pin/i;

export type NormalizedActionEvidence = {
  platformAction: string | null;
  normalizedActionId: string | null;
  normalizedActionName: string | null;
  actionClass: string | null;
  actionImpact: string | null;
  actionMappingStatus: "metadata" | "fallback" | "unmapped";
  actionMappingReason: string;
};

type ActionDefinition = Pick<
  NormalizedActionEvidence,
  "normalizedActionId" | "normalizedActionName" | "actionClass" | "actionImpact"
>;

const ACTIONS_BY_ID: Record<string, ActionDefinition> = {
  "SUP-25": {
    normalizedActionId: "SUP-25",
    normalizedActionName: "view_queue",
    actionClass: "Observe",
    actionImpact: "Moderate",
  },
  "SUP-01": {
    normalizedActionId: "SUP-01",
    normalizedActionName: "view_ticket",
    actionClass: "Observe",
    actionImpact: "Low",
  },
  "SUP-02": {
    normalizedActionId: "SUP-02",
    normalizedActionName: "create_ticket",
    actionClass: "Change",
    actionImpact: "Moderate",
  },
  "SUP-03": {
    normalizedActionId: "SUP-03",
    normalizedActionName: "reply_to_customer",
    actionClass: "Change",
    actionImpact: "Moderate",
  },
  "CRM-01": {
    normalizedActionId: "CRM-01",
    normalizedActionName: "view_record",
    actionClass: "Observe",
    actionImpact: "Low",
  },
  "CRM-07": {
    normalizedActionId: "CRM-07",
    normalizedActionName: "edit_record_property",
    actionClass: "Change",
    actionImpact: "Moderate",
  },
  "SMP-25": {
    normalizedActionId: "SMP-25",
    normalizedActionName: "cancel_subscription",
    actionClass: "Change",
    actionImpact: "Critical",
  },
  "SUP-18": {
    normalizedActionId: "SUP-18",
    normalizedActionName: "escalate_ticket",
    actionClass: "Change",
    actionImpact: "High",
  },
  "CRM-18": {
    normalizedActionId: "CRM-18",
    normalizedActionName: "add_note",
    actionClass: "Change",
    actionImpact: "Moderate",
  },
};

/** Research-note-01 fallbacks for historical simulator rows without normalized metadata. */
export const CRM_TOOL_ACTION_FALLBACKS: Record<string, ActionDefinition | null> = {
  list_tickets: ACTIONS_BY_ID["SUP-25"]!,
  get_ticket: ACTIONS_BY_ID["SUP-01"]!,
  create_ticket: ACTIONS_BY_ID["SUP-02"]!,
  add_ticket_comment: ACTIONS_BY_ID["SUP-03"]!,
  lookup_account: ACTIONS_BY_ID["CRM-01"]!,
  update_contact_email: ACTIONS_BY_ID["CRM-07"]!,
  update_contact_phone: ACTIONS_BY_ID["CRM-07"]!,
  request_refund: null,
  cancel_subscription: ACTIONS_BY_ID["SMP-25"]!,
  escalate_to_human: ACTIONS_BY_ID["SUP-18"]!,
  add_crm_note: ACTIONS_BY_ID["CRM-18"]!,
};

function stringField(
  records: Record<string, unknown>[],
  ...keys: string[]
): string | null {
  for (const record of records) {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }
  return null;
}

/**
 * Prefer producer-supplied normalized action metadata; otherwise use the reviewed
 * simulator-tool fallback. Action evidence says what happened, not why or policy.
 */
export function resolveNormalizedActionEvidence(
  toolName: string | null | undefined,
  metadata: Record<string, unknown>,
): NormalizedActionEvidence {
  const nestedCandidate =
    metadata.normalizedAction ?? metadata.normalized_action ?? metadata.actionEvidence;
  const nested =
    nestedCandidate &&
    typeof nestedCandidate === "object" &&
    !Array.isArray(nestedCandidate)
      ? (nestedCandidate as Record<string, unknown>)
      : {};
  const records = [nested, metadata];
  const platformAction =
    stringField(
      records,
      "platformAction",
      "platform_action",
      "platformActionName",
      "toolName",
      "tool_name",
      "tool",
    ) ??
    toolName ??
    null;
  const metadataId = stringField(records, "normalizedActionId", "normalized_action_id", "action_id");
  const metadataName = stringField(
    records,
    "normalizedActionName",
    "normalizedAction",
    "normalized_action_name",
    "action_name",
  );
  const metadataClass = stringField(records, "actionClass", "action_class");
  const metadataImpact = stringField(records, "actionImpact", "action_impact", "impact");
  const metadataStatus = stringField(
    records,
    "actionMappingStatus",
    "action_mapping_status",
    "mappingStatus",
  );
  const metadataReason = stringField(
    records,
    "actionMappingReason",
    "action_mapping_reason",
    "mappingReason",
  );

  if (
    metadataId ||
    metadataName ||
    metadataClass ||
    metadataImpact ||
    metadataStatus === "mapped"
  ) {
    const known = metadataId ? ACTIONS_BY_ID[metadataId] : undefined;
    return {
      platformAction,
      normalizedActionId: metadataId,
      normalizedActionName: metadataName ?? known?.normalizedActionName ?? null,
      actionClass: metadataClass ?? known?.actionClass ?? null,
      actionImpact: metadataImpact ?? known?.actionImpact ?? null,
      actionMappingStatus: "metadata",
      actionMappingReason:
        metadataReason ?? "Producer-supplied normalized action metadata.",
    };
  }

  if (metadataStatus === "unmapped") {
    return {
      platformAction,
      normalizedActionId: null,
      normalizedActionName: null,
      actionClass: metadataClass,
      actionImpact: metadataImpact,
      actionMappingStatus: "unmapped",
      actionMappingReason:
        metadataReason ?? "Producer explicitly marked this action unmapped.",
    };
  }

  const fallback = toolName ? CRM_TOOL_ACTION_FALLBACKS[toolName] : undefined;
  if (fallback) {
    return {
      platformAction,
      ...fallback,
      actionMappingStatus: "fallback",
      actionMappingReason:
        "Historical fallback verified against ELAH Research Note 01 (17 Sep 2026).",
    };
  }

  return {
    platformAction,
    normalizedActionId: null,
    normalizedActionName: null,
    actionClass: null,
    actionImpact: null,
    actionMappingStatus: "unmapped",
    actionMappingReason:
      toolName === "request_refund"
        ? "Research Note 01 contains no normalized refund action ID; no ID invented."
        : "No producer metadata or reviewed tool fallback is available.",
  };
}

export function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

export function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}

export function isCsCrmIntent(value: string): value is CsCrmIntent {
  return (CS_CRM_INTENTS as readonly string[]).includes(value);
}

/** Display coordinates for an intent label. Unknown → ambiguous_crm_request. */
export function csCrmCoordinates(intentLabel: string | null | undefined): CsCrmCoordinates {
  const key = intentLabel && isCsCrmIntent(intentLabel) ? intentLabel : "ambiguous_crm_request";
  const raw = CS_CRM_COORDINATE_ATLAS[key] ?? UNKNOWN_FALLBACK;
  return {
    humanAgency: round3(clamp01(raw.humanAgency)),
    financialRisk: round3(clamp01(raw.financialRisk)),
    emotionalUrgency: round3(clamp01(raw.emotionalUrgency)),
  };
}

/** Overlay colour bands from Financial Risk (Y). Not an ELAH allow/deny. */
export function financialRiskLevel(financialRisk: number): "low" | "medium" | "high" | "critical" {
  if (financialRisk >= 0.75) return "critical";
  if (financialRisk >= 0.5) return "high";
  if (financialRisk >= 0.3) return "medium";
  return "low";
}

export function isDeviationPoint(input: {
  intentLabel?: string | null;
  policyDecision?: string | null;
  eventType?: string | null;
}) {
  if (input.intentLabel && DEVIATION_INTENTS.has(input.intentLabel)) return true;
  if (input.policyDecision === "deny") return true;
  if (input.eventType === "policy_denied") return true;
  return false;
}

export function pointDisplayOpacity(input: {
  confidence?: number | null;
  unavailable?: boolean;
  recommendation?: string | null;
}) {
  if (input.unavailable) return 0.32;
  if (input.recommendation === "abstain" && input.confidence == null) return 0.4;
  if (input.confidence == null) return 0.82;
  return round3(clamp01(0.2 + input.confidence * 0.75));
}

export function alternativeInterpretations(reasonCodes: string[]): string[] {
  const notes: string[] = [];
  const seen = new Set<string>();
  for (const code of reasonCodes) {
    const note = CS_CRM_REASON_NOTES[code];
    if (note && !seen.has(note)) {
      seen.add(note);
      notes.push(note);
    }
    if (notes.length >= 3) break;
  }
  if (notes.length === 0) {
    return [
      "No second model. Other labels in the 16-intent CS/CRM set may fit if cues were thin.",
    ];
  }
  return notes;
}

export function sanitizeMetadata(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (SENSITIVE_KEY.test(key)) {
      out[key] = "[redacted]";
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = sanitizeMetadata(value as Record<string, unknown>);
    } else {
      out[key] = value;
    }
  }
  return out;
}

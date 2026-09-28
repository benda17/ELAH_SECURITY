/**
 * Closed reason-code catalog for rules_v0 policyHook.reasons.
 * Codes are hints for analysts/SOC — never allow / deny / block / confirm.
 */
export const REASON_CODES = [
  "RC_INJECTION_OVERRIDE",
  "RC_P0_EXTERNAL_TRANSFER",
  "RC_P0_INTERNAL_TRANSFER",
  "RC_P0_BILL_PAYMENT",
  "RC_ABSTAIN_LOW_CONFIDENCE",
  "RC_NO_TOOL_AMBIGUOUS",
  "RC_HIGH_VALUE",
  "RC_POLICY_DENIED_NOT_ELAH",
  "RC_NON_BANKING",
  "RC_PLANNED_TOOL",
  "RC_NONE",
] as const;

export type ReasonCode = (typeof REASON_CODES)[number];

export const RC_INJECTION_OVERRIDE = "RC_INJECTION_OVERRIDE" satisfies ReasonCode;
export const RC_P0_EXTERNAL_TRANSFER = "RC_P0_EXTERNAL_TRANSFER" satisfies ReasonCode;
export const RC_P0_INTERNAL_TRANSFER = "RC_P0_INTERNAL_TRANSFER" satisfies ReasonCode;
export const RC_P0_BILL_PAYMENT = "RC_P0_BILL_PAYMENT" satisfies ReasonCode;
export const RC_ABSTAIN_LOW_CONFIDENCE = "RC_ABSTAIN_LOW_CONFIDENCE" satisfies ReasonCode;
export const RC_NO_TOOL_AMBIGUOUS = "RC_NO_TOOL_AMBIGUOUS" satisfies ReasonCode;
export const RC_HIGH_VALUE = "RC_HIGH_VALUE" satisfies ReasonCode;
export const RC_POLICY_DENIED_NOT_ELAH = "RC_POLICY_DENIED_NOT_ELAH" satisfies ReasonCode;
export const RC_NON_BANKING = "RC_NON_BANKING" satisfies ReasonCode;
export const RC_PLANNED_TOOL = "RC_PLANNED_TOOL" satisfies ReasonCode;
export const RC_NONE = "RC_NONE" satisfies ReasonCode;

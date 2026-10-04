# ELAH Baseline Reason Codes

| Field | Value |
|---|---|
| Document ID | ELAH-BASE-RC-001 |
| Version | **1.0** |
| Status | **Proposed** |
| Date | 26 August 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related tasks | `task-5-add-reason-codes` |
| Depends on | `ELAH-SPEC-OUTPUT-001` §5.6, `ELAH-SPEC-EXPLAIN-001`, `ELAH-BASE-RULES-001`, `ELAH-BASE-FEAT-001` |
| Code | `lib/elah/baseline/` (reason catalog); emitted on `ScoreResponse.score.policyHook.reasons` |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. No ATM, beneficiary-write, or `device_change` product. Do not `prisma db push`. Closed 22-label taxonomy. `rules_v0` is **uncalibrated** and is **not** a trained model.

---

## 1. Purpose

Freeze machine-readable **reason codes** for why `rules_v0` set a given `policyHook.recommendation`.

Codes live in **`policyHook.reasons`**. That array already exists on `ElahScore` (`ELAH-SPEC-OUTPUT-001` §5.6). Phase 5 does **not** add a `reasonCodes` field, a parallel hook, or extra properties on `ScoreResponse`.

---

## 2. Placement and constraints

| Rule | Value |
|---|---|
| Path | `score.policyHook.reasons` |
| Type | `string[]`, required (may be empty when `recommendation` is `none`) |
| Caps | Max **16** items; each max **160** chars; no PII |
| Token shape | `RC_` + `UPPER_SNAKE_CASE` |
| Order | Stable: catalog order below, then de-dupe |
| Human sentence | Optional `explanation.summary` — **not** a substitute for codes |
| New API field | **Forbidden** |

Consumers (dashboard, eval, SOC copy) parse `RC_*`. Free-text reasons from Phase 3 samples (“intentLabel is prompt_injection_or_policy_bypass”) MUST be replaced by the matching code when the baseline adapter is wired. Mixing one code + one short non-PII gloss is allowed only if the string **starts with** `RC_` (e.g. `RC_WATCH_HIGH_FR`). Do not embed amounts, names, or account numbers.

---

## 3. Catalog

### 3.1 Injection / hostility

| Code | Meaning |
|---|---|
| `RC_INJECTION_LEXICON` | Utterance lexicon matched override / ignore-previous / jailbreak-style tokens |
| `RC_INTENT_INJECTION` | Resolved `intentLabel` is `prompt_injection_or_policy_bypass` |
| `RC_POLICY_REFUSED_INJECTION` | Bank policy denied or outcome `refused` / `blocked` with injection-class policy reasons |
| `RC_ACTION_TYPE_INJECTION` | `actionType` is `prompt_injection` (no tool) |

### 3.2 Ambiguity / uncertainty

| Code | Meaning |
|---|---|
| `RC_AMBIGUOUS_INTENT` | Resolved label `ambiguous_banking_request` |
| `RC_SHORT_MESSAGE` | Non-empty utterance below the short-length feature threshold |
| `RC_NO_TOOL_PLAN` | No allow-listed `toolName` and no clear action plan |
| `RC_CONFLICTING_SIGNALS` | Conflict abstention rule (matched and negative signals both ≥ 2, score near 0.50) |
| `RC_ABSTAINED` | `status` is `abstained`; `elahScore` is non-decisive |
| `RC_LOW_CONFIDENCE` | `confidence < 0.40` (v1 default; consumers still key off `status`) |

### 3.3 Money / financial risk (not hostility)

| Code | Meaning |
|---|---|
| `RC_P0_MONEY_MOVE` | Planned P0 money-move tool or intent (internal / external transfer, bill pay, scheduled payment) |
| `RC_P0_ENTITLEMENT` | Card freeze / unfreeze (entitlement change, not a send) |
| `RC_DOCUMENT_EXPORT` | Statement / document export path |
| `RC_HIGH_VALUE_BUCKET` | Amount bucket `large_2000_9999` or `very_large_10000_plus` |
| `RC_HIGH_FINANCIAL_RISK` | Coordinate `financialRisk ≥ 0.70` |
| `RC_AMOUNT_PRESENT` | Monetary amount or non-`none` bucket present |
| `RC_RECIPIENT_PRESENT` | `recipientType` ≠ `none` |

`RC_HIGH_FINANCIAL_RISK` on a genuine wire is a **watch glance**, not a false positive and not a deny.

### 3.4 Banking context / agent

| Code | Meaning |
|---|---|
| `RC_AGENT_CHANNEL` | `source = agent` |
| `RC_UI_CHANNEL` | `source = ui` |
| `RC_TOOL_PLANNED` | Allow-listed `toolName` present |
| `RC_POLICY_NEEDS_CONFIRMATION` | Bank `policy.decision = needs_confirmation` (context; ELAH does not confirm) |
| `RC_POLICY_DENY_CONTEXT` | Bank already `deny` — ELAH is scoring, not denying |
| `RC_NON_BANKING` | Resolved label `non_banking_request` |
| `RC_INTENT_TOOL_MISMATCH` | Planner `detectedIntent` disagrees with planned tool class |

### 3.5 Hook-level (why this recommendation)

| Code | Meaning |
|---|---|
| `RC_REVIEW_INJECTION` | `recommendation = review` because of injection / bypass |
| `RC_REVIEW_ABSTAIN` | `recommendation = review` because ELAH abstained |
| `RC_REVIEW_OFF_INTENT` | `recommendation = review` because `elahScore < 0.25` |
| `RC_WATCH_HIGH_FR` | `recommendation = watch` — elevated FR on an otherwise genuine request |
| `RC_STEP_UP_HINT_ALIGN` | `recommendation = step_up_hint` — bank confirmation already in play; ELAH does not perform MFA |
| `RC_NONE` | Explicit empty-attention marker; omit if `reasons` is `[]` with `none` |

When `recommendation` is `none`, `reasons` SHOULD be `[]`. Do not pad with `RC_NONE` unless a test needs a non-empty array.

---

## 4. Mapping to `policyHook.recommendation`

| `recommendation` | Typical codes (subset) |
|---|---|
| `none` | `[]` |
| `watch` | `RC_WATCH_HIGH_FR`, `RC_P0_MONEY_MOVE`, `RC_HIGH_VALUE_BUCKET` |
| `review` | `RC_REVIEW_INJECTION` and/or `RC_REVIEW_ABSTAIN` / `RC_REVIEW_OFF_INTENT`, plus the firing evidence codes |
| `step_up_hint` | `RC_STEP_UP_HINT_ALIGN`, `RC_POLICY_NEEDS_CONFIRMATION` |

Producer defaults remain those in `ELAH-SPEC-OUTPUT-001` §5.6. Tenant threshold-config may change **when** a recommendation fires; **code names stay**.

---

## 5. Forbidden: allow / deny / block / confirm as ELAH actions

These strings MUST NOT appear as reason codes, as `recommendation` values, or as new fields:

```
allow, deny, block, confirm, execute, decision,
RC_ALLOW, RC_DENY, RC_BLOCK, RC_CONFIRM, RC_EXECUTE,
ELAH_ALLOW, ELAH_BLOCK, ELAH_DENY, ELAH_CONFIRM
```

Bank policy already owns `event.policy.decision` ∈ { `allow`, `deny`, `needs_confirmation`, `not_applicable` }. ELAH may **cite** that context with `RC_POLICY_NEEDS_CONFIRMATION` or `RC_POLICY_DENY_CONTEXT` without claiming it performed the decision.

UI copy MUST NOT say “ELAH blocked”, “ELAH allowed”, or “deny because RC_*” (`ELAH-SPEC-CONFIDENCE-001` C12).

---

## 6. Worked examples

### 6.1 Genuine external transfer, high FR, bank will confirm

```json
"policyHook": {
  "recommendation": "watch",
  "reasons": ["RC_WATCH_HIGH_FR", "RC_P0_MONEY_MOVE", "RC_HIGH_FINANCIAL_RISK"]
}
```

**Accept.** High `elahScore` + `watch`. Tool path still follows **bank** confirmation.

### 6.2 Prompt injection, policy already refused

```json
"policyHook": {
  "recommendation": "review",
  "reasons": ["RC_REVIEW_INJECTION", "RC_INTENT_INJECTION", "RC_INJECTION_LEXICON"]
}
```

**Accept.** Low `elahScore`. No tool. ELAH did not deny; policy did.

### 6.3 Abstention

```json
"policyHook": {
  "recommendation": "review",
  "reasons": ["RC_REVIEW_ABSTAIN", "RC_ABSTAINED", "RC_SHORT_MESSAGE", "RC_NO_TOOL_PLAN"]
}
```

**Accept.** Full `score` still present. Do not treat `elahScore` as a KPI.

### 6.4 Invalid — enforcement leaked

```json
"policyHook": {
  "recommendation": "deny",
  "reasons": ["RC_DENY"]
}
```

**Reject.** Output O10. Producer defect.

---

## 7. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder |  |  | Approve / Approve with comments / Reject |
| Engineering |  |  |  |
| Security |  |  |  |

**Approval statement:** I agree reason codes are `RC_*` tokens in existing `policyHook.reasons` with no new `ScoreResponse` field; that the catalog above is the v1 set; that allow / deny / block / confirm are forbidden as ELAH actions; and that ELAH still never allows, blocks, or executes.

---

*End of document.*

# ELAH Explainability Requirements

| Field | Value |
|---|---|
| Document ID | ELAH-SPEC-EXPLAIN-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 17 August 2026 |
| Related task | `task-0-define-explainability-requirements` |
| Depends on | Output, confidence, coordinate, score-semantics specs |

---

## 1. Purpose

MVP demos fail if the score is an opaque number. This checklist ties every explanation field to a **consumer**. No chain-of-thought.

---

## 2. Required explanation payload

From `ElahScore` (output contract):

| Field | Must explain | Forbidden |
|---|---|---|
| `intentLabel` | Which of 22 intents | New ad-hoc labels |
| `elahScore` + band copy | Genuine / mixed / off-intent | “Risk score” |
| `confidence` / `uncertainty` / `status` | Whether the number is usable | “ELAH blocked” |
| `coordinates` | Position on HA / FR / EU | 4th axis |
| `explanation.matchedSignals` | Why it looks like this intent | Raw utterance |
| `explanation.weakSignals` | Why evidence is thin | PII |
| `explanation.negativeSignals` | Counter-evidence / injection | CoT |
| `explanation.summary` | Optional ≤240 char sentence | Names, account numbers |
| `policyHook` | Attention hint | allow/deny/confirm |
| `provenance` | rules vs model; uncalibrated chip | Secrets |

---

## 3. Consumer checklist

| Consumer | Must show | Done when |
|---|---|---|
| Event **list** | Score + confidence/abstain + intent | Phase 9 list |
| Event **detail** | All fields above + policy decision from **event** | Phase 9 detail |
| Intention **graph** | Point + abstain glyph | Coordinates + Phase 7 |
| SOC queue | `policyHook` reason + policy decision | Queue copy in confidence spec |
| Training table | Same columns as live `ElahTrainingEvent` | Founder dataset page |
| Simulator log | `eventId` + score or `scoring_unavailable` | Phase 3 wire-up |
| Customer chat | **Nothing** from this table | — |

---

## 4. Quality bar (MVP)

- At least one matched **or** negative signal on every scored P0 demo.
- Injection: negativeSignals include a pattern id (e.g. `ignore_previous_instructions`).
- Summary, if present, is reproducible from the three lists.
- Red-team must not be able to dump system prompt via explanation fields.

---

## 5. Sign-off

I agree MVP explainability is the output-contract fields bound to the surfaces above, with no CoT and no customer-facing score.

---

*End of document.*

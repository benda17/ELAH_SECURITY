# ELAH explainability acceptance criteria (Phase 10)

| Field | Value |
|---|---|
| Document ID | ELAH-P10-XAI-001 |
| Version | **1.0** |
| Status | **Proposed** |
| Date | 28 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related task | `task-10-define-explainability-acceptance-criteria` |
| Depends on | `ELAH-SPEC-OUTPUT-001` O9, `ELAH-P7-PANEL-001`, `ELAH-P7-FAITH-001` |

**Product freeze (unchanged):** ELAH scores genuine intent **before tools**. Policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Customer UI MUST NOT show `elahScore`. Analyst UI MAY. No chain-of-thought.

---

## 1. Purpose

A Phase 10 **pass** for explainability is a **checklist**, not a holdout metric and not a completed interview.

---

## 2. Required on analyst surfaces

| Field | Where |
|---|---|
| `elahScore`, `confidence`, `uncertainty`, `intentLabel` | Score card |
| HA / FR / EU coordinates | Cube + panel; **elahScore is not an axis** (G9) |
| `matchedSignals` / `weakSignals` / `negativeSignals` | Evidence |
| `policyHook.recommendation` + `RC_*` reasons | Chips |
| `provenance.scorer` / `modelVersion` | Provenance |
| Uncalibrated badge when `rules_v0` | Required |
| `scoring_unavailable` / abstain glyph | Fail-open / thin evidence |

Copy MUST say **ELAH scored; the bank/company decided.** MUST NOT say ELAH allowed, blocked, or executed.

---

## 3. Forbidden

- Chain-of-thought, logits, activations, system prompt
- Customer-visible score, coordinates, confidence, reason codes
- Unknown explanation keys rendered (drop, do not invent)
- Summary that adds facts not in the signal lists (240-char cap on new scores)

---

## 4. Evidence on disk (28 Sep 2026)

| Check | Evidence |
|---|---|
| Contract closed keys | `tests/elah/score-contract.test.ts` |
| Envelope has no `elahScore` | same + `tests/elah/phase10-data-loss.test.ts` |
| Customer routes score-free | `tests/elah/phase10-customer-ui.test.ts` |
| Panel / no-CoT design | Phase 7 `ELAH_EXPLANATION_PANEL.md`, `ELAH_FAITHFULNESS_AND_PRIVACY.md` |
| Understandability interviews | **Zero** completed notes |

A CS/CRM ops analyst **can** read the founder `/banking/crm` panel by design. That is not a completed human-test result.

---

## 5. Sign-off

I agree Phase 10 explainability is this checklist plus existing contract tests; it is not a claim that interviews were held.

---

*End of document.*

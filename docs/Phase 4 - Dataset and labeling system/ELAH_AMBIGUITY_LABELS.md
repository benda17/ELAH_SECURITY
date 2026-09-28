# ELAH Ambiguity Labels

| Field | Value |
|---|---|
| Document ID | ELAH-DATA-AMBIG-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 26 August 2026 |
| Related tasks | `task-4-define-ambiguity-labels` |
| Depends on | `ELAH-SPEC-LABEL-TAXONOMY-001` (§5 decision order) |

**Product freeze (unchanged):** ELAH scores genuine banking intent before tool execution. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Ambiguity is a **label**, not a reason for ELAH to cancel a tool. Jane / customer UI MUST NOT show `elahScore`.

---

## 1. Closed use

The **only** ambiguity intent is `ambiguous_banking_request`.

Do not invent `underspecified_transfer`, `unclear_payee`, or similar extra labels. Missing amount / recipient is evidence for this **one** label, recorded in `reviewNotes` and tags if needed.

---

## 2. When to use `ambiguous_banking_request`

Banking-related **and** no concrete tool or intent can be identified.

| Use this label | Do not |
|---|---|
| "pay it" | "Pay the electricity bill 200 ILS" → `bill_payment` |
| "do the transfer" | "Send 500 ILS to my saved payee" → `external_transfer` |
| "help with my account" with no target | "What's my checking balance?" → `balance_awareness` |
| Two banking readings equally plausible and no planned tool | Injection language present → `prompt_injection_or_policy_bypass` first |
| Planned tool is absent/unknown | A concrete `plannedTool` exists → specific intent, or mistaken/conflict packs |

Gold rows:

- `annotatorConfidence` **low** or **medium**
- `reviewNotes` **required** (explain what is missing)
- coordinates mid-cube is typical; do not force high agency

---

## 3. Versus `non_banking_request`

| | `ambiguous_banking_request` | `non_banking_request` |
|---|---|---|
| Domain | Banking, but underspecified | Not a banking task |
| Examples | "pay it", "the transfer" | Weather, jokes, recipes |
| Decision order | Step 3 | Step 2 (after injection) |

Do not collapse jokes or weather into ambiguous. Do not force ambiguous rows into `external_transfer` to make the dataset “cleaner”.

If a later clear instruction exists, label **that** intent and use tag `conflict` instead (`ELAH-DATA-CTX-001`).

---

## 4. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder |  |  | Approve / Approve with comments / Reject |
| Data |  |  |  |

**Approval statement:** I agree that the only ambiguity intent is `ambiguous_banking_request`; that it is used when the request is banking-related but not concrete; that `non_banking_request` stays separate; and that ambiguity does not authorize ELAH to allow, block, or execute.

---

*End of document.*

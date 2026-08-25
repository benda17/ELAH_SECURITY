# ELAH Banking Action Name Glossary

| Field | Value |
|---|---|
| Document ID | ELAH-SIM-ACTIONS-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 18 August 2026 |
| Related task | `task-1-standardize-banking-action-names` |
| Depends on | `ELAH-SPEC-EVENT-001` (§5.1, §7.2), `ELAH-SIM-FLOWS-001` |
| Does not change | Live `AuditLog.actionType` strings (ops may keep aliases) |

---

## 1. Purpose

The simulator uses **four naming layers**. This glossary is the **single map** from live names → canonical `ElahEvent.actionType` (schema 1.0). Producers MUST map; they MUST NOT send raw aliases to `POST /v1/score`.

**Product freeze:** canonical names describe **what happened**, not ELAH’s score.

---

## 2. Four layers (do not collapse)

| Layer | Where | Example | Audience |
|---|---|---|---|
| A. Audit `actionType` | `AuditLog` | `transfer_submitted`, `agent_account_balance_read` | Ops / manager UI |
| B. Agent `toolName` | `lib/agent/policy.ts` allow-list | `create_external_transfer` | Assistant runtime |
| C. Canonical `ElahEvent.actionType` | Phase 0 schema §5.1 | `external_transfer` | ELAH ingest |
| D. `ElahBankingIntent` / matrix id | `lib/elah/types.ts`, `helpers.ts` | `balance_awareness` | Labels / training — **not** the event type |

Page-view audits (`*_view`, `*_viewed`) are **layer A only**. They are **not** ElahEvents (schema S8).

---

## 3. Canonical closed enum (repeat of schema §5.1)

**Session (optional for scoring demos):** `login`, `login_failed`, `logout`, `password_reset`

**Banking / assistant:**  
`internal_transfer`, `external_transfer`, `bill_payment`, `card_freeze`, `card_unfreeze`, `statement_download`, `account_balance_read`, `transactions_read`, `transaction_lookup`, `spending_summary`, `recipients_read`, `cards_read`, `support_case_created`, `document_download`, `document_bulk_download`, `profile_update`, `card_request`, `loan_application`, `prompt_injection`

Any other string is **invalid** on `ElahEvent` v1.0.

---

## 4. Tool name → canonical action + intent hint

`toolName` on the envelope is the live tool when `source = agent`, else `null`. Intent is **optional hint**, not a substitute for ELAH’s `intentLabel`.

| `toolName` (B) | Canonical `actionType` (C) | Default `ElahBankingIntent` (`TOOL_TO_INTENT`) |
|---|---|---|
| `get_account_balance` | `account_balance_read` | `balance_awareness` |
| `get_recent_transactions` | `transactions_read` | `recent_transactions` |
| `get_transaction_by_id` | `transaction_lookup` | `recent_transactions` |
| `get_spending_summary` | `spending_summary` | `spending_summary` |
| `get_monthly_statement` | `statement_download` | `statement_download` |
| `get_saved_recipients` | `recipients_read` | `external_transfer` *(read, not a send)* |
| `get_cards` | `cards_read` | `recent_transactions` *(weak default — do not treat as money move)* |
| `create_internal_transfer` | `internal_transfer` | `internal_transfer` |
| `create_external_transfer` | `external_transfer` | `external_transfer` |
| `pay_bill` | `bill_payment` | `bill_payment` |
| `freeze_card` | `card_freeze` | `card_freeze` |
| `unfreeze_card` | `card_unfreeze` | `card_unfreeze` |
| `create_support_case` | `support_case_created` | `support_escalation` |

Unknown tool → policy **deny**; do not invent a canonical action.

---

## 5. Live audit aliases → canonical

| Live `AuditLog.actionType` (A) | Canonical (C) | Notes |
|---|---|---|
| `login` | `login` | Session |
| `login_failed` | `login_failed` | May lack `userIdHash` |
| `logout` | `logout` | Session |
| `password_reset_requested` | `password_reset` | Simulated request only. Risk varies (unknown vs known vs session mismatch). Never a token or new password. |
| `internal_transfer` | `internal_transfer` | Agent |
| `external_transfer` | `external_transfer` | Agent posted |
| `transfer_submitted` | `external_transfer` **or** `internal_transfer` | UI path is **external only**; agent pending external also uses this |
| `transfer_blocked` | same as attempted move; default `external_transfer` | Outcome `blocked` |
| `transfer_draft_created`, `transfer_confirmation_viewed` | **do not map** | Pre-submit UX; not a scoring unit unless product later emits `executionState` drafts |
| `bill_payment` | `bill_payment` | Agent |
| `card_freeze` | `card_freeze` | Agent |
| `card_unfreeze` | `card_unfreeze` | Agent |
| `agent_account_balance_read` | `account_balance_read` | |
| `agent_transactions_search` | `transactions_read` | |
| `agent_transaction_lookup` | `transaction_lookup` | |
| `agent_spending_summary` | `spending_summary` | |
| `agent_recipients_read` | `recipients_read` | |
| `agent_cards_read` | `cards_read` | |
| `agent_statement_downloaded` | `statement_download` | |
| `document_downloaded` | `document_download` | UI |
| `document_bulk_download_attempt` | `document_bulk_download` | Always blocked today |
| `support_ticket_created` | `support_case_created` | UI or agent |
| `profile_updated` | `profile_update` | Args = field **names** only |
| `card_request_submitted` | `card_request` | UI request, not freeze |
| `loan_request_submitted` | `loan_application` | UI; not an assistant tool |
| `loan_request_blocked` | `loan_application` | Outcome `blocked` |
| `suspicious_prompt_detected` | `prompt_injection` | Plus policy deny |
| `unauthorized_route_access` | **do not map** | Ops / authz, not banking intent |
| `transfer_approved` / `transfer_rejected` / `loan_approved` / `loan_rejected` | **do not map** (MVP S9) | Manager ops |
| `*_view`, `*_viewed`, `*_opened`, `*_searched` | **do not map** | Page views |

Orchestrator may log `card_management` as a pending **intent** name (`lib/agent/orchestrator.ts`). That is **not** a schema `actionType`. Map the **tool** (`freeze_card` / `unfreeze_card`) instead.

---

## 6. Outcome vs action name

Do not encode success in the canonical type. Use `ElahEvent.outcome`:

| Live `actionOutcome` / status | Envelope `outcome` (see schema) |
|---|---|
| posted / succeeded / submitted (completed) | `executed` or `pending` per schema rules |
| blocked | `blocked` |
| needs confirmation | `pending_confirmation` |
| failed / error | `failed` |
| viewed (reads) | typically `executed` for a successful read |

`transfer_blocked` is alias **plus** outcome `blocked`, not a distinct canonical type.

---

## 7. Intents that have **no** live action

These `ElahBankingIntent` values may appear as classifier output. They MUST NOT be invented as `actionType` until a flow exists:

`scheduled_payment`, `fraud_report`, `dispute_chargeback`, `fee_or_overdraft_question`, `loan_inquiry` (page is application, not inquiry tool), `savings_optimization`, `ambiguous_banking_request`, `non_banking_request`

`prompt_injection_or_policy_bypass` is the **intent** label; canonical event type is `prompt_injection`.

`get_cards` → intent `recent_transactions` is a **live helper quirk**. Envelope `actionType` remains `cards_read`. ELAH may relabel.

---

## 8. Valid / invalid producer examples

**VALID**

```json
{
  "source": "agent",
  "actionType": "external_transfer",
  "toolName": "create_external_transfer"
}
```

**INVALID** — raw audit alias on the envelope:

```json
{ "actionType": "transfer_submitted", "toolName": "create_external_transfer" }
```

**INVALID** — tool name used as `actionType`:

```json
{ "actionType": "create_external_transfer" }
```

**INVALID** — page view:

```json
{ "actionType": "dashboard_view" }
```

**INVALID** — intent as action:

```json
{ "actionType": "balance_awareness" }
```

---

## 9. Implementation rule for later engineering

1. Keep writing live AuditLog strings (no big-bang rename required for ops UI).
2. Mapper table = this §5 (and schema §7.2). If they diverge, **this glossary wins for Phase 1** until schema 1.1.
3. New live strings require a glossary row **before** they are emitted on the scoring path.

---

## 10. Sign-off

I agree this glossary is the naming contract between the live simulator and `ElahEvent` 1.0 as of 18 Aug 2026.

---

*End of document.*

# ELAH Agent Tool Map

| Field | Value |
|---|---|
| Document ID | ELAH-AGT-TOOLS-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 25 August 2026 |
| Related task | `task-2-map-all-agent-tools` |
| Depends on | `ELAH-AGT-AUDIT-001`, `ELAH-SIM-ACTIONS-001`, `ELAH-PRD-MVP-SCOPE-001` (P0/P1), `ELAH-SPEC-EVENT-001` §5.1–§5.2 |
| Evidence | `lib/agent/policy.ts`, `lib/agent/tools/{index,read,money,cards,support}.ts`, `lib/elah/helpers.ts` (`TOOL_TO_INTENT`) |
| Does not change | Live `AuditLog.actionType` strings |

---

## 1. Purpose

Single table from live `toolName` → category, confirmation, MVP priority, ops audit alias, canonical `ElahEvent.actionType`, and default intent hint.

**Product freeze:** names describe **what the bank tool does**, not ELAH’s score. ELAH never allows, blocks, or executes.

---

## 2. Inventory count

Live allow-list (`TOOL_WHITELIST` = `tools/index.ts` registry = schema §5.2): **13 tools**.

There is **no 14th tool**. Do not add ATM, beneficiary write, or `device_change` to this table as if they existed.

Unknown `toolName` → policy **deny**; `executeTool` returns `tool_not_allowed` / `unknown_tool`. Do not invent a canonical action.

---

## 3. Naming layers (do not collapse)

| Layer | Where | Example |
|---|---|---|
| A. Audit `actionType` | `AuditLog` written inside `tool.execute` | `agent_account_balance_read` |
| B. Agent `toolName` | Policy allow-list | `get_account_balance` |
| C. Canonical `ElahEvent.actionType` | Phase 0 schema §5.1 | `account_balance_read` |
| D. Default `ElahBankingIntent` | `TOOL_TO_INTENT` | `balance_awareness` |

`AgentIntent` from the planner (e.g. `card_management`, `balance_query`) is a **fifth** logging label. It is **not** layer C. Producers MUST map C from the **tool**, not from `plan.intent`.

---

## 4. Tool table (all 13)

`requiresConfirmation` is the live flag (`ToolDefinition` + `CONFIRMATION_REQUIRED`). P0/P1 from Phase 0 MVP scope. Default intent is `TOOL_TO_INTENT` (optional hint; ELAH may relabel).

| `toolName` (B) | Category | Confirm? | P0/P1 | Live `AuditLog.actionType` (A) | Canonical (C) | Default intent (D) |
|---|---|---|---|---|---|---|
| `get_account_balance` | `read` | No | **P1** | `agent_account_balance_read` | `account_balance_read` | `balance_awareness` |
| `get_recent_transactions` | `read` | No | **P1** | `agent_transactions_search` | `transactions_read` | `recent_transactions` |
| `get_transaction_by_id` | `read` | No | **P1** | `agent_transaction_lookup` | `transaction_lookup` | `recent_transactions` |
| `get_spending_summary` | `read` | No | **P1** | `agent_spending_summary` | `spending_summary` | `spending_summary` |
| `get_saved_recipients` | `read` | No | **P1** | `agent_recipients_read` | `recipients_read` | `external_transfer` *(read, not a send — live helper quirk)* |
| `get_cards` | `read` | No | **P1** | `agent_cards_read` | `cards_read` | `recent_transactions` *(weak default — not a money move)* |
| `get_monthly_statement` | `document_export` | **Yes** | **P0** | `agent_statement_downloaded` | `statement_download` | `statement_download` |
| `create_internal_transfer` | `money_move` | **Yes** | **P0** | `internal_transfer` | `internal_transfer` | `internal_transfer` |
| `create_external_transfer` | `money_move` | **Yes** | **P0** | `external_transfer` **or** `transfer_submitted` **or** `transfer_blocked` | `external_transfer` | `external_transfer` |
| `pay_bill` | `money_move` | **Yes** | **P0** | `bill_payment` | `bill_payment` | `bill_payment` |
| `freeze_card` | `card_control` | **Yes** | **P0** | `card_freeze` | `card_freeze` | `card_freeze` |
| `unfreeze_card` | `card_control` | **Yes** | **P0** | `card_unfreeze` | `card_unfreeze` | `card_unfreeze` |
| `create_support_case` | `support` | No | **P1** | `support_ticket_created` | `support_case_created` | `support_escalation` |

Injection refuse (no tool): Audit / agent `suspicious_prompt_detected`; canonical `prompt_injection`. Not a row in this table.

---

## 5. External transfer — three audit aliases, one canonical type

| Live condition | Audit (A) | `actionOutcome` | Envelope `outcome` (later) |
|---|---|---|---|
| Posted under approval line | `external_transfer` | `posted` | `executed` |
| Amount ≥ `approvalRequiredAbove` | `transfer_submitted` | `submitted` | `pending` |
| Amount > `perTransferLimit` | `transfer_blocked` | `blocked` | `blocked` |

Canonical (C) stays `external_transfer`. Do not send `transfer_submitted` / `transfer_blocked` as `ElahEvent.actionType`.

Policy also **denies** before execute if `amount > approvalRequiredAbove * 10` (no AuditLog from the tool; `policy_check_failed` only).

---

## 6. `card_management` is not an actionType

Orchestrator / `AgentPendingAction.actionType` / `plan.intent` may be `card_management` when the customer talks about cards. Schema §5.1 has **no** `card_management`.

| Planned tool | Canonical (C) |
|---|---|
| `get_cards` | `cards_read` |
| `freeze_card` | `card_freeze` |
| `unfreeze_card` | `card_unfreeze` |

Pending freeze after a `get_cards` list is still `freeze_card` for ingest.

---

## 7. N/A — do not invent tools

| Requested capability | Live | Canonical |
|---|---|---|
| ATM / withdrawal | No tool, no UI flow | **N/A** until product adds it |
| Beneficiary write (add / edit / remove) | `get_saved_recipients` is **read-only** (derived from the customer’s own txns) | **N/A** for write |
| Device change / device registration | No tool | **N/A** |

Also **not** assistant tools (UI exists): `profile_update`, `card_request`, `loan_application`, document-id download, bulk download. See `ELAH_AGENT_CAPABILITIES.md`.

---

## 8. Args and sanitization (producer notes)

`filterToolArgs` keeps only JSON-schema properties for that tool and strips `FORBIDDEN_TOOL_ARG_KEYS` (`userId`, `customerProfileId`, `accountId`, `password`, `token`, `role`, …).

External transfer AuditLog redacts recipient as `[recipient_redacted]`. Envelope producers MUST still sanitize `action.args` per schema §6.

`get_cards` / freeze use checking `BankAccount.id` as `cardId` (no Card table).

---

## 9. Sign-off

I agree this map is the live tool contract as of 25 August 2026: 13 tools, glossary names for ingest, `card_management` excluded from `actionType`, ATM / beneficiary-write / device-change N/A.

---

*End of document.*

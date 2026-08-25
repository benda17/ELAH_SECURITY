# ELAH Non-Flows and High-Risk Coverage

| Field | Value |
|---|---|
| Document ID | ELAH-SIM-NONFLOWS-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 25 August 2026 |
| Related task | `task-1-document-nonflows-and-high-risk-coverage` |
| Depends on | `ELAH-SIM-AUDIT-001`, `ELAH-SIM-FLOWS-001`, `ELAH-SIM-ACTIONS-001`, `ELAH-PRD-MVP-SCOPE-001` §6.5 |
| Evidence | `prisma/schema.prisma`, `lib/agent/policy.ts`, `lib/agent/tools/*`, `app/actions/auth.ts`, `app/actions/transfer.ts`, `app/actions/documents.ts`, `app/(public)/forgot-password/page.tsx`, live Phase 1 docs in this folder |

**Product freeze (unchanged):** ELAH scores genuine banking intent. Bank policy allow / deny / confirm. ELAH never allows, blocks, or executes. This document does **not** add `actionType`s, tools, tables, or `POST /v1/score`.

---

## 1. Purpose

Close out Phase 1 items that are **not live product flows**, and freeze the **high-risk coverage matrix** for every action that *is* live and that a later mapper must (or must not) turn into an `ElahEvent`.

If a row here says **N/A**, later engineering MUST NOT invent ATM, beneficiary write, or device inventory until product adds the flow. Password **reset requests** are live events (§2.4); real mailbox recovery is still not built.

---

## 2. N/A close-outs (verification, not builds)

Verified against live code on 25 Aug 2026. No schema, route, tool, or `actionType` was added.

### 2.1 Cash withdrawal / ATM — N/A

| Check | Live evidence |
|---|---|
| Product fence | MVP scope §6.5: cash withdrawal **Not implemented / Out**. Audit `ELAH-SIM-AUDIT-001` §4: “Withdrawal / ATM: None. Task 32 is N/A until product adds ATM.” Flows §7: ATM/withdrawal is not a live flow. |
| Routes | No `app/**/atm/**`. No withdrawal page or server action. |
| Tools | `lib/agent/policy.ts` allow-list has 13 tools; none is withdrawal / ATM. Classifier intent `atm_branch_help` maps to **guidance / support**, not a cash tool (`lib/elah/helpers.ts`). |
| Schema | No ATM / cash-drawer entity. `BankAccount` types are `checking \| savings \| investment` only. |

**Close-out:** there is no cash-withdrawal flow. Do **not** add an `actionType` (`withdrawal`, `atm_withdrawal`, or similar). If a customer asks the assistant about ATMs, that is support talk, not a scored cash event.

### 2.2 Beneficiary WRITE (add / edit / remove) — N/A; READ exists

| Check | Live evidence |
|---|---|
| Product fence | MVP §6.3 / §6.5: `get_saved_recipients` is **read-only**. “There is no add/edit/remove beneficiary tool.” Beneficiary write is **Out as a write flow**. |
| Schema | **No** `Beneficiary` / `Recipient` table. Recipients are derived at read time from the customer’s own `Transaction` counterparties (`lib/agent/tools/read.ts` `get_saved_recipients`: `category in ["transfer_external", "transfer"]`). |
| Tools | Allow-list includes `get_saved_recipients` only. No `add_beneficiary` / `edit_beneficiary` / `remove_beneficiary`. |
| UI | `/transfer` accepts a typed recipient name + account string (placeholder copy says “beneficiary ID”). That is **not** CRUD on a saved-payee store. |
| Mapping | Read path: live AuditLog `agent_recipients_read` → canonical `recipients_read` (`createdByAgent: true`). Write aliases (`beneficiary_add`, etc.) MUST NOT be emitted. |

**Close-out:** beneficiary **write** is N/A. Do not invent write events. Coverage for payee *read* is the existing P1 tool.

### 2.3 Device CHANGE as a product flow — N/A

| Check | Live evidence |
|---|---|
| Product fence | MVP §6.5: device registration / change is **Out as a first-class flow**. Event schema S6: “Device inventory is out of MVP. Client context is optional `ipAddress` + `userAgent`.” |
| Schema | **No** `Device` model. `Session` stores optional `ipAddress` + `userAgent` only (`prisma/schema.prisma`). |
| Auth | `lib/auth/session.ts` copies request IP / UA onto the session row at login. No device inventory, no trust-on-first-use, no “new device” action. |
| Tools / audits | No `device_change` tool or `AuditLog.actionType`. |

**Close-out:** optional client context (`ipAddress`, `userAgent`) may appear on envelopes later. There is **no** `device_change` `actionType` and none should be added.

### 2.4 Password reset — **monitor the request**; do not send mail

Credential recovery is an **ATO-class signal**. Phase 1 does **not** implement real email tokens or a password change. It **does** emit a scoring-relevant event when someone asks to recover an account.

| Check | Live evidence |
|---|---|
| Page | `/forgot-password` form → `requestPasswordResetAction`. |
| Side effects | **No** email, **no** token, **no** password change. Demo password stays `DemoPass123!`. |
| Audit | `password_reset_requested` → canonical `password_reset`. Args: `emailDomain`, `accountKnown`, `sessionMismatch` only. |
| Risk | Unknown email `medium`. Known account, no session `high` + RiskEvent. Own-account while signed in `medium`. Other-account while signed in `critical` + RiskEvent. |

**Close-out:** do **not** treat this as N/A. Do **not** invent a working mailbox. Later ELAH should score the request; genuine forgotten-password and hostile reset-spray must be distinguishable.

---

## 3. Live facts that affect mapping (not N/A)

### 3.1 Audit A4 — freeze is not a Card table

`lib/agent/tools/cards.ts`: there is `CardRequest` but **no issued `Card` model**. `freeze_card` / `unfreeze_card` mutate the customer’s **checking** `BankAccount.status` (`active` \| `frozen`). `cardId` in the tool is the checking account id.

UI `/cards` only submits `CardRequest` (`card_request_submitted`). It does **not** freeze.

Orchestrator pending intent name `card_management` (`lib/agent/orchestrator.ts`, `lib/agent/types.ts`) is **not** an `ElahEvent.actionType`. Map the **tool**: `freeze_card` → `card_freeze`, `unfreeze_card` → `card_unfreeze`. `get_cards` → `cards_read`.

### 3.2 Currency — UI USD vs agent ILS (document, do not convert)

| Surface | Amount semantics |
|---|---|
| `TIER_POLICY` (`lib/auth/roles.ts`) | Mock **USD** limits (basic per-transfer 5,000, etc.). |
| UI transfer (`app/actions/transfer.ts`) | Does not set `Transaction.currency`; Prisma default is **USD**. |
| Assistant money / statement copy | `fmtNis` formats **ILS**; agent-posted ledger rows set `currency: "ILS"` (`lib/agent/tools/money.ts`). |
| `BankAccount.currency` default | **USD**. |

This is a demo inconsistency (`ELAH-SIM-DATA-001` §5). Event producers MUST record the live currency field as stored. They MUST NOT convert USD ↔ ILS for scoring.

### 3.3 Daily transfer limit is display-only

`TIER_POLICY.dailyTransferLimit` and `BankAccount.dailyTransferLimit` are shown on customer pages. Neither UI nor agent **sums** posted volume against a daily cap (`ELAH-SIM-TIERS-001` §4). Per-transfer cap and `approvalRequiredAbove` **are** enforced on external transfers. Do not treat “over daily limit” as a live hook.

### 3.4 Confirmation is bank policy, not malice

`validateToolCall` returns `needs_confirmation` for: `create_internal_transfer`, `create_external_transfer`, `pay_bill`, `freeze_card`, `unfreeze_card`, `get_monthly_statement`. That is **not** an injection or fraud signal. Envelope `outcome` is `pending_confirmation` until the customer confirms; then `executed` or `pending` (manager approval) per glossary §6.

### 3.5 Injection refuse is AgentEventLog, not AuditLog

Live emit: `lib/agent/orchestrator.ts` writes `AgentEventLog.eventType = suspicious_prompt_detected` and returns `refused: true`. **No** `AuditLog` row is written for that refuse. Glossary still maps the **string** `suspicious_prompt_detected` → canonical `prompt_injection`. UI transfer memos that look like injection write AuditLog `transfer_blocked` (`app/actions/transfer.ts`) + RiskEvent `prompt_injection_detected` — canonical type is the **attempted move** (`external_transfer`) with `outcome: blocked`.

---

## 4. High-risk coverage matrix

Columns:

- **action** — what the customer / assistant attempted
- **channel** — `ui` or `agent`
- **live AuditLog.actionType** — ops string (or AgentEventLog where noted)
- **canonical ElahEvent.actionType** — glossary / schema §5.1
- **createdByAgent** — live `AuditLog.createdByAgent` (default `false` in `writeAuditLog`)
- **maps to ElahEvent?** — yes / no / N/A
- **notes**

P0 tools, injection, `transfer_blocked`, bulk download, P2 UI, page views, and manager approvals are all in this table. `POST /v1/score` is **not** wired; “maps” means the glossary contract for a later producer.

| action | channel | live AuditLog.actionType | canonical ElahEvent.actionType | createdByAgent | maps to ElahEvent? | notes |
|---|---|---|---|---|---|---|
| Internal transfer (P0 `create_internal_transfer`) | agent | `internal_transfer` | `internal_transfer` | **true** | **yes** | Confirmation required. **No** UI twin (audit A5). **No** per-transfer cap on this tool (tier gap). Agent ledger currency ILS. |
| External transfer (P0 `create_external_transfer`) | agent | `external_transfer` (posted) / `transfer_submitted` (pending approval) / `transfer_blocked` (over cap) | `external_transfer` | **true** | **yes** | Confirm first. Over `perTransferLimit` → blocked + RiskEvent `tier_limit_violation`. ≥ `approvalRequiredAbove` → pending, no debit. |
| External transfer (P2 UI twin) | ui | `transfer_submitted` (posted or pending) / `transfer_blocked` | `external_transfer` (or `internal_transfer` if a future UI exists; **today UI is external only**) | **false** | **yes** (submit / block only) | `/transfer` + `submitTransferAction`. Draft/confirm views do **not** map (next rows). |
| Transfer draft | ui | `transfer_draft_created` | — | false | **no** | Pre-submit UX. |
| Transfer confirm screen | ui | `transfer_confirmation_viewed` | — | false | **no** | Pre-submit UX. |
| Transfer blocked (cap or injection-like memo) | ui / agent | `transfer_blocked` | `external_transfer` (default; outcome `blocked`) | ui **false** / agent **true** | **yes** | UI memo uses `detectInjectionLike`. Agent over-cap uses the same audit alias. Not a distinct canonical type. |
| Bill pay (P0 `pay_bill`) | agent | `bill_payment` | `bill_payment` | **true** | **yes** | Confirm required. **No** bill-pay UI. |
| Freeze card (P0 `freeze_card`) | agent | `card_freeze` | `card_freeze` | **true** | **yes** | Mutates checking `BankAccount.status` (A4). Confirm required. Orchestrator may log pending `actionType: "card_management"` — **that string is not canonical**. |
| Unfreeze card (P0 `unfreeze_card`) | agent | `card_unfreeze` | `card_unfreeze` | **true** | **yes** | Same A4 proxy. Confirm required. |
| List cards (`get_cards`) | agent | `agent_cards_read` | `cards_read` | **true** | **yes** | Read. Intent helper default `recent_transactions` is a quirk; envelope type stays `cards_read`. |
| Monthly statement (P0 `get_monthly_statement`) | agent | `agent_statement_downloaded` | `statement_download` | **true** | **yes** | Confirm required (export). Generated summary, not the same as UI document download. |
| Account balance (`get_account_balance`) | agent | `agent_account_balance_read` | `account_balance_read` | **true** | **yes** | P1 read. |
| Recipients read (`get_saved_recipients`) | agent | `agent_recipients_read` | `recipients_read` | **true** | **yes** | P1 read. **Not** beneficiary write. |
| Support case (`create_support_case`) | agent | `support_ticket_created` | `support_case_created` | **true** | **yes** | No confirmation. |
| Injection refuse (P0 path) | agent | **(AgentEventLog)** `suspicious_prompt_detected` — **no AuditLog row** | `prompt_injection` | n/a on AuditLog (agent channel) | **yes** | Policy deny **before** tool execute. Intent label `prompt_injection_or_policy_bypass`. SIMULATION ONLY utterances. |
| Document single download (P2) | ui | `document_downloaded` | `document_download` | **false** | **yes** | `downloadDocumentAction`. |
| Document bulk download attempt | ui | `document_bulk_download_attempt` | `document_bulk_download` | **false** | **yes** | **Always blocked** for every tier + high RiskEvent. |
| Profile update (P2) | ui | `profile_updated` | `profile_update` | **false** | **yes** | Field **names** only in `inputDataSummary`. No password change. |
| Card request (P2) | ui | `card_request_submitted` | `card_request` | **false** | **yes** | new / replacement / lost / stolen. **Not** freeze. |
| Loan application (P2) | ui | `loan_request_submitted` / `loan_request_blocked` | `loan_application` | **false** | **yes** | Blocked row still maps with `outcome: blocked`. No loan assistant tool. |
| Support ticket (P2) | ui | `support_ticket_created` | `support_case_created` | **false** | **yes** | Same canonical type as the agent tool; `createdByAgent` distinguishes channel. |
| Login / logout | ui | `login` / `login_failed` / `logout` | `login` / `login_failed` / `logout` | false | optional (session) | Not high-risk banking. |
| Page views | ui | `*_view`, `*_viewed`, `*_opened`, `*_searched` | — | false | **no** (schema S8) | Ops noise. Do-not-map. |
| Manager approve / reject | ui | `transfer_approved` / `transfer_rejected` / `loan_approved` / `loan_rejected` | — | false | **no** (schema S9 / MVP §6.4) | Do-not-map. |
| Unauthorized route | ui | `unauthorized_route_access` | — | false | **no** | Authz, not banking intent. |
| Cash withdrawal / ATM | — | — | — | — | **N/A** | §2.1. Do not add `actionType`. |
| Beneficiary add / edit / remove | — | — | — | — | **N/A** | §2.2. Read-only `recipients_read` only. |
| Device change | — | — | — | — | **N/A** | §2.3. Optional `ipAddress` + `userAgent` only. |
| Password reset request | ui | `password_reset_requested` | `password_reset` | **false** | **yes** | Simulated request. Risk medium / high / critical per §2.4. No token, no password change. |

---

## 5. What this matrix does **not** claim

- ELAH does not allow, block, or execute any row above. `transfer_blocked` and injection refuse are **bank policy**.
- `needs_confirmation` is not hostility.
- Daily limit is not a live summed control.
- Orchestrator `card_management` is an intent / pending-action label, not a canonical event type.
- There is still no single `ElahEvent` producer (`POST /v1/score` is not on the tool path).

---

## 6. Sign-off

I agree these N/A close-outs match the live simulator and MVP §6.5, and that the high-risk matrix is the Phase 1 coverage contract for mapping (not for inventing missing flows).

---

*End of document.*

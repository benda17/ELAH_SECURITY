# ELAH Live Banking Flows

| Field | Value |
|---|---|
| Document ID | ELAH-SIM-FLOWS-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 18 August 2026 |
| Related task | `task-1-document-all-existing-banking-flows` |
| Depends on | `ELAH-SIM-AUDIT-001` |

---

## 1. Purpose

Step-by-step catalog of **every banking flow that exists in the live app**. This is the checklist for event coverage. If a flow is not here, it is not in the simulator.

Password for all demo users: `DemoPass123!`.

---

## 2. Actors and home pages

| Actor | Login | After login |
|---|---|---|
| Basic customer | `basic.customer@elah.demo` | `/dashboard` |
| Premium customer | `premium.customer@elah.demo` | `/dashboard` |
| VIP customer | `vip.customer@elah.demo` | `/dashboard` |
| Bank manager | `manager@elah.demo` | `/manager/dashboard` |
| Security reviewer | `security.admin@elah.demo` | `/admin/security-dashboard` |
| AI agent placeholder | `agent@elah.demo` | Redirects to admin URL; **layout forbids** this role (see authz doc) |

---

## 3. Customer UI flows

### F-C-01 Login

1. Open `/login`.
2. Submit email + password (`loginAction`).
3. Invalid → stay on login; AuditLog `login_failed` (no user).
4. Inactive user → fail.
5. Success → `elah_session` cookie, AuditLog `login`, redirect by role.

### F-C-02 Logout

1. Sign out (`logoutAction`).
2. AuditLog `logout`, session destroyed, `/login`.

### F-C-03 Forgot password (simulated request)

1. `/forgot-password` — enter email (`requestPasswordResetAction`).
2. UI always says: if the email exists, recovery would be sent. **No** email, **no** token, **no** password change.
3. Always writes AuditLog `password_reset_requested` (`createdByAgent: false`). Never stores the email or a password.
4. Risk is **not** always the same:
   - Unknown email → `medium` (no RiskEvent)
   - Known account, no session → `high` + RiskEvent (ATO precursor)
   - Signed-in user requesting **their own** email → `medium`
   - Signed-in user requesting **another** account → `critical` + RiskEvent

### F-C-04 Dashboard / accounts / transactions

| Step | Route | Audit |
|---|---|---|
| Home | `/dashboard` | `dashboard_view` |
| Accounts | `/accounts` | `accounts_view` |
| Ledger | `/transactions` | `transactions_view` / `transactions_search` |

### F-C-05 External transfer (UI)

Route `/transfer` → `submitTransferAction`.

1. Enter recipient name, account, amount, memo → `transfer_draft_created`.
2. Confirm screen → `transfer_confirmation_viewed`.
3. Over tier per-transfer / daily limit → `transfer_blocked` + `RiskEvent` `tier_limit_violation`.
4. Injection-like memo → `transfer_blocked` + `prompt_injection_detected`.
5. Amount above `approvalRequiredAbove` → `ApprovalRequest` + `transfer_submitted` (pending).
6. Else debit checking → `transfer_submitted` (posted).

**Not in this form:** internal transfer between own accounts.

### F-C-06 Documents

1. `/documents` — list filtered by `availableToTier` → `document_list_view`.
2. Download one → `downloadDocumentAction` → `document_downloaded`.
3. Bulk download → **always blocked** → `document_bulk_download_attempt` + RiskEvent.

### F-C-07 Cards (request only)

1. `/cards` → `cards_view`.
2. Submit request (new / replacement / lost / stolen) → `card_request_submitted`.
3. **No** freeze/unfreeze on this page.

### F-C-08 Loans

1. `/loans` → `loans_view`.
2. Submit → `loan_request_submitted` or `loan_request_blocked` (over `loanRequestLimit`).

### F-C-09 Investments (view)

1. `/investments` → `investments_view`.
2. Basic tier: upgrade panel (`canSeeInvestments === false`). Premium/VIP: holdings view. **No trade.**

### F-C-10 Profile

1. `/profile` → `profile_edit_opened`.
2. Update email/phone/address/employment → `profile_updated` (changed **field names** only).
3. **No** password change.

### F-C-11 Support

1. `/support` → `support_view`.
2. Ticket → `support_ticket_created`. Injection in message → RiskEvent.

### F-C-12 Assistant

1. `/assistant` → `POST /api/agent/chat` (customer API guard).
2. See §5.

---

## 4. Manager flows

Guard: `requireManager()` — `bank_manager` only.

| ID | Route / action | Audit |
|---|---|---|
| F-M-01 | `/manager/dashboard` | `manager_dashboard_view` |
| F-M-02 | `/manager/customers` list/search | `customer_list_view` / `customer_search` |
| F-M-03 | `/manager/customers/[id]` | `customer_profile_viewed` |
| F-M-04 | Add note | `manager_note_created` |
| F-M-05 | `/manager/approvals` | `approval_queue_viewed` |
| F-M-06 | Approve/reject | `transfer_approved` / `transfer_rejected` / `loan_approved` / `loan_rejected` |
| F-M-07 | `/manager/audit-logs` | `audit_log_viewed` |
| F-M-08 | `/manager/flagged-actions` | `flagged_actions_viewed` |
| F-M-09 | Review risk | `risk_event_reviewed` |

---

## 5. Assistant (agent) flows

Tools: `lib/agent/policy.ts` whitelist. Policy **before** `executeTool`. Confirmation set: internal/external transfer, pay_bill, freeze/unfreeze, monthly statement.

| ID | Utterance class | Tool | Confirm? | Audit (typical) |
|---|---|---|---|---|
| F-A-01 | Balance | `get_account_balance` | No | `agent_account_balance_read` |
| F-A-02 | Recent tx | `get_recent_transactions` | No | `agent_transactions_search` |
| F-A-03 | Tx by id | `get_transaction_by_id` | No | `agent_transaction_lookup` |
| F-A-04 | Spending | `get_spending_summary` | No | `agent_spending_summary` |
| F-A-05 | Recipients | `get_saved_recipients` | No | `agent_recipients_read` |
| F-A-06 | Cards list | `get_cards` | No | `agent_cards_read` |
| F-A-07 | Statement | `get_monthly_statement` | Yes | `agent_statement_downloaded` |
| F-A-08 | Internal transfer | `create_internal_transfer` | Yes | `internal_transfer` |
| F-A-09 | External transfer | `create_external_transfer` | Yes | `external_transfer` / `transfer_submitted` / `transfer_blocked` |
| F-A-10 | Pay bill | `pay_bill` | Yes | `bill_payment` |
| F-A-11 | Freeze | `freeze_card` | Yes | `card_freeze` |
| F-A-12 | Unfreeze | `unfreeze_card` | Yes | `card_unfreeze` |
| F-A-13 | Support | `create_support_case` | No | `support_ticket_created` |
| F-A-14 | Injection | none | Deny | `suspicious_prompt_detected`; no execute |

Every turn also writes `AgentEventLog` (message → policy → tool) and one `ElahTrainingEvent` **after** the turn.

---

## 6. Security reviewer flows

Guard: `requireSecurity()` — `security_reviewer` only.

| ID | Route | Audit |
|---|---|---|
| F-S-01 | `/admin/security-dashboard` | `admin_security_dashboard_viewed` |
| F-S-02 | `/admin/action-logs` | `action_logs_searched` |
| F-S-03 | `/admin/assistant-logs` | `assistant_logs_viewed` |
| F-S-04 | `/admin/agent-simulation-logs` | `agent_simulation_logs_viewed` |
| F-S-05 | `/admin/prompt-injection-scenarios` | `prompt_injection_scenarios_viewed` |
| F-S-06 | `/admin/risk-events` | `risk_events_viewed` |

---

## 7. Explicitly not a live flow

ATM/withdrawal, password reset/change, beneficiary CRUD, device registration, bill-pay UI, internal-transfer UI, card freeze UI, scheduled payments, securities trading, agent-driven profile or loan.

---

## 8. Sign-off

I agree this catalog matches the live simulator. Event work must cover these flows and must not invent the §7 list.

---

*End of document.*

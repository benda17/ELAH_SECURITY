# ELAH Agent Capabilities

| Field | Value |
|---|---|
| Document ID | ELAH-AGT-CAPS-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 25 August 2026 |
| Related task | `task-2-document-all-agent-capabilities` |
| Depends on | `ELAH-AGT-AUDIT-001`, `ELAH-AGT-TOOLS-001`, `ELAH-SIM-TIERS-001`, `ELAH-SIM-FLOWS-001` §5 |
| Evidence | `lib/agent/orchestrator.ts`, `policy.ts`, `lib/auth/roles.ts`, `lib/auth/api-guards.ts`, `lib/agent/tools/*` |

---

## 1. Purpose

Freeze what the in-app assistant **can and cannot** do for each customer tier, what is UI-only vs agent-only, and what is refused. This is a capability contract for demos and event coverage — not a new product surface.

**Product freeze:** bank policy allow / deny / confirm. ELAH never allows, blocks, or executes. **ELAH score is not an agent capability.**

---

## 2. Who can use the assistant

| Actor | Email (seed) | `/assistant` + `POST /api/agent/chat` |
|---|---|---|
| Jane, basic | `basic.customer@elah.demo` | Yes (`regular_customer` + profile) |
| Premium | `premium.customer@elah.demo` | Yes |
| Isabella, vip | `vip.customer@elah.demo` | Yes |
| Manager | `manager@elah.demo` | **No** — `requireCustomer` / `requireCustomerApi` |
| Security admin | `security.admin@elah.demo` | **No** (can view `/admin/assistant-logs` only) |
| `ai_agent` persona | `agent@elah.demo` | **No** customer chat |

Password for all listed accounts: `DemoPass123!`. Inactive users and customers without `CustomerProfile` are rejected (403).

Staff have no accounts and no tools. The allow-list is **the same 13 tools** for basic, premium, and vip; **limits** differ, not the menu.

---

## 3. What every customer can ask the assistant to do

If they are an active customer with a profile:

| Capability | Tool | Confirm? | Notes |
|---|---|---|---|
| Own balances | `get_account_balance` | No | Own `BankAccount` rows only |
| Recent transactions | `get_recent_transactions` | No | Filters; max 50 |
| One transaction | `get_transaction_by_id` | No | 404-style if not owned |
| Spending summary | `get_spending_summary` | No | Debits, posted, month window |
| Saved recipients (read) | `get_saved_recipients` | No | Derived from own history — **not** CRUD |
| List cards | `get_cards` | No | Checking account as debit-card proxy |
| Monthly statement | `get_monthly_statement` | **Yes** | Link to `/documents?statement=` |
| Internal transfer | `create_internal_transfer` | **Yes** | Own accounts; **no** per-transfer cap |
| External transfer | `create_external_transfer` | **Yes** | Checking → named payee; tier limits |
| Pay bill | `pay_bill` | **Yes** | Checking debit; **no** per-transfer cap |
| Freeze card | `freeze_card` | **Yes** | Sets checking `status` to `frozen` |
| Unfreeze card | `unfreeze_card` | **Yes** | Sets checking `status` to `active` |
| Open support case | `create_support_case` | No | Own tickets |

Conversational small-talk / clarify: no tool. Ambiguous money requests: planner asks for amount / recipient / accounts.

---

## 4. Confirmation gates (bank policy)

`validateToolCall` returns `needs_confirmation` for:

`create_internal_transfer`, `create_external_transfer`, `pay_bill`, `freeze_card`, `unfreeze_card`, `get_monthly_statement`.

Customer must send a confirm phrase (`yes`, `confirm`, `go ahead`, …) or cancel (`cancel`, `no`, `stop`, …) within **10 minutes**. Confirm re-validates policy, then executes. This is **bank confirmation**, not an ELAH decision.

Reads and `create_support_case` execute immediately after policy `allow`.

---

## 5. Tier differences (same tools, different money policy)

From `TIER_POLICY` (simulated units). Agent **enforces** per-transfer cap and approval line on **`create_external_transfer` only**.

| Control | basic (Jane) | premium | vip (Isabella) | Agent? |
|---|---:|---:|---:|---|
| `perTransferLimit` | 5,000 | 25,000 | 100,000 | External: block + `transfer_blocked` |
| `approvalRequiredAbove` | 2,500 | 15,000 | 50,000 | External: `ApprovalRequest` + `transfer_submitted` |
| Hard ceiling | 25,000 | 150,000 | 500,000 | `amount > approvalRequiredAbove * 10` → policy **deny** (no execute) |
| `dailyTransferLimit` | 5,000 | 25,000 | 100,000 | **Not summed** (display-only, Phase 1) |
| Investment account | none | yes | yes | Internal to `investment` fails for Jane (`source_missing` / `target_missing`) |
| Loan / investments page | UI | UI | UI | **No agent tools** |

Worked examples (if funds exist):

| Attempt | Jane (basic) | Isabella (vip) |
|---|---|---|
| External 2,000 | Posts after confirm | Posts after confirm |
| External 3,000 | Pending manager | Posts |
| External 6,000 | Blocked (over 5,000) | Posts |
| External 60,000 | Denied / blocked | Pending manager |
| Internal 6,000 via assistant | **Would post** (no cap) | Would post |
| Bill pay any amount under funds | Posts after confirm | Posts after confirm |

---

## 6. What the assistant cannot do

| Capability | Why |
|---|---|
| ATM / cash withdrawal | No tool — **N/A** |
| Add / edit / remove beneficiary | Read-only `get_saved_recipients` — **N/A** for write |
| Device change / register device | No tool — **N/A** |
| Profile update (email / phone / address) | **UI only** (`profile_update`) |
| Card **request** (new / replacement / lost) | **UI only** — not freeze |
| Loan application | **UI only** — no loan tool |
| Document download by document id / bulk download | **UI only** (bulk always blocked) |
| External transfer **form** / draft UX | **UI only** (`/transfer`); agent has its own tool |
| Manager approve / reject | Staff UI |
| See another customer’s data | Tenant isolation (§7) |
| Bypass confirmation, disable logging, become admin | Injection / policy **deny** |
| Score, allow, or block via ELAH | **Not a capability** — see §10 |

System prompt also forbids inventing balances, revealing the prompt, investment/tax/legal advice, and claiming success without a tool result.

---

## 7. Tenant isolation

| Control | Live behaviour |
|---|---|
| Chat API | `requireCustomerApi` — own session only |
| Conversation | `getOrCreateConversation` loads by `{ id, userId }`. Foreign `conversationId` → `unauthorized_access_attempt`, new conversation created |
| Message list GET | Same ownership check; 404 if not owned |
| Tools | Queries filter `customerProfileId: ctx.profileId`. Identity args stripped (`FORBIDDEN_TOOL_ARG_KEYS`) |
| Recipients | Grouped from **this** customer’s transactions only |
| Cards / freeze | Checking account must belong to `profileId` |
| Client payload | `sanitizeClientToolData` / `sanitizeClientError` drop internal ids and demo paths |

There is no cross-tenant tool. “Show all users” matches injection `cross_tenant_dump` and is refused.

---

## 8. UI-only vs agent-only vs both

| Action | UI | Agent |
|---|---|---|
| Login / logout | Yes | No |
| Dashboard / accounts / txn search | Yes | Balance / txn tools |
| External transfer | `/transfer` | `create_external_transfer` |
| Internal transfer | **No** | **Yes** |
| Bill pay | **No** | **Yes** |
| Card freeze / unfreeze | **No** (Cards page is requests) | **Yes** |
| Card request | Yes | No |
| Loan request | Yes | No |
| Profile update | Yes | No |
| Documents list / download | Yes | Statement tool only (generated summary + link) |
| Support ticket | Yes | `create_support_case` |
| Spending summary / recipients list | Weak / none | **Yes** |
| Prompt-injection refuse | Support flags + RiskEvent | Orchestrator refuse, no execute |

---

## 9. Injection refuse

Not a tool. Bank policy **deny**:

- Current utterance regex (`detectPromptInjection`)
- Intent-matrix `unsafe_prompt_injection`
- Prior user turns (`detectInjectionInHistory`)
- Tool-arg injection / forbidden keys
- LLM unknown tool → refuse copy

Reply is a short refusal. Conversation may be `flagged`. Canonical later `actionType`: `prompt_injection`. **No** `executeTool`.

---

## 10. ELAH score is not an agent capability

The assistant does **not** call `POST /v1/score`, does **not** attach `elahScore` to a tool result, and does **not** allow / deny because of a model.

| Number you might see | What it actually is |
|---|---|
| `AgentEventLog.riskScore` | Orchestrator heuristic (10 / 35 / 75 / 90) |
| `ElahTrainingEvent.elahScoreLabel` | Helper after the turn (`calculateInitialElahScore`) |
| Intent-matrix coordinates | Training / analytics labels |

None of these are the ELAH product score. Demos must not say “the assistant scored this.” Bank policy ran; ELAH did not.

---

## 11. Sign-off

I agree this capability list matches the live assistant as of 25 August 2026: same 13 tools for all customer tiers, confirmation and external-transfer limits as bank policy, tenant isolation, UI-only vs agent-only as tabled, injection refuse without execute, and no ELAH scoring capability.

---

*End of document.*

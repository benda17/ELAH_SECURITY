# ELAH Agent Capture Completeness

| Field | Value |
|---|---|
| Document ID | ELAH-AGT-CAPTURE-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 25 August 2026 |
| Related tasks | `task-2-capture-the-original-user-request`, `task-2-capture-assistant-messages`, `task-2-capture-model-outputs`, `task-2-capture-tool-call-requests`, `task-2-capture-tool-call-arguments`, `task-2-capture-tool-call-results`, `task-2-capture-the-resulting-banking-action`, `task-2-capture-errors-and-retries`, `task-2-capture-session-and-conversation-identifiers`, `task-2-capture-action-chains` |
| Depends on | `ELAH-SPEC-EVENT-001`, `ELAH-SIM-ACTIONS-001`, `ELAH-SIM-FLOWS-001` |
| Code | `lib/agent/logger.ts`, `lib/agent/orchestrator.ts`, `lib/agent/llm.ts` |
| Tests | `tests/events/agent-capture.test.ts` |
| Does not | `POST /v1/score`, Prisma columns / `db push`, `lib/elah/envelope.ts`, admin event-viewer pages |

**Product freeze (unchanged):** ELAH scores genuine banking intent. Bank policy allow / deny / confirm. ELAH never allows, blocks, or executes. AgentEventLog rows in this document are **ops lifecycle hops**, not scoring envelopes.

---

## 1. Purpose

Record what the live assistant **captures today** for every turn, what was added on 25 August 2026, and how hops reconstruct an action chain. Later Phase 2 work maps these ops rows into `ElahEvent` 1.0 (`lib/elah/envelope.ts`, another owner). This file is the capture contract for the banking simulator.

---

## 2. Store vs ingest (do not collapse)

| Store | Role | Scoring unit? |
|---|---|---|
| `AgentEventLog` | Assistant lifecycle (this spec) | **No** — hops of a turn |
| `AuditLog` | Banking side-effect / UI action | **Yes** when not a page-view |
| `ElahTrainingEvent` | One labeled row after the assistant reply | Training, not ingest |
| `ElahEvent` 1.0 | Normalized envelope (other task) | **Yes** — one per scoring unit |

`metadata.schemaVersion: "1.0"` on AgentEventLog is the **ops capture hop** version. It is not the ingest envelope `schemaVersion`. Do not add Prisma columns; new fields live in `AgentEventLog.metadata` JSON.

---

## 3. Already present (before this change)

`writeAgentEvent` already wrote these eventTypes from `handleAgentChat`:

| eventType | When |
|---|---|
| `user_message_received` | Every `/assistant` turn; stores `userMessage`, `conversationId`, `messageId`, `sessionId` |
| `agent_intent_classified` | After `callLLM` / fallback plan |
| `tool_call_requested` | After a planned tool; **messageId was missing** |
| `policy_check_passed` / `policy_check_failed` | Bank policy in `lib/agent/policy.ts`; **messageId was missing** |
| `confirmation_required` | Money / card writes pending confirm |
| `action_confirmed` / `action_cancelled` | Confirm / cancel of a pending action |
| `tool_call_executed` / `tool_call_failed` | After `executeTool`; `resultSummary` + `latencyMs` |
| `agent_message_created` | Conversational reply (no tool) |
| `suspicious_prompt_detected` | Injection on the current message or history |
| `unauthorized_access_attempt` | Client supplied another user's `conversationId` |
| `agent_error` | Corrupt pending-action args only |

Also already present:

- `sanitizeToolArgs` on request / policy / execute / confirm paths.
- `withScoringEventId` (`runWithEventId`) around execute / refuse / injection scoring units so `AuditLog.eventId` can match the execute hop.
- `AgentMessage` transcript rows for user and assistant.
- No automatic second `executeTool` on money tools.

---

## 4. Added on 25 August 2026

| Gap | Change |
|---|---|
| Ordering tie-break | `writeAgentEvent` stamps `metadata.sequence` = 1 + count of `AgentEventLog` rows for that `conversationId` (or 1 if none). Helper: `nextAgentSequence`. |
| Action chain key | `metadata.turnId` = user-turn `messageId` (explicit `metadata.turnId`, else `messageId` when provided). |
| Ops version | `metadata.schemaVersion: "1.0"` on every AgentEventLog write. |
| Request / policy IDs | `tool_call_requested` and policy events now receive `messageId: userMsg.id`. |
| Structured plan | First post-plan hop (`tool_call_requested` **or** `agent_message_created` **or** refuse `policy_check_failed`) carries `metadata.modelOutput = { usedFallback, plannedTool, intent, refuse }`. **Never** raw LLM JSON, system prompt, or tokens. |
| Provider degrade | `AgentPlan.degradedFromProvider` set in `callLLM` catch. Orchestrator writes `agent_error` with `metadata.reason=provider_error_fallback`, then continues on the fallback plan. **Not** a tool retry. |
| Shared scoring hop id | Auto-allow tool path mints one `eventId` for request + policy + execute + `AuditLog`. |

---

## 5. Capture map

### 5.1 Original user request

Every turn writes `user_message_received` **before** planning or tools. Fields: `userMessage` (raw utterance), `conversationId`, `messageId` (user `AgentMessage.id`), `sessionId` (cookie id), `userId`, `ipAddress`, `userAgent`.

Injection turns still capture the request, then `suspicious_prompt_detected` + deny. Do not copy the utterance onto page-view `AuditLog` rows.

Envelope `conversation.utterance` (capped) is a mapper concern, not this file.

### 5.2 Assistant messages

Every orchestrator return path persists `AgentMessage` (role `assistant`) plus a matching AgentEventLog hop:

| Path | Lifecycle event | What is stored |
|---|---|---|
| Conversational | `agent_message_created` | `assistantMessage`, `latencyMs` |
| Confirm gate | `confirmation_required` | `assistantMessage` + `resultSummary` |
| Execute | `tool_call_executed` / `tool_call_failed` | `assistantMessage` + `resultSummary` |
| Refuse / inject | `policy_check_failed` / `suspicious_prompt_detected` | reply + deny |

Lifecycle rows are **ops**. Do not emit one ElahEvent per chat line.

### 5.3 Model outputs (explanation + result)

`callLLM` returns `AgentPlan`. Persist a small snapshot — **not** the raw provider payload:

```
metadata.modelOutput = {
  usedFallback: boolean,
  plannedTool: string | null,
  intent: AgentIntent,
  refuse: boolean,
  explanation: string | null,  // capped model/assistant explanation (max 500)
  result: string | null        // capped tool result summary (max 500), set on execute
}
```

Privacy: no completion JSON, no `AGENT_SYSTEM_PROMPT`, no token stream, no API keys. Digit runs of 8+ are redacted. Sanitized tool args live on `toolArgsSanitized`, not inside `modelOutput`.

### 5.4 Tool requests, args, results

1. **Request (pre-side-effect):** `tool_call_requested` with `toolName`, `toolArgsSanitized`, `conversationId`, `messageId`, `sessionId`, `modelOutput`. Written **before** `executeTool`.
2. **Args:** `sanitizeToolArgs` + `FORBIDDEN_TOOL_ARG_KEYS` (`lib/agent/sanitize.ts`). Amounts / `accountType` / month / category stay. `userId`, `accountId`, `cardId`, recipient names, long digit runs must not.
3. **Policy:** `policy_check_passed` or `policy_check_failed` with the same sanitized args and user-turn `messageId`. Bank policy, not ELAH.
4. **Result:** `tool_call_executed` or `tool_call_failed` with `resultSummary` (short) and `latencyMs`. No full ledger dumps.

P0 tools: `create_internal_transfer`, `create_external_transfer`, `pay_bill`, `freeze_card`, `unfreeze_card`, `get_monthly_statement`.  
P1 tools: `get_account_balance`, `get_recent_transactions`, `get_transaction_by_id`, `get_spending_summary`, `get_saved_recipients`, `get_cards`, `create_support_case`.

### 5.5 Resulting banking action (AuditLog link)

Money / card / read / support tools write `AuditLog` with `createdByAgent: true`. On the auto-allow path, request + policy + execute + that `AuditLog` share `eventId` (ALS `runWithEventId`).

Confirm-then-execute is a **new** scoring unit: pending hops keep the request `eventId`; the confirmed execute mints a fresh id shared with the banking `AuditLog`.

Canonical `ElahEvent.actionType` is the Phase 1 glossary map (e.g. `get_account_balance` / audit `agent_account_balance_read` → `account_balance_read`). Mapper work is out of this task. UI twins stay `createdByAgent: false` / `source: ui`.

### 5.6 Errors and retries (degrade, not retry)

| Reason code | eventType | Meaning |
|---|---|---|
| `provider_error_fallback` | `agent_error` | LLM threw; rules planner used; **no** second `executeTool` |
| `action_failed` | `tool_call_failed` or `agent_error` | Tool execute failed, or pending args corrupt |
| `unauthorized_conversation` | `unauthorized_access_attempt` | Foreign `conversationId` |
| (policy) | `policy_check_failed` | Unknown / forbidden tool args, injection, refuse |

Absent `OPENAI_API_KEY` is **not** an error: `usedFallback: true` with no `agent_error`.

**Forbidden:** automatic retry of money-move `executeTool` (no double send). Planner fallback is not a money retry. Optional `metadata.retryOfEventId` is unused unless a true retry is added later.

### 5.7 Session and conversation identifiers

| Field | Where |
|---|---|
| `sessionId` | Cookie id on AgentEventLog (`sessionCookieId`) |
| `conversationId` | `AgentConversation.id` on every orchestrator hop except unauthorized (attempted id in metadata) |
| `messageId` | User turn id on request + policy; assistant message id on reply hops |
| `turnId` | Always the user-turn `messageId` (metadata) |
| `userId` | Ops only; ingest uses `userIdHash` |

`login_failed` may lack session; that is UI, not this agent task.

### 5.8 Action chains

Reconstruct a turn with:

```
conversationId + turnId (user messageId)
order by metadata.sequence, then timestamp
```

Typical auto-allow read (balance):

1. `user_message_received`
2. `agent_intent_classified`
3. `tool_call_requested` (`modelOutput`)
4. `policy_check_passed`
5. `tool_call_executed` + `AuditLog` (same `eventId`)

A chain is **ops correlation**. One ElahEvent per scoring unit still applies — do not emit one envelope per hop. `eventId` identifies the scoring unit; `sequence` orders hops when timestamps collide.

Replay sort key: `(conversationId, sequence, timestamp)`.

---

## 6. Product freeze reminder

- ELAH does not allow, block, confirm, or execute.
- No `POST /v1/score` in this phase.
- No ATM, beneficiary-write, or device-change capture (those flows do not exist).

---

## 7. Tests

`npx vitest run tests/events/agent-capture.test.ts tests/agent/assistant.test.ts`

Jane-like fixture user asks “What's my balance?”. Assertions: `user_message_received`, `tool_call_requested.messageId`, increasing `sequence`, `modelOutput.plannedTool = get_account_balance`, shared `eventId` with `AuditLog`, provider degrade logs `agent_error` without a second execute.

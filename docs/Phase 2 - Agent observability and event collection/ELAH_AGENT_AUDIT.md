# ELAH Integrated AI Banking Agent Audit

| Field | Value |
|---|---|
| Document ID | ELAH-AGT-AUDIT-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 25 August 2026 |
| Related task | `task-2-audit-the-integrated-ai-banking-agent` |
| Depends on | `ELAH-SIM-AUDIT-001`, `ELAH-SIM-FLOWS-001`, `ELAH-SIM-ACTIONS-001`, `ELAH-SPEC-EVENT-001` (§3) |
| Evidence | `lib/agent/orchestrator.ts`, `llm.ts`, `policy.ts`, `logger.ts`, `system-prompt.ts`, `sanitize.ts`, `lib/agent/tools/*`, `prisma/schema.prisma`, `app/(customer)/assistant/page.tsx`, `app/api/agent/chat/route.ts`, `app/(admin)/admin/assistant-logs/page.tsx` |

---

## 1. Purpose

Record what the **live** in-app assistant actually does versus what Phase 0 said ELAH ingest needs. This is a **report**, not a code change. Later Phase 2 engineering (capture, envelope, quality) closes the gaps.

**Product freeze:** ELAH scores genuine banking intent before tool execution. Bank policy allow / deny / confirm. ELAH never allows, blocks, or executes. There is **no** `POST /v1/score` on this path in Phase 2.

---

## 2. Method

Read-only inspection of `ELAH_SECURITY---Banking-System` on 25 August 2026. No `prisma db push`, no Kanban updates, no ATM / beneficiary-write / device-change invention.

---

## 3. Verdict

The assistant is a **working customer chat** (planner → bank policy → optional confirmation → `executeTool`). It is **not** an ELAH ingest source:

| Area | Verdict |
|---|---|
| Surface | `/assistant` → `POST /api/agent/chat` (`requireCustomerApi`). Ops UI at `/admin/assistant-logs` (`requireSecurity`). |
| Tool inventory | **13** allow-listed tools (`policy.ts` `TOOL_WHITELIST` = schema §5.2). Not 14. ATM, beneficiary write, and `device_change` are **N/A**. |
| Planner | `callLLM` when `OPENAI_API_KEY` is set; else / on provider error → `fallbackPlan`. |
| Policy | `validateToolCall` **before** `executeTool`. Decisions: `allow` / `needs_confirmation` / `deny`. |
| Confirmation | `AgentPendingAction`, 10-minute TTL. Confirm / cancel via `isConfirmMessage` / `isCancelMessage`. |
| Injection | Regex on current utterance, history, tool args; matrix `unsafe_prompt_injection`; no execute. |
| `AgentEventType` | **14** lifecycle strings (see §6). These are **not** `ElahEvent.actionType`. |
| Three stores | `AuditLog` (tool side-effects + UI), `AgentEventLog` (assistant lifecycle), `ElahTrainingEvent` (one row **after** the turn). |
| Scoring unit | Schema §3 wants **one** `ElahEvent` per banking action, typically pre-tool. Live code writes **many** lifecycle rows and a post-turn training row. |
| `ElahEvent` mapper | **Absent.** No `lib/elah/envelope.ts`. `lib/elah/event-context.ts` mints UUIDs and banking context only. |
| `POST /v1/score` | **Not wired.** |

**Critical-path implication:** Phase 2 capture + normalize cannot wait on “the agent already emits ElahEvent.” It does not.

---

## 4. Runtime (live)

```
Browser  /assistant  (requireCustomer)
    → POST /api/agent/chat  (requireCustomerApi + CustomerProfile)
        → handleAgentChat
            1. getOrCreateConversation (tenant: userId)
            2. persist AgentMessage (user)
            3. AgentEventLog user_message_received
            4. intent-matrix classification (training helper, not ELAH)
            5. detectPromptInjection / matrix unsafe → refuse, no tool
            6. pending confirm / cancel (if AgentPendingAction open)
            7. detectInjectionInHistory → refuse, no LLM
            8. callLLM | fallbackPlan
            9. AgentEventLog agent_intent_classified
           10. refuse / conversational reply / tool plan
           11. validateToolCall  ← bank policy, before execute
           12. deny | needs_confirmation (pending row) | allow → executeTool
           13. ElahTrainingEvent after the turn (commitElahTurn)
```

`executeTool` re-checks `isToolAllowed` and `filterToolArgs`. Tools re-scope queries to `ctx.profileId`.

---

## 5. Planner (LLM vs fallback)

| Path | When | Behaviour |
|---|---|---|
| LLM | `OPENAI_API_KEY` set and provider succeeds | `gpt-4o-mini` (or `OPENAI_MODEL`) + `AGENT_SYSTEM_PROMPT` + `toolsForLLM()`. First function call only. Unknown tool → `refuse: true`, intent `unsafe_request`. `classifyIntent` still sets `plan.intent` from the **last user utterance** (rules), not from the model. |
| `fallbackPlan` | No key, empty choice, or provider throw | Rules in `llm.ts`: keyword intent + crude amount / recipient / month extractors. `usedFallback: true`. |
| Flag | Always | `agent_intent_classified.metadata.usedFallback`. |

`card_management` is an **`AgentIntent`** (planner / pending `actionType`). It is **not** a schema `actionType`. Map the tool (`freeze_card` / `unfreeze_card` / `get_cards`).

Quirk: after a successful `get_cards` with intent `card_management`, if the utterance matches `/freeze/`, the orchestrator auto-creates a `freeze_card` pending action. `/freeze/` also matches **“unfreeze”**. There is no symmetric auto-pending for unfreeze-only.

---

## 6. `AgentEventType` (lifecycle — 14 values)

From `lib/agent/logger.ts`. Stored on `AgentEventLog.eventType`. **Do not** send these strings as `ElahEvent.actionType`.

| `eventType` | Typical moment |
|---|---|
| `user_message_received` | Every turn, before policy / tools |
| `agent_intent_classified` | After planner |
| `tool_call_requested` | Planned tool + sanitized args |
| `policy_check_passed` | `validateToolCall` → `allow` or written then overridden for confirm |
| `policy_check_failed` | Deny, planner refuse, or confirm re-check fail |
| `confirmation_required` | Pending created |
| `action_confirmed` | User confirmed; **before** execute on the confirm path |
| `action_cancelled` | User cancelled pending |
| `tool_call_executed` | `executeTool` ok |
| `tool_call_failed` | `executeTool` not ok |
| `agent_message_created` | Conversational reply, no tool |
| `suspicious_prompt_detected` | Injection refuse |
| `unauthorized_access_attempt` | `conversationId` not owned by this user |
| `agent_error` | Corrupt pending args or `POST /api/agent/chat` catch |

`AgentEventLog.riskScore` is a **local heuristic** (injection 90, deny 75, confirm 35, else 10). It is **not** an ELAH score.

---

## 7. Scoring unit vs lifecycle rows

Phase 0 `ELAH_EVENT_SCHEMA.md` §3: lifecycle rows **MAY** exist; **ELAH ingest uses one `ElahEvent` per scoring unit**, typically after policy allow/confirm **immediately before** `executeTool`, or on deny (no execute). Do not emit a separate envelope per `AgentEventLog` line.

| Live row | Role vs §3 |
|---|---|
| `user_message_received`, `agent_intent_classified`, `tool_call_requested`, `policy_check_*`, `confirmation_required`, `action_confirmed` / `cancelled`, `agent_message_created` | **Lifecycle.** Ops / `/admin/assistant-logs`. |
| `tool_call_executed` / `tool_call_failed` | **After** side effects. Too late for pre-tool scoring. |
| `suspicious_prompt_detected` + policy deny | Closest live deny snapshot; still not an `ElahEvent`. |
| `AuditLog` written **inside** `tool.execute` | Side-effect audit. Alias `actionType` (glossary layer A). |
| `ElahTrainingEvent` via `commitElahTurn` | **One row per turn, after the reply.** Stores raw `userQuestion` / `assistantAnswer`. Not pre-tool; not the ingest envelope. |

`withScoringEventId` (`runWithEventId(mintEventId(), …)`) wraps **some** paths (injection refuse, confirm+execute, history injection, planner refuse, policy deny, immediate execute). `writeAgentEvent` / `writeAuditLog` reuse `currentEventId()` when set, else mint.

Gaps vs “one scoring-unit id”:

- `user_message_received` is written **before** the wrap → different `eventId`.
- `needs_confirmation` (pending create) is **not** wrapped.
- Conversational no-tool replies are **not** wrapped.
- Inside a wrap, **several** lifecycle rows share one UUID — a correlation id, not “one envelope”.
- Confirm path logs `action_confirmed` then executes; there is still no `ElahEvent` at the pre-tool moment.

---

## 8. Three stores (plus a fourth unused by this chat)

| Store | Writer | Shape | ELAH ingest? |
|---|---|---|---|
| `AuditLog` | Tools (`writeAuditLog`) and UI actions | Ops `actionType` aliases; `createdByAgent`; optional `eventId` / `source` | Must **map** (glossary). Not an envelope. |
| `AgentEventLog` | `writeAgentEvent` | 14 lifecycle types; may include raw `userMessage` | Lifecycle only. |
| `ElahTrainingEvent` | `recordElahTrainingEventForTurn` | One per user message id; helper `elahScoreLabel` | Training / founder view. **Not** `ElahEvent` 1.0. |
| `AgentActionLog` | Seeded simulation traces | Legacy `/admin/agent-simulation-logs` | **Not** the in-app assistant. |

No mapper module. `lib/elah/event-context.ts` is UUID + `buildElahLogContext` (amount bucket, account context, recipient type, `source`). That is **not** `ElahEvent` serialization.

---

## 9. Injection path (refuse, no execute)

Order in `handleAgentChat`:

1. `detectPromptInjection(input.message)` — regex list in `policy.ts`.
2. Intent-matrix `unsafe_prompt_injection`.
3. Either match → fixed refuse copy, conversation `status: flagged`, `suspicious_prompt_detected`, `commitElahTurn` outcome `blocked`. **No planner, no tool.**
4. Later: `detectInjectionInHistory` on prior **user** turns → same refuse before LLM.
5. `validateToolCall` denies if the originating message matched, if an arg matches injection, or if a forbidden identity key is present (`sanitize.ts` `FORBIDDEN_TOOL_ARG_KEYS`).
6. System prompt instructs refuse; LLM unknown tool → `refuse`.

`create_support_case` still **opens a ticket** if injection-like text is only in subject/description (`containsInjectionTest`); that is a tool execute, not the orchestrator refuse path.

---

## 10. Confirmation pending

- Set: `create_internal_transfer`, `create_external_transfer`, `pay_bill`, `freeze_card`, `unfreeze_card`, `get_monthly_statement` (`CONFIRMATION_REQUIRED` + each tool’s `requiresConfirmation`).
- TTL 10 minutes; stale rows expired at turn start.
- New confirmable plan cancels other open pendings on the conversation.
- Confirm re-runs `validateToolCall` with `isFollowUpFromConfirmedPending: true`, then `updateMany` claim, then `executeTool`.
- Cancel does not execute.

---

## 11. Gaps vs ElahEvent 1.0 (agent)

| Schema need | Live today | Gap |
|---|---|---|
| One envelope per action | Many `AgentEventLog` lines + post-turn training row + in-tool `AuditLog` | No producer |
| Pre-tool `executionState` | Tools execute then audit | No pre-tool score hook |
| Canonical `actionType` | Mix of lifecycle names, audit aliases, `AgentIntent` (`card_management`) | Mapper + glossary |
| `source: agent` | `createdByAgent` on AuditLog; ALS `source` helper | Not an `ElahEvent.source` field on a single object |
| Shared `eventId` as scoring unit | UUID on some rows; split across the turn | Correlation ≠ ingest id |
| No raw utterance on scoring payload | Training row + `AgentEventLog.userMessage` store the question | Privacy vs Phase 0 |
| `POST /v1/score` | None | Phase 2 must not pretend it exists |
| ATM / beneficiary write / device change | No tools | **N/A** — do not invent |
| `lib/elah/envelope.ts` | Missing | Capture/envelope tasks |

---

## 12. Defects found (agent, not schema)

| ID | Finding | Severity |
|---|---|---|
| G1 | Internal transfer and bill pay have **no** `perTransferLimit` check (external does). Policy hard ceiling is `approvalRequiredAbove * 10` only when `amount` is in args. | Medium (known Phase 1) |
| G2 | `/freeze/` auto-pending after `get_cards` also matches **unfreeze** utterances. | Medium |
| G3 | `fallbackPlan` internal transfer defaults `fromAccountType` to checking even when the customer said otherwise. | Low |
| G4 | `get_monthly_statement` “download” is a `/documents?statement=` link, not a file export. | Note |
| G5 | Freeze/unfreeze mutate checking `BankAccount.status`, not a Card entity. | Medium (demo fidelity; Phase 1 A4) |
| G6 | `ElahTrainingEvent.elahScoreLabel` / `AgentEventLog.riskScore` can be read as “ELAH scored this.” They did not. | High (product freeze) |

---

## 13. Recommended next engineering (out of this task)

1. Pre-tool capture of planned tool + policy (`ELAH_AGENT_CAPTURE.md`).
2. Mapper to `ElahEvent` 1.0 (`ELAH_EVENT_ENVELOPE.md`) — do **not** send lifecycle `eventType` as `actionType`.
3. Do **not** invent ATM, beneficiary CRUD, or device-change tools.

---

## 14. Sign-off

I agree this audit describes the live in-app assistant as of 25 August 2026 and that ELAH ingest is blocked until a scoring-unit envelope exists. Bank policy remains allow / deny / confirm. ELAH never allows, blocks, or executes.

---

*End of document.*

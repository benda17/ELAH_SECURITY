# ELAH Banking Simulator Audit

| Field | Value |
|---|---|
| Document ID | ELAH-SIM-AUDIT-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 18 August 2026 |
| Related task | `task-1-audit-the-existing-banking-simulator` |
| Depends on | `ELAH-SPEC-EVENT-001`, `ELAH-PRD-MVP-SCOPE-001` |

---

## 1. Purpose

Record what the **live** simulator actually does versus what Phase 0 said ELAH ingest needs. This is a **report**, not a code change. Later Phase 1 engineering tasks close the gaps.

---

## 2. Method

Read-only inspection of `ELAH_SECURITY---Banking-System` on 18 Aug 2026: route layouts, `lib/auth/*`, `lib/agent/policy.ts`, `lib/agent/tools/*`, `lib/logging/logger.ts`, `lib/agent/logger.ts`, `lib/elah/training-event.ts`, `prisma/seed.ts`, `scripts/verify-routes.ts`. No production-bank traffic.

---

## 3. Verdict

The simulator is a **working demo bank** (login, ledger, assistant, manager/admin consoles). It is **not** yet a stable ELAH ingest source:

| Area | Verdict |
|---|---|
| Customer/manager/admin UI | Operational |
| Assistant tools + bank policy | Operational (13 tools; allow/deny/confirm in `policy.ts`) |
| AuditLog | Dense UI + tool side-effects; names **do not** match `ElahEvent.actionType` |
| AgentEventLog | Assistant lifecycle only |
| ElahTrainingEvent | One row per assistant **turn**, after the reply — not a pre-tool `ElahEvent` |
| `POST /v1/score` on the tool path | **Not wired** |
| Three event stores | Overlap; no single mapper to `ElahEvent` 1.0 |

**Critical-path implication:** Phase 2 capture + normalize cannot wait on “the simulator already emits ElahEvent.” It does not.

---

## 4. Gaps vs ElahEvent 1.0

| Schema need | Live today | Gap |
|---|---|---|
| One envelope per action | AuditLog **or** AgentEventLog **or** training row | Three shapes |
| `source: ui \| agent` | `createdByAgent` on some AuditLog rows | Not on every view; not named `source` |
| Canonical `actionType` | Mix of `transfer_submitted`, `external_transfer`, `agent_account_balance_read` | Glossary task 28 |
| `executionState` pre_tool | Tools execute then log | No pre-tool score hook |
| No raw utterance in scoring payload | Training row stores question/answer | Privacy conflict with Phase 0 |
| Login / logout as session bounds | `login` / `logout` AuditLog | Not ElahEvent |
| Withdrawal / ATM | None | Task 32 is **N/A until product adds ATM** |
| Beneficiary write | Read-only `get_saved_recipients` | Task 35 is **N/A for write** (MVP non-goal) |
| Device change | None | Task 36 N/A |
| Password reset | Placeholder page only | Task 37 N/A |
| Unique event id | Prisma `id` per table | Not a shared `eventId` across stores |
| Device context | Session `userAgent` / `ipAddress` | Not copied onto every score payload |

---

## 5. High-risk actions that **do** emit something

| Action | Channel | What is logged |
|---|---|---|
| External transfer | UI + agent | AuditLog `transfer_*` / `external_transfer` |
| Internal transfer | Agent only | `internal_transfer` |
| Bill pay | Agent only | `bill_payment` |
| Freeze / unfreeze card | Agent only | `card_freeze` / `card_unfreeze` |
| Statement download | UI + agent | `document_downloaded` / `agent_statement_downloaded` |
| Prompt injection refuse | Agent policy | AgentEventLog `suspicious_prompt_detected` + policy deny; **no execute** |

---

## 6. Defects found (not schema)

| ID | Finding | Severity |
|---|---|---|
| A1 | `ai_agent` login redirects to `/admin/agent-simulation-logs` but that layout is `requireSecurity()` (`security_reviewer` only) → `unauthorized_route_access` | Medium (demo persona) |
| A2 | `simulatedMfaEnabled` is seeded for manager/security and **never checked** at login | Low |
| A3 | No Next.js `middleware.ts`; guards are layout-only. Direct API without `requireCustomerApi` would be a hole; agent chat is guarded | Note |
| A4 | Card freeze mutates **checking `BankAccount.status`**, not a Card entity | Medium (demo fidelity) |
| A5 | UI `/transfer` is **external only**; internal move is assistant-only | Note |

---

## 7. Recommended next engineering (out of this task)

1. Pre-tool capture of planned tool + policy (Phase 2).
2. Mapper AuditLog / AgentEventLog → `ElahEvent` 1.0.
3. Do **not** invent ATM, beneficiary CRUD, or password-reset events until product adds the flows.

---

## 8. Sign-off

I agree this audit describes the live simulator as of 18 Aug 2026 and that ELAH ingest is blocked until a normalized envelope exists.

---

*End of document.*

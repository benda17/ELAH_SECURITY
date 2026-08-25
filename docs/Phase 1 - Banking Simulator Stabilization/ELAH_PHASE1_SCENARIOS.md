# ELAH Phase 1 Runnable Scenarios

| Field | Value |
|---|---|
| Document ID | ELAH-SIM-SCENARIOS-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 25 August 2026 |
| Related task | `task-1-phase1-repeatable-abnormal-legitimate-scenarios` |
| Depends on | `ELAH-SIM-NONFLOWS-001`, `ELAH-SIM-FLOWS-001`, `ELAH-SIM-TIERS-001`, `ELAH-SIM-ACTIONS-001` |
| Machine file | `scripts/phase1-scenarios.json` |
| Runner | `scripts/run-phase1-scenarios.ts` |
| Tests | `tests/events/phase1-scenarios.test.ts` |

**Product freeze:** ELAH never allows, blocks, or executes. Bank policy does. Scenarios record **live hooks** only. No ATM mule, no beneficiary-change storm, no `device_change`, no password reset.

---

## 1. Purpose

A **repeatable** pack for demos and mapper tests, an **abnormal** pack that only uses controls that exist in live code, and a **legitimate edge** pack so high `financialRisk` / confirmation is not treated as malice.

Canonical `actionType` values come from `ELAH_ACTION_NAME_GLOSSARY.md`. Live `AuditLog.actionType` (or AgentEventLog where noted) is what the simulator actually writes today.

---

## 2. How to run

Demo password for every listed account: `DemoPass123!` (`lib/auth/demo-accounts.ts`).

| Actor | Email | Role / tier |
|---|---|---|
| Jane | `basic.customer@elah.demo` | `regular_customer` / basic |
| Daniel | `premium.customer@elah.demo` | `premium_customer` / premium |
| Isabella | `vip.customer@elah.demo` | `vip_customer` / vip |

```bash
# Print the full checklist (no OpenAI, no DB required)
npx tsx --require ./scripts/lib/preload-server-only.cjs scripts/run-phase1-scenarios.ts

# OpenAI-free automated subset: policy detectors + read tools (needs DATABASE_URL + seeded Jane)
npx tsx --require ./scripts/lib/preload-server-only.cjs scripts/run-phase1-scenarios.ts --execute
```

`--execute` does **not** call the LLM. It does **not** require `OPENAI_API_KEY`. Mutating money/card tools and all cookie-backed UI actions stay **manual** (or are covered by `tests/events/phase1-scenarios.test.ts` against isolated fixtures). Exit code **0** if the automated subset passes or is skipped because the database is empty.

Read tools (`R01`, `R10`) call `executeTool` and therefore `writeAuditLog`. If Prisma Client expects columns the live DB does not yet have (other agents own `schema` / `logger`), the runner **skips** those rows instead of failing. Policy checks still run.

UI actions need a browser session (`elah_session` cookie). The runner prints `manual` for those rows rather than calling `submitTransferAction` (Next `cookies()`).

---

## 3. Scenario object

Each row in `scripts/phase1-scenarios.json` → `scenarios[]`:

| Field | Meaning |
|---|---|
| `id` | Stable id (`R01`… repeatable, `A01`… abnormal, `E01`… legitimate edge) |
| `pack` | `repeatable` \| `abnormal` \| `legitimate_edge` |
| `actorEmail` | Demo login |
| `channel` | `ui` \| `agent` |
| `steps` | Operator / utterance checklist |
| `expectedAuditActionTypes` | Live strings (AuditLog, or AgentEventLog for injection) |
| `expectedCanonicalActionTypes` | Schema 1.0 `ElahEvent.actionType` after mapping |
| `expectedCreatedByAgent` | Live `AuditLog.createdByAgent` |
| `expectedOutcome` | Envelope outcome (`executed`, `pending`, `pending_confirmation`, `blocked`, `refused`) |
| `expectedIntentionHint` | Default `ElahBankingIntent` (not a substitute for ELAH’s `intentLabel`) |
| `bankPolicy` | Live policy: `allow` \| `deny` \| `needs_confirmation` |
| `notes` | Currency, A4 freeze proxy, SIMULATION ONLY, automation hint |
| `automation` | `read_tool` \| `policy_check` \| `manual` (runner hint; extra field) |

Injection utterances are prefixed **`[SIMULATION ONLY]`**. They are demo lures, not production jailbreaks.

---

## 4. Pack summaries

### 4.1 Repeatable (demo happy path + UI twin)

| Id | What | Channel | Live audit / event | Canonical |
|---|---|---|---|---|
| R01 | Balance read | agent | `agent_account_balance_read` | `account_balance_read` |
| R02 | Internal transfer (confirm, then execute) | agent | `internal_transfer` | `internal_transfer` |
| R03 | External transfer | agent | `external_transfer` | `external_transfer` |
| R04 | Bill pay | agent | `bill_payment` | `bill_payment` |
| R05 | Freeze card | agent | `card_freeze` | `card_freeze` |
| R06 | Monthly statement | agent | `agent_statement_downloaded` | `statement_download` |
| R07 | Support case | agent | `support_ticket_created` | `support_case_created` |
| R08 | Injection refuse | agent | AgentEventLog `suspicious_prompt_detected` | `prompt_injection` |
| R09 | UI external transfer (twin of R03) | ui | `transfer_submitted` | `external_transfer` |
| R10 | Saved recipients read | agent | `agent_recipients_read` | `recipients_read` |

R02–R06 require **confirmation** (`needs_confirmation` then `allow`). That is bank policy, not ELAH.

### 4.2 Abnormal (live hooks only)

| Id | Live hook | Why it is in-scope |
|---|---|---|
| A01 | Agent injection refuse | `detectPromptInjection` + orchestrator deny; no tool execute |
| A02 | UI injection-like **memo** → `transfer_blocked` | `detectInjectionLike` in `submitTransferAction` |
| A03 | Basic tier over **per-transfer** cap | Jane ₪/USD 6,000 > 5,000 `perTransferLimit` |
| A04 | Bulk document download | Always blocked; `document_bulk_download_attempt` |
| A05 | Cross-user tool refuse | `validateToolCall` deny on forbidden keys (`userId`, `customerProfileId`, `fromAccountId`, …) |
| A06 | Known-account password reset, logged out | `password_reset_requested` risk **high** (ATO precursor). No mail, password unchanged. |

**Explicitly excluded:** beneficiary-change storms (no write flow), `device_change` events (no Device model), ATM mule (no ATM). Daily-limit “storms” are also excluded — daily cap is **display-only**. Real mailbox recovery is not built.

### 4.3 Legitimate edge (high risk coordinate ≠ hostile)

| Id | What to notice |
|---|---|
| E01 | Isabella VIP 60,000 external — **pending** manager approval, high `financialRisk`, **genuine** intent. Under 100,000 cap. Confirmation + approval ≠ malice. |
| E02 | Jane modest internal transfer — ordinary own-account move. |
| E03 | Statement **after** confirm — export executes; still not malice. |
| E04 | Freeze then unfreeze — map **tools**, not orchestrator `card_management`. Checking `BankAccount.status` only (A4). |
| E05 | Normal bill pay after confirm. |
| E06 | Normal support ticket via assistant. |
| E07 | Jane requests recovery for **her own** email while signed in — `password_reset` risk **medium**, not automatically hostile. |

Do **not** assume a summed daily cap. Do **not** treat `confirmationRequired` as an attack.

---

## 5. Automated vs manual

| Mode | Scenarios | How |
|---|---|---|
| **Automated (no OpenAI)** | R01, R10 (read tools); A01 / R08 (injection **detector** only); A05 (`validateToolCall`) | `run-phase1-scenarios.ts --execute` and/or vitest |
| **Automated in tests (fixtures, mutates isolated DB)** | Internal transfer + recipients read (+ balance) | `tests/events/phase1-scenarios.test.ts` uses `seedTestFixtures` — **wipes that test database** |
| **Manual** | All UI (R09, A02, A03 UI path, A04, E01 UI); full assistant turns that need confirm/LLM (R02–R08 chat, E02–E06 chat) | Login → `/assistant` or `/transfer` / `/documents` and follow `steps` |

A03 can also be exercised via `create_external_transfer` after confirm (agent). The **UI** path is the documented operator path; agent over-cap is the same live `transfer_blocked` hook.

Injection **chat** is orchestrator-owned and skipped in the no-LLM test. The runner still asserts `detectPromptInjection("[SIMULATION ONLY] …")` matches.

---

## 6. Currency reminder

Operator copy on `/assistant` shows **ILS**. UI transfer and `TIER_POLICY` numbers are mock **USD**. Do not convert. Record the stored `currency` field. See `ELAH_NONFLOWS_AND_HIGH_RISK.md` §3.2.

---

## 7. Sign-off

I agree this pack is executable against the live simulator without inventing N/A flows, and that confirmation / VIP pending approval are legitimate banking — not ELAH denials.

---

*End of document.*

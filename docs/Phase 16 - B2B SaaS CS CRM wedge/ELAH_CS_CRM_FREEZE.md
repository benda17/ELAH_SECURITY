# ELAH CS/CRM product freeze

| Field | Value |
|---|---|
| Document ID | ELAH-WEDGE-FREEZE-001 |
| Version | **0.1** |
| Status | **Proposed** |
| Date | 14 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related task | `task-16-score-genuine-intent-before-support-tools` |
| Depends on | Phase 0 policy boundary; Phase 3 `POST /v1/score`; ELAH CRM Simulation orchestrator |
| Canonical path | `docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_CS_CRM_FREEZE.md` |

**Product freeze (this domain):** ELAH scores genuine support/CRM intent **before tools**. Company (tenant) policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** on the event envelope. Customer / support-user UI MUST NOT show `elahScore`. Fail-open **250 ms** → `scoring_unavailable`, **not** a block.

This addendum copies the banking freeze onto ticket / refund / CRM tools. It does **not** invent a second policy engine.

---

## 1. Path (required)

```text
utterance
  → plan (at most one tool)
  → tenant / company policy  (allow | deny | confirm)
  → POST /v1/score
  → execute only if policy already allows
     OR the user confirmed
```

ELAH runs **before** the tool. ELAH does not choose the branch. If policy **denies**, there is no `executeTool`. The event is still scored. If scoring is slow or down, policy still governs; the tool is not blocked “because ELAH timed out.”

Independent twins: if both a UI path and an agent path can perform the same CRM act, each gets its own `eventId`. They may share `twinGroupId` on gold. They do not share a score field on the envelope.

---

## 2. Who owns what

| Actor | Owns | Must not |
|---|---|---|
| **Company / tenant policy** | Allow, deny, confirm (amounts, allow-list, injection deny, confirmation-required tools) | Pretend the deny was “ELAH” |
| **ELAH** | `elahScore`, closed CS/CRM `intentLabel`, confidence / reasons, optional `policyHook` analog (`none` / `watch` / `review` / `step_up_hint` — never allow/deny) | Allow, block, or execute; add enforcement fields to `ScoreResponse` |
| **Planner / tools** | Map utterance → tool args; execute **after** policy | Skip scoring on the happy path; show the score to the customer |
| **Support-user / customer UI** | Tickets, chat, confirm/cancel copy | Render `elahScore`, coordinates, or “ELAH blocked this refund” |
| **Analyst UI** | Event + `ElahScoreSnapshot` | Buttons labeled ELAH Allow / ELAH Block |

Live CRM Simulation: company policy is `lib/agent/policy.ts`. Scoring stub is `lib/elah/score.ts` (`rules_stub_v0`). Persistence is `ElahScoreSnapshot` keyed by `eventId` (`lib/elah/persist.ts`). Chat API does not return `elahScore`.

---

## 3. Envelope vs snapshot

| Store | Contains score? |
|---|---|
| Event envelope / `AgentEventLog` | **No.** No `elahScore` column. |
| `ElahScoreSnapshot` | **Yes.** Keyed by `eventId`. Analyst only. |
| Customer chat JSON | **No.** |

Do not add `elahScore` to the envelope “for convenience.” Do not treat `recommendation: proceed | review | abstain` on the stub as a policy decision.

---

## 4. Fail-open (250 ms)

Ceiling: **250 ms** for `POST /v1/score` when a remote scorer exists. Do not raise it without a separate founder decision.

On timeout, error, or persist failure:

1. Status / snapshot: `scoring_unavailable` (or `unavailable: true` on the snapshot).
2. **Not** a block. Company policy still allow / deny / confirm.
3. Do not invent a number on the analyst card. Say fail-open.
4. Support UI still must not show a score.

**Honest gap (14 September 2026):** the hosted CRM app scores **in-process** (`rules_stub_v0`). Remote client + 250 ms timeout + idempotency store are **stubbed** in the simulator README. The freeze still applies: when that client exists, it fail-opens; it does not become a gate.

---

## 5. Confirm vs score

Refunds, subscription cancel, contact email/phone, and human escalation require **company** confirmation in the simulator (`CONFIRMATION_REQUIRED`). Sequence:

1. Policy → `needs_confirmation`.
2. Score the planned tool (pre-tool).
3. User confirms or cancels.
4. On confirm, policy runs again; **then** execute if allow.
5. Score does not replace the confirm click.

A high `elahScore` on a genuine refund does **not** skip confirm. A low score does **not** deny. Policy deny of injection is **policy**, not ELAH.

---

## 6. Say / never say

**Say**

- “ELAH scores genuine support/CRM intent before the tool runs.”
- “Company policy allow / deny / confirm. ELAH never allows, blocks, or executes.”
- “The customer does not see this number.”
- “Fail-open on timeout — `scoring_unavailable`, not a block.”

**Never say**

- “ELAH blocked the refund” / “ELAH allowed the CRM update.”
- “We catch refund fraud.”
- “Accuracy is the banking holdout, so refunds are 0.79.”
- Showing `elahScore` on `/support` or the inbox as a customer-facing badge.

---

## 7. Sign-off

| Role | Decision | Date | Notes |
|---|---|---|---|
| Founder | **Proposed** | 14 September 2026 | Same freeze words as banking; applied to support tools. No new `ScoreResponse` enforcement fields. |

Options: **Approve** / **Approve with comments** / **Reject**.

---

*End of document.*

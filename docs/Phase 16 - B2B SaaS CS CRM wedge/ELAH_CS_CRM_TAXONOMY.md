# ELAH CS/CRM intent taxonomy 0.1

| Field | Value |
|---|---|
| Document ID | ELAH-WEDGE-TAX-001 |
| Version | **0.1** |
| Status | **Proposed** |
| Date | 14 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related task | `task-16-define-support-tool-taxonomy-and-intent-labels` |
| Domain version | `cs_crm_taxonomy` **0.1** |
| Canonical path | `docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_CS_CRM_TAXONOMY.md` |
| Code (simulator) | `elah-crm-simulator/lib/elah/envelope.ts` (`ELAH_CRM_INTENTS`) · tools in `lib/agent/tools.ts` |
| Action ontology research | [ELAH-WEDGE-RESEARCH-001](./ELAH_CRM_SAAS_HUMAN_ACTIONS_RESEARCH.md), supplied 17 September 2026 |

**Product freeze (unchanged):** ELAH scores genuine support/CRM intent **before tools**. Company policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** The label is not an allow/deny. Customer / support-user UI MUST NOT show `elahScore`.

This is a **new domain set**. It is **not** a 23rd banking label. Do not edit Phase 4 `ElahBankingIntent` (22 labels, frozen). Do not stretch `dispute_chargeback` or banking `support_escalation` over Zendesk refunds. Do not mix CS/CRM rows into banking gold v1.0.

---

## 1. Purpose

A closed label set so the CRM simulator, gold JSONL, scoring stub, and analyst UI use the same meaning when they say `refund_request` or `prompt_injection_or_policy_bypass`.

One primary `intentLabel` per scored event:

> What support/CRM intent best explains the user's request or the assistant's planned tool?

The label is not enforcement, not fraud, not a policy result. A genuine refund can still be high-impact; company policy still confirms.

---

## 2. Normative two-label rule

Every mapped Phase 16 training example MUST keep two separate labels:

1. `normalizedActionId` — **what happened**, using an exact ID from the supplied 249-action research ontology.
2. `intentLabel` — **why the request or planned tool appears aligned or misaligned**, using exactly one of the closed 16 labels below.

The 249 normalized actions are not intents and do not expand or replace the 16-label set. The same action may pair with different intents as authority, scope, evidence, or sequence changes.

**No invented action IDs.** Preserve the platform-native action and set `normalizedActionId` to `null`/unmapped when the research has no exact match. In particular, the research includes refund scenarios but no normalized refund action ID; do not fabricate one for `refund_request` or `refund_abuse`. Any new action ID requires an explicit, human-reviewed ontology revision.

This mapping is **Proposed**, not founder-approved or validated against customer systems.

---

## 3. Closed set (must match this list)

**16** labels. Unknown values are invalid for `cs_crm_taxonomy` 0.1.

```text
ticket_status
list_tickets
create_ticket
account_lookup
profile_update
refund_request
cancel_subscription
support_escalation
add_crm_note
ambiguous_crm_request
non_crm_request
prompt_injection_or_policy_bypass
refund_abuse
unauthorized_crm_overwrite
data_exfil_ticket_export
mistaken_agent
```

---

## 4. Decision order

1. **Injection / policy bypass first** — if the utterance or planned args are an instruction override, jailbreak, or hidden directive to hijack tools, label `prompt_injection_or_policy_bypass`. Do not also pick `refund_request`.
2. **Exfil** — dump/export of tickets, PII, or other tenants via support tools → `data_exfil_ticket_export`.
3. **Unauthorized overwrite** — write CRM fields the caller must not change → `unauthorized_crm_overwrite`.
4. **Refund abuse** — refund-shaped tool with intent to extract value the caller is not entitled to → `refund_abuse` (not `refund_request`).
5. **Mistaken agent** — genuine user goal, **wrong tool planned** → `mistaken_agent`.
6. **Non-CRM** — off-domain → `non_crm_request`.
7. **Ambiguous** — cannot uniquely select a genuine tool → `ambiguous_crm_request`.
8. Else the matching **genuine** tool-family label.

Company policy may still **deny** a genuine-looking refund. That does not change the intent label into abuse.

---

## 5. Definitions

Each row: one-line definition + out-of-scope.

### 5.1 Genuine tool-family

| Label | Definition | Out of scope |
|---|---|---|
| `ticket_status` | Genuine request to read status or contents of a ticket the caller is entitled to see. | Listing all tickets (`list_tickets`); opening a new ticket; dumping other tenants’ cases (`data_exfil_ticket_export`). |
| `list_tickets` | Genuine request to list the caller’s own tickets/cases. | Cross-account “show all customers/tickets” (`data_exfil_ticket_export` or injection); a single-ticket lookup (`ticket_status`). |
| `create_ticket` | Genuine request to open a new support ticket or case for the caller. | Using ticket-create as a cover for injection in the body (injection first); CRM field writes (`profile_update`). |
| `account_lookup` | Genuine request to read the caller’s workspace, plan, seats, or subscription. | Writing those fields; exporting other accounts; banking balance questions (`non_crm_request`). |
| `profile_update` | Genuine request to update the caller’s own contact fields (email, phone) that policy already allows them to change. | Writing another customer’s record or privileged fields (`unauthorized_crm_overwrite`); ticket comment mistaken for a field write (`mistaken_agent` if the **agent** planned the wrong tool). |
| `refund_request` | Genuine request to refund a charge/invoice the caller is entitled to ask about. | Repeat false refunds / social-engineered value extraction (`refund_abuse`); bank chargeback language (`dispute_chargeback` is **banking**, not this set). |
| `cancel_subscription` | Genuine request to cancel the caller’s own subscription or workspace plan. | Cancelling someone else’s tenant (`unauthorized_crm_overwrite`); injection that only mentions cancel (`prompt_injection_or_policy_bypass` first). |
| `support_escalation` | Genuine request to hand off to a human specialist on an allowed path. | Privilege escalation / “act as admin” (`prompt_injection_or_policy_bypass`); banking `support_escalation` (different closed set). |
| `add_crm_note` | Genuine request to append an internal CRM note on the caller’s workspace. | Overwriting canonical profile fields (`profile_update` / `unauthorized_crm_overwrite`); ticket customer comments (`ticket_status` / create / comment family). |

### 5.2 Residual and hostile

| Label | Definition | Out of scope |
|---|---|---|
| `ambiguous_crm_request` | Utterance does not uniquely select a support/CRM tool; needs clarification, not a tool. | Forcing a refund label because the word “money” appeared; injection that is clear (`prompt_injection_or_policy_bypass`). |
| `non_crm_request` | Off-domain for this product (weather, jokes, wires, ATM, loans, generic chatbot). | A vague but still-CRM ticket question (`ambiguous_crm_request`). |
| `prompt_injection_or_policy_bypass` | Instruction override, jailbreak, hidden directive, or tool-hijack against company policy. | A clumsy genuine refund; policy deny of a **genuine** high-amount refund (still `refund_request`; policy owns the deny). |
| `refund_abuse` | Refund-shaped action whose intent is to extract value the caller is not entitled to (repeat false refunds, social engineering a credit). | Honest “refund $40 for duplicate invoice” (`refund_request`); TM/fraud scoring of posted payments (not ELAH). |
| `unauthorized_crm_overwrite` | Intent to write CRM / contact / identity fields the caller must not change (other customer, role, tenant swap). | Allowed self-service email/phone update (`profile_update`); exfil without a write (`data_exfil_ticket_export`). |
| `data_exfil_ticket_export` | Intent to dump or export tickets, PII, or other tenants’ records through support/CRM tools. | Listing **own** tickets (`list_tickets`); injection whose goal is override rather than dump (injection first if both; prefer injection when the text is an instruction hijack). |
| `mistaken_agent` | Assistant planned the **wrong** CRM tool relative to a genuine user goal (over-eager field write, wrong ticket). Accidental tool, not injection. | User hostility (`prompt_injection_or_policy_bypass`, `refund_abuse`); annotator uncertainty (use confidence, do not invent a 17th label). |

`mistaken_agent` is an **intent label in this domain**. Banking treats accidental error as a **tag**, not a 23rd banking intent. Do not copy this label onto banking gold v1.0.

---

## 6. Optional mapping to banking 22 (not the same closed set)

The tables share **some strings**. They are **not** the same taxonomy. Mapping is for readers only. Gold, `rules_v0`, and banking dashboards stay on the 22. CS/CRM gold stays on these 16.

| CS/CRM 0.1 | Banking 22 (analog only) | Must not conclude |
|---|---|---|
| `ticket_status` / `list_tickets` / `create_ticket` | No equivalent ticket family. Nearest reads: `recent_transactions` / `balance_awareness` | That ticket ops are banking reads |
| `account_lookup` | `balance_awareness` analog (read own account) | Same label ID |
| `profile_update` | **Same string** `profile_update` | Same closed set or same allowed fields |
| `refund_request` / `refund_abuse` | **Not** `dispute_chargeback` | That chargeback gold covers refunds |
| `cancel_subscription` | None | A banking intent was extended |
| `support_escalation` | **Same string** `support_escalation` | Bank case-create = Zendesk escalate |
| `add_crm_note` | None | |
| `ambiguous_crm_request` | `ambiguous_banking_request` | Merge packs |
| `non_crm_request` | `non_banking_request` | One residual bucket in gold v1.0 |
| `prompt_injection_or_policy_bypass` | **Same string** | Same tools, same eval number |
| `unauthorized_crm_overwrite` | Authorization-boundary **scenarios**, not a banking intent name | Add as 23rd banking label |
| `data_exfil_ticket_export` | `statement_download` is **not** ticket export | Quote banking holdout as exfil-on-tickets |
| `mistaken_agent` | Accidental-error **tag** (`ELAH-DATA-DIM-001`), not an intent | Add `mistaken_user` as banking intent |

Banking closed set (frozen, do not edit here): `ELAH_BANKING_INTENTS` in the banking repo / `ELAH-SPEC-LABEL-TAXONOMY-001`. Phase 4 documents that set as **22**. CS/CRM 0.1 is **16** and **separate**. Do not add any of these 16 into `ELAH_BANKING_INTENTS`.

---

## 7. Code alignment (honest, 17 September 2026)

This Proposed 0.1 list is the **closed set used by gold and scoring**.

Live simulator `ELAH_CRM_INTENTS` in `lib/elah/envelope.ts` contains all **16** labels. `cs_crm_rules_v0` has deterministic rules for the genuine, residual, hostile, and mistaken-agent families. The 516-row synthetic `cs_crm_gold` 0.1 corpus also uses the same 16-label set.

This code alignment is not evidence of production accuracy or human agreement. The taxonomy and vendor-action mappings remain Proposed until founder/human review. They still do not modify `BANKING_INTENTS`.

---

## 8. Sign-off

| Role | Decision | Date | Notes |
|---|---|---|---|
| Founder | **Proposed** | 14 September 2026 | Do not generate `cs_crm_gold` 0.1 until Approve (or explicit “generate Proposed”). |

Options: **Approve** / **Approve with comments** / **Reject**.

---

*End of document.*

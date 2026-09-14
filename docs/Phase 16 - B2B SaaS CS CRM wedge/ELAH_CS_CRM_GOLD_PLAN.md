# ELAH CS/CRM gold dataset plan (`cs_crm_gold` 0.1)

| Field | Value |
|---|---|
| Document ID | ELAH-WEDGE-GOLD-001 |
| Version | **0.1** |
| Status | **Proposed** (plan + first synthetic cut generated 14 Sep 2026 — do not quote as production accuracy) |
| Date | 14 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related task | `task-16-plan-gold-dataset-for-support-events` |
| `datasetVersion` | `cs_crm_gold` **0.1** |
| Seed | **20260914** |
| Taxonomy | `cs_crm_taxonomy` 0.1 (16 labels) — [ELAH_CS_CRM_TAXONOMY.md](./ELAH_CS_CRM_TAXONOMY.md) |
| Generator (canonical path) | `elah-crm-simulator/scripts/generate-phase16-gold.ts` |
| Output (canonical path) | `elah-crm-simulator/data/phase16/v0.1/` |
| Canonical path | `docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_CS_CRM_GOLD_PLAN.md` |

**Product freeze (unchanged):** ELAH scores genuine support/CRM intent **before tools**. Company policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Gold labels are not policy. Customer UI MUST NOT show `elahScore`.

This memo is a **plan** plus a first synthetic cut. Generator `npm run dataset:generate:phase16` in `elah-crm-simulator` wrote **516** rows (train 354 / val 66 / holdout 96), seed `20260914`. `cs_crm_rules_v0` holdout accuracy **1.00** is uncalibrated lexicon match against the same generator — **not** a production model and **not** comparable to banking-gold 0.79. Offline naive Bayes is eval-only and is **not** the live scorer.

It does not assert IAA, live tickets, or that refund accuracy equals banking holdout.

---

## 1. Purpose

A versioned gold set for **support/CRM** events so a later baseline can be measured **in this domain**.

Banking gold v1.0 (`data/phase4/v1.0`, seed `20260826`, 571 rows) stays frozen. **Do not** mix CS/CRM rows into it. **Do not** quote banking-gold / `rules_v0` holdout (intent accuracy 0.79, etc.) as CS/CRM or refund accuracy.

---

## 2. What a row is

Reuse the Phase 4 training-record **shape** (envelope + labels + optional `goldScore` sibling + provenance + split). Change domain fields only:

| Field | CS/CRM 0.1 rule |
|---|---|
| `datasetVersion` | `cs_crm_gold` `0.1` (directory `v0.1`) |
| `event.appId` | `elah-crm-demo` |
| `event` | ElahEvent 1.0 shape; **no** `elahScore` on `event` |
| `labels.intentLabel` | One of the **16** CS/CRM labels |
| `goldScore` | Sibling of `event`, never copied onto the envelope |
| Tools / `action.toolName` | CRM allow-list (tickets, refund, cancel, contact update, escalate, CRM note) — not transfers |

Prisma `ElahTrainingEvent` / live `AgentEventLog` are **not** gold. Do not `prisma db push` for this cut.

---

## 3. Sources (allowed)

| Source | Rule |
|---|---|
| **Synthetic packs** | Compiled from scenario templates; fictional utterances; seed `20260914`. |
| **Labeled simulator only** | CRM Simulation logs **after** a human (or two) labels them against taxonomy 0.1. Unlabeled command traffic is **not** gold. |

Generator lives in the CRM simulator repo:

```text
elah-crm-simulator/scripts/generate-phase16-gold.ts
elah-crm-simulator/data/phase16/v0.1/          # packs/ + splits/ + manifest.json
```

Do not run a cut that overwrites banking `data/phase4/v1.0`. Do not generate until taxonomy is **Approve** (or the founder explicitly says generate Proposed).

Suggested pack families (names, not a claim they are on disk):

| Pack | Typical `intentLabel` |
|---|---|
| `genuine_ticket` | `ticket_status`, `list_tickets`, `create_ticket` |
| `genuine_account` | `account_lookup`, `profile_update`, `add_crm_note` |
| `genuine_refund_cancel` | `refund_request`, `cancel_subscription`, `support_escalation` |
| `ambiguous` | `ambiguous_crm_request` |
| `non_crm` | `non_crm_request` |
| `injection` | `prompt_injection_or_policy_bypass` |
| `refund_abuse` | `refund_abuse` |
| `unauthorized_overwrite` | `unauthorized_crm_overwrite` |
| `exfil` | `data_exfil_ticket_export` |
| `mistaken_agent` | `mistaken_agent` |

Counts are **TBD at generate time**. Do not invent an n= in this memo.

---

## 4. Forbidden sources

| Forbidden | Why |
|---|---|
| Live customer tickets | No production Zendesk/Salesforce/Intercom bodies |
| Production CRM export | PII, contractual, not ours |
| Unlabeled simulator JSONL mixed into **banking** gold v1.0 | Phase 4 / model-data rule; different taxonomy |
| Unlabeled 10k `seed:traffic` rows promoted to gold | Traffic pack is synthetic **volume**, not labels |
| Real emails, phone numbers, ticket bodies copied from a hosted DB dump | Privacy |
| Banking utterances relabeled as refunds | Wrong domain |

---

## 5. Splits and leakage

Same discipline as Phase 4 (`ELAH-DATA-VER-001`), new directory:

| Split | Target |
|---|---|
| `train` | ~70% of **groups** |
| `val` | ~15% |
| `holdout` | remainder (~15%) |

**Grouping key (first match):** `sequenceId` OR `twinGroupId` OR `scenarioId`.

**Leakage keys** (must not appear in more than one split): `sequenceId`, `twinGroupId`. Prefer also blocking duplicate `scenarioId` across splits.

Stratify by `pack` so rare hostile packs are not emptied out of holdout.

Pack files keep `split: null`. Split files set `split` on each copied row.

Seed for assignment: **20260914**. Changing the seed is a new `datasetVersion`, not a silent rewrite of 0.1.

---

## 6. Privacy

| Rule | Value |
|---|---|
| Ticket bodies | **Synthetic only.** No real ticket text. |
| Emails | Demo domain `*.elah.demo` or clearly fake. No live inboxes. |
| `userId` | Hash only (`userIdHash`). |
| Customer UI | Gold scores never shown on `/support`. |
| Git | No hosted DB dumps. Manifest + JSONL are synthetic/labeled-simulator. |

Forbidden arg keys follow the envelope (no raw `userId`, tokens, passwords, role-swap fields). Digit runs and email-like strings in notes should be redacted or invented.

Legal counsel sign-off of a **real-customer** CS dataset is out of this plan (no real customers).

---

## 7. Later cards (not this memo)

| Work | This plan |
|---|---|
| Labeling UI for CRM gold | Later Data card |
| Two-person IAA / Cohen’s κ | Later; do not invent κ |
| `rules` baseline eval on CS holdout | Later; **no CS holdout number today** |
| Mixing unlabeled logs into v0.1 | Forbidden; would be a 0.2 conversation after labeling |

---

## 8. Manifest (when generated)

`data/phase16/v0.1/manifest.json` should record: `datasetVersion`, `taxonomyVersion` (`0.1`), `seed` (`20260914`), pack counts, split counts, `generatedAt`, file sha256s, changelog. A new cut is `v0.2/`, not an in-place edit.

---

## 9. Sign-off

| Role | Decision | Date | Notes |
|---|---|---|---|
| Founder | **Proposed** | 14 September 2026 | Plan only. Generator path named; JSONL not claimed. |

Options: **Approve** / **Approve with comments** / **Reject**.

---

*End of document.*

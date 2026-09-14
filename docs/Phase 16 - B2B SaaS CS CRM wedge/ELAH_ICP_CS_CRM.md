# ELAH ICP — B2B SaaS CS/CRM operations

| Field | Value |
|---|---|
| Document ID | ELAH-WEDGE-ICP-001 |
| Version | **0.1** |
| Status | **Proposed** |
| Date | 14 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related tasks | `task-16-rewrite-icp-for-cs-crm-ops-first-buyer` · `task-16-keep-banking-simulator-as-demo-not-first-sale` |
| Depends on | Founder pivot 8 September 2026; Phase 0 freeze; ELAH CRM Simulation |
| Canonical path | `docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_ICP_CS_CRM.md` |

**Product freeze (unchanged):** ELAH scores genuine support/CRM intent **before tools**. Company policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** on the event envelope. Customer / support-user UI MUST NOT show `elahScore`.

No named design partner. No invented logos, ARR, or emails. Status stays **Proposed** until the sign-off table is **Approve**.

---

## 1. Purpose

Name the **first buyer** for PROJECT ELAH’s first-client motion so outreach, the investor one-pager, and the live demo tell the same story.

The first buyer is **not** “a bank CISO, full stop.” Banking remains a later vertical and an existing scoring demo (§banking-demo).

---

## 2. First buyer (this wedge)

**Role:** Head of Support, or an equivalent CS/CRM operations lead who owns tools that **act** on tickets and records.

**Must have (all three):**

1. B2B SaaS (or B2B product-led SaaS) where customers open **tickets** and the company can **refund**, **cancel**, or **write CRM fields**.
2. An assistant, copilot, or automation that can **call those tools** (or a 90-day plan to put one in front of them).
3. A human who already owns **allow / deny / confirm** for refunds and CRM writes — ELAH will not take that job.

**Adjacent titles (same buyer motion, not a second ICP):**

| Title | Why they sit next to the first buyer |
|---|---|
| VP Customer Experience / VP Customer Success | Owns CX outcomes; often budgets the support-agent stack. |
| CRM operations / Salesforce admin (ops, not a lone admin ticket) | Owns record-write paths the assistant will call. |
| RevOps with ticket + refund tools | Owns the join of billing, CRM, and support macros when those tools can fire without a specialist. |

**Who uses (not who signs):** support agents, the customer-facing assistant, and a security / QA reviewer who reads scores. The **customer** never sees `elahScore`.

**Who does not buy this wedge:** a bank CISO whose only mandate is core-banking assistants, fraud TM, or AI-governance theatre with no ticket/refund tools. That person is a later-vertical conversation, not the Phase 16 list.

---

## 3. Pain

Support and CRM **tools act** — open tickets, propose refunds, overwrite contact fields, export cases — **before anyone scores whether the request is genuine support/CRM intent**.

Existing controls still matter and are **not** ELAH:

| Control | What it answers | What it does not answer |
|---|---|---|
| SSO / seat auth | Is this an enrolled user? | Is this utterance a real refund request vs injection, confusion, or a write the caller is not entitled to? |
| Zendesk / Salesforce / billing **policy** | May this macro or tool run for this role and amount? | Should a reviewer treat the *reasoning* as aligned with a real customer goal **before** the tool? |
| After-the-fact QA / ticket audit | What already happened? | Cannot un-refund or un-overwrite. |
| Generic DLP / I/O filters | What tokens crossed a boundary? | Intent formation between “help with my invoice” and `request_refund`. |

ELAH’s claim is narrow: **score genuine support/CRM intent before tools**. Company policy still allow / deny / confirm. ELAH never executes.

This is **not** transaction monitoring, **not** “we block fraud,” **not** a new helpdesk, and **not** a 23rd banking label stretched over Zendesk.

---

## 4. Why now

1. **Assistants are being pointed at the same tools specialists already use** — tickets, refunds, CRM writes, escalation, exports. Once the model can invoke them, a wrong or hostile parse is an action, not a bad paragraph.
2. **Policy engines already exist** in support and billing (confirm above $X, deny cross-account, require a human for cancel). They do not score **genuine intent**. That gap is the product.
3. **We have a clickable CS/CRM demo** (ELAH CRM Simulation, founder-confirmed hosted 14 September 2026) without claiming a customer. Banking remains the older scoring demo, not the first sales story.
4. **Procurement for a support-ops lead is shorter than a bank CISO cycle** for a pre-seed company with no production bank install. That is a GTM fact, not a claim that anyone has bought.

Unknown — do not quote: TAM, win rate, sales-cycle days, named inbound.

---

## 5. Non-buyer for THIS wedge

Do **not** run Phase 16 outreach as bank-CISO-only.

| Out of this wedge | Why |
|---|---|
| Bank CISO / fraud / TM / AI-governance as the **only** named ICP | Later vertical. Phase 11–12 stay on the board with the 8 Sep 2026 pivot banner. |
| “We sell to banks first; CS/CRM is a slide” | Contradicts the founder-approved first-client motion. |
| Consumer apps with no ticket + refund + CRM-write tools | No tool surface for pre-tool scoring. |
| A request that ELAH **block** refunds or **allow** CRM overwrites | Freeze violation. Company policy owns that. |
| Live Zendesk / Salesforce as the demo | Simulator only. No production CRM export. |

A bank CISO can still **watch** the Jane banking demo. They are not the person this list emails.

---

## 6. What changes vs what stays

| Stays | Changes (this wedge) |
|---|---|
| Freeze: ELAH scores; policy allow/deny/confirm; ELAH never allows, blocks, or executes | First buyer = CS/CRM ops lead |
| Closed **22** banking labels (Phase 4). Do not add a 23rd | Closed **16** CS/CRM labels (Proposed 0.1) — different set |
| Banking gold v1.0 / `rules_v0` holdout numbers, **labeled as banking-gold** | First demo venue = ELAH CRM Simulation |
| Jane `/assistant` transfer + injection as a **demo** | First outreach list = public B2B SaaS CS/CRM firms |
| Phase 1–10 engineering | Phase 11–12 read as later banking vertical, not live ICP |

---

## 7. §banking-demo

The **banking simulator stays**.

It is a working scoring demo: Jane (`basic.customer@elah.demo`) genuine transfer + injection, analyst (`security.admin@elah.demo`) score card, customer UI never shows `elahScore`. Path: utterance → plan → **bank** policy → `POST /v1/score` → execute only if policy already allows or the user confirmed.

It is **not** the first sales motion and **not** the first-client ICP.

| Keep | Do not |
|---|---|
| Simulator app, Vercel, Neon, closed 22 labels, `rules_v0` | Delete Phase 1–10 work |
| Holdout evidence **as banking-gold / `rules_v0`**: gold v1.0 **571** rows, holdout **100**, seed **20260826**, blinded intent accuracy **0.79**, legitimate-as-injection FP **0**, FN **1**, injection recall **0.59**, ECE **0.153** uncalibrated. Do not quote 1.00 (hint-echo). | Quote those numbers as CS/CRM or **refund** accuracy |
| Optional encore after a CS/CRM demo ([ELAH_CS_CRM_DEMO_SCRIPT.md](./ELAH_CS_CRM_DEMO_SCRIPT.md)) | Open investor or buyer meetings on Jane as if a bank were the customer |
| Independent twins if UI and agent both exist | Merge CRM tables into banking Neon; `prisma db push` CRM onto banking |

`rules_v0` is **uncalibrated** and is **not** a trained model. There is **no** CS/CRM holdout score as of 14 September 2026.

---

## 8. Sign-off

| Role | Decision | Date | Notes |
|---|---|---|---|
| Founder | **Proposed** | 14 September 2026 | Pivot 8 Sep 2026 is approved. This memo is not Approved until you mark it. |

Options: **Approve** / **Approve with comments** / **Reject**. Do not mark the Kanban card Done until this table is Approve.

---

*End of document.*

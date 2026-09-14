# ELAH CS/CRM ops interview script

| Field | Value |
|---|---|
| Document ID | ELAH-WEDGE-INT-001 |
| Version | **0.1** |
| Status | **Proposed** (protocol only) |
| Date | 14 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related task | `task-16-write-cs-crm-first-buyer-interview-script` |
| Canonical path | `docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_CS_CRM_INTERVIEW_SCRIPT.md` |

**Product freeze (unchanged):** ELAH scores genuine support/CRM intent **before tools**. Company policy allow / deny / confirm. **ELAH never allows, blocks, or executes.**

This is **not** the banking-domain interview guide with nouns swapped. Do **not** attach fake completed interviews. Zero calls are logged for this buyer as of 14 September 2026.

Agents never send the invite.

---

## 1. Purpose

Evidence-gathering with people who **own ticket, refund, and CRM-write tools** — or the assistant about to sit in front of them.

Core question:

> If a support or CRM assistant can open tickets, file refunds, cancel subscriptions, or overwrite contact fields, who inside the company needs to know whether that request is genuine support/CRM intent **before the tool runs** — and what would they do with a score they do not themselves treat as allow/deny?

---

## 2. Who to talk to

| Profile | Why |
|---|---|
| Head of Support / Support ops | Owns the ticket queue and often the bot. |
| VP Customer Experience / VP CS | Owns CX outcomes and often the budget. |
| CRM operations / RevOps (ticket + refund tools) | Owns Salesforce/HubSpot writes and billing macros. |
| Billing ops (refunds/credits) | Owns the money tool the assistant will call. |
| Support-automation / AI ops (CS, not bank SOC) | Owns the copilot roadmap. |

**Screen-out for this script:** bank CISO / TM / core-banking assistant owner with no CS tools. Use the Phase 11 banking guide if you take that call; do not relabel it as a Phase 16 interview.

---

## 3. Hypotheses (to test, not to pitch)

| ID | Hypothesis | Evidence |
|---|---|---|
| H1 | They already have, or will put, an assistant on ticket/refund/CRM tools. | Named tools, vendor, 90-day plan. |
| H2 | Auth + macros + billing limits do **not** score genuine intent. | They describe QA after the fact, or “the bot just runs the macro.” |
| H3 | Someone already owns allow/deny/confirm for refunds and CRM writes. | Role name, system of record. |
| H4 | False refunds and wrong-field writes are painful; a **block-by-ELAH** would also be painful. | Stories, not NPS we invent. |
| H5 | A score + reasons for a **reviewer** is useful even if ELAH never executes. | They can place the score on a QA/security queue, not the customer. |
| H6 | Budget might exist as support-QA, AI-ops, or CRM-governance — or it might not. | Honest “no line item” is a valid result. |

---

## 4. Screening (before a 45-minute slot)

1. Do you own or heavily influence **support tickets, refunds/credits, or CRM record writes**?
2. Do you have (or plan) a **bot, copilot, or automation** that can call those tools?
3. Can you speak in generalities without pasting live ticket text or customer emails?
4. Would you watch a **simulated** CRM assistant (not your production Zendesk)?

Need yes on 1, plus 2 or 4.

---

## 5. Format

**45 minutes.** Founder-led. Recorder optional with consent. No live customer data on screen.

| Min | Block |
|---:|---|
| 0–5 | Consent, freeze one-liner, “not a sales close.” |
| 5–20 | Their stack and policy (questions below). |
| 20–35 | React to the CRM demo **or** a verbal walkthrough if time/network fails. |
| 35–45 | Score placement, budget, intros, stop. |

Demo: [ELAH_CS_CRM_DEMO_SCRIPT.md](./ELAH_CS_CRM_DEMO_SCRIPT.md) shortened to genuine refund + injection if you only have 15 minutes inside the call.

---

## 6. Questions (ask in their nouns)

Do not open with “tell me about your SOC” or “how do you monitor wires.”

**Stack**

1. What system is the source of truth for **tickets**? For **CRM**? For **refunds**?
2. Which of those can an **assistant or macro** invoke today without a human clicking?
3. Walk me through a **refund**: who can file it, what amount needs a second person, what happens if the bot gets it wrong.
4. Walk me through a **contact-field overwrite** (email/phone/account owner). Who is allowed?
5. Do you export tickets or CRM lists (PII) via tools or APIs? Who approves that?

**Policy vs intent**

6. Where does **allow / deny / confirm** live today (Zendesk trigger, Salesforce validation, Stripe dashboard, custom)?
7. When the bot is wrong, do you find out from **QA sampling**, a customer complaint, or a finance recon?
8. Has prompt injection or “the ticket text told the bot to …” shown up in your world? If no, say so — do not lead them into a war story.
9. If you had a **0–1 genuine-intent score before the tool**, who would see it? (QA, security, the agent, the customer — we will push back on customer.)
10. What would make you **ignore** the score?

**Buying (light)**

11. Is pre-tool intent scoring a **budget line**, or would it sit under support tooling / AI ops / CRM ops?
12. What would a **first install** actually be (demo/dev, one queue, not production)?
13. Who else has to say yes (legal, security, engineering)?

**Close**

14. Anything we should **not** build (ELAH as the refund switch, scores on the customer widget)?
15. Anyone else in **support/CRM ops** we should ask — no need to intro today.

---

## 7. Note template (blank until a real call)

Copy one block per call. Leave rows empty rather than inventing.

```text
Date:
Firm (public name):
Role (their words):
Wave (1/2 from buyer list, or other):
Recording consent: yes / no
Live ticket text shown: no (required)

Stack — tickets:
Stack — CRM:
Stack — refunds/cancel:
Assistant/macros that act: yes / no / planned
Who owns allow/deny/confirm today:
False-refund or wrong-write story (their words, no PII):
Where a score would sit:
Would customer see a score? (we want no):
Budget line? unknown / no / maybe / named team:
Interest in simulator demo: yes / no / later
Intro offered: none / name only if they volunteered
Quotes (verbatim, no polish):
Disconfirming evidence (what failed H1–H6):
Follow-up we actually owe:
Contacted logged in CRM?: no until founder marks it
```

**Forbidden in notes:** fabricated quotes; “they loved it”; NPS; ARR; attaching a Zendesk export; marking Phase 11 banking interviews done via this card.

---

## 8. After the call

Log to founder CRM only if **you** sent or took the meeting. Email stays whatever they gave you — never backfilled from this repo. Update [ELAH_CS_CRM_BUYER_LIST.md](./ELAH_CS_CRM_BUYER_LIST.md) status only when true.

---

## 9. Sign-off

| Role | Decision | Date | Notes |
|---|---|---|---|
| Founder | **Proposed** | 14 September 2026 | Protocol only. No completed interviews. |

Options: **Approve** / **Approve with comments** / **Reject**.

---

*End of document.*

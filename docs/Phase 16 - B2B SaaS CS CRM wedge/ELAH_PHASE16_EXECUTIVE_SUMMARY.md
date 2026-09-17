# Phase 16 — Executive summary

| Field | Value |
|---|---|
| Date | 17 September 2026 |
| Audience | Founder (Confluence home for this phase) |
| Status | Documentation pack **Proposed**. Engineering: Vercel + Neon + naming **done**; simulator and score-wire **in review / in progress**. No CS/CRM customer. |
| Evidence | `docs/Phase 16 - B2B SaaS CS CRM wedge/` + GitHub [`benda17/ELAH_SECURITY-CRM-System`](https://github.com/benda17/ELAH_SECURITY-CRM-System) |

**Product freeze (unchanged):** ELAH scores genuine support/CRM intent **before tools**. Company policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Customer / support-user UI never shows `elahScore`. No fabricated customers, ARR, emails, or live Zendesk.

---

## What this phase is

Founder-approved **8 September 2026**: first-client motion is **B2B SaaS CS/CRM operations**. First buyer is Head of Support / VP CX / CRM ops / RevOps with ticket + refund tools. Banking simulator **stays** as a scoring demo. It is **not** the first sales motion.

Ask stays **$400K** pre-seed / 12 months (Phase 13, founder-approved 26 August 2026, **not closed**). Year-1 plan revenue **$0**. Investor one-pager bumped to **v0.2 Proposed** (14 September 2026): first sentence is CS/CRM ops; banking holdout stays labeled **banking-gold / `rules_v0`**.

---

## What is true today

| Surface | Fact |
|---|---|
| Demo venue | ELAH CRM Simulation. Local `http://localhost:3003`. GitHub `benda17/ELAH_SECURITY-CRM-System`. Hosted Vercel project **ELAH_SECURITY-CRM-System** (founder confirmed 14 Sep 2026). Do not invent a hostname here. |
| Database | Dedicated Neon `elah_crm`. Not banking `DATABASE_URL`. Do not `prisma db push` CRM onto banking. |
| Logins | `basic.customer@elah.demo` / `security.admin@elah.demo` / `DemoPass123!` |
| Scorer | In-process `rules_stub_v0`. Snapshot in `ElahScoreSnapshot`. Remote 250 ms fail-open still stubbed. |
| Taxonomy | 16 CS/CRM labels, version **0.1 Proposed** — **not** a 23rd banking label. |
| Human-actions research | PDF supplied **17 Sep 2026**: **249 normalized actions**, **9 domains**, **28 critical actions**. Research input / Proposed mapping only; not demand, interview, approval, or accuracy evidence. |
| Gold | **Plan only.** `cs_crm_gold` 0.1, seed `20260914`. Generator path: `elah-crm-simulator/scripts/generate-phase16-gold.ts` → `data/phase16/v0.1/`. No CS holdout number. |
| Banking gold | v1.0 remains 571 / holdout 100 / seed 20260826 / blinded intent accuracy **0.79**. Do **not** quote as refund accuracy. |
| Outreach | 28 public firms listed; emails blank; nobody contacted. |
| Interviews | Script exists; **zero** completed notes. |
| Copy | Replacement sentences written; founder publishes. |

Phase 11–12 Kanban cards carry the pivot banner: later banking vertical, not live ICP.

---

## Action ontology vs intent taxonomy

The supplied research describes **what happened** with a normalized action ID. Phase 16's existing closed 16 `ElahCrmIntent` labels describe **why the request/tool appears aligned or misaligned**. Training rows should carry both `normalizedActionId` and `intentLabel`; the 249 actions do not replace or expand the 16 intents.

Use only action IDs actually present in the source. The research contains refund scenarios but no normalized refund action ID, so refund tools stay unmapped/null at the action-ontology layer until an explicit reviewed revision. See [ELAH_CRM_SAAS_HUMAN_ACTIONS_RESEARCH.md](./ELAH_CRM_SAAS_HUMAN_ACTIONS_RESEARCH.md).

---

## What needs you

1. **Approve** (or comment) the sign-off tables: ICP, taxonomy, freeze, gold plan, interview protocol, one-pager v0.2; separately review the Proposed action mappings. They stay Proposed until you do.
2. **Click-through note** on the simulator card if you want that card Done (hosted refund + injection + analyst snapshot, customer chat without a score).
3. **Publish** site/newsletter/social from `ELAH_ICP_COPY.md` yourself.
4. **Emails** on the buyer list only when you have a real address; then you send.
5. Optional: point founder `CRM_APP_URL` at the hosted CRM project (do not commit secrets).

Do not mix unlabeled CRM logs into banking gold v1.0. Do not tell an investor the bank demo is a customer.

---

## How to read the pack

Start here, then [README.md](./README.md) (Kanban → files + Confluence upload). Then human-actions research, ICP (§banking-demo), freeze, taxonomy, gold plan, demo script, buyer list, interview script, copy deck.

---

*End of document.*

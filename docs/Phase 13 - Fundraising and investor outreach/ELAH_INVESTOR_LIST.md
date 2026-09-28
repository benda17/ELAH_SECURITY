# ELAH Investor Target List

| Field | Value |
|---|---|
| Document ID | ELAH-FUND-LIST-001 |
| Version | **1.0** |
| Status | **Research / identified** (no outreach logged) |
| Date | 26 August 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related tasks | `Build the investor target list.` · `Prioritize pre-seed and seed funds.` · `Prioritize AI, cybersecurity, fintech, and enterprise investors.` · `Identify relevant partners at each fund.` · `Track investor emails and LinkedIn profiles.` |
| CRM | `elah-analytics-dashboard` · `RoadmapContact` (`contactType: investor`) |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** No fake investors, customers, or meetings. Do not `prisma db push`. Do not invent email addresses. Agents never send mail.

---

## 1. Purpose

A **real, public** shortlist of pre-seed / seed funds (plus a later-stage wave and a park list) that match ELAH’s theses: **AI, cybersecurity, fintech, enterprise**, with emphasis on **Israel** and funds known to underwrite those theses.

This list is **research**, not a pipeline of conversations. Every firm below is a public entity with a firm website. Partner names appear **only when published on that firm’s site** (or a page the firm itself publishes). Email is **blank** everywhere. If a partner name is not verified on a public firm page, it is **TBD**.

---

## 2. Hygiene rules

| Rule | Value |
|---|---|
| Count | **30** firms |
| Email | Always blank — do not guess personal inboxes or `info@` as a “contacted” channel |
| Partner | Published on the firm’s own site, else **TBD** |
| Source | Public firm URL in the table |
| CRM status allowed here | `research` or `identified` only |
| Forbidden statuses | `contacted`, `replied`, `meeting_scheduled`, `follow_up`, `interested`, `due_diligence`, `passed`, `closed` |
| Fusion VC | Keep the existing CRM row. Do **not** invent Fusion’s email. Do **not** delete the row. |
| Agents | Never send mail. Never mark a human as contacted. |

**Wave meaning**

| Wave | Use |
|---|---|
| **1** | Primary pre-seed / seed targets for a first institutional check |
| **2** | Later, multi-stage, or company-builder — useful after a seed lead or intro, not the first cold wave |
| **park** | Real firms that are a poor fit for *this* outbound motion (FoF, crowdfunding, apply-only accelerator) |

---

## 3. Why these theses

ELAH is an **enterprise banking-security** product: it scores genuine banking intent **before tools**. Buyers are banks; the category sits at **AI + cybersecurity + fintech infrastructure**. Israel has depth in cyber and early-stage software. Wave 1 therefore overweight Israeli seed cyber/AI funds and a small set of well-known US/EU seed firms with public cyber, fintech, or B2B theses.

---

## 4. Summary (30 firms)

| # | Firm | Geo | Wave | Thesis tags | Partner (published) | Email | Status | Source |
|---:|---|---|---|---|---|---|---|---|
| 1 | Fusion VC | Israel | 1 | pre-seed, AI, cyber, fintech | Guy Katsovich; Yair Vardi | | identified | https://www.fusion-vc.com/ |
| 2 | Cyberstarts | Israel | 1 | cyber, seed | Gili Raanan | | identified | https://www.cyberstarts.com/ |
| 3 | Glilot Capital | Israel | 1 | cyber, AI, seed | Kobi Samboursky | | identified | https://glilotcapital.com/ |
| 4 | YL Ventures | Israel + US | 1 | cyber, seed | Yoav Andrew Leitersdorf | | identified | https://www.ylventures.com/ |
| 5 | Hetz Ventures | Israel | 1 | seed, AI, cyber, data | Pavel Livshiz | | identified | https://www.hetz.vc/ |
| 6 | lool ventures | Israel | 1 | pre-seed, seed, AI, cyber, fintech | Avichay Nissenbaum | | identified | https://www.lool.vc/ |
| 7 | Entrée Capital | Israel + UK + US | 1 | pre-seed, seed, AI, fintech, cyber | TBD | | identified | https://www.entreecap.com/ |
| 8 | TLV Partners | Israel | 1 | seed, AI, cyber, fintech | TBD | | identified | https://www.tlv.partners |
| 9 | NFX | Israel + US | 1 | seed, AI, fintech | Gigi Levy-Weiss | | identified | https://nfx.com/ |
| 10 | Grove Ventures | Israel | 1 | pre-seed, seed, AI, enterprise | Dov Moran | | identified | https://www.groveventures.com/ |
| 11 | F2 Capital | Israel | 1 | early-stage, AI, cyber | TBD | | identified | https://www.f2vc.com/ |
| 12 | Zeev Ventures | Israel + US | 1 | seed, enterprise, fintech | Oren Zeev | | identified | https://zeevventures.com/ |
| 13 | Pitango First | Israel | 1 | seed, cyber, AI, fintech | TBD | | identified | https://www.pitango.com/first/ |
| 14 | iAngels | Israel | 1 | pre-seed, seed | TBD | | identified | https://www.iangels.com/ |
| 15 | First Round Capital | US | 1 | seed, enterprise, AI, fintech | TBD | | identified | https://www.firstround.com/ |
| 16 | Point Nine | Europe | 1 | seed, B2B, AI, SaaS | TBD | | identified | https://www.pointnine.com/ |
| 17 | Seedcamp | Europe | 1 | pre-seed, seed, AI, cyber, fintech | TBD | | identified | https://seedcamp.com/ |
| 18 | QED Investors | US / global | 1 | fintech | TBD | | identified | https://www.qedinvestors.com/ |
| 19 | Nyca Partners | US | 1 | fintech, seed | TBD | | identified | https://www.nyca.com/ |
| 20 | Ballistic Ventures | US | 1 | cyber, early-stage | TBD | | identified | https://www.ballisticventures.com/ |
| 21 | Unusual Ventures | US | 1 | seed, enterprise | TBD | | identified | https://www.unusual.vc/ |
| 22 | Amplify Partners | US | 1 | seed, AI infra, enterprise | TBD | | identified | https://www.amplifypartners.com/ |
| 23 | Aleph | Israel | 2 | later seed / A+, consumer + enterprise | TBD | | research | https://www.aleph.vc/ |
| 24 | Team8 | Israel | 2 | cyber, fintech, company-builder | TBD | | research | https://www.team8.vc/ |
| 25 | Ten Eleven Ventures | US | 2 | cyber, multi-stage | TBD | | research | https://www.1011vc.com/ |
| 26 | Paladin Capital Group | US | 2 | cyber, AI, multi-stage | TBD | | research | https://www.paladincapgroup.com/ |
| 27 | Viola Ventures | Israel | 2 | early-to-A/B, AI, fintech, enterprise | TBD | | research | https://www.viola-group.com/fund/violaventures/ |
| 28 | OurCrowd | Israel / global | park | crowdfunding / platform | TBD | | research | https://www.ourcrowd.com/ |
| 29 | Vintage Investment Partners | Israel | park | fund-of-funds | TBD | | research | https://www.vintage-ip.com/ |
| 30 | Y Combinator | US | park | apply-only accelerator | TBD | | research | https://www.ycombinator.com/ |

---

## 5. Wave 1 — primary pre-seed / seed

### 5.1 Fusion VC

| Field | Value |
|---|---|
| Firm | Fusion VC |
| Geography | Israel (Tel Aviv); US program touchpoints |
| Stage wave | **1** |
| Thesis tags | pre-seed, AI, cybersecurity, fintech, Israeli founders |
| Why ELAH fit | Israel’s public pre-seed platform; sector-agnostic with explicit AI / cyber / fintech coverage; already on the CRM as the first relevant lead. |
| Public source | https://www.fusion-vc.com/ |
| Partner (published) | Guy Katsovich (Founding Partner); Yair Vardi (Founding Partner) |
| Email | *(blank — do not invent)* |
| Status | identified |
| CRM | Existing row. Keep. Email remains null. |

### 5.2 Cyberstarts

| Field | Value |
|---|---|
| Firm | Cyberstarts |
| Geography | Israel |
| Stage wave | **1** |
| Thesis tags | cybersecurity, seed |
| Why ELAH fit | Cyber-only Israeli seed firm; public thesis is day-one partnership with security companies. |
| Public source | https://www.cyberstarts.com/ |
| Partner (published) | Gili Raanan (Founder) — https://www.cyberstarts.com/team/gili-raanan |
| Email | |
| Status | identified |

### 5.3 Glilot Capital

| Field | Value |
|---|---|
| Firm | Glilot Capital |
| Geography | Israel |
| Stage wave | **1** |
| Thesis tags | cybersecurity, AI, seed, enterprise |
| Why ELAH fit | Public cyber + AI seed franchise (G-Seed); enterprise security buyer network. |
| Public source | https://glilotcapital.com/ |
| Partner (published) | Kobi Samboursky (Co-Founder & Managing Partner) — https://glilotcapital.com/g-team/ |
| Email | |
| Status | identified |

### 5.4 YL Ventures

| Field | Value |
|---|---|
| Firm | YL Ventures |
| Geography | Israel + Silicon Valley |
| Stage wave | **1** |
| Thesis tags | cybersecurity, seed-to-scale |
| Why ELAH fit | Cyber-only; public seed-from-inception posture with Israeli founders and US GTM. |
| Public source | https://www.ylventures.com/ |
| Partner (published) | Yoav Andrew Leitersdorf (Managing Partner) — https://www.ylventures.com/team |
| Email | |
| Status | identified |

### 5.5 Hetz Ventures

| Field | Value |
|---|---|
| Firm | Hetz Ventures |
| Geography | Israel |
| Stage wave | **1** |
| Thesis tags | seed, AI, cybersecurity, data infrastructure |
| Why ELAH fit | Israeli seed fund with a published cyber GP and AI/data thesis; Prompt Security / BlinkOps-class cyber in the public narrative. |
| Public source | https://www.hetz.vc/ |
| Partner (published) | Pavel Livshiz (General Partner, cyber) — https://www.hetz.vc/our-team |
| Email | |
| Status | identified |

### 5.6 lool ventures

| Field | Value |
|---|---|
| Firm | lool ventures |
| Geography | Israel |
| Stage wave | **1** |
| Thesis tags | pre-seed, seed, AI, fintech, cyber |
| Why ELAH fit | Self-described Israel seed fund; public early-check posture across AI / fintech / cyber. |
| Public source | https://www.lool.vc/ |
| Partner (published) | Avichay Nissenbaum (General Partner) — https://www.lool.vc/team |
| Email | |
| Status | identified |

### 5.7 Entrée Capital

| Field | Value |
|---|---|
| Firm | Entrée Capital |
| Geography | Israel, London, New York |
| Stage wave | **1** |
| Thesis tags | pre-seed, seed, AI, fintech, cyber, software |
| Why ELAH fit | Public early-stage firm with software / fintech / AI coverage and Israeli + US/UK presence. |
| Public source | https://www.entreecap.com/ |
| Partner (published) | TBD |
| Email | |
| Status | identified |

### 5.8 TLV Partners

| Field | Value |
|---|---|
| Firm | TLV Partners |
| Geography | Israel |
| Stage wave | **1** |
| Thesis tags | seed, AI, cybersecurity, fintech, developer tools |
| Why ELAH fit | Well-known Tel Aviv seed firm; public coverage includes cyber, data, AI, and fintech. |
| Public source | https://www.tlv.partners |
| Partner (published) | TBD |
| Email | |
| Status | identified |

### 5.9 NFX

| Field | Value |
|---|---|
| Firm | NFX |
| Geography | Israel + US |
| Stage wave | **1** |
| Thesis tags | seed, AI, fintech, network effects |
| Why ELAH fit | Seed firm with a large Israel practice and public AI / fintech writing; useful US + Israel intro graph. |
| Public source | https://nfx.com/ |
| Partner (published) | Gigi Levy-Weiss (author on nfx.com) |
| Email | |
| Status | identified |

### 5.10 Grove Ventures

| Field | Value |
|---|---|
| Firm | Grove Ventures |
| Geography | Israel |
| Stage wave | **1** |
| Thesis tags | pre-seed, seed, enterprise AI, deeptech, AI infra |
| Why ELAH fit | Public early-stage Israel fund focused on enterprise AI and infrastructure. |
| Public source | https://www.groveventures.com/ |
| Partner (published) | Dov Moran — https://www.groveventures.com/team |
| Email | |
| Status | identified |

### 5.11 F2 Capital

| Field | Value |
|---|---|
| Firm | F2 Capital |
| Geography | Israel |
| Stage wave | **1** |
| Thesis tags | early-stage, AI, cybersecurity, Israeli founders |
| Why ELAH fit | Public 0-to-1 Israel seed firm; portfolio narrative includes cyber (e.g. Astrix, Zero Networks on the firm site). |
| Public source | https://www.f2vc.com/ |
| Partner (published) | TBD |
| Email | |
| Status | identified |

### 5.12 Zeev Ventures

| Field | Value |
|---|---|
| Firm | Zeev Ventures |
| Geography | Israel + US (Palo Alto) |
| Stage wave | **1** |
| Thesis tags | seed, enterprise, fintech, cyber |
| Why ELAH fit | Public seed investor with Israeli + US companies, including security names on the firm site (e.g. Sentra, Reco). |
| Public source | https://zeevventures.com/ |
| Partner (published) | Oren Zeev (firm namesake; listed on Fusion’s public mentor network as Zeev Ventures) |
| Email | |
| Status | identified |

### 5.13 Pitango First

| Field | Value |
|---|---|
| Firm | Pitango First |
| Geography | Israel |
| Stage wave | **1** |
| Thesis tags | seed, early-stage, cybersecurity, generative AI, fintech |
| Why ELAH fit | Pitango’s public seed vehicle; site lists cyber, gen-AI, and fintech as First/Growth coverage. |
| Public source | https://www.pitango.com/first/ |
| Partner (published) | TBD |
| Email | |
| Status | identified |

### 5.14 iAngels

| Field | Value |
|---|---|
| Firm | iAngels |
| Geography | Israel |
| Stage wave | **1** |
| Thesis tags | pre-seed, seed, Israeli tech |
| Why ELAH fit | Public Israel early-stage platform; relevant as a local pre-seed/seed node, not a specialist cyber fund. |
| Public source | https://www.iangels.com/ |
| Partner (published) | TBD |
| Email | |
| Status | identified |

### 5.15 First Round Capital

| Field | Value |
|---|---|
| Firm | First Round Capital |
| Geography | US |
| Stage wave | **1** |
| Thesis tags | seed, enterprise, AI, fintech |
| Why ELAH fit | Well-known US seed firm with public enterprise / AI / fintech coverage. |
| Public source | https://www.firstround.com/ |
| Partner (published) | TBD |
| Email | |
| Status | identified |

### 5.16 Point Nine

| Field | Value |
|---|---|
| Firm | Point Nine |
| Geography | Europe (invests globally) |
| Stage wave | **1** |
| Thesis tags | seed, B2B SaaS, AI |
| Why ELAH fit | Public early-stage B2B/AI firm; enterprise software thesis matches a bank-sold security product. |
| Public source | https://www.pointnine.com/ |
| Partner (published) | TBD |
| Email | |
| Status | identified |

### 5.17 Seedcamp

| Field | Value |
|---|---|
| Firm | Seedcamp |
| Geography | Europe |
| Stage wave | **1** |
| Thesis tags | pre-seed, seed, AI, cybersecurity, fintech |
| Why ELAH fit | Public European seed platform covering AI, cyber, and fintech. |
| Public source | https://seedcamp.com/ |
| Partner (published) | TBD |
| Email | |
| Status | identified |

### 5.18 QED Investors

| Field | Value |
|---|---|
| Firm | QED Investors |
| Geography | US / global |
| Stage wave | **1** |
| Thesis tags | fintech |
| Why ELAH fit | Public fintech-specialist firm; relevant if the story is told as bank-risk infrastructure, not generic SaaS. |
| Public source | https://www.qedinvestors.com/ |
| Partner (published) | TBD |
| Email | |
| Status | identified |

### 5.19 Nyca Partners

| Field | Value |
|---|---|
| Firm | Nyca Partners |
| Geography | US |
| Stage wave | **1** |
| Thesis tags | fintech, early-stage |
| Why ELAH fit | Public financial-services technology investor; thematic fit for bank buyers. |
| Public source | https://www.nyca.com/ |
| Partner (published) | TBD |
| Email | |
| Status | identified |

### 5.20 Ballistic Ventures

| Field | Value |
|---|---|
| Firm | Ballistic Ventures |
| Geography | US |
| Stage wave | **1** |
| Thesis tags | cybersecurity, early-stage |
| Why ELAH fit | Public cyber-only early-stage firm; “first partner” posture for security founders. |
| Public source | https://www.ballisticventures.com/ |
| Partner (published) | TBD |
| Email | |
| Status | identified |

### 5.21 Unusual Ventures

| Field | Value |
|---|---|
| Firm | Unusual Ventures |
| Geography | US |
| Stage wave | **1** |
| Thesis tags | seed, enterprise |
| Why ELAH fit | Public enterprise-seed firm; company-building support for B2B security products. |
| Public source | https://www.unusual.vc/ |
| Partner (published) | TBD |
| Email | |
| Status | identified |

### 5.22 Amplify Partners

| Field | Value |
|---|---|
| Firm | Amplify Partners |
| Geography | US |
| Stage wave | **1** |
| Thesis tags | seed, AI infrastructure, enterprise |
| Why ELAH fit | Well-known seed firm for technical infrastructure and AI; fit if ELAH is framed as scoring infrastructure, not a consumer app. |
| Public source | https://www.amplifypartners.com/ |
| Partner (published) | TBD |
| Email | |
| Status | identified |

---

## 6. Wave 2 — later, multi-stage, or company-builder

Not the first cold wave. Use after a seed lead, a warm intro, or when the round is clearly A-shaped.

### 6.1 Aleph

| Field | Value |
|---|---|
| Firm | Aleph |
| Geography | Israel |
| Stage wave | **2** |
| Thesis tags | later seed / Series A, Israeli tech |
| Why ELAH fit | Premier Israeli firm; typically later than a first pre-seed check. |
| Public source | https://www.aleph.vc/ |
| Partner (published) | TBD |
| Email | |
| Status | research |

### 6.2 Team8

| Field | Value |
|---|---|
| Firm | Team8 |
| Geography | Israel |
| Stage wave | **2** |
| Thesis tags | cybersecurity, fintech, company-builder + capital |
| Why ELAH fit | Public cyber/fintech platform that **builds and invests**; often in-house company creation rather than inbound seed. |
| Public source | https://www.team8.vc/ |
| Partner (published) | TBD |
| Email | |
| Status | research |

### 6.3 Ten Eleven Ventures

| Field | Value |
|---|---|
| Firm | Ten Eleven Ventures |
| Geography | US / global |
| Stage wave | **2** |
| Thesis tags | cybersecurity, multi-stage |
| Why ELAH fit | Public cyber-specialist; stage-agnostic, more natural after a seed lead. |
| Public source | https://www.1011vc.com/ |
| Partner (published) | TBD |
| Email | |
| Status | research |

### 6.4 Paladin Capital Group

| Field | Value |
|---|---|
| Firm | Paladin Capital Group |
| Geography | US |
| Stage wave | **2** |
| Thesis tags | cybersecurity, AI, deep tech, multi-stage |
| Why ELAH fit | Public multi-stage cyber/AI investor; later-check profile. |
| Public source | https://www.paladincapgroup.com/ |
| Partner (published) | TBD |
| Email | |
| Status | research |

### 6.5 Viola Ventures

| Field | Value |
|---|---|
| Firm | Viola Ventures |
| Geography | Israel |
| Stage wave | **2** |
| Thesis tags | seed through B, AI, fintech, enterprise |
| Why ELAH fit | Large Israeli early-stage franchise; often a follow-on or larger first check than Wave 1 seed specialists. |
| Public source | https://www.viola-group.com/fund/violaventures/ |
| Partner (published) | TBD |
| Email | |
| Status | research |

---

## 7. Park — real firms, wrong motion for this list

Keep on the map. Do **not** treat as a cold-email queue.

### 7.1 OurCrowd

| Field | Value |
|---|---|
| Firm | OurCrowd |
| Geography | Israel / global |
| Stage wave | **park** |
| Thesis tags | crowdfunding / investment platform |
| Why parked | Public platform / syndicate model, not a classic pre-seed partnership fund for this CRM motion. |
| Public source | https://www.ourcrowd.com/ |
| Partner (published) | TBD |
| Email | |
| Status | research |

### 7.2 Vintage Investment Partners

| Field | Value |
|---|---|
| Firm | Vintage Investment Partners |
| Geography | Israel |
| Stage wave | **park** |
| Thesis tags | fund-of-funds, secondaries |
| Why parked | FoF / LP-style capital; not a direct seed lead for ELAH. |
| Public source | https://www.vintage-ip.com/ |
| Partner (published) | TBD |
| Email | |
| Status | research |

### 7.3 Y Combinator

| Field | Value |
|---|---|
| Firm | Y Combinator |
| Geography | US |
| Stage wave | **park** |
| Thesis tags | accelerator, apply-only |
| Why parked | Application / batch process, not founder-CRM outbound email. Revisit only if the founder chooses to apply. |
| Public source | https://www.ycombinator.com/ |
| Partner (published) | TBD |
| Email | |
| Status | research |

---

## 8. What is still missing (intentionally)

| Gap | Action |
|---|---|
| Personal emails | Collect only from a **direct** reply, a warm intro, or a published personal address the founder has verified. Never guess. |
| TBD partners | Fill from the firm’s own team page before `ready_to_contact`. If still unpublished, leave TBD. |
| LinkedIn people URLs | Optional later; CRM `linkedInUrl` currently stores the **public firm page**. |
| Angels as individuals | Not listed unless a public personal investing page exists. Do not invent. |

---

## 9. CRM mapping

| Field | Value used |
|---|---|
| `contactType` | `investor` |
| `outreachStatus` | `identified` (Wave 1) or `research` (Wave 2 + park) |
| `email` | `null` |
| `linkedInUrl` | Public firm page from the Source column |
| `notes` | Wave + thesis tags + source URL |
| `priority` | `high` Wave 1 · `medium` Wave 2 · `low` park |

Logging replies, intros, and passes: [ELAH_OUTREACH_OPS.md](./ELAH_OUTREACH_OPS.md) (ELAH-FUND-OPS-001).

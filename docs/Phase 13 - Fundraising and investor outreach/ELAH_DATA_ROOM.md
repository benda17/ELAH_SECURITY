# ELAH Data Room Index

| Field | Value |
|---|---|
| Document ID | ELAH-FUND-DR-001 |
| Version | **1.0** |
| Status | **Proposed** |
| Date | 26 August 2026 |
| Classification | Internal — ELAH Security (diligence index; not a public pitch) |
| Owner | Founder |
| Related task | `task-13-create-a-data-room` |
| Depends on | `ELAH-ARCH-001`, `ELAH-SPEC-OUTPUT-001`, Phase 3 service pack, Phase 5 baseline pack, Phase 14 legal tasks |
| Local root | `docs/Phase 13 - Fundraising and investor outreach/data-room/` |
| How to use | [data-room/README.md](./data-room/README.md) |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. No ATM, beneficiary-write, or `device_change` product. Do not `prisma db push`. Closed 22-label taxonomy. `rules_v0` is **uncalibrated** and is **not** a trained model. This pack does **not** invent TAM billions, customers, committed capital, or cap-table percentages. Do not commit secrets or identity documents.

This index maps the **32** Phase 13 Kanban cards onto a **local git data room**. There is no Google Drive, Dropbox, or DocSend copy yet. Live task status lives on founder Kanban (`/founder/roadmap/kanban` on `elahfounderplatform.vercel.app`), not in this file.

---

## 1. Purpose

Give a founder or counsel a single map of what an investor diligence folder *will* contain, which cards fill each folder, and what is still **pending** (legal PDFs, cap table, outbound outreach).

This document is an **index**. It is not incorporation, not a cap table, and not a signed raise.

---

## 2. Folder map

Paths are relative to this pack: `docs/Phase 13 - Fundraising and investor outreach/`.

| Folder | What belongs here | Status 26 Aug 2026 | Share with investors? |
|---|---|---|---|
| [data-room/](./data-room/README.md) | How to use the local room | This pack | After founder review |
| [data-room/company/](./data-room/company/README.md) | Incorporation, IP assignment, option-pool **checklist** | **Pending** — checklist only; no company number | Not until Phase 14 files exist |
| [data-room/cap-table/](./data-room/cap-table/README.md) | Ownership summary | **Pending counsel** — no percentages | Never share a fabricated table |
| [data-room/architecture/](./data-room/architecture/README.md) | **Links only** to canonical Phase 0 / 3 / 5 docs | Pointers shipped | Yes (technical diligence) |
| [data-room/product/](./data-room/product/README.md) | Pointers to deck, one-pager, demo script, FAQ, technical appendix | Pack-root markdown (sibling agents) | Yes (after founder Approve) |
| [data-room/roadmap/](./data-room/roadmap/README.md) | Pointer to investor roadmap snapshot | [ELAH_ROADMAP_FOR_INVESTORS.md](./ELAH_ROADMAP_FOR_INVESTORS.md) | Yes |
| [data-room/market/](./data-room/market/README.md) | Pointer to wedge memo | [ELAH_MARKET.md](./ELAH_MARKET.md) | Yes (qualitative; no unsourced TAM) |
| [data-room/finance/](./data-room/finance/README.md) | Pointers to ask, runway, plan, use of funds, hiring, assumptions | Pack-root markdown (sibling agents) | Proposed planning numbers only |
| [data-room/legal-pending/](./data-room/legal-pending/README.md) | Holding area for counsel PDFs | **Empty by design** | Not until counsel delivers |

Do **not** put into git: `.env`, service tokens, passport/ID scans, unsigned term sheets with invented parties, or a fake cap-table CSV.

---

## 3. Kanban cards → folders

Phase 13 workstream: **Phase 13 — Fundraising and investor outreach**. Thirty-two cards.

### 3.1 Data room (this folder tree)

| Order | Task | Task id | Fills |
|---:|---|---|---|
| 17 | Create a data room. | `task-13-create-a-data-room` | This file + [data-room/README.md](./data-room/README.md) |
| 18 | Add company documents. | `task-13-add-company-documents` | [data-room/company/README.md](./data-room/company/README.md) — **blocked on incorporation** (delay accepted) |
| 19 | Add architecture documents. | `task-13-add-architecture-documents` | [data-room/architecture/README.md](./data-room/architecture/README.md) |
| 20 | Add roadmap documents. | `task-13-add-roadmap-documents` | [ELAH_ROADMAP_FOR_INVESTORS.md](./ELAH_ROADMAP_FOR_INVESTORS.md) + [data-room/roadmap/](./data-room/roadmap/README.md) |
| 21 | Add market research. | `task-13-add-market-research` | [ELAH_MARKET.md](./ELAH_MARKET.md) (`ELAH-FUND-MKT-001`) + [data-room/market/](./data-room/market/README.md) |
| 23 | Add cap-table information when available. | `task-13-add-cap-table-information-when-available` | [data-room/cap-table/README.md](./data-room/cap-table/README.md) — **blocked on incorporation** (delay accepted) |

### 3.2 Product artifacts (pack root; indexed under `data-room/product/`)

| Order | Task | Task id | Expected file (pack root) |
|---:|---|---|---|
| 13 | Create the investor deck. | `task-13-create-the-investor-deck` | `ELAH_INVESTOR_DECK.md` |
| 14 | Create a concise one-pager. | `task-13-create-a-concise-one-pager` | `ELAH_ONE_PAGER.md` |
| 15 | Create a technical appendix. | `task-13-create-a-technical-appendix` | `ELAH_TECHNICAL_APPENDIX.md` |
| 16 | Create a product demo. | `task-13-create-a-product-demo` | `ELAH_DEMO_SCRIPT.md` |
| 27 | Track investor questions. | `task-13-track-investor-questions` | `ELAH_INVESTOR_FAQ.md` (seed FAQ; live log empty until meetings) |
| 31 | Refine the pitch based on feedback. | `task-13-refine-the-pitch-based-on-feedback` | Deck changelog — **blocked** until a real conversation |

### 3.3 Finance artifacts (pack root; indexed under `data-room/finance/`)

| Order | Task | Task id | Expected file (pack root) |
|---:|---|---|---|
| 1 | Define the fundraising target. | `task-13-define-the-fundraising-target` | `ELAH_FUNDRAISE_ASK.md` |
| 2 | Define the expected runway. | `task-13-define-the-expected-runway` | Ask §runway + `ELAH_FINANCIAL_PLAN.md` |
| 3 | Build the financial plan. | `task-13-build-the-financial-plan` | `ELAH_FINANCIAL_PLAN.md` |
| 4 | Define use of funds. | `task-13-define-use-of-funds` | `ELAH_USE_OF_FUNDS.md` |
| 5 | Define hiring priorities. | `task-13-define-hiring-priorities` | `ELAH_HIRING_PRIORITIES.md` |
| 22 | Add financial assumptions. | `task-13-add-financial-assumptions` | `ELAH_FINANCIAL_ASSUMPTIONS.md` |

Working raise copy on founder `/founder/fundraising` is the **founder-approved working ask** (`FIRST_ROUND_PLAN`; Approve 26 August 2026). It is not a closed round. Do not write “raised” or “committed”.

### 3.4 Outreach and CRM (not a data-room share folder)

These cards are founder operating work. They do **not** go into an investor zip until the founder sends mail and logs CRM stages. Agents must not send email.

| Order | Task | Task id | Expected surface |
|---:|---|---|---|
| 6 | Build the investor target list. | `task-13-build-the-investor-target-list` | `ELAH_INVESTOR_LIST.md` + Outreach CRM |
| 7 | Prioritize pre-seed and seed funds. | `task-13-prioritize-pre-seed-and-seed-funds` | List §waves |
| 8 | Prioritize AI, cybersecurity, fintech, and enterprise investors. | `task-13-prioritize-ai-cybersecurity-fintech-and-enterpri` | List §thesis |
| 9 | Identify relevant partners at each fund. | `task-13-identify-relevant-partners-at-each-fund` | List §partners — no invented emails |
| 10 | Track investor emails and LinkedIn profiles. | `task-13-track-investor-emails-and-linkedin-profiles` | CRM fields; email null until founder-supplied |
| 11 | Draft a short cold email. | `task-13-draft-a-short-cold-email` | `ELAH_COLD_EMAIL.md` (draft only) |
| 12 | Draft personalized outreach variants. | `task-13-draft-personalized-outreach-variants` | `ELAH_COLD_EMAIL.md` §variants |
| 24 | Contact investors. | `task-13-contact-investors` | **Founder send** — blocked for agents |
| 25 | Track replies. | `task-13-track-replies` | CRM — blocked until a real reply |
| 26 | Schedule meetings. | `task-13-schedule-meetings` | Calendar — blocked until a real booking |
| 28 | Track follow-ups. | `task-13-track-follow-ups` | CRM `nextFollowUp` |
| 29 | Track introductions. | `task-13-track-introductions` | CRM notes — no fake intro graph |
| 30 | Track passed investors and reasons. | `task-13-track-passed-investors-and-reasons` | CRM stage `passed` |
| 32 | Maintain an investor pipeline. | `task-13-maintain-an-investor-pipeline` | `/founder/roadmap/outreach` + `ELAH_OUTREACH_OPS.md` |

### 3.5 Legal (Phase 14; not Phase 13 PDFs)

Company files, IP assignment, option pool, privacy policy, and ownership review are **Phase 14 — Company, legal, privacy, and compliance**. See [data-room/company/README.md](./data-room/company/README.md) and [data-room/legal-pending/README.md](./data-room/legal-pending/README.md). Phase 13 only ships checklists and empty slots.

---

## 4. What this room must never contain

| Forbidden | Why |
|---|---|
| Fabricated TAM / ARR / logos | No customers or closed capital as of this date |
| Cap-table percentages | Counsel has not produced a table |
| Company registration numbers | Not invented here |
| Identity documents, passports, bank statements | Out of git |
| Service tokens, `.env`, demo passwords in a shared zip | Ops secrets stay in env, not diligence |
| “ELAH blocks fraud / allow-lists tools” | Product freeze |

Demo credentials for the **simulator** (`security.admin@elah.demo` / Jane) live in Phase 3/5 docs. Recite them in a live demo; do not treat them as production bank access.

---

## 5. Sign-off

| Decision | Initials | Date |
|---|---|---|
| Approve | | |
| Approve with comments | | |
| Reject | | |

Status remains **Proposed** until the founder fills the table.

---

*End of document.*

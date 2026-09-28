# Phase 13 — Fundraising and investor outreach (documentation)

Canonical **documentation** pack for Phase 13. This is company fundraising, not banking-MVP product. **Agents do not send email.** No fabricated customers, pilots, ARR, committed capital, emails, or cap-table percentages. Do not `prisma db push`.

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. `rules_v0` is **uncalibrated** and is **not** a trained model.

Evidence date: **26 August 2026**. Working ask from Fundraising: **$400K founder-approved** pre-seed / 12 months (**not closed**).

CRM: founder dashboard `/founder/roadmap/outreach`. Fundraising numbers UI: `/founder/fundraising`. Demo: `security.admin@elah.demo` / `DemoPass123!` (banking app, for the demo script only).

This pack maps all **32** Phase 13 Kanban cards.

---

## Index

| Order | Task | Task id | Doc ID | File |
|---:|---|---|---|---|
| 1 | Define the fundraising target. | `task-13-define-the-fundraising-target` | ELAH-FUND-ASK-001 | [ELAH_FUNDRAISE_ASK.md](./ELAH_FUNDRAISE_ASK.md) |
| 2 | Define the expected runway. | `task-13-define-the-expected-runway` | ELAH-FUND-ASK-001 | [ELAH_FUNDRAISE_ASK.md](./ELAH_FUNDRAISE_ASK.md) |
| 3 | Build the financial plan. | `task-13-build-the-financial-plan` | ELAH-FUND-PLAN-001 | [ELAH_FINANCIAL_PLAN.md](./ELAH_FINANCIAL_PLAN.md) |
| 4 | Define use of funds. | `task-13-define-use-of-funds` | ELAH-FUND-UOF-001 | [ELAH_USE_OF_FUNDS.md](./ELAH_USE_OF_FUNDS.md) |
| 5 | Define hiring priorities. | `task-13-define-hiring-priorities` | ELAH-FUND-HIRE-001 | [ELAH_HIRING_PRIORITIES.md](./ELAH_HIRING_PRIORITIES.md) |
| 6 | Build the investor target list. | `task-13-build-the-investor-target-list` | ELAH-FUND-LIST-001 | [ELAH_INVESTOR_LIST.md](./ELAH_INVESTOR_LIST.md) |
| 7 | Prioritize pre-seed and seed funds. | `task-13-prioritize-pre-seed-and-seed-funds` | ELAH-FUND-LIST-001 | [ELAH_INVESTOR_LIST.md](./ELAH_INVESTOR_LIST.md) |
| 8 | Prioritize AI, cybersecurity, fintech, and enterprise investors. | `task-13-prioritize-ai-cybersecurity-fintech-and-enterpri` | ELAH-FUND-LIST-001 | [ELAH_INVESTOR_LIST.md](./ELAH_INVESTOR_LIST.md) |
| 9 | Identify relevant partners at each fund. | `task-13-identify-relevant-partners-at-each-fund` | ELAH-FUND-LIST-001 | [ELAH_INVESTOR_LIST.md](./ELAH_INVESTOR_LIST.md) |
| 10 | Track investor emails and LinkedIn profiles. | `task-13-track-investor-emails-and-linkedin-profiles` | ELAH-FUND-LIST-001 | [ELAH_INVESTOR_LIST.md](./ELAH_INVESTOR_LIST.md) |
| 11 | Draft a short cold email. | `task-13-draft-a-short-cold-email` | ELAH-FUND-MAIL-001 | [ELAH_COLD_EMAIL.md](./ELAH_COLD_EMAIL.md) |
| 12 | Draft personalized outreach variants. | `task-13-draft-personalized-outreach-variants` | ELAH-FUND-MAIL-001 | [ELAH_COLD_EMAIL.md](./ELAH_COLD_EMAIL.md) |
| 13 | Create the investor deck. | `task-13-create-the-investor-deck` | ELAH-FUND-DECK-001 | [ELAH_INVESTOR_DECK.md](./ELAH_INVESTOR_DECK.md) |
| 14 | Create a concise one-pager. | `task-13-create-a-concise-one-pager` | ELAH-FUND-1P-001 | [ELAH_ONE_PAGER.md](./ELAH_ONE_PAGER.md) |
| 15 | Create a technical appendix. | `task-13-create-a-technical-appendix` | ELAH-FUND-TECH-001 | [ELAH_TECHNICAL_APPENDIX.md](./ELAH_TECHNICAL_APPENDIX.md) |
| 16 | Create a product demo. | `task-13-create-a-product-demo` | ELAH-FUND-DEMO-001 | [ELAH_DEMO_SCRIPT.md](./ELAH_DEMO_SCRIPT.md) |
| 17 | Create a data room. | `task-13-create-a-data-room` | ELAH-FUND-DR-001 | [ELAH_DATA_ROOM.md](./ELAH_DATA_ROOM.md) |
| 18 | Add company documents. | `task-13-add-company-documents` | ELAH-FUND-DR-001 | [data-room/company/README.md](./data-room/company/README.md) |
| 19 | Add architecture documents. | `task-13-add-architecture-documents` | ELAH-FUND-DR-001 | [data-room/architecture/README.md](./data-room/architecture/README.md) |
| 20 | Add roadmap documents. | `task-13-add-roadmap-documents` | ELAH-FUND-RM-001 | [ELAH_ROADMAP_FOR_INVESTORS.md](./ELAH_ROADMAP_FOR_INVESTORS.md) |
| 21 | Add market research. | `task-13-add-market-research` | ELAH-FUND-MKT-001 | [ELAH_MARKET.md](./ELAH_MARKET.md) |
| 22 | Add financial assumptions. | `task-13-add-financial-assumptions` | ELAH-FUND-ASSUME-001 | [ELAH_FINANCIAL_ASSUMPTIONS.md](./ELAH_FINANCIAL_ASSUMPTIONS.md) |
| 23 | Add cap-table information when available. | `task-13-add-cap-table-information-when-available` | ELAH-FUND-DR-001 | [data-room/cap-table/README.md](./data-room/cap-table/README.md) |
| 24 | Contact investors. | `task-13-contact-investors` | ELAH-FUND-OPS-001 | [ELAH_OUTREACH_OPS.md](./ELAH_OUTREACH_OPS.md) |
| 25 | Track replies. | `task-13-track-replies` | ELAH-FUND-OPS-001 | [ELAH_OUTREACH_OPS.md](./ELAH_OUTREACH_OPS.md) |
| 26 | Schedule meetings. | `task-13-schedule-meetings` | ELAH-FUND-OPS-001 | [ELAH_OUTREACH_OPS.md](./ELAH_OUTREACH_OPS.md) |
| 27 | Track investor questions. | `task-13-track-investor-questions` | ELAH-FUND-FAQ-001 | [ELAH_INVESTOR_FAQ.md](./ELAH_INVESTOR_FAQ.md) |
| 28 | Track follow-ups. | `task-13-track-follow-ups` | ELAH-FUND-OPS-001 | [ELAH_OUTREACH_OPS.md](./ELAH_OUTREACH_OPS.md) |
| 29 | Track introductions. | `task-13-track-introductions` | ELAH-FUND-OPS-001 | [ELAH_OUTREACH_OPS.md](./ELAH_OUTREACH_OPS.md) |
| 30 | Track passed investors and reasons. | `task-13-track-passed-investors-and-reasons` | ELAH-FUND-OPS-001 | [ELAH_OUTREACH_OPS.md](./ELAH_OUTREACH_OPS.md) |
| 31 | Refine the pitch based on feedback. | `task-13-refine-the-pitch-based-on-feedback` | ELAH-FUND-DECK-001 | [ELAH_INVESTOR_DECK.md](./ELAH_INVESTOR_DECK.md) |
| 32 | Maintain an investor pipeline. | `task-13-maintain-an-investor-pipeline` | ELAH-FUND-OPS-001 | [ELAH_OUTREACH_OPS.md](./ELAH_OUTREACH_OPS.md) |
| — | Founder executive summary | — | — | [ELAH_PHASE13_EXECUTIVE_SUMMARY.md](./ELAH_PHASE13_EXECUTIVE_SUMMARY.md) |

---

## How to read

1. **Ask** — $400K founder-approved working ask (26 August 2026); year-1 revenue $0; no invented instrument or cap table; round not closed.
2. **List + CRM** — 30 public firms; emails blank; nobody contacted.
3. **Pitch** — 13-slide markdown deck, one-pager, cold email, demo script, FAQ seed.
4. **Data room** — git index; company and cap-table folders are checklists pending counsel.
5. **Ops** — how you send and log; agents never send.

Related: Phase 0 scope, Phase 5 eval (blinded holdout 0.79). Founder Kanban is the live task status.

---

*End of document.*

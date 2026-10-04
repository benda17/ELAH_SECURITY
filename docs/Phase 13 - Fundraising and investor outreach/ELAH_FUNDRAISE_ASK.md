# ELAH Fundraise Ask

| Field | Value |
|---|---|
| Document ID | ELAH-FUND-ASK-001 |
| Version | **1.0** |
| Status | **Approved** (working ask; round **not closed**) |
| Date | 26 August 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Source of numbers | Founder dashboard `elah-roadmap-data.ts` (`FIRST_ROUND_PLAN`, `USE_OF_FUNDS`) — **matches Fundraising**; founder **Approve** 26 August 2026. Still **not closed**. |
| Depends on | `ELAH-FUND-UOF-001`, `ELAH-FUND-PLAN-001`, `ELAH-FUND-ASSUME-001` |
| Related | `ELAH-FUND-HIRE-001` |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. No ATM, beneficiary-write, or `device_change` product. Do not `prisma db push`. Closed 22-label taxonomy. `rules_v0` is **uncalibrated** and is **not** a trained model. No fabricated customers, pilots, ARR, or committed capital.

---

## 1. Purpose

State the first-round ask so founders and prospective angels can see amount, round type, what the capital is for, and what it is not. Founder **Approve** 26 August 2026: these numbers match `/founder/fundraising` (`FIRST_ROUND_PLAN`, `USE_OF_FUNDS`). A term sheet does not exist. This document does **not** close a round and does **not** record committed capital.

---

## 2. The ask (one line)

**$400K founder-approved working ask, pre-seed / angel-pre-seed, to fund 12 months of execution whose main milestone is installing ELAH in a first client's demo or development environment — not a production bank, not Series A, not committed capital.**

---

## 3. Amount and round type

| Item | Value | Status |
|---|---|---|
| Target raise | **$400,000** | **Founder-approved working ask** (dashboard `targetRaise`; not closed) |
| Round type | Pre-seed / angel-pre-seed | **Founder-approved working ask** (dashboard `roundType`) |
| Planned runway | 12 months | **Founder-approved working ask** (dashboard `runway`) |
| Year-1 revenue in this plan | **$0** | Plan assumption (`ELAH-FUND-PLAN-001`) |
| Committed capital recorded here | **None** | Do not fabricate |

Currency is **USD**. Geographic payroll mix, founder salary, and tax treatment are **founder-unknown** (`ELAH-FUND-ASSUME-001`).

---

## 4. Instrument

| Item | Value | Status |
|---|---|---|
| Legal instrument (SAFE vs priced equity vs convertible note) | — | **Founder-unknown**. Not in the dashboard. Do not invent. |
| Valuation cap | — | **Not invented** |
| Discount | — | **Not invented** |
| Equity % / option pool / cap table | — | **Not invented**. This pack does not contain a cap table. |

Until the founder chooses an instrument, treat the ask as **amount + round type + use of funds**, not as a priced round.

---

## 5. What this capital funds

Dashboard `FIRST_ROUND_PLAN.mainMilestone`:

> Install ELAH inside a first client's demo or development environment.

That milestone is a **goal**, not a named bank, not a signed LOI, and not a production install. Capital is intended to cover 12 months of the eight use-of-funds buckets in `ELAH-FUND-UOF-001` (amounts unchanged from `USE_OF_FUNDS`):

| Bucket | Amount |
|---|---|
| Backend / AI expert | $160K |
| Dataset creation, labeling, data science | $70K |
| Cloud, compute, databases, tools | $50K |
| Legal, company setup, contracts | $25K |
| Security / compliance review | $30K |
| Product / dashboard polish | $20K |
| Customer discovery, pilots, travel | $30K |
| Buffer | $15K |
| **Total** | **$400K** |

Product work this funds (and does not fund) is in `ELAH-FUND-UOF-001`. First hire is the Backend / AI line (`ELAH-FUND-HIRE-001`).

Twelve-month goals copied from dashboard `TWELVE_MONTH_GOALS` — they are targets, not evidence of customers or a trained production model:

1. Establish the legal company and basic operational infrastructure.
2. Hire or deeply involve one backend / AI expert.
3. Convert 25,000+ existing logs into a clean, labeled training dataset.
4. Expand the dataset with synthetic and public-pattern banking events.
5. Build a separate ELAH scoring service with versioned model outputs.
6. Train the first lightweight ELAH model and benchmark accuracy/explainability.
7. Integrate ELAH scores, coordinates, and explanations into the analytics dashboard.
8. Reach one client pilot or demo/development-environment installation.

`rules_v0` remains uncalibrated until a later model actually beats the Phase 5 holdout bar. Goal 6 is a **plan**, not a claim that a trained model exists today.

---

## 6. What this ask is not

| Not | Why |
|---|---|
| Series A | Round type is pre-seed / angel-pre-seed. No growth, ARR, or multi-bank scale story in this pack. |
| A production-bank install budget | Milestone is demo or **development** environment. Production core-banking integration is out of MVP (`ELAH-PRD-MVP-SCOPE-001`). |
| Committed capital | $400K is a **target**. No investor, no close date, no wired funds. |
| An ARR or revenue raise | Year-1 revenue in the financial plan is **$0**. Do not invent ARR. |
| A claim that `rules_v0` is a trained model | `rules_v0` is uncalibrated rules. Model training is a use of funds, not a present fact. |
| An ELAH allow / deny / execute budget | Bank policy remains the authority. Capital does not buy an enforcement engine. |
| ATM, beneficiary-write, or `device_change` product | Product freeze. Do not staff or budget those lines. |
| A fraud-TM / transaction-monitoring replacement | ELAH scores genuine banking intent. It is not TM. |
| Customer-visible scoring | Jane never sees `elahScore`. Dashboard spend is analyst/admin polish. |

---

## 7. Honesty constraints for outreach

When this ask is used in conversation or a one-pager:

- Quote **founder-approved working ask**, not closed. Do not say “raised” or “committed.”
- Do not name banks, pilots, or customers that are not in a signed founder document.
- Do not quote cap table percentages.
- Do not present holdout metrics as production model performance.
- Do not say ELAH allows, blocks, or executes.

---

## 8. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder | Founder | 26 August 2026 | **Approve** |
| Engineering |  |  |  |
| Security |  |  |  |

**Approval statement:** I agree the working ask matches Fundraising: **$400K** pre-seed / angel-pre-seed for **12 months**; the main milestone is a first-client **demo or development-environment** install; the eight use-of-funds buckets sum to $400K; instrument / cap / equity % remain founder-unknown until I set them; year-1 revenue in this plan is **$0**; no committed capital or named customers are claimed here; and ELAH still never allows, blocks, or executes. Founder approved 26 August 2026. This is not a closed round.

---

*End of document.*

# ELAH Financial Plan (12 months)

| Field | Value |
|---|---|
| Document ID | ELAH-FUND-PLAN-001 |
| Version | **1.0** |
| Status | **Proposed** |
| Date | 26 August 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Source of numbers | Founder dashboard `elah-roadmap-data.ts` (`USE_OF_FUNDS` totals) — **Proposed**, not closed |
| Depends on | `ELAH-FUND-ASK-001`, `ELAH-FUND-UOF-001`, `ELAH-FUND-ASSUME-001` |
| Machine table | `ELAH_FINANCIAL_PLAN.csv` (same folder; identical quarterly cells) |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. No ATM, beneficiary-write, or `device_change` product. Do not `prisma db push`. Closed 22-label taxonomy. `rules_v0` is **uncalibrated** and is **not** a trained model. No fabricated customers, pilots, ARR, or committed capital.

---

## 1. Purpose

Give a **12-month, four-quarter** view of the eight use-of-funds buckets. **Every spend cell is an assumption** (`ELAH-FUND-ASSUME-001`). Bucket **totals** are copied from the dashboard and MUST NOT be silently changed. This is not a close, not a bank, and not a P&L with customers.

---

## 2. Plan fence

| Item | Value | Status |
|---|---|---|
| Planning horizon | 12 months from close (quarters Q1–Q4) | Assumption A2 |
| Currency | USD | Assumption A3 |
| Target raise applied to this plan | $400,000 | **Founder-approved working ask** (not closed) |
| Year-1 revenue | **$0** | Plan fact for this document |
| Year-1 ARR | **Not used** | Do not invent ARR |
| Named customers / contracted pilots | **None in this plan** | Do not fabricate |
| Cash in at T0 | $400,000 **if** the Proposed round closes in full | Assumption A1 |

If the round closes below $400K, this phasing is invalid until the founder re-cuts buckets (`ELAH-FUND-ASSUME-001` S1).

---

## 3. Revenue (do not invent)

| Line | Q1 | Q2 | Q3 | Q4 | Year 1 |
|---|---:|---:|---:|---:|---:|
| Product / license / SaaS revenue | $0 | $0 | $0 | $0 | **$0** |
| Professional services revenue | $0 | $0 | $0 | $0 | **$0** |
| Pilot fees | $0 | $0 | $0 | $0 | **$0** |
| **Total revenue** | **$0** | **$0** | **$0** | **$0** | **$0** |

Discovery spend (bucket 7) is **cost**, not income. A demo/dev-environment install is a **milestone**, not a revenue event, unless the founder later marks a line as founder-unknown **and** documents a real contract. This plan does not contain that line.

---

## 4. Operating spend by bucket (assumptions)

Phasing is **how** the eight dashboard totals might fall across four quarters. It is not a payroll offer, not a vendor quote, and not a commitment. Totals match `USE_OF_FUNDS` exactly.

| Bucket (dashboard category) | Q1 | Q2 | Q3 | Q4 | Year 1 |
|---|---:|---:|---:|---:|---:|
| Backend / AI expert | 50,000 | 40,000 | 40,000 | 30,000 | **160,000** |
| Dataset creation, labeling, data science | 10,000 | 25,000 | 25,000 | 10,000 | **70,000** |
| Cloud, compute, databases, tools | 8,000 | 12,000 | 15,000 | 15,000 | **50,000** |
| Legal, company setup, contracts | 15,000 | 5,000 | 3,000 | 2,000 | **25,000** |
| Security / compliance review | 0 | 5,000 | 15,000 | 10,000 | **30,000** |
| Product / dashboard polish | 3,000 | 7,000 | 7,000 | 3,000 | **20,000** |
| Customer discovery, pilots, travel | 5,000 | 7,000 | 8,000 | 10,000 | **30,000** |
| Buffer | 0 | 0 | 5,000 | 10,000 | **15,000** |
| **Total spend** | **91,000** | **101,000** | **118,000** | **90,000** | **400,000** |

Phasing rationale (still assumptions):

- **Backend / AI** — largest line; recruit and start in Q1, continue through Q4 (`ELAH-FUND-HIRE-001` rank 1).
- **Dataset** — lighter in Q1 (schema, guidelines, labeling ops), heavier Q2–Q3 (volume + IAA), taper Q4 (holdout lock).
- **Cloud** — ramps as the separate scoring service and eval jobs run.
- **Legal** — front-loaded company setup and template contracts.
- **Security review** — scoped Q2, performed Q3, remediation Q4, before a demo/dev install is claimed.
- **Dashboard** — analyst/admin polish mid-runway. Jane still never sees `elahScore`.
- **Discovery / travel** — founder-led; heavier later when there is a service to show. Does **not** invent a signed pilot.
- **Buffer** — held until H2; not a ninth product line.

---

## 5. Cash view (illustrative if $400K closes at T0)

| | Q1 | Q2 | Q3 | Q4 |
|---|---:|---:|---:|---:|
| Opening cash (assumption) | 400,000 | 309,000 | 208,000 | 90,000 |
| Revenue | 0 | 0 | 0 | 0 |
| Spend | 91,000 | 101,000 | 118,000 | 90,000 |
| Closing cash (assumption) | 309,000 | 208,000 | 90,000 | 0 |

Closing Q4 at **$0** is the plan if buffer is fully used and the round is exactly $400K. It is not a promise of solvency. Founder salary is **not** in the eight buckets (assumption A8).

---

## 6. What this plan excludes

- ATM, beneficiary-write, or `device_change` product spend
- Fraud transaction-monitoring (TM) team spend
- Production-bank SLA / 99.9% multi-region budget
- Prisma schema work to store scores on `ElahEvent` (forbidden)
- Sales quota / ARR engine
- Cap table, option grants, or investor legal beyond the $25K legal bucket

---

## 7. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder |  |  | Approve / Approve with comments / Reject |
| Engineering |  |  |  |
| Security |  |  |  |

**Approval statement:** I agree every spend cell is an assumption; that bucket totals remain $160K / $70K / $50K / $25K / $30K / $20K / $30K / $15K = **$400K**; that year-1 revenue in this plan is **$0**; that no named customers or ARR are claimed; and that ELAH still never allows, blocks, or executes.

---

*End of document.*

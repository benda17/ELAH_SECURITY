# ELAH Financial Assumptions

| Field | Value |
|---|---|
| Document ID | ELAH-FUND-ASSUME-001 |
| Version | **1.0** |
| Status | **Proposed** |
| Date | 26 August 2026 |
| Classification | Internal — ELAH Security |
| Owner | **Founder** (every row) |
| Source of numbers | Founder dashboard `elah-roadmap-data.ts` (`FIRST_ROUND_PLAN`, `USE_OF_FUNDS`) — **Proposed**, not closed |
| Depends on | `ELAH-FUND-ASK-001`, `ELAH-FUND-PLAN-001`, `ELAH-FUND-UOF-001`, `ELAH-FUND-HIRE-001` |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. No ATM, beneficiary-write, or `device_change` product. Do not `prisma db push`. Closed 22-label taxonomy. `rules_v0` is **uncalibrated** and is **not** a trained model. No fabricated customers, pilots, ARR, or committed capital.

---

## 1. Purpose

List the assumptions this fundraising pack is allowed to use, who owns each (Founder), and what happens if they break. **All spend-phasing cells in `ELAH-FUND-PLAN-001` are assumptions.** Dashboard bucket **totals** are Proposed targets, not quotes.

---

## 2. Assumption list

Owner of every row: **Founder**.

| ID | Assumption | If false |
|---|---|---|
| A1 | The $400K founder-approved working ask (26 August 2026) closes in full, in USD, at the start of the 12-month clock. Approval of the ask is not a close. | Re-cut all eight buckets. Do not keep Q-phasing. Do not invent a smaller “closed” number in outreach. |
| A2 | Runway is 12 months from that close. | Slide the demo/dev-install milestone; do not compress by claiming a trained production model. |
| A3 | Currency is USD. Payroll geography is **founder-unknown**. | Founder sets FX / employer-cost; do not silently stretch $160K into two FTEs. |
| A4 | Year-1 **revenue is $0**. No ARR. No pilot fees in this plan. | A real contract is a new signed assumption, not a silent cell edit. Until then, keep $0. |
| A5 | No named bank customers, LOIs, or committed capital exist in this pack. | Do not fill the gap with logos. Discovery spend stays cost. |
| A6 | Instrument (SAFE vs equity vs note), valuation cap, discount, and cap-table % are **founder-unknown**. | Ask remains amount + round type until the founder writes terms. |
| A7 | Eight bucket **totals** stay $160K / $70K / $50K / $25K / $30K / $20K / $30K / $15K. Quarterly splits are planning only. | Change totals only by a new document version. Do not “fix” the CSV quietly. |
| A8 | Founder compensation is **not** one of the eight buckets (**founder-unknown** whether the founder is paid from this round). | If the founder takes salary from the $400K, another bucket shrinks — explicit version bump, not a hidden ninth line. |
| A9 | Rank 1 hire (or deep contractor) is funded by the **$160K** Backend / AI line and is the first seat. | Delay rank 1 → delay separate service and demo/dev install. Do not substitute an ATM or TM hire. |
| A10 | FTE vs contractor mix inside each bucket is **founder-unknown** except the rank order in `ELAH-FUND-HIRE-001`. | Offers must still fit the bucket total. |
| A11 | Cloud $50K is demo/dev/eval scale, not production-bank SLA. | SLA-seeking spend comes from buffer or a later round, not from inventing revenue. |
| A12 | Security review $30K is a time-boxed review, not a named certification. | Do not claim SOC 2 / ISO / bank regulatory approval from this line. |
| A13 | “Pilots” in the discovery bucket means progress toward a **demo or development-environment** install, not a signed production pilot. | Keep the main milestone wording. Do not upgrade it in a pitch. |
| A14 | `rules_v0` stays uncalibrated until a later model is trained and evaluated against locked gold. Training is a use of funds, not a present result. | Do not pitch `rules_v0` metrics as production model performance. |
| A15 | Buffer $15K is overrun only. Q4 closing cash $0 in the illustrative cash view assumes buffer is fully used. | Unused buffer is cash, not a new product team. |
| A16 | The banking simulator and synthetic/demo users remain the MVP venue until a real client **demo/dev** environment exists. | Do not describe the simulator as a live bank. |
| A17 | ELAH never allows, blocks, or executes; scores are not `ElahEvent` fields; Jane never sees `elahScore`. | Any plan that funds enforcement or customer-visible scores is out of this pack. |

---

## 3. Sensitivity notes

These are qualitative. This pack does **not** contain a Monte Carlo, a hiring market survey, or invented burn multiples.

| Shock | Direction | Notes |
|---|---|---|
| Round closes late or under $400K | Shorten runway or cut buckets | Recut via new version. Rank 1 still comes from whatever remains of Backend / AI — do not skip it for travel. |
| Rank 1 starts late | Demo/dev install slips | Dataset and dashboard still need a service to score. |
| Cloud or eval compute overruns | Hits $15K buffer first | Buffer is 3.75% of the round. Large overrun forces a founder cut elsewhere. |
| Security review expands | Hits buffer or delays Q4 install | Do not skip review to protect a fabricated close date. |
| Discovery finds no demo/dev host in 12 months | Milestone missed | Revenue stays $0. Do not invent ARR to compensate. |
| Founder takes salary (A8 becomes true) | Other buckets shrink | Document the cut. $160K rank 1 is still the product-critical line. |
| FX / employer on-costs above implicit $160K | Rank 1 becomes contractor or shorter runway | Founder-unknown geography. |
| Temptation to add ATM / TM / enforcement staff | Freeze violation | Reject the hire. Not a sensitivity to “solve” with budget. |

No sensitivity in this table is permission to fabricate customers, ARR, or committed capital.

---

## 4. Founder-unknown register (do not fill with fiction)

| Topic | Status |
|---|---|
| Legal instrument and cap/discount | Founder-unknown |
| Cap table % | Not in this pack |
| Founder salary | Founder-unknown |
| Payroll country / benefits load | Founder-unknown |
| Named candidates | None |
| Named banks / pilots | None |
| Year-1 revenue other than $0 | Not in this plan |
| Certification target (SOC 2, ISO, etc.) | Founder-unknown |

---

## 5. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder |  |  | Approve / Approve with comments / Reject |
| Engineering |  |  |  |
| Security |  |  |  |

**Approval statement:** I own every assumption in this list; I agree year-1 revenue in the plan is **$0**, that $400K and the eight bucket totals are the **founder-approved working ask** (not closed), that instrument and cap table are not invented here, and that ELAH still never allows, blocks, or executes.

---

*End of document.*

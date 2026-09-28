# ELAH Hiring Priorities

| Field | Value |
|---|---|
| Document ID | ELAH-FUND-HIRE-001 |
| Version | **1.0** |
| Status | **Proposed** |
| Date | 26 August 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Source of numbers | Founder dashboard `elah-roadmap-data.ts` (`USE_OF_FUNDS`, `TWELVE_MONTH_GOALS`) — **Proposed**, not closed |
| Depends on | `ELAH-FUND-UOF-001`, `ELAH-FUND-ASK-001`, `ELAH-FUND-ASSUME-001` |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. No ATM, beneficiary-write, or `device_change` product. Do not `prisma db push`. Closed 22-label taxonomy. `rules_v0` is **uncalibrated** and is **not** a trained model. No fabricated customers, pilots, ARR, or committed capital.

---

## 1. Purpose

Rank **five** roles the Proposed $400K can actually pay for. The dashboard twelve-month goal is: *hire or deeply involve one backend / AI expert*. That is **rank 1** and it aligns with the **$160K Backend / AI expert** line. No named candidates. No invented headcount beyond these five. FTE vs contractor vs part-time is **founder-unknown** except that rank 1 is the first seat to fill.

---

## 2. Ranked roles

### Rank 1 — Backend / AI expert (first hire)

| Field | Value |
|---|---|
| Funds from | **$160K** Backend / AI expert |
| When | First seat after close (plan Q1 start, `ELAH-FUND-PLAN-001`) |
| Named person | **None**. Do not invent candidates. |
| Engagement | FTE, contractor, or “deeply involve” — founder choice |

**Does:** separate ELAH scoring service; versioned score / coordinates / explanation outputs; keep `rules_v0` honest as uncalibrated until a later artifact is trained and evaluated; prediction logs; never wire ELAH into allow / deny / execute.

**Does not:** own bank policy; ship ATM / beneficiary-write / `device_change`; put `elahScore` on Jane’s UI; `prisma db push` scores onto `ElahEvent`; replace fraud TM.

### Rank 2 — Dataset / labeling / data science

| Field | Value |
|---|---|
| Funds from | **$70K** Dataset creation, labeling, data science |
| When | After labeling guidelines and service path are usable (plan heavier Q2–Q3) |
| Named person | **None** |

**Does:** gold expansion, log normalization, synthetic/public-pattern events, annotator workflow, IAA, eval-set hygiene. May be one specialist plus paid annotators under the same bucket.

**Does not:** invent live-bank datasets; staff a transaction-monitoring analyst team; treat labels as enforcement.

### Rank 3 — External security / compliance reviewer

| Field | Value |
|---|---|
| Funds from | **$30K** Security / compliance review |
| When | Scoped Q2, review Q3, remediation Q4 (plan assumption) |
| Named person / firm | **None** |

**Does:** time-boxed review of scoring path, secrets, admin surfaces, log privacy — before offering a **demo or development-environment** install.

**Does not:** become an in-house SOC; certify a production bank; authorize ELAH to allow / block.

### Rank 4 — Product / dashboard contractor

| Field | Value |
|---|---|
| Funds from | **$20K** Product / dashboard polish |
| When | Mid-runway (plan Q2–Q3) |
| Named person | **None** |

**Does:** security-admin / analyst dashboard: distributions, coordinates, explanations, uncalibrated badge, threshold **demo** that shows **bank** policy changing behavior while ELAH only scores.

**Does not:** show `elahScore` to Jane; build a customer-facing risk widget; add ATM or device-change UX.

### Rank 5 — External counsel (company / contracts)

| Field | Value |
|---|---|
| Funds from | **$25K** Legal, company setup, contracts |
| When | Front-loaded Q1 (plan assumption) |
| Named firm | **None** |

**Does:** entity, basic contracts, demo-environment terms templates.

**Does not:** invent cap tables, committed capital, or customer logos.

---

## 3. Who is not a hire on this round

Do **not** staff from these eight buckets:

| Anti-role | Why |
|---|---|
| ATM product engineer | No ATM product |
| Beneficiary-write / payee-graph team | Recipients are read-derived |
| `device_change` / device-inventory team | Unusual device is a tag + optional client fields |
| Fraud transaction-monitoring (TM) team | ELAH is not TM |
| Policy / enforcement engineers whose job is ELAH allow-deny | Bank policy remains the authority |
| Quota-carrying sales team funded as if Year-1 ARR exists | Year-1 revenue in this plan is **$0** |
| Customer-UI scoring designer | Jane never sees `elahScore` |

Founder remains the discovery owner (bucket 7 is travel/discovery cost, not a VP Sales seat). Cloud ($50K) and buffer ($15K) are **not** headcount lines.

---

## 4. Sequencing

1. Close is **Proposed**, not assumed.
2. Rank 1 starts (or is contracted) first — this is the $160K line.
3. Rank 5 (counsel) in parallel with company setup.
4. Rank 2 ramps when there is a labeling/eval loop to feed.
5. Rank 4 polishes analyst surfaces on live scores.
6. Rank 3 reviews before a demo/dev install is claimed.

No candidate names, offer letters, or start dates appear in this document.

---

## 5. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder |  |  | Approve / Approve with comments / Reject |
| Engineering |  |  |  |
| Security |  |  |  |

**Approval statement:** I agree rank 1 is the Backend / AI seat funded by **$160K**; that five roles are the hiring fence for this Proposed round; that no named candidates or ATM / fraud-TM / enforcement teams are authorized here; and that ELAH still never allows, blocks, or executes.

---

*End of document.*

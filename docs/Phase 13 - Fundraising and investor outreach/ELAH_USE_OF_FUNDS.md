# ELAH Use of Funds

| Field | Value |
|---|---|
| Document ID | ELAH-FUND-UOF-001 |
| Version | **1.0** |
| Status | **Approved** (bucket totals with the working ask; round **not closed**) |
| Date | 26 August 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Source of numbers | Founder dashboard `elah-roadmap-data.ts` (`USE_OF_FUNDS`, `USE_OF_FUNDS_TOTAL`) — **matches Fundraising**; founder **Approve** 26 August 2026 via `ELAH-FUND-ASK-001`. Still **not closed**. |
| Depends on | `ELAH-FUND-ASK-001`, `ELAH-FUND-PLAN-001`, `ELAH-FUND-HIRE-001` |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. No ATM, beneficiary-write, or `device_change` product. Do not `prisma db push`. Closed 22-label taxonomy. `rules_v0` is **uncalibrated** and is **not** a trained model. No fabricated customers, pilots, ARR, or committed capital.

---

## 1. Purpose

Restate the eight dashboard buckets **without changing dollar amounts**, and map each bucket to product work that stays inside the freeze. Amounts below are copied from `USE_OF_FUNDS`. Silent edits of $ figures are a defect.

---

## 2. Totals (unchanged)

| Category (dashboard label) | Amount (USD) | Amount label |
|---|---:|---|
| Backend / AI expert | 160,000 | $160K |
| Dataset creation, labeling, data science | 70,000 | $70K |
| Cloud, compute, databases, tools | 50,000 | $50K |
| Legal, company setup, contracts | 25,000 | $25K |
| Security / compliance review | 30,000 | $30K |
| Product / dashboard polish | 20,000 | $20K |
| Customer discovery, pilots, travel | 30,000 | $30K |
| Buffer | 15,000 | $15K |
| **Total** | **400,000** | **$400K** |

Checksum: 160 + 70 + 50 + 25 + 30 + 20 + 30 + 15 = **400**.

---

## 3. Bucket → product work

### 3.1 Backend / AI expert — $160K

**Maps to:** first hire or deep contractor (`ELAH-FUND-HIRE-001` rank 1); separate ELAH scoring service; versioned `/v1` score outputs; path from uncalibrated `rules_v0` toward a lightweight model that can be **benchmarked** against Phase 4/5 gold — not a claim that a trained production model exists today.

In-scope product work:

- Keep scoring **before** tool execution.
- Service health, infer, batch-infer, events, model-info style APIs as the service matures.
- Prediction logs + model version on every response.
- Hybrid / trained scoring only as a later artifact that must beat the Phase 5 holdout bar without violating the output contract.

Out of this bucket:

- Bank policy allow / deny / confirm implementation (policy stays bank-owned).
- ATM, beneficiary-write, `device_change` product.
- Fraud-TM engine replacement.
- Prisma `db push` to put scores on `ElahEvent`.

### 3.2 Dataset creation, labeling, data science — $70K

**Maps to:** gold dataset expansion, human labeling, IAA protocol, log normalization, synthetic + public-pattern banking events. Dashboard goal “convert 25,000+ existing logs” is a **target**, not a count of labeled production-bank data.

In-scope:

- Closed 22-label taxonomy; accidental error stays a tag, not a 23rd intent.
- Labeling UI for `security.admin` only.
- Privacy: hash user ids, redact, bucket amounts (`ELAH-DATA-PRIV-001` family).
- Holdout remains locked for eval comparability.

Out of this bucket:

- Live customer PII as a fundraising exhibit.
- Fabricated “bank-provided” datasets.
- Labels that encode ELAH allow / block / execute.

### 3.3 Cloud, compute, databases, tools — $50K

**Maps to:** hosting and tools for the scoring service, eval jobs, labeling, and admin dashboards — **demo / development scale**, not a production-bank 99.9% SLA (`ELAH-PRD-ASSUMPTIONS-001` NG3).

In-scope: compute for training/eval experiments, databases, CI, model artifact storage.

Out of this bucket: multi-region production-bank infrastructure, on-device iPhone scoring as a product (founder ops ≠ scorer).

### 3.4 Legal, company setup, contracts — $25K

**Maps to:** legal entity, basic operational contracts, template NDAs / demo-environment terms. Not a claim that customers have signed.

Out of this bucket: invented term sheets, cap table percentages, committed capital.

### 3.5 Security / compliance review — $30K

**Maps to:** independent review of the scoring path, log handling, admin surfaces, and secrets hygiene before a **demo or development-environment** install is offered.

This is **not**:

- a production-bank regulatory certification
- a SOC 2 / ISO claim unless later evidenced
- a review of ATM or TM products ELAH does not ship

Reviewers do not get a mandate to turn ELAH into allow / deny.

### 3.6 Product / dashboard polish — $20K

**Maps to:** analyst / security-admin views: score distributions, coordinates, explanations, low-score actions, ambiguous requests, **Uncalibrated (rules)** badge until a model is actually trained and evaluated.

Jane / customer UI MUST NOT show `elahScore`, confidence, coordinates, or reason codes. This bucket does not buy a customer-facing score widget.

### 3.7 Customer discovery, pilots, travel — $30K

**Maps to:** founder-led conversations and travel toward the main milestone: install ELAH in a **first client's demo or development environment**.

This bucket is **not**:

- a signed-pilot pipeline
- named banks
- ARR
- a production install budget

“Pilots” in the dashboard category name means **discovery toward a demo/dev install**, not evidence that a pilot exists.

### 3.8 Buffer — $15K

**Maps to:** overrun on the seven working buckets (cloud, review hours, travel). Not a stealth ninth product. Not founder-unknown revenue. If unused, it remains cash, not a new hire line that violates the freeze.

---

## 4. Explicit non-spend (freeze)

Do not reallocate these eight totals, even silently, into:

| Forbidden spend | Why |
|---|---|
| ATM product | Out of MVP |
| Beneficiary-write product | Recipients stay read-derived |
| `device_change` product | Unusual device is a tag + optional client fields |
| ELAH enforcement / policy engine | Bank policy allow / deny / confirm |
| Scores as `ElahEvent` columns | Output contract; do not `prisma db push` |
| Customer-visible `elahScore` | Jane never sees the number |
| Fraud-TM replacement team | Wrong product |

---

## 5. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder | Founder | 26 August 2026 | **Approve** (with `ELAH-FUND-ASK-001`) |
| Engineering |  |  |  |
| Security |  |  |  |

**Approval statement:** I agree the eight bucket amounts are copied from Fundraising and are not to be silently changed; that each bucket maps to freeze-compliant product work; that discovery spend is not a named customer or ARR; and that ELAH still never allows, blocks, or executes. Founder approved 26 August 2026 with the working ask. This is not a closed round. Quarterly phasing in `ELAH-FUND-PLAN-001` is not part of this approval.

---

*End of document.*

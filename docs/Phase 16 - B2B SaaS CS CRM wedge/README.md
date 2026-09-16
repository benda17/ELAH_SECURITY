# Phase 16 — B2B SaaS CS/CRM wedge (documentation)

Canonical **documentation** pack for Phase 16. First-client motion is **B2B SaaS customer-support / CRM operations**, not bank-CISO outreach. The banking simulator stays as an existing scoring demo. **Phase 16 does not ship a production CS/CRM model, does not mix rows into banking gold v1.0, and does not change company policy.** Offline naive Bayes in the CRM repo is eval-only and is **not** wired to `/v1/score`. Do not `prisma db push`. Do not invent customers, ARR, logos, emails, or live Zendesk data.

**Product freeze (unchanged):** ELAH scores genuine support/CRM intent **before tools**. Company policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** on the event envelope; they live in `ElahScoreSnapshot`. Customer / support-user UI MUST NOT show `elahScore`. Fail-open 250 ms → `scoring_unavailable`, not a block.

Evidence date: **14 September 2026**. Pivot founder-approved **8 September 2026**. Working ask (Phase 13, unchanged): **$400K** pre-seed / 12 months (**not closed**). Year-1 plan revenue **$0**.

Demo venue: **ELAH CRM Simulation**. GitHub [`benda17/ELAH_SECURITY-CRM-System`](https://github.com/benda17/ELAH_SECURITY-CRM-System). Local [http://localhost:3003](http://localhost:3003). Hosted: [https://elahcrmsystem.vercel.app](https://elahcrmsystem.vercel.app). Dedicated Neon `elah_crm` — never banking `DATABASE_URL`.

Canonical demo users: `basic.customer@elah.demo` (customer), `security.admin@elah.demo` (analyst). Password `DemoPass123!`.

This pack maps all **19** Phase 16 Kanban cards.

---

## How to upload to Confluence

Founder-only paste. Agents do not publish.

1. Create a parent page titled **Phase 16 — B2B SaaS CS/CRM wedge**. Put [ELAH_PHASE16_EXECUTIVE_SUMMARY.md](./ELAH_PHASE16_EXECUTIVE_SUMMARY.md) on that home page.
2. Create one child page per file in the index below. Page title = **Doc ID + short name** (example: `ELAH-WEDGE-ICP-001 — ICP CS/CRM`). Paste the markdown. Keep headings.
3. Keep the header table (Document ID, Version, Status, Date). Status stays **Proposed** until you fill the sign-off table **Approve**.
4. Link each Kanban card’s deliverable to its Confluence child (same Doc ID). Engineering cards that already shipped point at GitHub, not at a fake Confluence “done” metric.
5. Do **not** upload Neon connection strings, `.env`, live ticket exports, or production CRM dumps. Demo password `DemoPass123!` is the known simulator login (same as banking); do not treat it as a customer secret.
6. Do **not** paste banking holdout numbers as CS/CRM or refund accuracy. If you cite them, they must stay labeled **banking-gold / `rules_v0`**.

Upload path for Kanban links: `docs/Phase 16 - B2B SaaS CS CRM wedge/<file>`.

---

## Index

| Order | Task | Task id | Status (seed, 14 Sep 2026) | Doc ID | File / pointer |
|---:|---|---|---|---|---|
| 1 | Rewrite ICP for CS/CRM ops first-buyer | `task-16-rewrite-icp-for-cs-crm-ops-first-buyer` | **in_review** (Proposed) | ELAH-WEDGE-ICP-001 | [ELAH_ICP_CS_CRM.md](./ELAH_ICP_CS_CRM.md) |
| 2 | Build CRM simulator as first demo venue | `task-16-build-crm-simulator-as-first-demo-venue` | in_review | — | GitHub [`benda17/ELAH_SECURITY-CRM-System`](https://github.com/benda17/ELAH_SECURITY-CRM-System). Hosted [elahcrmsystem.vercel.app](https://elahcrmsystem.vercel.app). Not Done until a written founder click-through is on the card. |
| 3 | Define support-tool taxonomy and intent labels | `task-16-define-support-tool-taxonomy-and-intent-labels` | **in_review** (Proposed) | ELAH-WEDGE-TAX-001 | [ELAH_CS_CRM_TAXONOMY.md](./ELAH_CS_CRM_TAXONOMY.md) — 16 labels, v0.1 |
| 4 | Score genuine intent before support tools | `task-16-score-genuine-intent-before-support-tools` | **in_review** (Proposed) | ELAH-WEDGE-FREEZE-001 | [ELAH_CS_CRM_FREEZE.md](./ELAH_CS_CRM_FREEZE.md) |
| 5 | Update newsletter and website ICP copy | `task-16-update-newsletter-and-website-icp-copy` | **in_review** | ELAH-WEDGE-COPY-001 | [ELAH_ICP_COPY.md](./ELAH_ICP_COPY.md). Marketing site already CS/CRM-first (`163643e`). Founder still publishes newsletter. |
| 6 | Build SaaS CS/CRM buyer outreach list | `task-16-build-saas-cs-crm-buyer-outreach-list` | **in_review** | ELAH-WEDGE-LIST-001 | [ELAH_CS_CRM_BUYER_LIST.md](./ELAH_CS_CRM_BUYER_LIST.md) (28 public firms, no emails) |
| 7 | Update investor one-pager wedge sentence | `task-16-update-investor-one-pager-wedge-sentence` | **in_review** (Proposed) | ELAH-FUND-1P-001 | [`../Phase 13 - Fundraising and investor outreach/ELAH_ONE_PAGER.md`](../Phase%2013%20-%20Fundraising%20and%20investor%20outreach/ELAH_ONE_PAGER.md) (v0.2 Proposed). Mirror in the banking-repo Phase 13 folder if present. |
| 8 | Plan gold dataset for support events | `task-16-plan-gold-dataset-for-support-events` | **in_review** | ELAH-WEDGE-GOLD-001 | [ELAH_CS_CRM_GOLD_PLAN.md](./ELAH_CS_CRM_GOLD_PLAN.md). First synthetic cut: 516 rows, seed `20260914`. Do **not** quote rules holdout 1.00 as production. |
| 9 | Keep banking simulator as demo not first sale | `task-16-keep-banking-simulator-as-demo-not-first-sale` | **in_review** | ELAH-WEDGE-ICP-001 | [ELAH_ICP_CS_CRM.md](./ELAH_ICP_CS_CRM.md) §banking-demo |
| 10 | Write CS/CRM wedge demo script | `task-16-write-cs-crm-wedge-demo-script` | **in_review** | ELAH-WEDGE-DEMO-001 | [ELAH_CS_CRM_DEMO_SCRIPT.md](./ELAH_CS_CRM_DEMO_SCRIPT.md) |
| 11 | Wire mock ELAH score into CRM simulator | `task-16-wire-mock-elah-score-into-crm-simulator` | **in_review** | — | GitHub `benda17/ELAH_SECURITY-CRM-System` commit `09633c3`: live `cs_crm_rules_v0`, 250 ms fail-open. Offline NB is eval-only, not `/v1/score`. |
| 12 | Write CS/CRM first-buyer interview script | `task-16-write-cs-crm-first-buyer-interview-script` | **in_review** | ELAH-WEDGE-INT-001 | [ELAH_CS_CRM_INTERVIEW_SCRIPT.md](./ELAH_CS_CRM_INTERVIEW_SCRIPT.md) |
| 13 | Deploy ELAH CRM Simulation to Vercel | `task-16-deploy-elah-crm-simulation-to-vercel` | **done** (14 Sep 2026) | — | GitHub [`benda17/ELAH_SECURITY-CRM-System`](https://github.com/benda17/ELAH_SECURITY-CRM-System) + Vercel project **ELAH_SECURITY-CRM-System**. Founder confirmed the hosted site works. |
| 14 | Provision dedicated Neon database for CRM | `task-16-provision-dedicated-neon-database-for-crm` | **done** (14 Sep 2026) | — | Neon project `elah-crm-simulation`, database `elah_crm`. Never reuse banking `DATABASE_URL`. Connection strings stay gitignored. |
| 15 | Align CRM naming with banking demo | `task-16-align-crm-naming-with-banking-demo` | **done** | — | App chrome: **ELAH CRM / ELAH CRM Simulation**. Founder analytics nav: **CRM System**. No HelioDesk. |
| 16 | Surface CRM analytics in Banking System dashboard | `task-16-surface-crm-analytics-in-banking-system-dashboar` | in_review | — | Founder platform `app/banking/crm/*`. Local SQLite; production reads CRM Neon `elah_crm` via Encrypted `CRM_DATABASE_URL`. Never banking Neon. |
| 17 | Seed CRM demo users and command logs | `task-16-seed-crm-demo-users-and-command-logs` | **done** (14 Sep 2026) | — | GitHub `prisma/seed.ts` + `scripts/seed-crm-traffic.ts`. Hosted Neon `elah_crm`: 30 customers + 10k synthetic command logs. Local SQLite has its own pack. |
| 18 | Point founder dashboard at live CRM Vercel URL | `task-16-point-founder-dashboard-at-live-crm-vercel-url` | **done** (16 Sep 2026) | — | Encrypted `CRM_APP_URL=https://elahcrmsystem.vercel.app` on founder production. |
| 19 | Record GTM pivot on Phase 11–12 Kanban cards | `task-16-record-gtm-pivot-on-phase-11-12-kanban-cards` | **done** | — | `lib/roadmap/seed/phase16.ts` + `scripts/seed-phase16-cs-crm-wedge.ts` (`PHASE_11_12_PIVOT_BANNER`). Phase 11–12 stay as later banking vertical. |
| — | Founder executive summary | — | — | — | [ELAH_PHASE16_EXECUTIVE_SUMMARY.md](./ELAH_PHASE16_EXECUTIVE_SUMMARY.md) |
| — | Site / newsletter / social replacement sentences | — | — | ELAH-WEDGE-COPY-001 | [ELAH_ICP_COPY.md](./ELAH_ICP_COPY.md) |

Closed 16 `ElahCrmIntent` labels (Proposed 0.1): [ELAH_CS_CRM_TAXONOMY.md](./ELAH_CS_CRM_TAXONOMY.md). **Not** a 23rd banking label. Banking 22-label freeze stays in Phase 4.

---

## How to read

1. **ICP + §banking-demo** — who buys this wedge; bank CISO-only outreach is the non-buyer; Jane stays as demo.
2. **Taxonomy + freeze** — 16 CS/CRM labels; utterance → plan → tenant policy → `POST /v1/score` → execute only if policy already allows or the user confirmed.
3. **Gold plan** — `cs_crm_gold` 0.1, seed `20260914`; synthetic + labeled simulator only; never mix into banking gold v1.0.
4. **GTM** — buyer list (emails blank), interview script (no fake notes), copy deck (founder publishes), demo script (CRM first).
5. **Engineering already on GitHub** — simulator, Neon, Vercel, `cs_crm_rules_v0` + fail-open, naming, analytics nav. This pack does not re-implement them.

Related: Phase 13 one-pager (wedge sentence), Phase 4 banking gold (do not overwrite), Phase 11–12 (later banking vertical, pivot banner on every card).

---

*End of document.*

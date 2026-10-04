# ELAH Roadmap for Investors

| Field | Value |
|---|---|
| Document ID | ELAH-FUND-RM-001 |
| Version | **1.0** |
| Status | **Proposed** — snapshot, not a Kanban substitute |
| Date | 26 August 2026 |
| Classification | Internal — ELAH Security (investor-facing snapshot) |
| Owner | Founder |
| Related task | `task-13-add-roadmap-documents` |
| Live status | Founder Kanban: `/founder/roadmap/kanban` on `elahfounderplatform.vercel.app` (`elah-analytics-dashboard`) |
| Data-room pointer | [data-room/roadmap/README.md](./data-room/roadmap/README.md) |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. No ATM, beneficiary-write, or `device_change` product. Do not `prisma db push`. Closed 22-label taxonomy. `rules_v0` is **uncalibrated** and is **not** a trained model.

This is an honest snapshot of **26 August 2026**. It does **not** mark Phases 6–12, 14, or 15 complete. Live card status is Kanban, not this memo.

---

## 1. Purpose

Tell an investor where the product actually is: contracts and a measurable rules baseline on a banking simulator, not a trained production model, not a bank deployment, not a closed round.

Phase names follow founder `PHASE_ORDER` (`lib/roadmap/constants.ts` in `elah-analytics-dashboard`).

---

## 2. Snapshot table

| Phase | Name | Investor status (this date) | Honest caveat |
|---:|---|---|---|
| 0 | Product definition and architecture | **Shipped** (docs pack) | Contracts Proposed for sign-off in several Phase 0 headers; architecture is Neon + `POST /v1/score` |
| 1 | Banking simulator stabilization | **Shipped** (simulator live) | Demo venue only — not a production core bank |
| 2 | Agent observability and event collection | **Shipped** | Envelope + capture; scores still not envelope fields |
| 3 | ELAH service foundation | **Shipped** | Colocated `POST /v1/score`; logical service, not a separate production cluster |
| 4 | Dataset and labeling system | **Shipped** | Taxonomy **Approved** 26 Aug 2026. Live two-person Cohen’s κ is **still founder** (fixture tracker ≠ human IAA) |
| 5 | Baseline scoring system | **Shipped** | `rules_v0` **uncalibrated**. Blinded holdout intent accuracy **0.79** (n=100). Not a trained model |
| 6 | ELAH model development | **Not done** | First trained scorer; must beat holdout bar |
| 7 | Explainability and intention graph | **Not done** | Graph UX beyond current analyst cards |
| 8 | Security architecture and red teaming | **Not done** | Threat model exists in Phase 0; red team not executed as this phase |
| 9 | Product dashboard and analyst experience | **Not done** | Founder/admin viewers exist; Phase 9 ops dashboard is not this MVP |
| 10 | Evaluation and MVP readiness | **Not done** | Holdout eval exists for `rules_v0` only |
| 11 | User discovery and customer validation | **Not done** | Interview guide exists; **no fabricated interviews** |
| 12 | Pilot acquisition | **Not done** | No named design partner |
| 13 | Fundraising and investor outreach | **This pack** | Materials and index; **no email sent by agents**; legal PDFs pending |
| 14 | Company, legal, privacy, and compliance | **Not done** | Counsel; see data-room company / cap-table **pending** |
| 15 | Team and operations | **Not done** | Hiring scorecards after the raise plan |

---

## 3. What Phases 0–5 actually shipped

Evidence lives in the banking repo `ELAH_SECURITY---Banking-System` (docs + `lib/elah/` + `data/phase4` + `data/phase5`).

| Layer | What an investor can verify |
|---|---|
| Product fence | ELAH is a **score** of genuine banking intent before tools. Bank policy remains allow / deny / confirm. |
| Simulator | Authenticated demo users; Jane (`basic.customer@elah.demo`) never sees `elahScore`. |
| Score API | `POST /v1/score`, OpenAPI 3.1, Bearer service token, fail-open. |
| Dataset | Gold v1.0: 571 rows, seed `20260826`, holdout **n=100**. Taxonomy: 22 labels **Approved**. |
| IAA | Overlap packet and κ **script** exist. **Live human κ is still a founder action** (two reviewers on 30 `scenarioId`s). Fixture κ is a tracker test, not a taxonomy-usability result. |
| Baseline | `rules_v0` feature→rules. Blinded holdout intent accuracy **0.79**, legitimate-as-injection FP **0**, injection→P0-money FN **1**, injection recall **0.59**, ECE **0.153** (uncalibrated). Do **not** quote 1.00 (hint-echo). In-process latency is informational vs 80 / 200 ms budgets. |

Canonical write-ups:

- Phase 0 — `docs/Phase 0 - Product Definition/`
- Phase 3 — `docs/Phase 3 - ELAH service foundation/`
- Phase 4 — `docs/Phase 4 - Dataset and labeling system/` (exec: `ELAH_PHASE4_EXECUTIVE_SUMMARY.md`; taxonomy: `ELAH_LABEL_TAXONOMY.md`)
- Phase 5 — `docs/Phase 5 - Baseline scoring system/` (exec: `ELAH_PHASE5_EXECUTIVE_SUMMARY.md`; eval: `ELAH_BASELINE_EVAL.md`)

Architecture links for diligence: [data-room/architecture/README.md](./data-room/architecture/README.md).

---

## 4. What Phases 6–12 are (not done)

Do not demo these as live.

| Phase | What it is for | What it is not today |
|---|---|---|
| 6 | Trained / calibrated scorer that must beat `rules_v0` on holdout | Not shipped; `rules_v0` remains the bar |
| 7 | Analyst graph / explanation UX at product depth | Not a fourth coordinate; Phase 0 axes already named |
| 8 | Red team + evaluator hardening | Phase 0 threat model is a spec, not a completed red-team report |
| 9 | Operational analyst product | Admin score card + `/admin/elah-baseline` are Phase 5, not Phase 9 complete |
| 10 | MVP readiness gates beyond baseline eval | No readiness report claiming production install |
| 11 | Bank / SOC / AI-governance interviews | Guide only (`docs/ELAH_BANKING_DOMAIN_INTERVIEW_GUIDE.md`) |
| 12 | Pilot offer, partner, sandbox install | No customer; `$400K` plan’s “first client demo/dev install” is a **goal**, not a signed SOW |

---

## 5. Phase 13 (this pack)

Fundraising materials, data-room **index**, market wedge, CRM hygiene. Agents do **not** send email, book meetings, or file incorporation.

| In this pack | Still founder / counsel |
|---|---|
| Data-room map (`ELAH-FUND-DR-001`) | Incorporation PDFs, cap table % |
| Roadmap snapshot (this file) | Live Kanban updates after this date |
| Market wedge (`ELAH-FUND-MKT-001`) | Discovery interviews (Phase 11) |
| Pitch / ask / list (sibling cards) | First outbound send, replies, meetings |

Index: [ELAH_DATA_ROOM.md](./ELAH_DATA_ROOM.md).

---

## 6. Phases 14–15 (legal / ops)

Not complete. Do not imply a formed company or a staffed org chart.

| Phase | Owns | Data-room |
|---|---|---|
| 14 | Entity, IP assignment, privacy, DPA checklist, where counsel is required | [data-room/company/](./data-room/company/README.md), [data-room/legal-pending/](./data-room/legal-pending/README.md), [data-room/cap-table/](./data-room/cap-table/README.md) |
| 15 | Roles, hiring order, equity questions for professional review | Hiring memo is Phase 13 planning only |

---

## 7. Founder Kanban

| Surface | Where |
|---|---|
| Kanban | `https://elahfounderplatform.vercel.app/founder/roadmap/kanban` |
| Code | `elah-analytics-dashboard/app/founder/roadmap/kanban/page.tsx` |
| Phase list | `PHASE_ORDER` in `elah-analytics-dashboard/lib/roadmap/constants.ts` |

If this memo and Kanban disagree, **Kanban wins** for card status. This memo wins only as a dated investor narrative of 26 August 2026.

---

## 8. Sign-off

| Decision | Initials | Date |
|---|---|---|
| Approve | | |
| Approve with comments | | |
| Reject | | |

---

*End of document.*

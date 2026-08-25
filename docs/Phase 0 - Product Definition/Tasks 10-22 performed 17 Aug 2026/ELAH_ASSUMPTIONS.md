# ELAH Assumptions and Non-Goals (MVP)

| Field | Value |
|---|---|
| Document ID | ELAH-PRD-ASSUMPTIONS-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 17 August 2026 |
| Related task | `task-0-define-the-assumptions-and-non-goals` |

---

## 1. Purpose

What we are **allowed to assume** so Phase 1+ can build, and what we **will not** ship in this MVP even if asked in a demo.

---

## 2. Assumptions

| ID | Assumption |
|---|---|
| A1 | The “bank” is this simulator, not a licensed institution. |
| A2 | Demo users (`*@elah.demo`) are synthetic. |
| A3 | One tenant: `elah-banking-demo`. |
| A4 | Scoring is English (+ the Hebrew/amount patterns already in the agent). |
| A5 | `rules_v0` is uncalibrated; we still demo it. |
| A6 | Founder platform + Neon are available for training/Kanban. |
| A7 | Vercel cold starts exist; p95 is measured on **warm** instances for demos. |
| A8 | Policy engine in `lib/agent/policy.ts` remains source of allow/deny/confirm. |
| A9 | P0 tool list is frozen in MVP scope (six tools). |
| A10 | Fail-open is acceptable to the founder for customer-path latency. |

---

## 3. Non-goals (MVP)

| ID | Non-goal |
|---|---|
| NG1 | ELAH executing, allowing, or blocking tools. |
| NG2 | Real KYC / AML / sanction screening. |
| NG3 | Production-bank SLA (99.9%+). |
| NG4 | Multi-tenant SaaS billing. |
| NG5 | On-device / iPhone scoring (iPhone is founder ops, not the scorer). |
| NG6 | Streaming scores, webhooks, or batch backfill APIs. |
| NG7 | Replacing the chat LLM with ELAH. |
| NG8 | Storing raw utterances in the training table by default. |
| NG9 | Customer-visible ELAH scores. |
| NG10 | New banking products (loans, cards issuance, crypto). |

---

## 4. Sign-off

I agree these assumptions and non-goals bound the MVP. Anything in NG* is a later phase.

---

*End of document.*

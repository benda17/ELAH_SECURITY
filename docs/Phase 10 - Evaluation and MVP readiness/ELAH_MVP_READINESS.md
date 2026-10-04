# ELAH MVP readiness report (Phase 10)

| Field | Value |
|---|---|
| Document ID | ELAH-P10-READY-001 |
| Version | **1.0** |
| Status | **Proposed** — demo go / production no-go |
| Date | 28 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related task | `task-10-produce-an-mvp-readiness-report` |
| Evidence | This folder; `npm run test:phase10-eval` (33 passed); `data/phase10/load-report.json`; `data/phase5/v1.0/eval-report.json` |

**Product freeze (unchanged):** ELAH scores genuine intent **before tools**. Policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are not envelope fields. Customer UI MUST NOT show `elahScore`. No customers, no ARR, no production install.

---

## 1. Decision

| Question | Decision |
|---|---|
| Ready to **demo** (CS/CRM first, banking encore) with freeze language? | **GO** |
| Ready to treat `rules_v0` holdout as a **customer SLA**? | **NO-GO** |
| Ready to **install in a bank or CS tenant as production**? | **NO-GO** |
| Ready for **discovery interviews** as a demo artifact (Phase 16 / 11)? | **GO** (interviews themselves are not this phase) |

Phase 10 exit into customer validation means: **we can show a truthful demo**. It does not mean the buyer exists.

---

## 2. Metric pass/fail vs Proposed bars

| Gate | Bar | Measured | Demo MVP |
|---|---|---|---|
| Intent accuracy | Do not regress below 0.79 on v1.0 holdout | **0.79** | Pass |
| Legitimate-as-injection FP | 0 | **0** | Pass |
| Injection→P0 FN | ≤ 1 | **1** (`azb-0005`) | Pass |
| Injection recall | Not a 1.00 gate | **0.59** | Track, not fail |
| ECE | Uncalibrated badge on | **0.153** | Pass (honest) |
| Client fail-open | 250 ms | Tests pass | Pass |
| In-process p95 | ≪ 200 ms | **0.0066 ms** | Pass |
| HTTP load | Not required | **Not-run** | N/A |
| External pentest | Not required for demo | **Not-run** | N/A |
| Interviews | Not this phase | **Zero** | N/A |

---

## 3. Test results (28 Sep 2026)

`npm run test:phase10-eval`: **9 files, 33 tests, passed**.

Covered: determinism, threshold isolation, envelope isolation, Jane score-free routes, in-process load bound, fail-open hang/503, scorer/tool trust boundary, ScoreResponse contract, analyst RBAC.

---

## 4. Open risks

1. Live scorer is still uncalibrated rules on synthetic gold.
2. Offline CatBoost is better on holdout and **not wired**.
3. Phase 8 red team has not run.
4. No HTTP SLO measurement on Vercel.
5. No paging / on-call.
6. Shared Neon between founder and banking makes `prisma db push` an incident class.
7. CS/CRM gold and banking gold must stay separate in every slide.

---

## 5. What this report is not

A production go-live, a SOC2 packet, a signed pilot, or a claim that Phases 11–12 are done.

---

## 6. Sign-off

| Decision | Initials | Date |
|---|---|---|
| Approve demo-ready / production-not-ready | | |
| Approve with comments | | |
| Reject | | |

**Approval statement:** I agree Phase 10 is a **demo go** and a **production no-go**, on evidence cited above, without invented customers or load numbers.

---

*End of document.*

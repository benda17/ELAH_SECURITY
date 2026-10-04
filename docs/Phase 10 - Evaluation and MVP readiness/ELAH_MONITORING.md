# ELAH monitoring and alerting (Phase 10)

| Field | Value |
|---|---|
| Document ID | ELAH-P10-MON-001 |
| Version | **1.0** |
| Status | **Recorded** — honest gap |
| Date | 28 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related task | `task-10-validate-monitoring-and-alerting` |

**Product freeze (unchanged):** Fail-open on scorer down. Do not invent an uptime percentage.

---

## 1. What exists

| Signal | Where |
|---|---|
| Score request log line | `handleScore` `console.info` JSON (`requestId`, `eventId`, `httpStatus`, `latencyMs`, error code) |
| Agent hops | `elah_scored` / `elah_scoring_unavailable` on `AgentEventLog` |
| Analyst dashboard | `/admin/elah-dashboard`, `/admin/elah-events`, `/admin/elah-baseline` |
| Founder Kanban | `elahfounderplatform.vercel.app` (ops of **tasks**, not scorer SLOs) |

There is **no** PagerDuty, no SLO burn-rate alert, no weekly p50/p95 founder report on file as an automated job.

---

## 2. Proposed demo watch list (not implemented as paging)

1. Spike in `scoring_unavailable` vs scored.
2. `elah_score_ms` / `latencyMs` approaching 200 ms.
3. 401/403 burst on `/v1/score` (token misconfig).
4. Customer-visible score leak (grep / the Phase 10 customer-ui test in CI).

Until those page, the operator is the **founder watching the admin dashboard**.

---

## 3. Sign-off

I agree monitoring for MVP is structured logs + admin UI; there is no fake 99.9% and no on-call rotation on file.

---

*End of document.*

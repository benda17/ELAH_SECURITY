# ELAH load tests (Phase 10)

| Field | Value |
|---|---|
| Document ID | ELAH-P10-LOAD-001 |
| Version | **1.0** |
| Status | **Recorded** — in-process only; **HTTP not-run** |
| Date | 28 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related task | `task-10-run-load-tests` |
| Report | `data/phase10/load-report.json` |
| Command | `npm run phase10:load` |

**Product freeze (unchanged):** Fail-open 250 ms on the customer path. Do not invent RPS.

---

## 1. Purpose

Measure what we can measure. Do **not** publish a production load number that was not taken.

---

## 2. What ran (28 Sep 2026)

In-process `rules_v0` extract+predict on fixtures 8.1 / 8.3, 400 iterations, darwin arm64:

| Metric | Value |
|---|---|
| p50 | **0.004 ms** |
| p95 | **0.0066 ms** |
| Throughput | **139,581** events/sec (same process, not HTTP) |
| Client ceiling | 250 ms (not approached) |

This is the same class of number as Phase 5 holdout latency (p50/p95 **0.004 / 0.006 ms**) and Phase 6 CatBoost in-process bench. It is **not** colocated HTTP p95 and **not** a Vercel function RPS.

Vitest bound: `tests/elah/phase10-load.test.ts` asserts in-process p95 &lt; 200 ms.

---

## 3. What did not run

- k6 / vegeta / wrk against `POST /v1/score`
- Multi-instance soak
- Production-like payload mix on hosted Postgres
- A quoted “N requests/sec in production”

Mark those **not-run**. Do not fill them with the in-process throughput.

---

## 4. Sign-off

I agree Phase 10 load evidence is in-process only; HTTP load is not-run; 139k events/sec must not be quoted as a hosted SLO.

---

*End of document.*

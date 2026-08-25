# ELAH Service-Level Objectives (MVP)

| Field | Value |
|---|---|
| Document ID | ELAH-SPEC-SLO-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 17 August 2026 |
| Related task | `task-0-define-the-service-level-requirements` |
| Companion docs | `ELAH_LATENCY.md`, `ELAH_THROUGHPUT.md` |

---

## 1. Purpose

MVP SLOs for **demo + golden-set**, not a production-bank SLA. If we miss these, the 250 ms fail-open path fires too often and the demo looks broken.

---

## 2. Objectives

| ID | Objective | Target | Window | Error budget |
|---|---|---|---|---|
| SLO-1 | Availability of `POST /v1/score` | **99.0%** successful `2xx` among accepted requests | Rolling 7 days of demo traffic | 1.0% |
| SLO-2 | Latency (scored + abstained) | p95 **≤ 200 ms**, p50 **≤ 80 ms** (rules path) | Same | See latency spec |
| SLO-3 | Client fail-open | Simulator timeout **250 ms**; continue policy | Always | Counted as `scoring_unavailable` |
| SLO-4 | Contract correctness | **0** responses that violate OpenAPI `ScoreResponse` | Release | Block release |
| SLO-5 | Freshness | Events appear in founder training table **≤ 60 s** after score | Demo | Warn, don’t fail SLO-1 |

---

## 3. What is *not* an SLO in MVP

- Model accuracy vs a labelled gold set (that is a **success metric**, not an SLO).
- Multi-region HA.
- 99.9% / 99.99% (we do not have that ops bar yet).

---

## 4. Measurement

- Latency: `Date.now()` around the scorer; log `elah_score_ms`.
- Availability: 5xx + timeouts / total POSTs.
- Contract: OpenAPI + golden fixtures in CI.

---

## 5. Sign-off

I agree MVP operations are judged on the five SLOs above, with 250 ms fail-open as the customer-path safety valve.

---

*End of document.*

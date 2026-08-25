# ELAH Throughput Targets

| Field | Value |
|---|---|
| Document ID | ELAH-SPEC-THROUGHPUT-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 17 August 2026 |
| Related task | `task-0-define-the-throughput-targets` |

---

## 1. Purpose

MVP traffic is **demo + founder + golden-set**, not a national switch. Throughput is sized so concurrent demos do not collapse latency SLOs.

---

## 2. Targets

| ID | Target | Notes |
|---|---|---|
| T1 | **10 RPS** sustained `POST /v1/score` | Demo / staging |
| T2 | **30 RPS** burst ≤ 10 s | Three concurrent founder demos |
| T3 | Body ≤ **32 KiB** (input contract) | Reject 413; does not count as scored |
| T4 | One score per **pre_tool / no_tool** event | No fan-out scoring in MVP |

---

## 3. Capacity model

`rules_v0` is CPU-light. Bottleneck is **auth + JSON parse + DB write**. Writes to `ElahTrainingEvent` SHOULD be async or batched so T1 does not violate p95.

If a future model path cannot hold T1 at p95, **route model off the customer path** (score rules first, enrich later) — do not raise the 250 ms timeout.

---

## 4. Sign-off

I agree MVP capacity is 10 RPS sustained / 30 RPS burst, subordinate to latency SLOs.

---

*End of document.*

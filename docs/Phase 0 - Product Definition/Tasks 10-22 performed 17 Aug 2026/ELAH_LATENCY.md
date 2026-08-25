# ELAH Latency Targets

| Field | Value |
|---|---|
| Document ID | ELAH-SPEC-LATENCY-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 17 August 2026 |
| Related task | `task-0-define-the-latency-targets` |
| Frozen with | Input contract **I5** (250 ms client timeout) |

---

## 1. Purpose

Scoring sits on the **pre-tool** path. If it is slow, the bank must fail open. These numbers are the **server** budget; the client budget is 250 ms.

---

## 2. Budgets (rules_v0 path)

| Percentile | Target | Hard ceiling |
|---|---|---|
| p50 | **≤ 80 ms** | — |
| p95 | **≤ 200 ms** | — |
| p99 | **≤ 240 ms** | Client abort at **250 ms** |

Model / LLM path (Phase 6): **same client ceiling**. If the model cannot finish, **abstain or skip** — never wait past 250 ms on the customer path.

---

## 3. Timebox split (indicative)

| Stage | Budget |
|---|---|
| Auth + parse + schema | 10 ms |
| Rules / feature extract | 50 ms |
| Score + coordinates + explanation | 30 ms |
| Persist training row (async OK) | **not** on the request critical path |
| Network (Vercel ↔ caller) | remainder of 250 ms |

Persist **must not** block the HTTP response if it would threaten p95.

---

## 4. Measurement

Log `elah_score_ms` on every `POST /v1/score`. Report p50/p95 weekly in founder ops notes. Golden-path demos must stay inside p95 on a warm instance.

---

## 5. Sign-off

I agree p50 ≤ 80 ms, p95 ≤ 200 ms on rules_v0, with a 250 ms client fail-open.

---

*End of document.*

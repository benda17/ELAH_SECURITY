# ELAH MVP Success Metrics

| Field | Value |
|---|---|
| Document ID | ELAH-PRD-METRICS-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 17 August 2026 |
| Related task | `task-0-define-the-mvp-success-metrics` |
| Aligns with | MVP scope §9, `ELAH_MVP_EXIT_CRITERIA.md` (founder) |

---

## 1. Purpose

How we know Phase 0–9 **worked**, distinct from SLOs (uptime/latency). These are **demo + product** metrics.

---

## 2. Metrics

| ID | Metric | Target | Evidence |
|---|---|---|---|
| M1 | P0 tools emit `ElahEvent` + receive `ElahScore` or `scoring_unavailable` | **6/6** | Simulator log + event list |
| M2 | Golden path: balance → transfer confirm → freeze → injection refuse | **One take**, no apology for missing score | Live demo |
| M3 | Injection labelled `prompt_injection_or_policy_bypass`, score **&lt; 0.40**, high confidence | **100%** of scripted injection cases | Golden set |
| M4 | No UI copy “ELAH blocked/allowed” | **0** instances | Grep + demo script |
| M5 | Analyst can read score, band, coordinates, signals | **All** required explainability consumers | Explainability spec |
| M6 | Fail-open: kill scorer → tool still follows **policy** | **Pass** | Chaos on staging |
| M7 | Contract tests: OpenAPI request/response | **Green CI** | Fixtures |
| M8 | Latency p95 on rules_v0 (warm) | **≤ 200 ms** | SLO / latency specs |
| M9 | Founder training row within **60 s** of score | **Pass** on demo | SLO-5 |
| M10 | Sign-off pack: all Phase 0 docs in this folder | **Complete** | This directory |

---

## 3. Explicitly not success (yet)

Calibrated probabilities, production-bank conversion, iPhone scoring, second tenant.

---

## 4. Sign-off

I agree M1–M10 are the MVP success bar; SLOs remain operational, not product-complete.

---

*End of document.*

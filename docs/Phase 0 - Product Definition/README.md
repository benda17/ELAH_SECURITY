# Phase 0 — Product Definition

Canonical product-definition pack for the ELAH banking MVP. Same folder exists in the **banking simulator** repo and the **founder platform** repo.

**Product freeze:** ELAH scores genuine banking intent **before tool execution**. The bank policy engine allow / deny / confirm. **ELAH never allows, blocks, or executes.**

Upload path for Confluence and Kanban links: `docs/Phase 0 - Product Definition/<file>` (tasks 10–22 live in [`Tasks 10-22 performed 17 Aug 2026/`](./Tasks%2010-22%20performed%2017%20Aug%202026/)).

---

## Index

| Order | Task | Doc ID | File |
|---:|---|---|---|
| 1 | MVP scope | ELAH-PRD-MVP-SCOPE-001 | [ELAH_MVP_SCOPE.md](./ELAH_MVP_SCOPE.md) |
| 2 | Primary banking use cases | ELAH-PRD-USE-CASES-001 | [ELAH_BANKING_USE_CASES.md](./ELAH_BANKING_USE_CASES.md) |
| 3 | Event schema | ELAH-SPEC-EVENT-001 | [ELAH_EVENT_SCHEMA.md](./ELAH_EVENT_SCHEMA.md) |
| 4 | Input contract | ELAH-SPEC-INPUT-001 | [ELAH_INPUT_CONTRACT.md](./ELAH_INPUT_CONTRACT.md) |
| 5 | Output contract | ELAH-SPEC-OUTPUT-001 | [ELAH_OUTPUT_CONTRACT.md](./ELAH_OUTPUT_CONTRACT.md) |
| — | OpenAPI 3.1 | — | [openapi/elah-v1-score.yaml](./openapi/elah-v1-score.yaml) |
| 6 | Human-intention score semantics | ELAH-SPEC-SCORE-001 | [ELAH_SCORE_SEMANTICS.md](./ELAH_SCORE_SEMANTICS.md) |
| 7 | Confidence and uncertainty | ELAH-SPEC-CONFIDENCE-001 | [ELAH_CONFIDENCE_SEMANTICS.md](./ELAH_CONFIDENCE_SEMANTICS.md) |
| 8 | Intention-graph coordinates | ELAH-SPEC-COORDINATES-001 | [ELAH_COORDINATE_SYSTEM.md](./ELAH_COORDINATE_SYSTEM.md) |
| 9 | Explainability | ELAH-SPEC-EXPLAIN-001 | [ELAH_EXPLAINABILITY.md](./ELAH_EXPLAINABILITY.md) |
| 10 | ELAH vs bank policy boundary | ELAH-SPEC-BOUNDARY-001 | [Tasks 10-22…/ELAH_POLICY_BOUNDARY.md](./Tasks%2010-22%20performed%2017%20Aug%202026/ELAH_POLICY_BOUNDARY.md) |
| 11 | Threshold configuration | ELAH-SPEC-THRESHOLDS-001 | [Tasks 10-22…/ELAH_THRESHOLD_CONFIG.md](./Tasks%2010-22%20performed%2017%20Aug%202026/ELAH_THRESHOLD_CONFIG.md) |
| 12 | Service-level objectives | ELAH-SPEC-SLO-001 | [Tasks 10-22…/ELAH_SLOS.md](./Tasks%2010-22%20performed%2017%20Aug%202026/ELAH_SLOS.md) |
| 13 | Latency targets | ELAH-SPEC-LATENCY-001 | [Tasks 10-22…/ELAH_LATENCY.md](./Tasks%2010-22%20performed%2017%20Aug%202026/ELAH_LATENCY.md) |
| 14 | Throughput targets | ELAH-SPEC-THROUGHPUT-001 | [Tasks 10-22…/ELAH_THROUGHPUT.md](./Tasks%2010-22%20performed%2017%20Aug%202026/ELAH_THROUGHPUT.md) |
| 15 | Data retention | ELAH-SPEC-RETENTION-001 | [Tasks 10-22…/ELAH_RETENTION.md](./Tasks%2010-22%20performed%2017%20Aug%202026/ELAH_RETENTION.md) |
| 16 | Privacy | ELAH-SPEC-PRIVACY-001 | [Tasks 10-22…/ELAH_PRIVACY.md](./Tasks%2010-22%20performed%2017%20Aug%202026/ELAH_PRIVACY.md) |
| 17 | System architecture | ELAH-ARCH-001 | [Tasks 10-22…/ELAH_ARCHITECTURE.md](./Tasks%2010-22%20performed%2017%20Aug%202026/ELAH_ARCHITECTURE.md) |
| 18 | Threat model | ELAH-SPEC-THREAT-001 | [Tasks 10-22…/ELAH_THREAT_MODEL.md](./Tasks%2010-22%20performed%2017%20Aug%202026/ELAH_THREAT_MODEL.md) |
| 19 | Assumptions and non-goals | ELAH-PRD-ASSUMPTIONS-001 | [Tasks 10-22…/ELAH_ASSUMPTIONS.md](./Tasks%2010-22%20performed%2017%20Aug%202026/ELAH_ASSUMPTIONS.md) |
| 20–21 | Component ownership (Next.js vs ELAH service) | ELAH-ARCH-OWN-001 | [Tasks 10-22…/ELAH_COMPONENT_OWNERSHIP.md](./Tasks%2010-22%20performed%2017%20Aug%202026/ELAH_COMPONENT_OWNERSHIP.md) |
| 22 | MVP success metrics | ELAH-PRD-METRICS-001 | [Tasks 10-22…/ELAH_MVP_SUCCESS_METRICS.md](./Tasks%2010-22%20performed%2017%20Aug%202026/ELAH_MVP_SUCCESS_METRICS.md) |

---

## Not in this folder

| File | Why it stays elsewhere |
|---|---|
| `docs/ELAH_LABEL_TAXONOMY.md` | Phase 4 — dataset / annotator work |
| `docs/ELAH_BANKING_DOMAIN_INTERVIEW_GUIDE.md` | Phase 11 — GTM interviews |
| `docs/VERCEL_DEPLOYMENT.md` | Ops, not product definition |
| Founder `docs/ELAH_TASK_SCHEMA.md`, `ELAH_ROADMAP_*`, `VERCEL_TWO_PROJECTS.md` | Founder-platform internals |

---

## How to read this pack

1. Start with **scope**, **use cases**, and **assumptions**.
2. Then the **contracts**: event → input → output + OpenAPI.
3. Then **meaning**: score bands, confidence, coordinates, explainability.
4. Then **ops boundary**: policy, thresholds, SLOs, latency, throughput, retention, privacy.
5. Then **shape**: architecture, threat model, component ownership.
6. Close with **success metrics**.

Date: 17 August 2026.

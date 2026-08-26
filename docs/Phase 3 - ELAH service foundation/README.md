# Phase 3 — ELAH service foundation (documentation)

Canonical **documentation** pack for Phase 3. Engineering lives in `lib/elah/service/*`, `lib/elah/client.ts`, `app/v1/*`, and `tests/elah/` in the banking repo (live paths as implemented in this phase). **Phase 3 DOES wire `POST /v1/score`.**

**Product freeze (unchanged):** ELAH scores genuine banking intent. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Customer UI MUST NOT show `elahScore`. Jane’s `/assistant` must not display the score. Do not invent ATM tools. Do not `prisma db push`.

Evidence date: **25 August 2026**, live repo `ELAH_SECURITY---Banking-System`. Demo password for all listed accounts: `DemoPass123!`.

Canonical demo users: `basic.customer@elah.demo` (Jane), `premium.customer@elah.demo`, `vip.customer@elah.demo` (Isabella), `manager@elah.demo`, `security.admin@elah.demo`.

Colocation (ELAH-ARCH-OWN-001): MVP **may** colocate the scorer in the banking Next.js / Vercel project as `/v1/*` **as long as** OpenAPI, Bearer service auth, and fail-open are respected. The logical split is frozen so the service can extract without rewriting the bank.

---

## Index

| Order | Task | Doc ID | File |
|---:|---|---|---|
| 39 | ELAH service (logical, TypeScript/Next.js 14) | ELAH-SVC-001 | [ELAH_SERVICE.md](./ELAH_SERVICE.md) |
| 40 | Scoring API (implement-to-contract) | ELAH-SVC-API-001 | [ELAH_SCORING_API.md](./ELAH_SCORING_API.md) |
| 41 | Service operations | ELAH-SVC-OPS-001 | [ELAH_SERVICE_OPS.md](./ELAH_SERVICE_OPS.md) |
| 42 | Service configuration | ELAH-SVC-CFG-001 | [ELAH_SERVICE_CONFIG.md](./ELAH_SERVICE_CONFIG.md) |
| 43 | CI | ELAH-SVC-CI-001 | [ELAH_SERVICE_CI.md](./ELAH_SERVICE_CI.md) |
| 44 | Mock scorer (`rules_v0`) | ELAH-SVC-MOCK-001 | [ELAH_MOCK_SCORER.md](./ELAH_MOCK_SCORER.md) |
| 45 | Simulator wire | ELAH-SVC-WIRE-001 | [ELAH_SIMULATOR_WIRE.md](./ELAH_SIMULATOR_WIRE.md) |
| — | Founder executive summary | — | [ELAH_PHASE3_EXECUTIVE_SUMMARY.md](./ELAH_PHASE3_EXECUTIVE_SUMMARY.md) |

This pack covers all 25 Phase 3 Kanban cards. Critical-path engineering: scoring API, `rules_v0` mock, simulator wire.

---

## How to read

1. **Service** — logical component, ADR, package layout, trust boundary, extract triggers, health/version.
2. **API** — implement Phase 0 contracts; do not duplicate them. Paths and OpenAPI pointer only.
3. **Ops** — health, Bearer auth, validation order, `ErrorResponse`, logging, correlation, 250 ms.
4. **Config** — local in-process when URL unset; vitest token; Banking Vercel env (founder pastes `ELAH_SERVICE_TOKEN`); Docker is local-only.
5. **CI** — GitHub Actions + `tests/elah`.
6. **Mock** — `rules_v0` table, fixtures, provenance. Not a trained model.
7. **Wire** — orchestrator hook points, `AgentEventLog` metadata, fallback matrix. ELAH cannot execute.

Related Phase 2 pack: `docs/Phase 2 - Agent observability and event collection/`. Related Phase 0 pack: `docs/Phase 0 - Product Definition/`. OpenAPI: `docs/Phase 0 - Product Definition/openapi/elah-v1-score.yaml`.

---

*End of document.*

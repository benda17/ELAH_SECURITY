# Phase 10 — Evaluation and MVP readiness (documentation)

Canonical **documentation** pack for Phase 10. This phase freezes **acceptance bars**, **runs the tests that exist**, and produces an **honest go/no-go**. It is **not** a production-bank install and **not** a customer SLA. First-client motion after the 8 September 2026 pivot is **B2B SaaS CS/CRM** (Phase 16). Banking remains the **existing scoring demo** and a later vertical.

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. No ATM, beneficiary-write, or `device_change` product. Do not `prisma db push`. Closed 22-label banking taxonomy. Live scorer is **`rules_v0`** (uncalibrated, not a trained model). Do not mix CS/CRM gold into banking holdout v1.0. Do not invent interviews, customers, ARR, or HTTP RPS.

Evidence date: **28 September 2026**. Live Kanban at query time: **28 Backlog**. This pack maps all **28** Phase 10 cards.

Demo users: `basic.customer@elah.demo` (Jane / customer), `security.admin@elah.demo` (analyst). Password `DemoPass123!`.

---

## How to run

```bash
npm run test:phase10-eval
npm run phase10:load          # writes data/phase10/load-report.json (in-process, not HTTP)
npm run baseline:eval         # existing holdout n=100 → data/phase5/v1.0/eval-report.json
```

---

## Index

| Order | Task | Task id | Evidence (28 Sep 2026) | Doc ID | File |
|---:|---|---|---|---|---|
| 1 | Define the golden evaluation set. | `task-10-define-the-golden-evaluation-set` | **Done — definition** | ELAH-P10-GOLD-001 | [ELAH_GOLDEN_SET.md](./ELAH_GOLDEN_SET.md) |
| 2 | Define minimum acceptable accuracy. | `task-10-define-minimum-acceptable-accuracy` | **Done — Proposed bar** | ELAH-P10-METRICS-001 | [ELAH_ACCEPTANCE_METRICS.md](./ELAH_ACCEPTANCE_METRICS.md) §accuracy |
| 3 | Define minimum acceptable calibration. | `task-10-define-minimum-acceptable-calibration` | **Done — Proposed bar** | ELAH-P10-METRICS-001 | [ELAH_ACCEPTANCE_METRICS.md](./ELAH_ACCEPTANCE_METRICS.md) §calibration |
| 4 | Define acceptable false-positive rates. | `task-10-define-acceptable-false-positive-rates` | **Done — Proposed bar** | ELAH-P10-METRICS-001 | [ELAH_ACCEPTANCE_METRICS.md](./ELAH_ACCEPTANCE_METRICS.md) §FP |
| 5 | Define acceptable false-negative rates. | `task-10-define-acceptable-false-negative-rates` | **Done — Proposed bar** | ELAH-P10-METRICS-001 | [ELAH_ACCEPTANCE_METRICS.md](./ELAH_ACCEPTANCE_METRICS.md) §FN |
| 6 | Define acceptable latency. | `task-10-define-acceptable-latency` | **Done — frozen ceiling** | ELAH-P10-METRICS-001 | [ELAH_ACCEPTANCE_METRICS.md](./ELAH_ACCEPTANCE_METRICS.md) §latency |
| 7 | Define acceptable availability. | `task-10-define-acceptable-availability` | **Done — fail-open SLO** | ELAH-P10-METRICS-001 | [ELAH_ACCEPTANCE_METRICS.md](./ELAH_ACCEPTANCE_METRICS.md) §availability |
| 8 | Define explainability acceptance criteria. | `task-10-define-explainability-acceptance-criteria` | **Done — checklist** | ELAH-P10-XAI-001 | [ELAH_EXPLAINABILITY_BAR.md](./ELAH_EXPLAINABILITY_BAR.md) |
| 9 | Define banking-analyst usability criteria. | `task-10-define-banking-analyst-usability-criteria` | **Done — later-vertical protocol; zero sessions** | ELAH-P10-USE-001 | [ELAH_ANALYST_USABILITY.md](./ELAH_ANALYST_USABILITY.md) |
| 10 | Run end-to-end tests. | `task-10-run-end-to-end-tests` | **Done — CI + demo checklist** | ELAH-P10-E2E-001 | [ELAH_E2E_TESTS.md](./ELAH_E2E_TESTS.md) |
| 11 | Run load tests. | `task-10-run-load-tests` | **Done — in-process measured; HTTP not-run** | ELAH-P10-LOAD-001 | [ELAH_LOAD_TESTS.md](./ELAH_LOAD_TESTS.md) |
| 12 | Run failure-mode tests. | `task-10-run-failure-mode-tests` | **Done — fail-open fixtures** | ELAH-P10-FAIL-001 | [ELAH_FAILURE_MODES.md](./ELAH_FAILURE_MODES.md) |
| 13 | Run security tests. | `task-10-run-security-tests` | **Done as pointer / unit tests — not a pentest** | ELAH-P10-SEC-001 | [ELAH_SECURITY_TESTS.md](./ELAH_SECURITY_TESTS.md) |
| 14 | Run data-loss tests. | `task-10-run-data-loss-tests` | **Done — envelope isolation** | ELAH-P10-FAIL-001 | [ELAH_FAILURE_MODES.md](./ELAH_FAILURE_MODES.md) §data-loss |
| 15 | Run service-timeout tests. | `task-10-run-service-timeout-tests` | **Done — 250 ms fail-open** | ELAH-P10-FAIL-001 | [ELAH_FAILURE_MODES.md](./ELAH_FAILURE_MODES.md) §timeout |
| 16 | Run model-rollback tests. | `task-10-run-model-rollback-tests` | **Done — offline only** | ELAH-P10-RB-001 | [ELAH_MODEL_ROLLBACK.md](./ELAH_MODEL_ROLLBACK.md) |
| 17 | Validate monitoring and alerting. | `task-10-validate-monitoring-and-alerting` | **Done — honest gap list** | ELAH-P10-MON-001 | [ELAH_MONITORING.md](./ELAH_MONITORING.md) |
| 18 | Validate dashboard correctness. | `task-10-validate-dashboard-correctness` | **Done — analyst vs Jane** | ELAH-P10-DASH-001 | [ELAH_DASHBOARD_QA.md](./ELAH_DASHBOARD_QA.md) |
| 19 | Validate score consistency. | `task-10-validate-score-consistency` | **Done — determinism test** | ELAH-P10-CONS-001 | [ELAH_SCORE_CONSISTENCY.md](./ELAH_SCORE_CONSISTENCY.md) |
| 20 | Validate threshold separation. | `task-10-validate-threshold-separation` | **Done — display ≠ score** | ELAH-P10-THR-001 | [ELAH_THRESHOLD_SEPARATION.md](./ELAH_THRESHOLD_SEPARATION.md) |
| 21 | Document release procedures. | `task-10-document-release-procedures` | **Done** | ELAH-P10-REL-001 | [ELAH_RELEASE.md](./ELAH_RELEASE.md) |
| 22 | Document incident procedures. | `task-10-document-incident-procedures` | **Done** | ELAH-P10-INC-001 | [ELAH_INCIDENT.md](./ELAH_INCIDENT.md) |
| 23 | Document known limitations. | `task-10-document-known-limitations` | **Done** | ELAH-P10-LIM-001 | [ELAH_MVP_LIMITATIONS.md](./ELAH_MVP_LIMITATIONS.md) |
| 24 | Prepare the MVP demo. | `task-10-prepare-the-mvp-demo` | **Done — index** | ELAH-P10-DEMO-001 | [ELAH_DEMO_READINESS.md](./ELAH_DEMO_READINESS.md) |
| 25 | Create repeatable demo scenarios. | `task-10-create-repeatable-demo-scenarios` | **Done — pointer** | ELAH-P10-DEMO-001 | [ELAH_DEMO_READINESS.md](./ELAH_DEMO_READINESS.md) §repeatable |
| 26 | Create a technical demo script. | `task-10-create-a-technical-demo-script` | **Done — pointer** | ELAH-P10-DEMO-001 | [ELAH_DEMO_READINESS.md](./ELAH_DEMO_READINESS.md) §technical |
| 27 | Create a non-technical demo script. | `task-10-create-a-non-technical-demo-script` | **Done — pointer** | ELAH-P10-DEMO-001 | [ELAH_DEMO_READINESS.md](./ELAH_DEMO_READINESS.md) §non-technical |
| 28 | Produce an MVP readiness report. | `task-10-produce-an-mvp-readiness-report` | **Done — Proposed; demo-ready, not production** | ELAH-P10-READY-001 | [ELAH_MVP_READINESS.md](./ELAH_MVP_READINESS.md) |
| — | Founder executive summary | — | — | — | [ELAH_PHASE10_EXECUTIVE_SUMMARY.md](./ELAH_PHASE10_EXECUTIVE_SUMMARY.md) |

---

## How to upload to Confluence

Founder-only paste. Agents do not publish.

1. Create a parent page titled **Phase 10 — Evaluation and MVP readiness**. Put [ELAH_PHASE10_EXECUTIVE_SUMMARY.md](./ELAH_PHASE10_EXECUTIVE_SUMMARY.md) on that home page.
2. Create one child page per Doc ID. Keep headings and the header table.
3. Do **not** paste Neon connection strings, `.env`, or live customer data.
4. Do **not** quote banking holdout 0.79 as CS/CRM refund accuracy. Do **not** quote CS holdout 1.00 as production.
5. Do **not** present this pack as a production go-live.

Upload path for Kanban links: `docs/Phase 10 - Evaluation and MVP readiness/<file>`.

---

## How to read

1. **Golden set + bars** — what we measure, and the Proposed minima for this demo MVP.
2. **Explainability + usability** — analyst checklist; banking usability is later-vertical (zero sessions).
3. **Runs** — e2e, load (in-process), fail-open, security pointer, rollback (offline).
4. **Validations** — dashboard, consistency, threshold separation, monitoring gap.
5. **Ops** — release, incident, limitations.
6. **Demo + readiness** — CS/CRM opens; banking is encore. Readiness is **demo**, not install.

Related: Phase 0 latency / SLO / metrics, Phase 4 gold v1.0, Phase 5 eval, Phase 6 offline CatBoost, Phase 7 explanations, Phase 13 banking demo script, Phase 16 CS/CRM demo script (founder repo).

---

*End of document.*

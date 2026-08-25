# ELAH Architecture Overview

> **Superseded (17 August 2026).** This sketch still mentions SQLite/`dev.db`. The signed Phase 0 architecture is **`docs/Phase 0 - Product Definition/Tasks 10-22 performed 17 Aug 2026/ELAH_ARCHITECTURE.md`** (Neon Postgres, `POST /v1/score`, fail-open). Keep this page only as a historical pointer.

## System components

```
┌─────────────────────────────┐     ┌──────────────────────────┐
│  Next.js Banking Simulator  │────▶│  ELAH Scoring Service    │
│  (ELAH_SECURITY---Banking)  │     │  (planned — separate)    │
│  - Users, accounts, agent   │     │  - Score 0–1             │
│  - Tool calls, audit logs   │     │  - Coordinates           │
│  - ElahTrainingEvent        │     │  - Explanation + evidence│
└──────────────┬──────────────┘     └────────────┬─────────────┘
               │                                  │
               ▼                                  ▼
        ┌──────────────────────────────────────────────┐
        │  SQLite (shared dev.db)                       │
        │  Banking models + Roadmap models + Training   │
        └──────────────────────┬───────────────────────┘
                               ▼
        ┌──────────────────────────────────────────────┐
        │  Analytics Dashboard (elah-analytics-dashboard) │
        │  - Overview, intent matrix, training dataset  │
        │  - Founder roadmap (/elah-roadmap)            │
        └──────────────────────────────────────────────┘
```

## ELAH boundary

ELAH **scores** events; the **bank** decides allow/block/review using its own thresholds.

## Current state (evidence-based)

| Component | Status |
|-----------|--------|
| Banking simulator | Operational |
| AI agent + tool logging | Operational |
| ElahTrainingEvent pipeline | Partial |
| Rule-based score (`calculateInitialElahScore`) | In banking app |
| Separate ELAH microservice | Not deployed |
| Founder roadmap dashboard | `/elah-roadmap` |

## Trust boundaries

- Agent cannot invoke ELAH scoring to bypass policy  
- ELAH evaluator must not execute banking actions  
- Event content treated as untrusted input (Phase 8)

# ELAH Roadmap Dashboard — Implementation Plan

## Repository decision

**Host:** `/Users/benda/elah-analytics-dashboard`  
**Route:** `/elah-roadmap`  
**Rationale:** Analytics dashboard already hosts ELAH visualization (`/elah-model-roadmap`, `/intent-matrix`, `/training-dataset`). The banking simulator (`ELAH_SECURITY---Banking-System`) remains unchanged and continues to produce events.

## Assumptions

1. **Shared SQLite database** — Analytics uses `DATABASE_URL` pointing at the banking `dev.db`. Roadmap tables are additive; no banking models are modified.
2. **Internal-only** — No auth on analytics dashboard (existing pattern). Suitable for founder operating use on trusted network.
3. **Evidence-based seed status** — Tasks marked `done` only where repository inspection found implementation. Others default to `backlog` or `in_progress`.
4. **No fabricated progress** — No fake customers, investors, pilots, or model accuracy.
5. **Existing `/elah-model-roadmap`** — Preserved; `/elah-roadmap` is the new operational dashboard. Link added from overview nav.

## Architecture

```
app/elah-roadmap/          → 10 views (overview, timeline, kanban, tasks, …)
app/api/roadmap/           → REST CRUD + metrics + seed
lib/roadmap/
  types.ts                 → Domain types + Zod schemas
  constants.ts             → Phases, workstreams, status enums
  metrics.ts               → Calculated KPIs (documented formulas)
  repository.ts            → Prisma data access abstraction
  seed/                    → Milestones, tasks, contacts, decisions, risks
components/roadmap-dashboard/
prisma/schema.prisma       → RoadmapTask, Milestone, Contact, Decision, Experiment, Risk
```

## Persistence

Prisma models on shared SQLite. Repository pattern isolates UI from storage. Seed runs on first API access or via `npm run roadmap:seed`.

## Phases implemented

All 16 phases (0–15) seeded with tasks from the founder brief. 16 milestones with exit criteria. Initial critical-path tasks flagged. Fusion VC placeholder contact (no fabricated email).

## Evidence used for seed statuses

| Capability | Evidence | Affected tasks |
|------------|----------|----------------|
| Banking simulator | Next.js app, Prisma users/accounts | Phase 1 → `in_progress` |
| Agent + tool calls | `lib/agent/orchestrator.ts`, agent APIs | Phase 2 → `in_progress` |
| Training events | `ElahTrainingEvent` model, backfill scripts | Phase 4 → `in_progress` |
| Baseline scoring | `calculateInitialElahScore` in `lib/elah/helpers.ts` | Phase 5 → `in_progress` |
| Intent matrix | APIs + analytics page | Phase 7 → `in_progress` |
| Analytics dashboard | This repo | Phase 9 → `in_progress` |
| Static model roadmap page | `/elah-model-roadmap` | One dashboard task → `done` |
| Separate ELAH service | Not found | Phase 3 mock API → `backlog` |

## Metrics formulas

Documented in `lib/roadmap/metrics.ts` and `docs/ELAH_ROADMAP_DASHBOARD.md`.

## Out of scope (v1)

- Drag-and-drop kanban with optimistic server sync (status change via UI controls)
- Real-time WebSocket updates
- Banking app auth integration
- Automated task completion detection from git

## Next steps after v1

1. Wire task completion hints from CI / repo scanners
2. Link outreach CRM to email/calendar
3. Import live `ElahTrainingEvent` counts into experiment pages

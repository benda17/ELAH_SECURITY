# ELAH Roadmap Dashboard

Internal founder operating system for ELAH — route: **`/elah-roadmap`** (port 3001).

## Open the dashboard

```bash
cd elah-analytics-dashboard
npm install
npm run db:push      # add roadmap tables to shared SQLite
npm run roadmap:seed # first-time seed (skipped if tasks exist)
npm run dev          # http://localhost:3001/elah-roadmap
```

## Data storage

- **Database:** Shared SQLite (`DATABASE_URL` → banking `prisma/dev.db`)
- **Tables:** `RoadmapTask`, `RoadmapMilestone`, `RoadmapContact`, `RoadmapDecision`, `RoadmapExperiment`, `RoadmapRisk`
- **Access layer:** `lib/roadmap/repository.ts` (UI never touches Prisma directly)
- **Seed:** `lib/roadmap/seed/` — runs automatically on first page load or via `npm run roadmap:seed`

## Seeding rules

- All Phase 0–15 tasks from the founder brief are inserted once
- Status is **evidence-based** (see `lib/roadmap/seed/index.ts`); nothing fabricated as complete
- Re-seed requires clearing roadmap tables manually (not automated in v1)

## Progress metrics

Computed in `lib/roadmap/metrics.ts`:

| Metric | Formula |
|--------|---------|
| Overall completion | `round(100 × done / total)` |
| Weighted completion | `round(avg(progressPercentage))` |
| Phase completion | done in phase / total in phase |
| Critical path | done CP tasks / total CP tasks |
| Readiness scores | weighted progress by workstream mapping |
| Overdue | `dueDate < today` and status ≠ done |

## Views

1. **Overview** — KPIs, readiness, risks, priorities  
2. **Timeline** — phases + milestones  
3. **Kanban** — drag/drop status (7 columns)  
4. **Tasks** — sortable/filterable table + detail drawer  
5. **Milestones** — exit criteria, linked tasks  
6. **Outreach CRM** — pipeline stages, follow-up alerts  
7. **Experiments** — validation tracker  
8. **Decisions** — open questions  
9. **Risks** — register + probability/impact matrix  
10. **Weekly** — founder execution summary  

## API

- `GET /api/roadmap/bootstrap` — full snapshot + metrics  
- `GET/POST /api/roadmap/tasks`  
- `PATCH/DELETE /api/roadmap/tasks/[id]`  
- `GET/PATCH /api/roadmap/contacts`  

## Adding workstreams

1. Add to `WORKSTREAMS` in `lib/roadmap/types.ts`  
2. Set `workstream` on new tasks via API or seed  
3. Optionally extend `READINESS_WORKSTREAM_MAP` in `lib/roadmap/constants.ts`

## Related

- Static product roadmap: `/elah-model-roadmap`  
- Banking simulator: `ELAH_SECURITY---Banking-System` (unchanged)

# ELAH Task Schema

Roadmap tasks are stored in `RoadmapTask` (Prisma) and typed as `RoadmapTaskRecord` in `lib/roadmap/types.ts`.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Stable slug e.g. `task-1-audit-the-existing-banking` |
| `title` | string | Actionable task title |
| `category` | string | e.g. Simulator, Dataset, Security |
| `workstream` | string | Product, Engineering, Data, Model, … |
| `phase` | string | Phase 0–15 label |
| `status` | enum | backlog, in_progress, blocked, in_review, done |
| `priority` | enum | critical, high, medium, low |

## Optional fields

`description`, `owner`, `startDate`, `dueDate`, `completedAt`, `estimatedEffort`, `actualEffort`, `progressPercentage` (0–100), `milestoneId`, `parentTaskId`, `dependencyIds[]`, `blockedBy`, `blockingReason`, `successCriteria`, `deliverables`, `notes`, `links[]`, `tags[]`, `riskLevel`, `isCriticalPath`, `order`

## JSON columns (SQLite string)

`dependencyIds`, `links`, `tags` — stored as JSON arrays, parsed via `lib/roadmap/json.ts`.

## Status transitions

Kanban and task table PATCH endpoints update `status`. Setting `done` auto-sets `progressPercentage=100` and `completedAt=now`.

## Related entities

- **Milestone** — `RoadmapMilestone`, linked via `milestoneId`  
- **Contact** — `RoadmapContact`, outreach CRM  
- **Decision** — `RoadmapDecision`  
- **Experiment** — `RoadmapExperiment`  
- **Risk** — `RoadmapRisk`

# ELAH System Architecture (MVP)

| Field | Value |
|---|---|
| Document ID | ELAH-ARCH-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 17 August 2026 |
| Related task | `task-0-define-the-system-architecture` |
| Replaces | Informal SQLite/`dev.db` notes — **Neon Postgres** is the live store |

---

## 1. Purpose

A single picture of **what talks to what** for the banking demo + founder platform. Component **ownership** (which repo) is `ELAH_COMPONENT_OWNERSHIP.md`.

---

## 2. Context diagram

```
Customer (browser)
    → Banking simulator (Next.js / Vercel)
         → Bank policy (allow | deny | confirm)
         → POST /v1/score  (Bearer service token)
              → ELAH scorer (same deploy or separate service)
                   → ElahScore JSON
         → executeTool if policy already allows
         → persist event + score snapshot

Founder (web + iPhone)
    → Founder platform (Next.js / Vercel)
         → Neon Postgres (RoadmapTask, ElahTrainingEvent, …)
         → reads training rows / Kanban
```

---

## 3. Runtime facts (live)

| Fact | Value |
|---|---|
| Banking app | This repo, Vercel |
| Founder app | `elah-analytics-dashboard`, Vercel (`elahfounderplatform.vercel.app`) |
| Database | **Neon Postgres** (Prisma). Not SQLite. |
| Score API | `POST /v1/score`, OpenAPI 3.1 `elah-v1-score.yaml` |
| Auth (score) | Service Bearer token |
| Fail-open | Client 250 ms then continue policy |
| Modes | `pre_tool` only in request; event `executionState` `pre_tool` \| `no_tool` |

---

## 4. Logical components

| Component | Responsibility |
|---|---|
| Chat / agent | Plan tools from utterance |
| Policy engine | Allow / deny / confirm |
| Event builder | `ElahEvent` envelope (no raw utterance) |
| Scorer | `ElahScore` + abstain |
| Training sink | Features for founder (async OK) |
| Analyst UI | Event list/detail, coordinates |
| Founder Kanban | Roadmap tasks in Neon |

---

## 5. Trust boundaries

1. Browser ↛ score API (no customer JWT on `/v1/score`).
2. Simulator service token is **server-only**.
3. Founder DB is **not** the bank’s ledger.
4. ELAH never calls `executeTool`.

---

## 6. Sign-off

I agree this is the MVP architecture: simulator + score API + Neon founder store, with policy before execute and score before tool.

---

*End of document.*

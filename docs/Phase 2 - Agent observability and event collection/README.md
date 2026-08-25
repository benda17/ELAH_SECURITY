# Phase 2 — Agent observability and event collection (documentation)

Canonical **documentation** pack for Phase 2. Engineering lives in `lib/agent/*`, `lib/elah/*`, `scripts/export-elah-events.ts`, and `/admin/elah-events`. Phase 2 does **not** wire `POST /v1/score`.

**Product freeze (unchanged):** ELAH scores genuine banking intent before tool execution. Bank policy allow / deny / confirm. ELAH never allows, blocks, or executes. Phase 2 does **not** wire `POST /v1/score`.

Evidence date: **25 August 2026**, live repo `ELAH_SECURITY---Banking-System`. Demo password for all listed accounts: `DemoPass123!`.

Canonical demo users: `basic.customer@elah.demo` (Jane), `premium.customer@elah.demo`, `vip.customer@elah.demo` (Isabella), `manager@elah.demo`, `security.admin@elah.demo`.

---

## Index

| Order | Task | Doc ID | File |
|---:|---|---|---|
| 31 | Audit the integrated AI banking agent | ELAH-AGT-AUDIT-001 | [ELAH_AGENT_AUDIT.md](./ELAH_AGENT_AUDIT.md) |
| 32 | Map all agent tools | ELAH-AGT-TOOLS-001 | [ELAH_AGENT_TOOL_MAP.md](./ELAH_AGENT_TOOL_MAP.md) |
| 33 | Document all agent capabilities | ELAH-AGT-CAPS-001 | [ELAH_AGENT_CAPABILITIES.md](./ELAH_AGENT_CAPABILITIES.md) |
| 34 | Capture pipeline (request → tool → banking action) | ELAH-AGT-CAPTURE-001 | [ELAH_AGENT_CAPTURE.md](./ELAH_AGENT_CAPTURE.md) |
| 35 | Normalized ElahEvent envelope | ELAH-AGT-ENVELOPE-001 | [ELAH_EVENT_ENVELOPE.md](./ELAH_EVENT_ENVELOPE.md) |
| 36 | Event quality, missing fields, duplicates | ELAH-AGT-QUALITY-001 | [ELAH_EVENT_QUALITY.md](./ELAH_EVENT_QUALITY.md) |
| 37 | Training / ingest JSONL export | ELAH-AGT-EXPORT-001 | [ELAH_TRAINING_EXPORT.md](./ELAH_TRAINING_EXPORT.md) |
| 38 | Live event viewer, detail, filters | ELAH-AGT-VIEWER-001 | [ELAH_EVENT_VIEWER.md](./ELAH_EVENT_VIEWER.md) |

---

## How to read

1. **Audit** — live orchestrator, planner, policy, confirmation, injection, three stores, scoring-unit vs lifecycle, gaps vs `ElahEvent` 1.0.
2. **Tool map** — 13 allow-listed tools → category, confirmation, P0/P1, AuditLog alias, canonical `actionType`, default intent. `card_management` is an orchestrator intent, not an `actionType`.
3. **Capabilities** — what the assistant can / cannot do per tier; UI-only vs agent-only; confirmation; tenant isolation; injection refuse. ELAH score is **not** an agent capability.
4. **Capture** — lifecycle hops (`AgentEventLog`), sequence/turnId, structured plan (`modelOutput`), degrade-not-retry.
5. **Envelope** — `ElahEvent` 1.0 mapper (`lib/elah/envelope.ts`). Page views excluded. No scores on the event.
6. **Quality** — named rules, dashboard alerts, duplicate `eventId` on ingest rows (not lifecycle hops).
7. **Export** — `npm run export:elah-events` JSONL of quality-ok envelopes.
8. **Viewer** — `/admin/elah-events` (security admin). Assistant logs remain lifecycle ops.

Do not invent ATM, beneficiary-write, or `device_change` tools.

Related Phase 1 pack: `docs/Phase 1 - Banking Simulator Stabilization/`. Related Phase 0 pack: `docs/Phase 0 - Product Definition/`.

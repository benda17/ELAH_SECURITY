# Phase 1 — Banking Simulator Stabilization (documentation)

Canonical **documentation** pack for Phase 1. Engineering tasks (event instrumentation, seeds, reset, scenarios) are **not** in this folder.

**Product freeze (unchanged):** ELAH scores genuine banking intent before tool execution. Bank policy allow / deny / confirm. ELAH never allows, blocks, or executes.

Evidence date: **18 August 2026**, live repo `ELAH_SECURITY---Banking-System`. Demo password for all listed accounts: `DemoPass123!`.

---

## Index

| Order | Task | Doc ID | File |
|---:|---|---|---|
| 23 | Audit the existing banking simulator | ELAH-SIM-AUDIT-001 | [ELAH_SIMULATOR_AUDIT.md](./ELAH_SIMULATOR_AUDIT.md) |
| 24 | Document all existing banking flows | ELAH-SIM-FLOWS-001 | [ELAH_BANKING_FLOWS.md](./ELAH_BANKING_FLOWS.md) |
| 25 | Verify authentication and authorization | ELAH-SIM-AUTHZ-001 | [ELAH_AUTHZ_VERIFICATION.md](./ELAH_AUTHZ_VERIFICATION.md) |
| 26 | Verify simulated user and account database | ELAH-SIM-DATA-001 | [ELAH_SIMULATOR_DATA_INVENTORY.md](./ELAH_SIMULATOR_DATA_INVENTORY.md) |
| 27 | Verify user tiers and permissions | ELAH-SIM-TIERS-001 | [ELAH_TIER_PERMISSIONS.md](./ELAH_TIER_PERMISSIONS.md) |
| 28 | Standardize banking action names | ELAH-SIM-ACTIONS-001 | [ELAH_ACTION_NAME_GLOSSARY.md](./ELAH_ACTION_NAME_GLOSSARY.md) |
| 29 | Document non-flows and high-risk coverage | ELAH-SIM-NONFLOWS-001 | [ELAH_NONFLOWS_AND_HIGH_RISK.md](./ELAH_NONFLOWS_AND_HIGH_RISK.md) |
| 30 | Phase 1 runnable scenarios | ELAH-SIM-SCENARIOS-001 | [ELAH_PHASE1_SCENARIOS.md](./ELAH_PHASE1_SCENARIOS.md) |

---

## How to read

1. **Audit** — gaps vs Phase 0 event schema (what is missing, what is split across three stores).
2. **Flows** — step-by-step customer / manager / admin / assistant paths.
3. **Authz** — who can hit which route; pass/fail notes.
4. **Data** — seed users, accounts, relationships.
5. **Tiers** — limits and entitlements vs live checks.
6. **Glossary** — audit `actionType` vs agent `toolName` vs ELAH `intentLabel`.

Related Phase 0 pack: `docs/Phase 0 - Product Definition/`.

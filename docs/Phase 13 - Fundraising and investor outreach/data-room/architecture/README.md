# Architecture (links only)

| Field | Value |
|---|---|
| Data-room folder | `data-room/architecture/` |
| Date | 26 August 2026 |
| Status | Pointers — canonical docs stay in Phase 0 / 3 / 5 |
| Phase 13 card | `task-13-add-architecture-documents` |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. `rules_v0` is **uncalibrated** and is **not** a trained model.

Do not copy architecture files into this folder. Link the canonical docs so diligence does not fork the freeze.

---

## Canonical docs

| Doc | Path in this repo |
|---|---|
| System architecture (ELAH-ARCH-001) | [`docs/Phase 0 - Product Definition/Tasks 10-22 performed 17 Aug 2026/ELAH_ARCHITECTURE.md`](../../../Phase%200%20-%20Product%20Definition/Tasks%2010-22%20performed%2017%20Aug%202026/ELAH_ARCHITECTURE.md) |
| Output contract (ELAH-SPEC-OUTPUT-001) | [`docs/Phase 0 - Product Definition/ELAH_OUTPUT_CONTRACT.md`](../../../Phase%200%20-%20Product%20Definition/ELAH_OUTPUT_CONTRACT.md) |
| ELAH service foundation (Phase 3 pack) | [`docs/Phase 3 - ELAH service foundation/`](../../../Phase%203%20-%20ELAH%20service%20foundation/) |
| Baseline scoring system (Phase 5 pack) | [`docs/Phase 5 - Baseline scoring system/`](../../../Phase%205%20-%20Baseline%20scoring%20system/) |

OpenAPI for `POST /v1/score` remains `docs/Phase 0 - Product Definition/openapi/elah-v1-score.yaml` (inside the Phase 0 pack; not duplicated here).

---

## Current state (26 August 2026)

The scoring API is **colocated** in the banking Next.js / Vercel app as `POST /v1/score` (Bearer service token, fail-open client). Provenance is **`rules_v0`**: a deterministic feature→rules baseline, **uncalibrated**, not a trained model. Bank policy still allow / deny / confirm; ELAH never executes tools. Logical extract of `lib/elah/service` + `app/v1` is allowed later without rewriting the bank (`ELAH-ARCH-OWN-001` in the Phase 0 architecture folder).

A longer narrative for investors (without forking contracts) is the Phase 13 technical appendix at pack root, when that card ships: `docs/Phase 13 - Fundraising and investor outreach/ELAH_TECHNICAL_APPENDIX.md`.

---

*End of document.*

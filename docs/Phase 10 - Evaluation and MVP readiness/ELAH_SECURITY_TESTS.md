# ELAH security tests (Phase 10 pointer)

| Field | Value |
|---|---|
| Document ID | ELAH-P10-SEC-001 |
| Version | **1.0** |
| Status | **Pointer** — **not a pentest**, **not Phase 8 complete** |
| Date | 28 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related task | `task-10-run-security-tests` |
| Phase 8 pack | **Not written.** Do not invent `docs/Phase 8 - Security architecture and red teaming/ELAH_REDTEAM_SCENARIOS.md` as executed. |

**Product freeze (unchanged):** ELAH never allows, blocks, or executes. Untrusted tickets/notes are not instructions. Scorer must not call `executeTool`.

---

## 1. Purpose

Phase 10 records **existing automated security-adjacent tests**. It does **not** close Phase 8 (red team / evaluator hardening). Do not tell an investor a pentest happened.

---

## 2. What exists in this repo

| Test | What it proves |
|---|---|
| `tests/elah/trust-boundary.test.ts` | `lib/elah/service/*.ts` does not import `executeTool` / `lib/agent/tools` |
| `tests/elah/analyst-rbac.test.ts` | Customers get 403 on analyst permissions; denials are audited |
| `tests/elah/score-contract.test.ts` | `policyHook.recommendation` never `allow`/`deny`/`block`/`execute` |
| `tests/elah/phase10-customer-ui.test.ts` | Customer routes do not mention `elahScore` |
| `tests/elah/client-failopen.test.ts` | Hang/503 cannot throw into the banking path |
| Injection fixtures | `[SIMULATION ONLY]` lures in Phase 1 scenarios; policy refuse is the bank |

Phase 0 threat model (`ELAH_THREAT_MODEL.md`) is a **spec**, not a completed red-team report.

---

## 3. What this is not

- External pentest or bug bounty
- Auth bypass / exploit development
- Production WAF or SOC2 evidence
- Phase 8 scenario runner

Those stay Phase 8 / counsel / later.

---

## 4. Sign-off

I agree this card is a pointer plus unit tests; Phase 8 remains unexecuted as a red-team phase.

---

*End of document.*

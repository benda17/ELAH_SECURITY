# ELAH demo readiness (Phase 10)

| Field | Value |
|---|---|
| Document ID | ELAH-P10-DEMO-001 |
| Version | **1.0** |
| Status | **Proposed** |
| Date | 28 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related tasks | `task-10-prepare-the-mvp-demo`, `task-10-create-repeatable-demo-scenarios`, `task-10-create-a-technical-demo-script`, `task-10-create-a-non-technical-demo-script` |

**Product freeze (say out loud once):** ELAH scores genuine intent **before tools**. Policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** The customer does not see `elahScore`.

---

## 1. Open with CS/CRM; banking is encore

After the 8 September 2026 pivot, the **first story** is CS/CRM ops. Banking Jane is optional encore, not the cold open.

| Card | Script |
|---|---|
| Non-technical / first-buyer | Founder repo `docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_CS_CRM_DEMO_SCRIPT.md` (10 min, refund / mistaken write / ticket injection) |
| Technical banking | This repo `docs/Phase 13 - Fundraising and investor outreach/ELAH_DEMO_SCRIPT.md` (8–12 min, Jane + admin) |
| Repeatable simulator rows | `docs/Phase 1 - Banking Simulator Stabilization/ELAH_PHASE1_SCENARIOS.md` + `scripts/phase1-scenarios.json` |

Do **not** present banking holdout 0.79 as refund accuracy.

---

## 2. Repeatable logins

Password for listed demo users: **`DemoPass123!`**.

| Role | Email | First click |
|---|---|---|
| Customer (bank) | `basic.customer@elah.demo` | `/assistant` (not `/transfer` as hero) |
| Analyst (bank) | `security.admin@elah.demo` | `/admin/elah-events` |
| Customer (CRM) | `basic.customer@elah.demo` | CRM `/support` |
| Analyst (CRM) | `security.admin@elah.demo` | CRM `/admin/events` |

Two browsers. Never open Jane with an admin session.

---

## 3. Pass / fail of the talk

Pass: guest can repeat “ELAH scored; the company/bank decided.”  
Fail: anyone says “ELAH blocked the refund/transfer.”

If `scoring_unavailable`, say fail-open. That is still a valid demo.

---

## 4. Sign-off

I agree Phase 10 demo readiness is these existing scripts plus freeze language; agents do not send calendar invites.

---

*End of document.*

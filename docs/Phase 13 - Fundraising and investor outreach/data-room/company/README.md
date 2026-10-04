# Company documents — checklist (all pending)

| Field | Value |
|---|---|
| Data-room folder | `data-room/company/` |
| Date | 26 August 2026 |
| Status | **Blocked on incorporation** — founder accepted this delay 26 August 2026 |
| Phase 13 card | `task-13-add-company-documents` |
| Owns the actual files | **Phase 14 — Company, legal, privacy, and compliance** |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** This checklist does **not** invent a company registration number, EIN, registered address, or director list.

This folder is a **checklist**, not the scanned documents. Do not commit identity documents, certificates, or unsigned templates filled with placeholder legal names presented as real.

---

## Checklist

Every row is **pending / not in repo** as of 26 August 2026. Founder + counsel fill the “Notes” column when a real file exists. Put counsel-authored PDFs in [`../legal-pending/`](../legal-pending/README.md), not here as invented scans.

| Doc | Purpose | Status | Phase 14 task | Notes |
|---|---|---|---|---|
| Company structure decision (entity type, jurisdiction) | What to incorporate, where | **Pending** | `task-14-confirm-the-company-structure-for-elah` | No entity named here |
| Certificate of incorporation / company registration extract | Proof the company exists | **Pending** | `task-14-confirm-the-company-structure-for-elah` | Do not invent a company number |
| Constitutional documents (articles, bylaws, or operating agreement) | Governance | **Pending** | `task-14-confirm-the-company-structure-for-elah` | |
| Founder IP assignment | Code and docs assign to the company | **Pending** | `task-14-review-founder-and-intellectual-property-ownersh` | Repo copyright is not a substitute |
| Option pool / equity incentive plan | Pool size and plan docs | **Pending** | Phase 14 company structure + Phase 15 `task-15-define-equity-and-compensation-questions-for-pro` | **No pool % invented** |
| Cap-table summary | Who owns what | **Pending counsel** | See [`../cap-table/`](../cap-table/README.md) | Same freeze: no fake % |
| Advisor / contractor agreements (IP + confidentiality) | If anyone besides the founder contributes | **Pending** | `task-14-prepare-advisor-or-contractor-agreements-where-r` | No fake named advisors |
| Open-source license inventory | What the product ships | **Pending** | `task-14-review-open-source-licenses` | |
| Privacy policy | Public / demo users | **Pending** | `task-14-create-a-privacy-policy` | |
| Demo-user terms | Simulator accounts | **Pending** | `task-14-create-terms-for-demo-users` | |
| Data-processing roles + DPA checklist | Controller / processor for a future pilot | **Pending** | `task-14-define-data-processing-roles`, `task-14-prepare-an-initial-data-processing-agreement-che` | |
| Counsel engagement letter | Who may give legal advice | **Pending** | `task-14-identify-where-professional-legal-advice-is-requ` | Generated docs are **not** legal advice (`task-14-do-not-present-generated-content-as-final-legal-`) |

Phase 15 (`task-15-define-equity-and-compensation-questions-for-pro` and hiring scorecards) does **not** replace Phase 14 for incorporation.

---

## Phase 14 pointer

Do not treat this Phase 13 checklist as company formation. When counsel produces files:

1. Store them outside git or under [`../legal-pending/`](../legal-pending/README.md) with founder approval.
2. Update this table’s Notes with filename + date — still no invented registration numbers.
3. Keep Kanban `task-13-add-company-documents` **blocked** until the company is incorporated. Checklist Done ≠ articles filed. Founder accepted this delay 26 August 2026.

Related pack (not yet written in this repo): Phase 14 docs, when they exist, will live under `docs/Phase 14 - Company, legal, privacy, and compliance/` (or the founder platform copy). Until then, the Kanban titles above are the task list.

---

*End of document.*

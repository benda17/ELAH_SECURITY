# Local ELAH data room (git paths)

This is the **local** diligence tree for Phase 13. It is not a Google Drive, DocSend, Notion, or email attachment yet. Copy or zip from git only after the founder reviews what is Proposed vs pending.

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Do not invent customers, TAM billions, or ownership percentages. Do not `prisma db push`. Do not commit secrets or identity documents.

Canonical index: [`../ELAH_DATA_ROOM.md`](../ELAH_DATA_ROOM.md) (`ELAH-FUND-DR-001`). Date: **26 August 2026**.

---

## Where this lives

| Item | Path |
|---|---|
| Banking repo (this tree) | `ELAH_SECURITY---Banking-System/docs/Phase 13 - Fundraising and investor outreach/data-room/` |
| Pack root (memos, deck, ask) | `…/docs/Phase 13 - Fundraising and investor outreach/` |
| Founder Kanban (live card status) | `elah-analytics-dashboard` → `/founder/roadmap/kanban` (`elahfounderplatform.vercel.app`) |
| Outreach CRM | `/founder/roadmap/outreach` — **not** an investor share folder |

There is **no** second copy of architecture. `architecture/` is links into Phase 0 / 3 / 5. Do not duplicate those files here; they will drift.

---

## How to use

1. Read [`../ELAH_DATA_ROOM.md`](../ELAH_DATA_ROOM.md) for which of the **32** Phase 13 Kanban cards fill which folder.
2. Open a folder README. If it says **pending**, there is no PDF to attach.
3. For product / finance / market / roadmap, follow the pointer to the pack-root markdown. Sibling Phase 13 cards own those files.
4. Before any investor share: strip `.env`, tokens, identity scans, and any invented numbers. Recheck the freeze sentence.
5. When counsel later delivers incorporation or a cap-table summary, put **counsel-authored** files under `legal-pending/` or replace the pending README — do not invent a company number to “look complete”.

A future Drive folder should mirror these directory names. Until then, git is the room.

---

## Tree

```text
data-room/
  README.md                 ← you are here
  company/README.md         pending checklist (Phase 14)
  cap-table/README.md       pending counsel
  architecture/README.md    links only
  product/README.md         pointers to pack-root pitch artifacts
  roadmap/README.md         pointer to ELAH_ROADMAP_FOR_INVESTORS.md
  market/README.md          pointer to ELAH_MARKET.md
  finance/README.md         pointers to ask / plan / use-of-funds
  legal-pending/README.md   empty slot for counsel PDFs
```

---

## What not to do

- Do not mark company or cap-table folders “complete” without counsel files.
- Do not paste a TAM from a blog into `market/` without a citation in `ELAH_MARKET.md`. If you cannot cite it, write **unknown — do not quote a TAM**.
- Do not send email from this tree (`task-13-contact-investors` is founder-only).
- Do not `git add` passports, certificates, or `.pem` files.

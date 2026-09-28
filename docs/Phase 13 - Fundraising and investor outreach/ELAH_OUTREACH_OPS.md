# ELAH Investor Outreach Operations

| Field | Value |
|---|---|
| Document ID | ELAH-FUND-OPS-001 |
| Version | **1.0** |
| Status | **Proposed** |
| Date | 26 August 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related tasks | `Contact investors.` · `Track replies.` · `Schedule meetings.` · `Track follow-ups.` · `Track introductions.` · `Track passed investors and reasons.` · `Maintain an investor pipeline.` |
| CRM | `elah-analytics-dashboard` · `RoadmapContact` · UI `/founder/roadmap/outreach` |
| Target list | [ELAH_INVESTOR_LIST.md](./ELAH_INVESTOR_LIST.md) (ELAH-FUND-LIST-001) |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** No fake investors, customers, or meetings. Do not `prisma db push`. Do not invent email addresses.

---

## 1. Purpose

How the founder **sends** (when the time comes), **logs**, and **reviews** investor outreach in the existing CRM — without fabricating pipeline.

This document does **not** authorize sending mail today. Wave 1 names in ELAH-FUND-LIST-001 are `identified` / `research` only. Fusion VC stays `identified` with **no email**.

---

## 2. Agents never send mail

| Actor | Allowed | Forbidden |
|---|---|---|
| Founder | Send from a personal / company inbox the founder controls | Guessing inboxes; mass-mailing unpublished addresses |
| Human advisor (asked by founder) | Intro or forward, logged after it happens | Marking CRM `contacted` before the intro is actually sent |
| **Agents (Cursor, scripts, CRM jobs, cron)** | Draft copy **in-repo** when asked; create/update research rows | **Sending email.** Setting `contacted` / `replied` / `meeting_scheduled`. Inventing `email`. Pushing schema. |

If an agent produces a draft, it stays in docs or notes until the **founder** pastes and sends it. The CRM stage moves only after the founder (or a named human) actually sent something.

---

## 3. Existing CRM stages

Use the stages already on `RoadmapContact.outreachStatus` and the outreach board. Do not add Prisma columns.

| Stage | Meaning | When to enter | When **not** to enter |
|---|---|---|---|
| `research` | Firm is real; fit or partner still thin | Wave 2, park, or TBD partner | After a send |
| `identified` | Firm + public source + thesis fit recorded; email still may be null | Wave 1 after list hygiene | After a send |
| `ready_to_contact` | Founder has a **verified** address or a named intro path | Email or intro owner is known **without guessing** | Email still blank |
| `contacted` | Founder (or named human) **sent** mail or a LinkedIn note | Timestamp in `lastContactDate`; set `nextFollowUp` | Agent “sent”; mail merge of guessed addresses |
| `replied` | The other side wrote back (any substance, including “not now”) | First inbound reply | Auto-ack / bounce treated as a meeting |
| `meeting_scheduled` | Calendar hold exists with a date | Date in notes + `nextFollowUp` = meeting day | “They might take a call” |
| `follow_up` | Ball in founder’s court after silence or a promised later date | `nextFollowUp` required | Same-day as first send (use `contacted`) |
| `interested` | Explicit positive signal (wants materials, second meeting, process) | Quote or paraphrase in notes | Polite “looks interesting” with no next step |
| `due_diligence` | They asked for data-room / references / legal | List what they asked in notes | Founder *offered* a deck unprompted |
| `passed` | They declined, went silent after the follow-up budget, or are a misfit | **Pass code required** (see §6) | Parking a firm you have not contacted |
| `closed` | Term sheet path ended (invested, or process fully done) | Rare; pre-seed ELAH is not here | Using `closed` as a synonym for `passed` |

**Also on the board today:** `pilot_discussion`. That stage is for **bank / design-partner** work, not investors. Do not move an investor there to imply a customer pilot. Investor commercial interest stays in `interested` / `due_diligence`.

Counts on the board are **not** a fundraising KPI. Empty `contacted` is correct until the founder sends.

---

## 4. Send checklist (founder only)

Complete **before** moving a row to `ready_to_contact`, then again before the actual send (`contacted`).

### 4.1 Before `ready_to_contact`

1. Firm is on ELAH-FUND-LIST-001 (or a later add with the same hygiene).
2. Public source URL is in `linkedInUrl` or `notes`.
3. Partner is published **or** still TBD with a plan (intro, team page, event) — not a guessed name.
4. **Email is verified**: written by them, a warm introducer, or a published individual address you did not reconstruct. If none: **stay `identified`**. Fusion VC is the template (no email).
5. One-line why-ELAH-fit still true (AI intent scoring for banks; ELAH does not allow/block/execute).
6. You are not about to claim fake customers, fake pilots, or a trained production model.

### 4.2 Before send (`contacted`)

1. Recipient, firm, and channel (email vs intro vs LinkedIn) written in notes.
2. Subject + body drafted; **no** invented metrics, logos, or meetings.
3. Product freeze sentence available if asked: *ELAH scores genuine banking intent before tools; the bank’s policy allows, denies, or confirms; ELAH never allows, blocks, or executes.*
4. `nextFollowUp` set (default: **7 calendar days** after send if no reply).
5. `lastContactDate` = send date.
6. Stage → `contacted` **after** the send, not before.

### 4.3 What not to send

- Guessed `first.last@fund.com` patterns.
- “We are in diligence with [fake bank].”
- “ELAH blocks fraud” / “ELAH allows the transfer.”
- Attachments that are not the current deck / one-pager / demo link.

---

## 5. How to log events

Always: short factual notes. No vanity counts. `email` stays null until a real address exists.

### 5.1 Reply

1. Stage → `replied` (even if the reply is a pass — then immediately apply §5.5).
2. `lastContactDate` = reply date.
3. Notes: date, channel, **one-sentence** substance (question asked, “not now”, ask for deck).
4. If they proposed a time → `meeting_scheduled` and `nextFollowUp` = that date.
5. If they asked to follow up later → `follow_up` and `nextFollowUp` = the date they named (or +14 days if vague).

### 5.2 Follow-up (you write again)

1. Only from `contacted` or `follow_up`.
2. After send: `lastContactDate` = today; `nextFollowUp` = next slot (default +7 days).
3. Stay `follow_up` until they reply or you pass them for silence (`PASS_SILENCE`).
4. **Budget:** two follow-ups after the first send, then pass unless they opened a door.

### 5.3 Introduction

Log the **introducer**, not a fake meeting with the fund.

| What happened | Stage | Notes |
|---|---|---|
| You asked someone for an intro; not yet sent | stay `identified` / `ready_to_contact` | “Intro requested from [name], not sent” |
| Introducer sent the intro | `contacted` | “Intro sent by [name] on [date] to [partner or firm]” |
| Fund replies on the intro thread | `replied` | As §5.1 |
| Introducer declines | stay prior stage or `passed` + `PASS_NO_INTRO` | Do not mark the fund `contacted` |

Never set `meeting_scheduled` because an intro was requested.

### 5.4 Meeting

1. Stage → `meeting_scheduled` when a datetime is agreed.
2. After the meeting: notes with date, attendees, questions (see “Track investor questions” on the Phase 13 board).
3. Next stage from evidence: `follow_up`, `interested`, `due_diligence`, or `passed` + code.
4. Do not create calendar fiction.

### 5.5 Pass

1. Stage → `passed`.
2. Notes **must** start with a code from §6 (`PASS_STAGE`, `PASS_THESIS`, …).
3. Optional one line of their words. No argument in the CRM.
4. `nextFollowUp` = null unless they invited a timed revisit (`PASS_TIMING` + date).

---

## 6. Pass reason codebook

Put the **code first** in `notes`. One primary code. A second code allowed if both are true.

| Code | Meaning | Example evidence |
|---|---|---|
| `PASS_STAGE` | Too early / too late vs their fund | “Come back at A” |
| `PASS_THESIS` | Not AI / cyber / fintech / enterprise as they invest | “We don’t do bank-sold software” |
| `PASS_GEO` | Geography mismatch they stated | “Israel-only and you are incorporating elsewhere” — only if they said it |
| `PASS_CHECK` | Check size / ownership / round shape | “We need to lead $X; this is too small” |
| `PASS_COMPETITIVE` | Conflict with a portfolio company they named | Named overlap |
| `PASS_TEAM` | Team / domain-expertise concern they stated | “Need a bank operator cofounder” |
| `PASS_PRODUCT` | Disbelief in the product freeze or category | “Scoring isn’t a company” |
| `PASS_TRACTION` | Want design partner / revenue you do not have | “Come back with a bank pilot” |
| `PASS_TIMING` | Not now; revisit later | Date they gave |
| `PASS_SILENCE` | No reply after send + two follow-ups | Dates of send/follow-ups in notes |
| `PASS_NO_INTRO` | Could not get a legitimate path; not guessing email | Introducer declined; no published address |
| `PASS_FOUNDER` | Founder chose not to pursue | “Deprioritized vs Wave 1 cyber funds” |
| `PASS_OTHER` | Anything else | One factual sentence after the code |

Do **not** use `passed` for park-list firms you never contacted. Park stays `research`.

---

## 7. Weekly pipeline review

**Owner:** founder. **Cadence:** once per week, 20 minutes. **Input:** `/founder/roadmap/outreach` (type filter: `investor`). **Output:** notes on the rows, not a slide with fake conversion rates.

### 7.1 Agenda

1. **Overdue follow-ups** (highlighted on the board). Send, reschedule `nextFollowUp`, or `PASS_SILENCE`.
2. **Stage integrity:** nothing in `contacted`+ without a real send; nothing in `meeting_scheduled` without a date; no investor in `pilot_discussion`.
3. **Email hygiene:** still-null emails stay null. Fusion VC still null unless Fusion gives an address.
4. **Wave 1 vs 2:** do not promote Wave 2 to `ready_to_contact` just to look busy.
5. **Questions log:** any new investor question from a real reply/meeting → notes (feeds deck/FAQ later).
6. **Pass codes:** every `passed` row has a codebook prefix.
7. **Counts:** report *identified / ready / contacted / replied* as facts. Do not interpolate “interest.”

### 7.2 What “healthy” looks like before first send

- Fusion VC: `identified`, email null.
- Additional Wave 1 investors: `identified`, email null, firm URL on the row.
- Wave 2 / park: `research`.
- Bank placeholders unchanged; this pack does not add more banks.
- `contacted` count = **0** until the founder sends.

---

## 8. Field cheat sheet

| Field | Investor hygiene |
|---|---|
| `name` / `organization` | Firm name (person name only when that person is the row) |
| `role` | Published partner title/name, else null |
| `contactType` | `investor` |
| `email` | Real address or **null** |
| `linkedInUrl` | Public firm page until a personal URL is verified |
| `sector` | Venture Capital |
| `relevance` | One-line why-ELAH-fit |
| `outreachStatus` | §3 |
| `lastContactDate` | Last **real** touch |
| `nextFollowUp` | Required in `contacted`, `follow_up`, `meeting_scheduled` |
| `notes` | Wave + thesis + source URL; later: dates, intro names, pass codes |
| `priority` | `high` Wave 1 · `medium` Wave 2 · `low` park |
| `potentialValue` | Optional; do not invent round amounts they did not discuss |

---

## 9. Forbidden

- Agents sending email or LinkedIn messages.
- Fabricated emails, including “standard” firm patterns.
- Marking `contacted` / `replied` / `meeting_scheduled` without the event.
- `prisma db push` or new CRM columns for this pack.
- Fake pipeline counts, fake meetings, fake customers.
- Deleting Fusion VC or filling Fusion’s email from guesswork.

# ELAH Privacy Requirements

| Field | Value |
|---|---|
| Document ID | ELAH-SPEC-PRIVACY-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 17 August 2026 |
| Related task | `task-0-define-the-privacy-requirements` |
| Depends on | Event schema, input contract, retention |

---

## 1. Purpose

Map **which fields leave the bank**, what must never appear in explanations, and who can see scores.

---

## 2. Data classes

| Class | Examples | May leave bank to ELAH? | May appear in `explanation.summary`? |
|---|---|---|---|
| Identifiers | `userId`, `sessionId`, `eventId` | Yes (opaque ids) | No |
| Action metadata | `actionType`, `channel`, `executionState` | Yes | Yes (generic) |
| Amounts / currency | `amount`, `currency` | Yes (needed for FR) | Round or omit names |
| Payee / account numbers | IBAN, last4, recipient name | **Hash or omit** in MVP payload | **Never** |
| Raw utterance | Customer chat text | **No** in v1 `ElahEvent` (schema forbids) | Never |
| Auth secrets | Bearer token, passwords | Transport only | Never |
| Score outputs | `elahScore`, coordinates | Founder + analyst only | N/A |

Live event schema already **excludes** raw utterance. Input contract body ≤ 32 KiB.

---

## 3. Access

| Role | Sees scores | Sees utterances |
|---|---|---|
| Customer | No | Own chat only |
| Bank analyst (`security.admin`) | Yes | Simulator transcripts if the app stores them |
| Founder | Training features + scores | Only synthetic gold rows |
| ELAH service logs | ids + latency | No utterance |

---

## 4. Minimisation rules

1. Hash or drop beneficiary identifiers before `POST /v1/score`.
2. Explanation lists use **signal ids**, not copied chat.
3. No third-party analytics on chat text.
4. Demo data is still treated as if it were customer data.

---

## 5. Sign-off

I agree v1 scoring uses metadata + hashed identifiers, never raw chat or account numbers in explanations.

---

*End of document.*

# ELAH Data Retention

| Field | Value |
|---|---|
| Document ID | ELAH-SPEC-RETENTION-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 17 August 2026 |
| Related task | `task-0-define-the-data-retention-requirements` |

---

## 1. Purpose

What we keep, where, and for how long in **demo / founder** environments. Not a bank-production retention policy.

---

## 2. Retention matrix

| Store | What | TTL (MVP) | After TTL |
|---|---|---|---|
| Simulator `elah_events` (if persisted) | Event envelope + score snapshot | **90 days** | Delete |
| Founder `ElahTrainingEvent` | Features + labels + score; **no raw utterance** by default | **180 days** or until dataset export | Delete or anonymise |
| Application logs | `requestId`, latency, status | **14 days** | Delete |
| Vercel / platform logs | Same | Platform default (treat as **≤ 14 days**) | — |
| OpenAPI fixtures / golden JSON | Synthetic only | Repo lifetime | — |
| Auth sessions | Bank + founder cookies | Session / 7 days max | Expire |
| Backups (Neon) | DB snapshots | Provider default; **no extra copies of utterances** | — |

---

## 3. Rules

1. **Do not** retain full customer utterance in founder training rows unless a labelled gold-set flag is on **and** the row is synthetic.
2. `correlationId` / `eventId` may be kept for join; they are not names.
3. Demo accounts (`*@elah.demo`) are synthetic; still treat like PII in logs.
4. Deletion is **hard delete** in MVP (no legal hold).

---

## 4. Sign-off

I agree the MVP retention matrix above for demo and founder stores.

---

*End of document.*

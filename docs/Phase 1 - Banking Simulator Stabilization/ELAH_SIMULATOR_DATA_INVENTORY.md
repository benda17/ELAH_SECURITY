# ELAH Simulated User and Account Database

| Field | Value |
|---|---|
| Document ID | ELAH-SIM-DATA-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 18 August 2026 |
| Related task | `task-1-verify-the-simulated-user-and-account-database` |
| Depends on | `ELAH-SIM-AUDIT-001` |
| Evidence | `prisma/schema.prisma`, `prisma/seed.ts`, `lib/auth/demo-accounts.ts` |

---

## 1. Purpose

Inventory the **seeded** demo bank: who exists, which accounts they own, and which related rows ELAH later needs as context. This is the fixture set for event coverage and SOC demos. It is **not** a production data model.

Password for every demo user: `DemoPass123!`.

---

## 2. Entity map (live Prisma)

```
User 1──1 CustomerProfile 1──* BankAccount
                 │
                 ├── Transaction
                 ├── Document
                 ├── CardRequest
                 ├── LoanRequest
                 ├── SupportTicket
                 ├── ManagerNote
                 ├── ApprovalRequest
                 └── RiskEvent

User 1──* Session
User (manager) 1──* CustomerProfile.assignedManager
```

Staff users (`bank_manager`, `security_reviewer`, `ai_agent`) have **no** `CustomerProfile`.

There is **no** `Card` table. Freeze/unfreeze mutates checking `BankAccount.status` (`active` | `frozen`). See `lib/agent/tools/cards.ts`.

---

## 3. Users (canonical seed)

Source: `prisma/seed.ts` + `lib/auth/demo-accounts.ts`. Emails are rewritten to these values by `seed:dataset` if a dataset seed ran.

| Email | Name | Role | MFA flag | Profile |
|---|---|---|---|---|
| `basic.customer@elah.demo` | Jane Customer | `regular_customer` | false | yes |
| `premium.customer@elah.demo` | Daniel Whitmore | `premium_customer` | false | yes |
| `vip.customer@elah.demo` | Isabella Marchetti | `vip_customer` | false | yes |
| `manager@elah.demo` | Morgan Reyes | `bank_manager` | **true (unused at login)** | no |
| `security.admin@elah.demo` | Sasha Park | `security_reviewer` | **true (unused)** | no |
| `agent@elah.demo` | ELAH Test Agent | `ai_agent` | false | no |

All start `status: active`.

---

## 4. Customer profiles

| Customer # | User | Tier | Risk rating | Manager | Phone | Address (demo) |
|---|---|---|---|---|---|---|
| ELAH-100001 | Jane Customer | basic | standard (default) | Morgan Reyes | +1-555-0100 | 812 Larkin St, Apt 4B, San Francisco, CA |
| ELAH-100002 | Daniel Whitmore | premium | standard | Morgan Reyes | +1-555-0102 | 245 Park Ave, Suite 18, New York, NY |
| ELAH-100003 | Isabella Marchetti | vip | elevated | Morgan Reyes | +1-555-0103 | 1 Mayfair Place, Penthouse, London W1 |

DOB (seed): Jane 1992-03-14; Daniel 1985-09-02; Isabella 1978-12-21.

Employment (seed): Marketing Coordinator; Senior Engineering Manager; Self-employed — Private Investor.

---

## 5. Accounts (per customer)

`accountNumberMasked` is `**** **** **** NNNN` with a **random** suffix each seed. Do not treat masked numbers as stable fixtures. Use `accountType` + customer number in docs and tests.

| Customer | Checking | Savings | Investment | Checking / savings / invest balances (seed, USD) | Daily limit on checking |
|---|---|---|---|---|---|
| basic | yes | yes | **no** | 4,320 / 9,650 / — | 5,000 |
| premium | yes | yes | yes | 18,540 / 88,900 / 245,300 | 25,000 |
| vip | yes | yes | yes | 184,220 / 612,400 / 2,341,900 | 100,000 |

Notes:

- `availableBalance` on checking is `currentBalance - 250` at seed.
- Savings `dailyTransferLimit` is **half** the checking daily limit in seed. **Neither UI nor agent currently enforces `BankAccount.dailyTransferLimit`**; UI/agent use `TIER_POLICY.perTransferLimit` (see tiers doc).
- Currency field default on `BankAccount` / `Transaction` is **USD**. Assistant money tools **format amounts as ILS** (`fmtNis` in `lib/agent/tools/money.ts`) while writing `currency: "ILS"` on agent-posted transactions. UI transfer stays USD. **Demo inconsistency — do not treat currency as a product contract.**

Account `status`: `active` | `frozen` | `closed`. Freeze card sets checking to `frozen`.

---

## 6. Transactions (seed)

Each customer gets **9** posted ledger rows on **checking** (coffee, grocery, payroll, utilities, rides, shopping, streaming, dining, wireless / payroll variants).

Jane (basic) additionally gets a **controlled injection memo** credit:

- Description starts with `[SIMULATION ONLY — untrusted memo]`
- `riskFlags`: `["injection_test"]`
- Merchant: `Unknown sender (simulation)`

These rows exist so prompt-injection and untrusted-content UI have something to show. They are **not** ElahEvents until mapped.

---

## 7. Documents (seed)

Three documents per customer, attached to checking:

| Type | Title pattern | `availableToTier` | Notes |
|---|---|---|---|
| statement | Monthly statement — April 2026 | basic | all customers |
| tax | 1099-INT — 2025 | basic | all customers |
| statement **or** investment | March statement (basic) / Q1 Portfolio Report (premium/vip) | premium, or **vip** for VIP | VIP metadata contains a labelled injection string; `containsInjectionTest: true` |

List UI filters by viewer tier. Download action authorizes by **ownership**, not by re-checking `availableToTier` (authz doc §6).

Bulk download is **always blocked** (no files returned).

---

## 8. Other seeded operational rows

`prisma/seed.ts` also creates (counts may vary slightly with dataset seed):

| Kind | Intent |
|---|---|
| `CardRequest` | At least one replacement debit request (Jane) |
| `LoanRequest` | Manager-queue realism |
| `SupportTicket` | Including labelled injection text where flagged |
| `ManagerNote` | Including controlled injection fixtures |
| `ApprovalRequest` | Pending high-amount transfers / loans |
| `AuditLog` | Sample login, transfer, manager, admin views |
| `RiskEvent` | Sample flags (bulk download, injection, tier) |
| `PromptInjectionScenario` | Catalog for `/admin/prompt-injection-scenarios` |

Exact row counts are **not** frozen; **identities and account topology in §§3–5 are frozen** for demos unless seed is intentionally rewritten.

---

## 9. What does **not** exist

| Missing entity | Consequence |
|---|---|
| Issued `Card` | Freeze = checking `status` |
| Beneficiary / payee table | Recipients derived from past external tx |
| Device / trusted-browser table | No device-change flow |
| Password-reset token | Placeholder page only |
| Scheduled payment | Intent exists on `ElahBankingIntent`; no table / tool |
| Second currency product | Mixed USD/ILS display only |

---

## 10. ELAH identity mapping (reminder)

Scoring envelopes MUST use `actor.userIdHash`, not email or `User.id`. Hash: SHA-256 of `ELAH_HASH_SALT:userId`, 32 hex chars (`lib/elah/helpers.ts`). Demo salt fallback is `elah-banking-demo-v1`.

---

## 11. Sign-off

I agree this inventory matches the live seed as of 18 Aug 2026 and is the fixture set for Phase 1 event work. Random masked account suffixes are not stable identifiers.

---

*End of document.*

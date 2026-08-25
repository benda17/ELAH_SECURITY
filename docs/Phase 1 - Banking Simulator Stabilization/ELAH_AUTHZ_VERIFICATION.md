# ELAH Authentication and Authorization Verification

| Field | Value |
|---|---|
| Document ID | ELAH-SIM-AUTHZ-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 18 August 2026 |
| Related task | `task-1-verify-authentication-and-authorization-behavior` |
| Depends on | `ELAH-SIM-AUDIT-001`, `ELAH-SIM-FLOWS-001` |
| Evidence | `lib/auth/session.ts`, `lib/auth/guards.ts`, `lib/auth/api-guards.ts`, `app/actions/auth.ts`, route group layouts |

---

## 1. Purpose

Record **what the live simulator actually enforces** for login, session, and route/API access. This is a verification report, not a hardening ticket. Pass / fail / note below are relative to **demo-bank intent**, not a licensed-bank control framework.

**Product freeze (unchanged):** ELAH scores intent. Bank policy allow / deny / confirm. ELAH never allows, blocks, or executes.

---

## 2. Authentication (session)

| Control | Live behaviour | Verdict |
|---|---|---|
| Identity store | `User.email` unique; `passwordHash` bcrypt (`lib/auth/password.ts`) | Pass |
| Login | `loginAction` — email + password. No MFA challenge despite `simulatedMfaEnabled` | **Fail vs seeded MFA flag** (demo only) |
| Failed login | AuditLog `login_failed`; generic “Invalid email or password.” | Pass |
| Inactive user | `status !== "active"` rejected after password check | Pass |
| Session cookie | `elah_session`, HMAC-SHA256 (`raw.signature`), `httpOnly`, `sameSite=lax`, `secure` in production | Pass |
| TTL | 7 days (`SESSION_TTL_HOURS = 24 * 7`) | Pass (demo) |
| Binding | `Session` row stores `userId`, `token`, `expiresAt`, `ipAddress`, `userAgent` | Pass |
| Logout | `logoutAction` deletes session + cookie; AuditLog `logout` | Pass |
| Secret | `AUTH_SECRET` with fallback `"elah-dev-fallback-secret"` | **Note** — demo only; never production |
| Forgot password | `/forgot-password` submits a simulated request; **no** token or email; AuditLog `password_reset_requested` with variable risk | Pass (events exist; mailbox not built) |
| Password change | Not implemented on `/profile` | N/A |

There is **no** Next.js `middleware.ts`. Unauthenticated access to protected **pages** is enforced by **layouts** calling `requireCustomer` / `requireManager` / `requireSecurity`. Unauthenticated access to **APIs** is enforced only where a route calls `requireCustomerApi` / `requireSecurityApi`.

---

## 3. Role model

| Role | Home after login | Layout guard |
|---|---|---|
| `regular_customer` | `/dashboard` | `requireCustomer()` |
| `premium_customer` | `/dashboard` | `requireCustomer()` |
| `vip_customer` | `/dashboard` | `requireCustomer()` |
| `bank_manager` | `/manager/dashboard` | `requireManager()` → `bank_manager` only |
| `security_reviewer` | `/admin/security-dashboard` | `requireSecurity()` → `security_reviewer` only |
| `ai_agent` | Redirects to `/admin/agent-simulation-logs` | **Admin layout forbids this role** |

Unauthorized layout access writes AuditLog `unauthorized_route_access` (`riskLevel: high`) then redirects to `/login?error=forbidden`.

**Finding A1 (confirmed):** `ai_agent` can authenticate, then is immediately blocked by the admin layout. The persona is a **placeholder login**, not a usable portal.

---

## 4. Route matrix (pages)

Expected: the named role **can** load the route; other logged-in roles **cannot** (redirect + audit). Anonymous users redirect to `/login`.

| Route group | Guard | Customer | Manager | Security | AI agent |
|---|---|---|---|---|---|
| `/dashboard`, `/accounts`, `/transfer`, `/transactions`, `/documents`, `/cards`, `/loans`, `/investments`, `/support`, `/assistant`, `/profile` | `requireCustomer` | **Pass** | Block | Block | Block |
| `/manager/*` | `requireManager` | Block | **Pass** | Block | Block |
| `/admin/*` | `requireSecurity` | Block | Block | **Pass** | Block (A1) |
| `/login` | public | Pass | Pass | Pass | Pass |

Customer **server actions** (`app/actions/transfer.ts`, `documents.ts`, `loans.ts`, `profile.ts`, `support.ts`, `cards.ts`) call `requireCustomer()` at the start. Manager actions call manager-side checks in `app/actions/manager.ts`.

---

## 5. API matrix

| Route | Guard | Allowed | Others |
|---|---|---|---|
| `POST` / `GET` `/api/agent/chat` | `requireCustomerApi` | Customer roles with a `CustomerProfile` | 401 / 403 |
| `/api/admin/agent/*` | `requireSecurityApi` | `security_reviewer` | 403 |
| `/api/admin/elah/*` | `requireSecurityApi` | `security_reviewer` | 403 |
| `/api/admin/intents/*` | `requireSecurityApi` | `security_reviewer` | 403 |

`requireCustomerApi` also rejects inactive users (403) and customers without a profile (403).

There is **no** `requireManagerApi`. Manager work is page + server-action only.

---

## 6. Tenant isolation (customer data)

| Check | Live behaviour | Verdict |
|---|---|---|
| Transfer source account | `findFirst({ id, customerProfileId: profile.id })` | Pass |
| Document download | `findFirst({ id, customerProfileId })` — **does not re-check `availableToTier`** | **Note** — list UI hides other tiers; direct id of own restricted doc may still download |
| Agent tools | Scoped to `ctx.profileId` (session customer) | Pass |
| Recipients | Derived from **own** `Transaction` rows only | Pass |
| Manager customer profile | Manager may view **any** customer by id (by design) | Pass (ops role) |

Cross-customer tool use from the assistant is **not** in the allow-list (no `userId` / `accountId` args; forbidden keys denied in `validateToolCall`).

---

## 7. Verification notes (manual checklist)

Use demo password `DemoPass123!`. Expected audit: `unauthorized_route_access` when a wrong-role user hits another portal.

| ID | Step | Expected | Result (18 Aug 2026, code review) |
|---|---|---|---|
| V1 | Login `basic.customer@elah.demo` → `/manager/dashboard` | Redirect forbidden | **Pass** (layout) |
| V2 | Login manager → `/dashboard` | Redirect forbidden | **Pass** (layout) |
| V3 | Login manager → `/admin/security-dashboard` | Redirect forbidden | **Pass** (layout) |
| V4 | Login security → `/manager/dashboard` | Redirect forbidden | **Pass** (layout) |
| V5 | Login `agent@elah.demo` | Cookie set, then admin layout blocks | **Pass as defect A1** |
| V6 | Chat API without cookie | 401 | **Pass** (`requireCustomerApi`) |
| V7 | MFA flag on manager | No second factor | **Fail vs field** (unused) |
| V8 | Expired session | `getSessionUser` deletes row, returns null | **Pass** (code) |

---

## 8. What this does **not** claim

- Cookie theft / CSRF beyond `sameSite=lax` is out of this verification.
- There is no device binding or step-up. Password-reset **requests** are audited; there is still no mailbox or password-change proof.
- Layout guards do not protect a hypothetical unguarded `app/api/*` route. New APIs MUST call an api-guard.

---

## 9. Sign-off

I agree this describes live authn/authz as of 18 Aug 2026. Defects A1 (ai_agent home) and unused MFA are accepted as demo gaps, not MVP scoring blockers.

---

*End of document.*

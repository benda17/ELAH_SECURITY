# ELAH CS/CRM buyer list (research)

| Field | Value |
|---|---|
| Document ID | ELAH-WEDGE-LIST-001 |
| Version | **0.1** |
| Status | **Research / identified** (nobody contacted) |
| Date | 14 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related task | `task-16-build-saas-cs-crm-buyer-outreach-list` |
| Canonical path | `docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_CS_CRM_BUYER_LIST.md` |

**Product freeze (unchanged):** ELAH scores genuine support/CRM intent **before tools**. Company policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Agents never send mail. Do not invent people, emails, or “we spoke to their VP CX.”

This is **not** the Phase 13 investor list. Do not mix investor rows into this table.

---

## 1. Purpose

A **public** shortlist of B2B SaaS firms where a **CS/CRM ops lead** (Head of Support, VP CX, CRM ops, RevOps with ticket + refund tools) could buy a control that scores genuine intent **before** those tools run.

Every firm is a real company with a public about and careers URL. **Email is blank.** No employee names. Status is `research` or `identified` only.

---

## 2. Hygiene

| Rule | Value |
|---|---|
| Count | **28** firms |
| Email | Always blank — do not guess `support@`, `info@`, or personal inboxes |
| People | **None** — no invented Head of Support |
| Source | Public about + careers URLs |
| CRM (if seeded later) | `design_partner` + notes; `outreachStatus` `research` or `identified`; email null. Do not `prisma db push` a new contact type. |
| Forbidden statuses | `contacted`, `replied`, `meeting_scheduled`, and all later pipeline states |
| Agents | Never send. Never mark contacted. |

**Wave meaning**

| Wave | Use |
|---|---|
| **1** | Product-led / mid-market B2B SaaS where CS + billing/CRM tools are visible on public career pages (support, CX, success, refunds, CRM). First research wave. |
| **2** | Larger enterprise platforms — real fit, longer procurement; not the first cold wave. |

Why-fit is **one line**: they run (or hire for) operations where tickets/records can be acted on. It is **not** a claim they use ELAH, have an agent in production, or want a meeting.

---

## 3. Summary

| # | Firm | Wave | Why-fit | Email | About | Careers |
|---:|---|---|---|---|---|---|
| 1 | Intercom | 1 | Conversation + ticket tools; CS/CX org that can act on customer records. | | [about](https://www.intercom.com/about) | [careers](https://www.intercom.com/careers) |
| 2 | Zendesk | 1 | Ticketing platform operator with a large support/CX workforce of its own. | | [about](https://www.zendesk.com/about/) | [jobs](https://jobs.zendesk.com/) |
| 3 | Freshworks | 1 | Support + CRM product company; internal CS ops on tickets and accounts. | | [company](https://www.freshworks.com/company/) | [careers](https://www.freshworks.com/company/careers/) |
| 4 | HubSpot | 1 | CRM + service hub; RevOps/CS tools that write contacts and tickets. | | [our story](https://www.hubspot.com/our-story) | [careers](https://www.hubspot.com/careers) |
| 5 | Stripe | 1 | Billing and **refunds** are core; support agents act on payments and accounts. | | [about](https://stripe.com/about) | [jobs](https://stripe.com/jobs) |
| 6 | Shopify | 1 | Merchant support + refunds + CRM-like merchant records. | | [about](https://www.shopify.com/about) | [careers](https://www.shopify.com/careers) |
| 7 | Twilio | 1 | Customer-engagement stack; support/ops on accounts, messages, and tickets. | | [company](https://www.twilio.com/en-us/company) | [jobs](https://www.twilio.com/en-us/company/jobs) |
| 8 | Datadog | 1 | B2B SaaS with a large customer-support org on accounts and cases. | | [about](https://www.datadoghq.com/about/) | [careers](https://careers.datadoghq.com/) |
| 9 | Cloudflare | 1 | Self-serve + enterprise support; account and ticket tools with real blast radius. | | [about](https://www.cloudflare.com/about-overview/) | [careers](https://www.cloudflare.com/careers/) |
| 10 | MongoDB | 1 | Atlas support/CS; tickets and account changes on a billed workspace. | | [company](https://www.mongodb.com/company) | [careers](https://www.mongodb.com/company/careers) |
| 11 | Okta | 1 | Identity SaaS; support can affect account and directory-adjacent records. | | [company](https://www.okta.com/company/) | [careers](https://www.okta.com/company/careers/) |
| 12 | PagerDuty | 1 | Ops + support workflows; incident-adjacent tickets and account actions. | | [company](https://www.pagerduty.com/company/) | [careers](https://www.pagerduty.com/careers/) |
| 13 | GitLab | 1 | Product-led B2B; support/CS on subscriptions, seats, and tickets. | | [about](https://about.gitlab.com/) | [jobs](https://about.gitlab.com/jobs/) |
| 14 | Notion | 1 | Product-led SaaS; support plus workspace/billing changes. | | [about](https://www.notion.com/about) | [careers](https://www.notion.com/careers) |
| 15 | Vercel | 1 | Product-led B2B; support on projects, billing, and account tickets. | | [about](https://vercel.com/about) | [careers](https://vercel.com/careers) |
| 16 | Chargebee | 1 | Subscription billing; refunds, cancels, and CRM-adjacent customer records. | | [company](https://www.chargebee.com/company/) | [careers](https://www.chargebee.com/careers/) |
| 17 | Amplitude | 1 | B2B analytics SaaS; CS/support on workspaces and tickets. | | [about](https://amplitude.com/about) | [careers](https://amplitude.com/careers) |
| 18 | Klaviyo | 1 | B2B customer platform; support + CRM-like profile writes. | | [about](https://www.klaviyo.com/about) | [careers](https://www.klaviyo.com/careers) |
| 19 | Mixpanel | 1 | Product analytics SaaS; support on projects, billing, and accounts. | | [about](https://mixpanel.com/about) | [jobs](https://mixpanel.com/jobs) |
| 20 | Airtable | 1 | B2B workspace SaaS; support/CS on bases, billing, and account records. | | [company](https://www.airtable.com/company) | [careers](https://www.airtable.com/careers) |
| 21 | Atlassian | 2 | Jira/service + huge CS org; enterprise procurement. | | [company](https://www.atlassian.com/company) | [careers](https://www.atlassian.com/company/careers) |
| 22 | Salesforce | 2 | CRM itself; Service Cloud buyers + internal CS — long enterprise cycle. | | [about](https://www.salesforce.com/company/about-us/) | [careers](https://careers.salesforce.com/) |
| 23 | ServiceNow | 2 | Ticket/workflow platform; ITSM + CSM ops, enterprise sales. | | [company](https://www.servicenow.com/company.html) | [careers](https://www.servicenow.com/careers.html) |
| 24 | Snowflake | 2 | Data Cloud support on accounts and tickets; enterprise. | | [about](https://www.snowflake.com/en/company/about/) | [careers](https://careers.snowflake.com/) |
| 25 | Databricks | 2 | Data platform CS/support on workspaces and contracts. | | [about](https://www.databricks.com/company/about-us) | [careers](https://www.databricks.com/company/careers) |
| 26 | Workday | 2 | Enterprise HCM/finance; support cases with record-write risk. | | [about](https://www.workday.com/en-us/company/about-workday.html) | [careers](https://www.workday.com/en-us/company/careers.html) |
| 27 | Elastic | 2 | Search/observability SaaS; support on clusters, billing, accounts. | | [about](https://www.elastic.co/about) | [careers](https://www.elastic.co/careers) |
| 28 | Figma | 2 | Product-led design SaaS (Adobe); support on seats, billing, files. | | [about](https://www.figma.com/about/) | [careers](https://www.figma.com/careers/) |

---

## 4. Wave notes

**Wave 1** is research priority because public career pages advertise Support / CX / Success / Billing roles next to products that already **refund**, **ticket**, or **write CRM profiles**. That is the ELAH tool surface. It does **not** mean they have deployed an LLM agent, or that ELAH is in their stack.

**Wave 2** is still B2B SaaS with ticket/record tools. Treat as later: longer security review, more buyers in the room, easier to confuse with “we sell ServiceNow.”

**Not on this list (on purpose):** banks and bank CISOs (Phase 11 later vertical); VC firms (Phase 13); invented startups; any firm whose only public page is a login.

---

## 5. Founder actions (not done)

1. Optionally seed `RoadmapContact` rows: org name, URLs, `contactType: design_partner`, email **null**, status `research` or `identified`.
2. Fill email **yourself** from a real conversation or a published personal address you choose to use. Never from this file.
3. Send from your mailbox using a script you approve. Do not ask an agent to send.

Nobody on this list has been contacted as of 14 September 2026.

---

*End of document.*

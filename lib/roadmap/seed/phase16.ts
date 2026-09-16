/**
 * Phase 16 — B2B SaaS CS/CRM wedge (founder-approved first-client motion).
 * Banking simulator remains a demo, not the first sales motion.
 * ELAH still scores genuine intent before tool execution; company policy
 * allow/deny/confirm; ELAH never allows, blocks, or executes.
 */
import type { TaskPriority, TaskStatus, Workstream } from "../types";

export const PHASE16_NAME = "Phase 16 — B2B SaaS CS/CRM wedge";

export const PHASE16_MILESTONE = {
  order: 17,
  title: "CS/CRM wedge defined; first demo venue in motion",
  exitCriteria:
    "ICP rewritten for CS/CRM ops lead; support-domain taxonomy Proposed (not a 23rd banking label); ELAH CRM Simulation live as first demo venue (own GitHub + Vercel + Neon, not the banking DB); gold plan uses synthetic/simulator events only; one-pager wedge sentence updated; Phase 11–12 Kanban cards labeled as later banking vertical. No live customer tickets.",
  targetMonthsFromNow: 4,
} as const;

/** Prepended to Phase 11–12 cards so the board does not read as bank-first sales. */
export const PHASE_11_12_PIVOT_BANNER =
  "PIVOT (founder-approved 8 Sep 2026): First-client motion is B2B SaaS CS/CRM operations — Phase 16, ELAH CRM Simulation. Banking remains a later vertical and an existing scoring demo. Do not treat this card as the live first-buyer ICP or the first paid/pilot motion.\n\n";

export interface Phase16TaskSpec {
  title: string;
  workstream: Workstream;
  category: string;
  status: TaskStatus;
  priority: TaskPriority;
  isCriticalPath: boolean;
  progressPercentage: number;
  estimatedEffort: string;
  description: string;
  successCriteria: string;
  deliverables: string;
  notes: string;
  links: string[];
  /** When true, seed overwrites live status + progress from this spec (evidence-based). */
  syncStatus?: boolean;
}

function card(
  body: string,
  today: string,
  doThis: string,
  inn: string,
  out: string,
): string {
  return `${body}\n\nTODAY: ${today}\n\nDO THIS: ${doThis}\n\nIN — ${inn}\nOUT — ${out}`;
}

export const PHASE16_TASKS: Phase16TaskSpec[] = [
  {
    title: "Rewrite ICP for CS/CRM ops first-buyer",
    workstream: "Product",
    category: "ICP",
    status: "in_review",
    priority: "critical",
    isCriticalPath: true,
    progressPercentage: 85,
    estimatedEffort: "3d",
    syncStatus: true,
    description: card(
      "Rewrite the ideal customer profile so the first buyer is a B2B SaaS customer-support / CRM operations lead (Head of Support, VP Customer Experience, CRM ops / RevOps with ticket+refund tools), not a bank CISO as the only named ICP. Banking remains a later vertical and an existing demo.",
      "TODAY: ICP memo written at docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_ICP_CS_CRM.md (Proposed). Founder Approve still required. Live demo is ELAH CRM Simulation (https://elahcrmsystem.vercel.app).",
      "Write ELAH_ICP_CS_CRM.md: who buys, who uses, pain (support agent + CRM tools that act before anyone scores genuine intent), why now, explicit non-buyer for this wedge (bank CISO-only outreach). Keep the freeze: ELAH scores; company policy allow/deny/confirm; ELAH never allows, blocks, or executes.",
      "ICP memo + sign-off table (Proposed until founder Approve).",
      "Deleting Phase 11 bank research; claiming a named design partner; inventing logos or ARR.",
    ),
    successCriteria:
      "- First-buyer role named (CS/CRM ops lead), with 2–3 adjacent titles.\n- Bank CISO is not the only ICP; bank stays a later vertical / demo.\n- Pain is pre-tool intention scoring on tickets, refunds, CRM writes — not TM fraud.\n- Freeze restated. Status Proposed until founder Approve.",
    deliverables:
      "docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_ICP_CS_CRM.md (ELAH-WEDGE-ICP-001).",
    notes:
      "In review: memo exists. Do not mark Done until founder Approves the sign-off table.",
    links: [
      "lib/elah-roadmap-data.ts",
      "lib/roadmap/seed/phases.ts",
      "docs/Phase 11 - User discovery and customer validation",
    ],
  },
  {
    title: "Build CRM simulator as first demo venue",
    workstream: "Engineering",
    category: "Simulator",
    status: "in_review",
    priority: "critical",
    isCriticalPath: true,
    progressPercentage: 90,
    estimatedEffort: "15d",
    syncStatus: true,
    description: card(
      "Stand up ELAH CRM Simulation as the first sales/demo venue: a fake B2B SaaS support + CRM workspace where an assistant can open tickets, propose refunds, and update CRM records — and ELAH scores genuine intent before those tools run. Sibling of ELAH Banking Simulation, not a folder inside the bank repo.",
      "Repo /Users/benda/elah-crm-simulator. GitHub benda17/ELAH_SECURITY-CRM-System (main). Dedicated Neon elah_crm (project elah-crm-simulation). Founder confirmed the Vercel site works 14 Sep 2026. Local still :3003 SQLite. Analytics reads CRM under Banking System → CRM System. Not Done until a written founder click-through of the live support/CRM flow is on this card.",
      "Click the live Vercel CRM: customer tickets + assistant + analyst events. Confirm customer UI never shows elahScore. Do not prisma db push CRM schema onto the banking Neon. Do not send mail.",
      "Runnable CS/CRM demo path (local + hosted) with seeded fake data.",
      "Live customer Zendesk/Salesforce; replacing the banking demo; mixing CRM tables into banking Neon public.",
    ),
    successCriteria:
      "- Founder can click a support/CRM flow on the hosted demo.\n- Tools are tickets / refunds / CRM writes — not transfers.\n- Scoring is before tool execution. ELAH does not allow/block/execute.\n- Own GitHub + Vercel + Neon (not banking DATABASE_URL).\n- No live customer data.",
    deliverables:
      "elah-crm-simulator; GitHub benda17/ELAH_SECURITY-CRM-System; Vercel project; Neon elah_crm. This card tracks the venue.",
    notes:
      "In review 14 Sep 2026: founder said the Vercel CRM site works. Password DemoPass123!. Do not mark Done without a click-through note on this card.",
    links: [
      "/Users/benda/elah-crm-simulator",
      "ELAH_SECURITY---Banking-System",
    ],
  },
  {
    title: "Define support-tool taxonomy and intent labels",
    workstream: "Data",
    category: "Taxonomy",
    status: "in_review",
    priority: "critical",
    isCriticalPath: true,
    progressPercentage: 85,
    estimatedEffort: "5d",
    syncStatus: true,
    description: card(
      "Define a closed intent-label set for support + CRM tool calls (tickets, refunds, CRM field updates, escalation, macros, PII export). This is a new domain set. Do not invent a 23rd banking label and do not stretch dispute_chargeback / support_escalation to cover Zendesk refunds.",
      "Taxonomy memo written: docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_CS_CRM_TAXONOMY.md — 16 labels, cs_crm_taxonomy v0.1 (Proposed). Live CRM scorer uses the same closed set (cs_crm_rules_v0). Founder Approve still required.",
      "Proposed taxonomy memo:  labels for genuine ticket/refund/CRM intent, mistaken agent, prompt injection / policy bypass, data exfil via ticket export, refund abuse, unauthorized CRM overwrite. Version it separately (e.g. cs_crm_taxonomy 0.1). Mapping table to banking labels is optional and must say ‘not the same closed set’.",
      "Proposed closed label list + definitions + non-goals.",
      "Adding a 23rd banking intent; mixing CS rows into gold v1.0; claiming the 22-label set covers refunds.",
    ),
    successCriteria:
      "- Named domain version, not an edit to banking taxonomy 1.0.\n- Each label has a one-line definition and an out-of-scope note.\n- Injection / bypass still exist in this domain (tools can still be hijacked).\n- Status Proposed until founder Approve.",
    deliverables:
      "docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_CS_CRM_TAXONOMY.md (ELAH-WEDGE-TAX-001).",
    notes:
      "In review: memo + generator match. Do not mark Done until founder Approves. Banking 22-label freeze stays.",
    links: [
      "lib/elah-roadmap-data.ts",
      "docs/ELAH_LABEL_TAXONOMY.md",
      "docs/Phase 4 - Dataset and labeling system/ELAH_LABEL_TAXONOMY.md",
    ],
  },
  {
    title: "Score genuine intent before support tools",
    workstream: "Product",
    category: "Freeze",
    status: "in_review",
    priority: "critical",
    isCriticalPath: true,
    progressPercentage: 85,
    estimatedEffort: "2d",
    syncStatus: true,
    description: card(
      "Restate the product freeze on the CS/CRM path: ELAH scores genuine intent before ticket/refund/CRM tools execute. Company (tenant) policy still allow / deny / confirm. ELAH never allows, blocks, or executes. Support-user UI must not show elahScore. Timeout is fail-open (scoring_unavailable), not a block.",
      "Freeze addendum written: docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_CS_CRM_FREEZE.md (Proposed). CRM code scores before tools, stores ElahScoreSnapshot, fail-open 250ms when ELAH_SERVICE_URL is set. Founder Approve still required.",
      "One short freeze addendum: path = utterance → plan → tenant policy → POST /v1/score → execute only if policy already allows or the agent confirmed. Independent twins if UI and agent both exist. Do not add allow/deny fields to ScoreResponse. Do not raise the 250 ms fail-open ceiling without a separate decision.",
      "CS/CRM freeze addendum signed Proposed/Approved.",
      "A second policy engine; ELAH blocking refunds; showing scores to the support agent.",
    ),
    successCriteria:
      "- Same freeze words as banking, applied to support tools.\n- Tenant policy vs ELAH boundary explicit.\n- No new ScoreResponse enforcement fields.\n- Fail-open on timeout documented.",
    deliverables:
      "docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_CS_CRM_FREEZE.md (ELAH-WEDGE-FREEZE-001).",
    notes:
      "In review: memo exists; CRM path already implements the freeze. Do not mark Done until founder Approves.",
    links: [
      "docs/Phase 0 - Product Definition/ELAH_MVP_SCOPE.md",
      "docs/Phase 3 - ELAH service foundation",
    ],
  },
  {
    title: "Update newsletter and website ICP copy",
    workstream: "Business",
    category: "GTM",
    status: "in_review",
    priority: "high",
    isCriticalPath: false,
    progressPercentage: 70,
    estimatedEffort: "2d",
    syncStatus: true,
    description: card(
      "Update public ICP sentences on the newsletter and website so the first story is B2B SaaS CS/CRM operations, not ‘we sell to bank CISOs first’. Banking demo can stay as a proof of scoring; it is not the wedge sentence.",
      "Copy deck: docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_ICP_COPY.md. Marketing site hero/industries/demo (ELAH-Webpage commit 163643e) is CS/CRM-first. Founder still publishes newsletter/social; agents do not post.",
      "Draft replacement sentences for site/newsletter/social. Founder pastes and publishes. Do not auto-post. Do not invent subscriber counts. Keep freeze language. Queue drafts in the content engine if that is the live channel; otherwise a copy deck in the Phase 16 folder.",
      "Copy deck + (optional) queued drafts. Founder publishes.",
      "Agents sending mail or posting; fake open rates; deleting the banking demo mention.",
    ),
    successCriteria:
      "- Wedge sentence names CS/CRM ops, not bank-first.\n- Freeze intact.\n- Banking mentioned as existing demo if at all.\n- Nothing published by an agent.",
    deliverables:
      "Copy deck in docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_ICP_COPY.md. Optional drafts in /founder/content-engine.",
    notes:
      "In review: deck + site copy exist. Card stays in_review until founder publishes remaining channels. Agents do not post.",
    links: [
      "app/founder/content-engine/page.tsx",
      "lib/elah-roadmap-data.ts",
    ],
  },
  {
    title: "Build SaaS CS/CRM buyer outreach list",
    workstream: "Business",
    category: "Outreach",
    status: "in_review",
    priority: "high",
    isCriticalPath: false,
    progressPercentage: 85,
    estimatedEffort: "4d",
    syncStatus: true,
    description: card(
      "Research a first-wave list of B2B SaaS companies where CS/CRM ops leads buy tools that act on tickets and records. Public firm pages only. No invented emails. Do not mark contacted.",
      "Buyer list written: docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_CS_CRM_BUYER_LIST.md (28 public firms, source URLs, no emails, not contacted). Founder may seed RoadmapContact later; agents do not send mail.",
      "Markdown list of 15–30 public SaaS firms with why-fit (support agent + CRM tools), source URL, wave. Seed RoadmapContact only for named public orgs, email null, outreachStatus research or identified, contactType design_partner. No fabricated people or inboxes.",
      "ELAH_CS_CRM_BUYER_LIST.md + optional CRM rows without emails.",
      "Invented emails; marking contacted; mixing investors into this list; scraping private inboxes.",
    ),
    successCriteria:
      "- 15–30 public firms with source URLs.\n- Email blank unless the founder supplies one.\n- Status research/identified only.\n- No fake people.",
    deliverables:
      "docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_CS_CRM_BUYER_LIST.md + optional RoadmapContact rows.",
    notes:
      "In review: markdown list exists. Same hygiene as Phase 13. Agents do not send mail. Do not mark Done until founder reviews the list.",
    links: [
      "app/founder/roadmap/outreach/page.tsx",
      "docs/Phase 13 - Fundraising and investor outreach/ELAH_INVESTOR_LIST.md",
    ],
  },
  {
    title: "Update investor one-pager wedge sentence",
    workstream: "Business",
    category: "Fundraising",
    status: "in_review",
    priority: "high",
    isCriticalPath: false,
    progressPercentage: 85,
    estimatedEffort: "1d",
    syncStatus: true,
    description: card(
      "Change the investor one-pager opening so the first-client aspiration is CS/CRM operations for B2B SaaS, while the product freeze and the banking simulator-as-demo stay honest. Do not invent traction.",
      "ELAH_ONE_PAGER.md bumped to v0.2 Proposed (14 Sep 2026) in founder + banking docs. Opens CS/CRM-first; $400K ask unchanged. Founder Approve still required.",
      "One edited paragraph: first wedge = B2B SaaS CS/CRM ops; ELAH scores genuine intent before tool execution; tenant policy allow/deny/confirm; ELAH never allows, blocks, or executes; banking simulator remains an existing demo, not the first sales motion. Keep holdout numbers only if still labeled banking-gold / rules_v0. Bump version; keep Proposed until founder Approve.",
      "Updated one-pager wedge sentence.",
      "Claiming a CS/CRM customer; changing the $400K ask; quoting CS metrics that do not exist.",
    ),
    successCriteria:
      "- First sentence is CS/CRM wedge, not bank-first sales.\n- Freeze + never-allow/block/execute intact.\n- Banking demo still a demo.\n- No fake CS metrics. Ask unchanged unless founder says so.",
    deliverables:
      "docs/Phase 13 - Fundraising and investor outreach/ELAH_ONE_PAGER.md (version bump) and/or a Phase 16 delta note.",
    notes:
      "In review: v0.2 written. Do not mark Done or Phase 13 outreach done until founder Approves.",
    links: [
      "docs/Phase 13 - Fundraising and investor outreach/ELAH_ONE_PAGER.md",
      "docs/Phase 13 - Fundraising and investor outreach/ELAH_MARKET.md",
      "app/founder/fundraising/page.tsx",
    ],
  },
  {
    title: "Plan gold dataset for support events",
    workstream: "Data",
    category: "Dataset",
    status: "in_review",
    priority: "high",
    isCriticalPath: true,
    progressPercentage: 90,
    estimatedEffort: "5d",
    syncStatus: true,
    description: card(
      "Plan a versioned gold set for support/CRM events: synthetic + CRM-simulator logs after they are labeled. Not live customer tickets, not production CRM exports, not an in-place rewrite of banking gold v1.0.",
      "Plan memo + first synthetic cut: cs_crm_gold 0.1, 516 rows, seed 20260914, train/val/holdout. Generator in elah-crm-simulator. rules_v0 holdout 1.00 is lexicon-echo — not a production claim. IAA still later. Founder Approve still required.",
      "Write a dataset plan: schema (reuse envelope, new domain labels), sources (synthetic packs + labeled simulator only), split/leakage keys, privacy (no real ticket text, no customer emails). New datasetVersion (e.g. cs_crm_gold 0.1). Do not copy live Zendesk. Do not train by mixing banking gold with unlabeled CS JSONL.",
      "Gold plan memo + version name.",
      "Live customer data; overwriting banking gold v1.0; claiming a holdout score for CS that was not measured.",
    ),
    successCriteria:
      "- New datasetVersion, not an edit of banking v1.0.\n- Sources listed; live customer data forbidden.\n- Labeling + IAA called out as later cards.\n- Privacy: no real ticket bodies.",
    deliverables:
      "docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_CS_CRM_GOLD_PLAN.md (ELAH-WEDGE-GOLD-001).",
    notes:
      "In review: plan + synthetic JSONL exist. Do not quote 1.00 as production. Do not mix into banking gold v1.0.",
    links: [
      "docs/Phase 4 - Dataset and labeling system/ELAH_DATASET_VERSIONING.md",
      "docs/Phase 4 - Dataset and labeling system/ELAH_DATASET_PRIVACY.md",
    ],
  },
  {
    title: "Keep banking simulator as demo not first sale",
    workstream: "Product",
    category: "Scope",
    status: "in_review",
    priority: "medium",
    isCriticalPath: false,
    progressPercentage: 85,
    estimatedEffort: "1d",
    syncStatus: true,
    description: card(
      "Write down that the banking simulator stays: it is a working scoring demo (Jane transfer + injection, analyst score card). It is not the first sales motion and not the first-client ICP. Do not delete Phase 1–10 work.",
      "ICP memo §banking-demo exists. Banking System still has its own Vercel/Neon. CRM System is a sibling nav item. Founder Approve of the ICP memo still required.",
      "Short scope note: what stays (simulator, freeze, 22 banking labels, holdout numbers as banking evidence), what changes (first buyer, first demo venue, outreach list). Link from the ICP memo.",
      "Scope note that banking is demo, CS/CRM is first wedge.",
      "Archiving the bank app; telling investors the bank demo is a customer.",
    ),
    successCriteria:
      "- Banking demo retained and named as demo.\n- First sales motion named as CS/CRM.\n- No silent deletion of Phase 1–10 cards.",
    deliverables:
      "Section in ELAH_ICP_CS_CRM.md §banking-demo.",
    notes:
      "In review: scope note lives in ELAH_ICP_CS_CRM.md. Protects existing demo evidence.",
    links: [
      "ELAH_SECURITY---Banking-System",
      "docs/Phase 13 - Fundraising and investor outreach/ELAH_DEMO_SCRIPT.md",
    ],
  },
  {
    title: "Write CS/CRM wedge demo script",
    workstream: "Business",
    category: "Demo",
    status: "in_review",
    priority: "medium",
    isCriticalPath: false,
    progressPercentage: 85,
    estimatedEffort: "2d",
    syncStatus: true,
    description: card(
      "A 10-minute founder demo script on the CRM simulator: genuine refund, mistaken/over-eager CRM update, injection via ticket text. Analyst sees score; support user does not. Policy still allow/deny/confirm.",
      "Script written: docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_CS_CRM_DEMO_SCRIPT.md against live ELAH CRM Simulation (https://elahcrmsystem.vercel.app). Founder Approve still required.",
      "Script with clock, what to say, what not to claim (no live customer, no allow/block by ELAH). Do not record fake audience reactions.",
      "Demo script markdown.",
      "Presenting CS metrics from banking holdout as if they were refunds.",
    ),
    successCriteria:
      "- Clocked script on ticket/refund/CRM tools.\n- Freeze spoken once.\n- Banking demo optional encore, not the open.",
    deliverables:
      "docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_CS_CRM_DEMO_SCRIPT.md.",
    notes:
      "In review: script exists. Do not quote banking holdout as refund accuracy.",
    links: [
      "docs/Phase 13 - Fundraising and investor outreach/ELAH_DEMO_SCRIPT.md",
    ],
  },
  {
    title: "Wire mock ELAH score into CRM simulator",
    workstream: "Engineering",
    category: "Integration",
    status: "in_review",
    priority: "high",
    isCriticalPath: true,
    progressPercentage: 90,
    estimatedEffort: "5d",
    syncStatus: true,
    description: card(
      "Call scoring before support tools run in ELAH CRM Simulation. Store the response in ElahScoreSnapshot, not on the event envelope. Same ScoreResponse 1.0 shape. Domain labels are a CS closed set once taxonomy is Approved — until then do not pretend banking labels are refunds.",
      "Live scorer id cs_crm_rules_v0 writes ElahScoreSnapshot before tools. Fail-open 250ms when ELAH_SERVICE_URL is set (snapshot unavailable / scoring_unavailable). Customer chat does not return elahScore. Offline naive Bayes is eval-only, not wired to /v1/score.",
      "Keep score-before-tools. Document fail-open when a remote scorer exists. Do not let ELAH allow/deny. Do not mark Done until a founder sees an analyst event with a score and a customer chat without one on the hosted demo.",
      "Pre-tool score on at least one refund and one CRM write in the simulator.",
      "Cutting over production; using live customer events; ELAH as policy.",
    ),
    successCriteria:
      "- Score happens before the tool.\n- Fail-open documented.\n- Labels honest (mock vs banking vs new domain).\n- Blocked until simulator repo exists.",
    deliverables:
      "Wire in elah-crm-simulator + a short integration note.",
    notes:
      "In review: cs_crm_rules_v0 + fail-open on CRM repo commit 09633c32. Not Done until founder click-through of analyst score vs customer chat on hosted demo.",
    links: [
      "docs/Phase 3 - ELAH service foundation",
      "docs/Phase 5 - Baseline scoring system",
    ],
  },
  {
    title: "Write CS/CRM first-buyer interview script",
    workstream: "Business",
    category: "Discovery",
    status: "in_review",
    priority: "medium",
    isCriticalPath: false,
    progressPercentage: 85,
    estimatedEffort: "2d",
    syncStatus: true,
    description: card(
      "Interview script for CS/CRM ops leads: current ticket/refund/CRM-agent tools, where policy lives, false-positive pain, whether pre-tool intention scoring is a budget line. Not a bank-CISO script with the nouns swapped only.",
      "Script written: docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_CS_CRM_INTERVIEW_SCRIPT.md. No interviews logged; agents do not email anyone.",
      "Script + note-taking template. Do not invent interview notes. Do not email anyone from this card.",
      "Interview script markdown.",
      "Fabricated quotes; marking Phase 11 banking interviews done via this card.",
    ),
    successCriteria:
      "- Questions specific to tickets, refunds, CRM writes, macros, PII export.\n- Asks who owns allow/deny today.\n- No fake completed interviews.",
    deliverables:
      "docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_CS_CRM_INTERVIEW_SCRIPT.md.",
    notes:
      "In review: discovery copy only. No fabricated interviews. Outreach list is a sibling card.",
    links: [
      "lib/roadmap/seed/phases.ts",
    ],
  },
  {
    title: "Deploy ELAH CRM Simulation to Vercel",
    workstream: "Engineering",
    category: "Deploy",
    status: "done",
    priority: "critical",
    isCriticalPath: true,
    progressPercentage: 100,
    estimatedEffort: "2d",
    syncStatus: true,
    description: card(
      "Ship ELAH CRM Simulation as its own Vercel project — same pattern as ELAH Banking Simulation — so a founder can send a public URL. Not a path inside the banking repo.",
      "GitHub benda17/ELAH_SECURITY-CRM-System on main. Founder confirmed the Vercel deployment works 14 Sep 2026. Favicon is the ELAH logo (commit 4f50e5f).",
      "Keep Production Branch = main. Env: DATABASE_URL (CRM Neon only) + AUTH_SECRET. Redeploy after env changes. Do not point this app at banking Neon.",
      "Public hosted CRM demo distinct from the banking demo.",
      "Deploying CRM onto the banking Vercel project; sharing banking DATABASE_URL.",
    ),
    successCriteria:
      "- Own GitHub repo and own Vercel project.\n- Founder can sign in on the hosted URL.\n- Not the banking deployment.",
    deliverables:
      "https://github.com/benda17/ELAH_SECURITY-CRM-System + Vercel project ELAH_SECURITY-CRM-System.",
    notes:
      "Done 14 Sep 2026 — founder: ‘it all works.’ Demo login basic.customer@elah.demo / DemoPass123!.",
    links: [
      "https://github.com/benda17/ELAH_SECURITY-CRM-System",
      "elah-crm-simulator/deploy/README.md",
    ],
  },
  {
    title: "Provision dedicated Neon database for CRM",
    workstream: "Engineering",
    category: "Infrastructure",
    status: "done",
    priority: "high",
    isCriticalPath: true,
    progressPercentage: 100,
    estimatedEffort: "1d",
    syncStatus: true,
    description: card(
      "Give ELAH CRM Simulation its own Postgres. Banking and founder analytics already share one Neon public schema; a CRM prisma db push there would be destructive. CRM tables stay on a separate project/database.",
      "Neon project elah-crm-simulation (holy-feather-54694828), database elah_crm, region aws-us-east-2. Schema pushed; 30 demo customers + staff seeded 14 Sep 2026. Local npm run dev still uses SQLite.",
      "Keep Vercel DATABASE_URL on this Neon only. Optional later: npm run seed:traffic against hosted DB. Never reuse banking DATABASE_URL.",
      "Hosted CRM schema + demo logins on a database that is not banking Neon.",
      "prisma db push CRM schema onto banking/founder Neon.",
    ),
    successCriteria:
      "- Separate Neon project or database from banking.\n- Schema applied; demo users can log in on Vercel.\n- Local SQLite workflow intact.",
    deliverables:
      "Neon elah_crm + Vercel DATABASE_URL. Connection string lives in gitignored .env.production.local.",
    notes:
      "Done 14 Sep 2026. Do not commit connection strings.",
    links: [
      "elah-crm-simulator/prisma/schema.prisma",
      "elah-crm-simulator/deploy/README.md",
    ],
  },
  {
    title: "Align CRM naming with banking demo",
    workstream: "Product",
    category: "Brand",
    status: "done",
    priority: "high",
    isCriticalPath: false,
    progressPercentage: 100,
    estimatedEffort: "1d",
    syncStatus: true,
    description: card(
      "Drop the fictional HelioDesk brand. Match banking: ELAH CRM / ELAH CRM Simulation in the app chrome, and CRM System in founder analytics — parallel to ELAH Bank / ELAH Banking Simulation / Banking System.",
      "HelioDesk strings removed from elah-crm-simulator and founder CRM analytics pages. Ticket numbers use CRM- not HD-. Cookie is elah_session. App id elah-crm-demo.",
      "Keep copy consistent in new docs and outreach. Do not resurrect HelioDesk in public decks.",
      "Product name matches the banking naming pattern.",
      "Inventing a third brand; renaming the banking demo.",
    ),
    successCriteria:
      "- No HelioDesk in the CRM app or Banking System CRM pages.\n- Sidebar: ELAH CRM + Simulation.\n- Analytics nav: CRM System.",
    deliverables:
      "elah-crm-simulator UI + elah-analytics-dashboard /banking/crm labels.",
    notes: "Done 9–14 Sep 2026.",
    links: [
      "elah-crm-simulator/app/layout.tsx",
      "elah-analytics-dashboard/components/banking/banking-sidebar.tsx",
    ],
  },
  {
    title: "Surface CRM analytics in Banking System dashboard",
    workstream: "Dashboard",
    category: "Analytics",
    status: "in_review",
    priority: "high",
    isCriticalPath: false,
    progressPercentage: 80,
    estimatedEffort: "3d",
    syncStatus: true,
    description: card(
      "Show CRM command logs, users, and actions inside the founder Banking System chrome as CRM System — another nav page, not a separate CRM-only shell. Reads the CRM SQLite (local) or later a hosted CRM DB. Never merge CRM rows into banking Neon.",
      "Local founder app has /banking/crm, /banking/crm/logs, users, actions, app. Old /crm/* redirects. Production reads CRM Neon elah_crm via Encrypted CRM_DATABASE_URL (Postgres client). Local stays SQLite. Never merge into banking Neon.",
      "Verify /banking/crm on local :3001. Decide whether production founder platform should read CRM Neon (read-only) — that is a later env change, not a schema merge.",
      "CRM System visible next to Dashboard / Agent Logs in Banking System nav.",
      "Copying CRM events into banking AgentEventLog; a second founder chrome named HelioDesk.",
    ),
    successCriteria:
      "- CRM System is a Banking System nav item.\n- Pages render CRM logs without writing to banking Neon.\n- Production read of hosted CRM DB is explicit and optional.",
    deliverables:
      "elah-analytics-dashboard app/banking/crm/* + sidebar.",
    notes:
      "In review: local SQLite works. Production charts need Encrypted CRM_DATABASE_URL=CRM Neon elah_crm, then redeploy. Never banking DATABASE_URL.",
    links: [
      "elah-analytics-dashboard/app/banking/crm/page.tsx",
      "elah-analytics-dashboard/lib/crm/config.ts",
    ],
  },
  {
    title: "Seed CRM demo users and command logs",
    workstream: "Engineering",
    category: "Dataset",
    status: "done",
    priority: "high",
    isCriticalPath: false,
    progressPercentage: 100,
    estimatedEffort: "2d",
    syncStatus: true,
    description: card(
      "Seed 30 distinct demo customers plus staff, then research-shaped portal/command logs (dashboard, tickets, billing, some chat) so the CRM demo and analytics are not an empty shell.",
      "Hosted CRM Neon elah_crm re-seeded 14 Sep 2026: 30 customers + staff, then 10,000 AgentEventLog rows + score snapshots. Synthetic/simulator only. Local SQLite still has its own 10k pack.",
      "Optional: ALLOW_HOSTED_DB=1 npm run seed:traffic against CRM Neon if the hosted demo should show volume. Do not invent live-customer logs.",
      "Demo logins work on Vercel; local analytics can show command volume.",
      "Exporting real Zendesk; mixing unlabeled CRM JSONL into banking gold v1.0.",
    ),
    successCriteria:
      "- 30 demo customers + staff, password DemoPass123!.\n- Hosted login works.\n- Traffic pack is optional and labeled synthetic/simulator.",
    deliverables:
      "elah-crm-simulator prisma/seed.ts + scripts/seed-crm-traffic.ts.",
    notes:
      "Done 14 Sep 2026 on CRM Neon (not banking). DemoPass123!.",
    links: [
      "elah-crm-simulator/scripts/seed-crm-traffic.ts",
    ],
  },
  {
    title: "Point founder dashboard at live CRM Vercel URL",
    workstream: "Engineering",
    category: "Integration",
    status: "done",
    priority: "high",
    isCriticalPath: false,
    progressPercentage: 100,
    estimatedEffort: "0.5d",
    syncStatus: true,
    description: card(
      "Set founder-platform CRM_APP_URL (Encrypted, not NEXT_PUBLIC_) to the live Vercel CRM demo so Banking System → Open CRM App opens the hosted site, not localhost:3003.",
      "Founder confirmed 16 Sep 2026: production founder platform deployed with Encrypted CRM_APP_URL=https://elahcrmsystem.vercel.app.",
      "Paste the Vercel URL into the founder Vercel project env (Production + Preview). Redeploy founder platform. Do not put secrets in git.",
      "Open CRM App hits the public CRM demo.",
      "Pointing CRM_APP_URL at the banking demo.",
    ),
    successCriteria:
      "- Founder production Open CRM App opens the hosted CRM Simulation.\n- Local .env can still use :3003.",
    deliverables:
      "Founder Vercel env CRM_APP_URL (Encrypted).",
    notes: "Done 16 Sep 2026. Encrypted CRM_APP_URL only — no NEXT_PUBLIC_ twin.",
    links: [
      "elah-analytics-dashboard/lib/crm/config.ts",
      "elah-analytics-dashboard/docs/VERCEL_TWO_PROJECTS.md",
    ],
  },
  {
    title: "Record GTM pivot on Phase 11–12 Kanban cards",
    workstream: "Product",
    category: "Roadmap",
    status: "done",
    priority: "high",
    isCriticalPath: false,
    progressPercentage: 100,
    estimatedEffort: "0.5d",
    syncStatus: true,
    description: card(
      "Phase 11 (user discovery) and Phase 12 (pilot acquisition) were written as bank-first. After the pivot they stay on the board as the later banking vertical — they must not read as the current first-buyer plan. First ICP, first demo, and first design-partner list live in Phase 16.",
      "Every Phase 11 and Phase 12 card now carries the 8 Sep 2026 pivot banner. Titles stay (banking discovery is still real later work). Phase 16 owns CS/CRM first-buyer cards.",
      "If a new Phase 11/12 card is added, prepend the same banner. Do not delete Phase 11–12. Do not retitle them as CS/CRM.",
      "Kanban no longer implies the next customer is a bank CISO.",
      "Moving Phase 11 interviews into Phase 16; deleting banking discovery.",
    ),
    successCriteria:
      "- Phase 11–12 descriptions start with the pivot banner.\n- CS/CRM first-buyer work remains Phase 16.\n- Banking interview evidence (if any) is not erased.",
    deliverables:
      "Annotated Phase 11–12 RoadmapTask rows + this Phase 16 card.",
    notes: "Done when seed-phase16-cs-crm-wedge.ts applies PHASE_11_12_PIVOT_BANNER.",
    links: [
      "lib/roadmap/seed/phase16.ts",
      "scripts/seed-phase16-cs-crm-wedge.ts",
    ],
  },
];

export function phase16TaskId(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `task-16-${slug}`.slice(0, 64);
}

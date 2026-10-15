export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "high" | "medium" | "low";
export type TaskGroup =
  | "Product"
  | "Data"
  | "Backend"
  | "Model"
  | "Dashboard"
  | "Evaluation"
  | "Demo";

export interface RoadmapTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  owner: string;
  effort: string;
  group: TaskGroup;
  milestoneId?: number;
}

export type ProtocolStage = "specified" | "proved" | "not_built";

export interface RoadmapMilestone {
  id: number;
  title: string;
  tasks: string[];
  stage: ProtocolStage;
}

export const HERO_HIGHLIGHTS = [
  {
    title: "Two paths at the entrance",
    description:
      "A person ticks “I'm not a robot” and is not checked. An agent declares the job and runs APACT.",
    icon: "shield" as const,
  },
  {
    title: "Guest travel, then a token",
    description:
      "Search flights and save a guest draft. Payment, contract, and export stay closed. The token is bound to a key that never leaves the page.",
    icon: "key" as const,
  },
  {
    title: "Local thin slice",
    description:
      "Python server, widget, Skyhop, and 33 tests. Hosted service, durable storage, and step-up approval are not built.",
    icon: "beaker" as const,
  },
] as const;

export const PRODUCT_EXAMPLE = {
  input: {
    summary:
      "Search flights and save a guest draft. Stop before payment, a contract, or export.",
    functions: "flight.search and traveler.draft.update on guest/current",
    profile: "guest-travel-v1 · travel-functions-v1",
  },
  output: {
    decision: "allow_limited",
    reason: "guest_policy_and_task_test_passed",
    granted: "flight.search, traveler.draft.update",
    blocked: "payment.create, contract.submit, data.export",
    token: "elah-admission+jwt for 300 seconds, bound to the page key",
    assurance:
      "Key possession verified. Origin asserted or unknown. User authority declared. Behavior observed in the exercise.",
  },
} as const;

export const ARCHITECTURE_STEPS = [
  {
    label: "Site entrance",
    detail: "Human checkbox is unchecked. “I'm an AI agent” opens APACT.",
  },
  {
    label: "Prepare and declare",
    detail: "Server-owned catalog. The agent signs fields 1–7. The declaration freezes.",
  },
  {
    label: "Three inert exercises",
    detail: "Baseline, pressure, and relabel. The server records mock effects.",
  },
  {
    label: "Decision and token",
    detail: "Only allow_limited issues a short-lived token bound to the page key.",
  },
  {
    label: "Partner enforcement",
    detail: "Skyhop checks the token and a fresh proof on every API call.",
  },
] as const;

export const SCORING_CONTRACT_FIELDS = [
  {
    key: "status",
    type: "string",
    desc: "allow_limited, step_up_required, rejected, or unsupported. Only allow_limited issues a token.",
  },
  {
    key: "reason",
    type: "string",
    desc: "Machine-readable reason. A passing guest run uses guest_policy_and_task_test_passed.",
  },
  {
    key: "granted_functions",
    type: "array",
    desc: "Catalog ids the token may present, each on a resource such as guest/current.",
  },
  {
    key: "blocked_functions",
    type: "array",
    desc: "Functions withheld, each with a basis. A passed exercise cannot add authority.",
  },
  {
    key: "measurements",
    type: "object",
    desc: "What the three exercises showed. Lab rules, not a calibrated safety probability.",
    children: [
      { key: "safe_task_completion", type: "string" },
      { key: "boundary_violation_count", type: "number" },
      { key: "declared_action_alignment", type: "string" },
      { key: "probe_consistency", type: "string" },
    ],
  },
  {
    key: "assurance",
    type: "object",
    desc: "Separate evidence levels for this attempt.",
    children: [
      { key: "key_possession", type: "verified | failed" },
      { key: "operator_origin", type: "verified | asserted | unknown" },
      { key: "user_task_authority", type: "verified | declared | unknown" },
      { key: "behavior_observation", type: "observed | unavailable" },
    ],
  },
] as const;

export const TRAVEL_FUNCTIONS = [
  { id: "flight.search", access: "guest" },
  { id: "traveler.draft.update", access: "guest" },
  { id: "payment.create", access: "blocked" },
  { id: "contract.submit", access: "blocked" },
  { id: "data.export", access: "blocked" },
] as const;

export const TRAVEL_TASK_KINDS = [
  "search_only",
  "search_and_save_guest_draft",
] as const;

export const ROADMAP_MILESTONES: RoadmapMilestone[] = [
  {
    id: 1,
    title: "APACT product definition",
    stage: "specified",
    tasks: [
      "Eight-field declaration and task-bound receipt",
      "Guest path versus delegated path",
      "Decisions: allow_limited, step_up_required, rejected, unsupported",
      "A passed exercise does not create authority",
    ],
  },
  {
    id: 2,
    title: "Local thin slice",
    stage: "proved",
    tasks: [
      "Python entrance, widget, and Skyhop on localhost",
      "Three inert guest-travel exercises",
      "300-second token bound to the page key",
      "33 tests covering admission, binding, presentation, and the site",
    ],
  },
  {
    id: 3,
    title: "Hosted entrance",
    stage: "not_built",
    tasks: [
      "A service a partner site can reach off this machine",
      "Deployed widget and published JWKS",
      "Cloud agents can complete a challenge",
    ],
  },
  {
    id: 4,
    title: "Durable storage",
    stage: "not_built",
    tasks: [
      "Challenges survive a process restart",
      "Replay cache shared across verifier instances",
      "Revocation shared across verifier instances",
    ],
  },
  {
    id: 5,
    title: "Step-up approval",
    stage: "not_built",
    tasks: [
      "Partner consent for payment, contract, and export",
      "Show agent, function, resource, duration, and limits",
      "A changed contract requires a new declaration",
    ],
  },
  {
    id: 6,
    title: "Operator and authority adapters",
    stage: "not_built",
    tasks: [
      "Configured issuer profiles for operator credentials",
      "Authority evidence that is not an approved:true flag",
      "Guest policy remains the only admitting path today",
    ],
  },
  {
    id: 7,
    title: "Partner enforcement beyond Skyhop",
    stage: "not_built",
    tasks: [
      "A second site mapping routes to catalog effects",
      "Online revocation fails closed",
      "Human checkbox stays unchecked and logged",
    ],
  },
  {
    id: 8,
    title: "Production protocol hardening",
    stage: "not_built",
    tasks: [
      "Reviewed canonicalization beyond the lab's sorted-key JSON",
      "Strict parser rules held in production",
      "Abuse limits that a new key cannot reset",
    ],
  },
  {
    id: 9,
    title: "Another task profile",
    stage: "not_built",
    tasks: [
      "A catalog besides guest travel",
      "Exercises generated after that declaration freezes",
      "Same decision and token rules",
    ],
  },
  {
    id: 10,
    title: "Fundraising narrative for the pivot",
    stage: "not_built",
    tasks: [
      "Tell the entrance story without claiming a hosted product",
      "Name durable storage and step-up approval as open",
      "The August 2026 ask is not a closed round",
    ],
  },
];

export const TASK_BOARD: RoadmapTask[] = [
  { id: "p1", title: "Specify the APACT entrance and four decisions", status: "done", priority: "high", owner: "Product", effort: "local", group: "Product", milestoneId: 1 },
  { id: "p2", title: "Guest travel catalog: search and draft in, pay and export out", status: "done", priority: "high", owner: "Product", effort: "local", group: "Product", milestoneId: 2 },
  { id: "p3", title: "Fundraising narrative that does not claim a hosted product", status: "todo", priority: "medium", owner: "Product", effort: "open", group: "Product", milestoneId: 10 },
  { id: "d1", title: "In-memory challenge state for one local process", status: "done", priority: "high", owner: "Data", effort: "local", group: "Data", milestoneId: 2 },
  { id: "d2", title: "Durable challenge, replay, and revocation storage", status: "todo", priority: "high", owner: "Data", effort: "open", group: "Data", milestoneId: 4 },
  { id: "b1", title: "Local entrance on 127.0.0.1:8700", status: "done", priority: "high", owner: "Backend", effort: "local", group: "Backend", milestoneId: 2 },
  { id: "b2", title: "Hosted APACT service", status: "todo", priority: "high", owner: "Backend", effort: "open", group: "Backend", milestoneId: 3 },
  { id: "b3", title: "Skyhop checks token and DPoP on every API call", status: "done", priority: "high", owner: "Backend", effort: "local", group: "Backend", milestoneId: 2 },
  { id: "m1", title: "Lab judge: three probes, zero violations, consistent effects", status: "done", priority: "high", owner: "Model", effort: "local", group: "Model", milestoneId: 2 },
  { id: "m2", title: "Step-up approval for payment, contract, and export", status: "todo", priority: "high", owner: "Model", effort: "open", group: "Model", milestoneId: 5 },
  { id: "dash1", title: "Protocol roadmap on the founder admin", status: "done", priority: "medium", owner: "Dashboard", effort: "local", group: "Dashboard", milestoneId: 1 },
  { id: "dash2", title: "Founder overview reads the live APACT execution plan", status: "done", priority: "high", owner: "Dashboard", effort: "local", group: "Dashboard", milestoneId: 1 },
  { id: "e1", title: "33 local tests: admission, binding, presentation, site, protocol", status: "done", priority: "high", owner: "Evaluation", effort: "local", group: "Evaluation", milestoneId: 2 },
  { id: "e2", title: "Browser signature checked against the Python verifier", status: "done", priority: "medium", owner: "Evaluation", effort: "local", group: "Evaluation", milestoneId: 2 },
  { id: "demo1", title: "Skyhop guest-travel site on 127.0.0.1:4173", status: "done", priority: "high", owner: "Demo", effort: "local", group: "Demo", milestoneId: 2 },
  { id: "demo2", title: "Hosted demo a partner can open", status: "todo", priority: "high", owner: "Demo", effort: "open", group: "Demo", milestoneId: 3 },
];

export const TASK_GROUPS: TaskGroup[] = [
  "Product",
  "Data",
  "Backend",
  "Model",
  "Dashboard",
  "Evaluation",
  "Demo",
];

export const FIRST_ROUND_PLAN = {
  targetRaise: "$400K",
  roundType: "Pre-seed / angel-pre-seed",
  runway: "12 months",
  mainMilestone: "Hosted APACT entrance a partner can install. Not done.",
  askStatus: "Founder-approved working ask",
  askApprovedOn: "26 August 2026",
  closed: false,
  description:
    "The working ask is $400K for 12 months, approved by the founder on 26 August 2026 for the earlier banking intention model. It is not a closed round. The product is now APACT, a CAPTCHA for agents. The thin slice runs locally. That pivot is not customers, revenue, or a hosted service.",
  closingStatement:
    "$400K working ask from 26 August 2026. Not closed. APACT is a local thin slice.",
} as const;

export const USE_OF_FUNDS = [
  { category: "Backend / AI expert", amount: 160_000, amountLabel: "$160K" },
  { category: "Dataset creation, labeling, data science", amount: 70_000, amountLabel: "$70K" },
  { category: "Cloud, compute, databases, tools", amount: 50_000, amountLabel: "$50K" },
  { category: "Legal, company setup, contracts", amount: 25_000, amountLabel: "$25K" },
  { category: "Security / compliance review", amount: 30_000, amountLabel: "$30K" },
  { category: "Product / dashboard polish", amount: 20_000, amountLabel: "$20K" },
  { category: "Customer discovery, pilots, travel", amount: 30_000, amountLabel: "$30K" },
  { category: "Buffer", amount: 15_000, amountLabel: "$15K" },
] as const;

export const USE_OF_FUNDS_TOTAL = {
  amount: 400_000,
  amountLabel: "$400K",
} as const;

export const TWELVE_MONTH_GOALS = [
  "Hold the APACT 0.1 entrance: eight fields, guest and delegated paths, and decisions that do not invent authority.",
  "Keep the local thin slice as the proof: Python server, widget, Skyhop, and 33 tests.",
  "Host the entrance so a site off this machine can call it.",
  "Move challenge, replay, and revocation state out of process memory.",
  "Build step-up approval for payment, contract, and export. The slice returns step_up_required and stops.",
  "Add operator-credential and authority-evidence adapters. Guest policy is the only path that admits today.",
  "Harden canonicalization and partner enforcement beyond the Skyhop test site.",
  "Write the fundraising narrative for the pivot with hosted gaps named as gaps.",
] as const;

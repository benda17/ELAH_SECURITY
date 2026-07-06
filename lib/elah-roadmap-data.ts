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

export interface RoadmapMilestone {
  id: number;
  title: string;
  tasks: string[];
}

export const HERO_HIGHLIGHTS = [
  {
    title: "Banking-only MVP",
    description:
      "Focused on authenticated banking assistant messages — no generic chatbot scoring.",
    icon: "landmark" as const,
  },
  {
    title: "Numeric intention score",
    description:
      "A calibrated 0.00–1.00 probability that the message reflects genuine banking intent.",
    icon: "gauge" as const,
  },
  {
    title: "Explainable graph coordinates",
    description:
      "Human Agency, Financial Risk, and Emotional Urgency with matched signal breakdown.",
    icon: "network" as const,
  },
] as const;

export const PRODUCT_EXAMPLE = {
  input: {
    userMessage: "Send Daniel ₪250",
  },
  output: {
    elahScore: 0.87,
    primaryIntent: "external_transfer",
    coordinates: {
      humanAgency: 0.82,
      financialRisk: 0.78,
      emotionalUrgency: 0.31,
    },
    explanation: [
      "Transfer verb detected",
      "Amount detected",
      "Recipient detected",
      "Banking action context detected",
    ],
  },
} as const;

export const ARCHITECTURE_STEPS = [
  {
    label: "Next.js Banking App",
    detail: "Captures assistant messages, tool calls, confirmations",
  },
  {
    label: "Separate ELAH Service",
    detail: "Independent scoring API — not embedded in bank policy",
  },
  {
    label: "Score + Coordinates + Explanation",
    detail: "0.00–1.00 score, intent probabilities, graph point, signals",
  },
  {
    label: "Analytics Dashboard",
    detail: "Visualize distributions, ambiguity, and low-score actions",
  },
  {
    label: "Bank-Owned Thresholds",
    detail: "Customer defines cutoffs; ELAH never allow/block/confirm",
  },
] as const;

export const SCORING_CONTRACT_FIELDS = [
  { key: "elahScore", type: "number", range: "0.00–1.00", desc: "Primary intention probability" },
  { key: "primaryIntent", type: "string", desc: "Highest-confidence banking intent label" },
  { key: "intentProbabilities", type: "Record<string, number>", desc: "Full intent distribution" },
  {
    key: "coordinates",
    type: "object",
    children: [
      { key: "humanAgency", type: "number" },
      { key: "financialRisk", type: "number" },
      { key: "emotionalUrgency", type: "number" },
    ],
  },
  {
    key: "vectorBreakdown",
    type: "object",
    desc: "H / B / S layer vectors from taxonomy",
  },
  {
    key: "explanation",
    type: "object",
    children: [
      { key: "matchedSignals", type: "string[]" },
      { key: "weakSignals", type: "string[]" },
      { key: "negativeSignals", type: "string[]" },
    ],
  },
] as const;

export const BANKING_INTENTS = [
  "balance_awareness",
  "recent_transactions",
  "spending_summary",
  "internal_transfer",
  "external_transfer",
  "bill_payment",
  "scheduled_payment",
  "statement_download",
  "card_freeze",
  "card_unfreeze",
  "fraud_report",
  "dispute_chargeback",
  "fee_or_overdraft_question",
  "loan_inquiry",
  "loan_application",
  "savings_optimization",
  "profile_update",
  "support_escalation",
  "ambiguous_banking_request",
  "non_banking_request",
  "prompt_injection_or_policy_bypass",
] as const;

export const ROADMAP_MILESTONES: RoadmapMilestone[] = [
  {
    id: 1,
    title: "Product Definition",
    tasks: [
      "Define exact meaning of ELAH score",
      "Finalize banking-only intent taxonomy",
      "Finalize input/output JSON contract",
      "Define graph coordinates",
      "Define what ELAH is not responsible for",
      "Define customer-owned thresholds",
    ],
  },
  {
    id: 2,
    title: "Data Pipeline",
    tasks: [
      "Export assistant messages",
      "Export tool calls",
      "Export confirmation events",
      "Export policy results",
      "Redact sensitive values",
      "Hash user IDs",
      "Bucket amounts",
      "Convert recipient names to recipient types",
      "Create ElahTrainingEvent schema",
      "Create daily export job",
    ],
  },
  {
    id: 3,
    title: "Separate ELAH Service",
    tasks: [
      "Create elah-service",
      "Add /health",
      "Add /v1/infer",
      "Add /v1/batch-infer",
      "Add /v1/events",
      "Add /v1/model-info",
      "Store prediction logs",
      "Return model version in every response",
    ],
  },
  {
    id: 4,
    title: "Rules Engine v0",
    tasks: [
      "Build banking keyword classifier",
      "Add amount detector",
      "Add recipient detector",
      "Add ambiguity detector",
      "Add prompt-injection detector",
      "Add intent probability generator",
      "Add graph coordinate calculator",
      "Add explanation generator",
      "Add unit tests",
    ],
  },
  {
    id: 5,
    title: "Dashboard Integration",
    tasks: [
      "Call ELAH service for every assistant message",
      "Store ELAH response",
      "Show ELAH score",
      "Show coordinates on graph",
      "Show explanation signals",
      "Show score distribution over time",
      "Show low-score agent actions",
      "Show ambiguous requests",
      "Show prompt-injection attempts",
      "Add filters",
    ],
  },
  {
    id: 6,
    title: "Synthetic Data Generator",
    tasks: [
      "Generate examples for each banking intent",
      "Generate Hebrew and English examples",
      "Generate slang and short messages",
      "Generate vague examples",
      "Generate prompt-injection examples",
      "Generate amount and recipient variations",
      "Generate public-pattern weighted distribution",
      "Save versioned dataset",
    ],
  },
  {
    id: 7,
    title: "Human Review Dataset",
    tasks: [
      "Build review UI",
      "Show message, tool, and ELAH result",
      "Let reviewer correct intent",
      "Let reviewer correct score",
      "Let reviewer rate explanation",
      "Build golden dataset",
      "Lock golden dataset for evaluation",
    ],
  },
  {
    id: 8,
    title: "Train ELAH v0.1",
    tasks: [
      "Train TF-IDF classifier",
      "Add structured features",
      "Train intent classifier",
      "Train score regressor",
      "Calibrate probabilities",
      "Compare rules vs model",
      "Export model artifact",
      "Add model version registry",
    ],
  },
  {
    id: 9,
    title: "Hybrid Scoring",
    tasks: [
      "Combine rule score and trained score",
      "Add graph-coherence score",
      "Add context-consistency score",
      "Add explanation confidence",
      "Benchmark against golden set",
      "Tune formula weights",
      "Freeze elah-banking-v0.2",
    ],
  },
  {
    id: 10,
    title: "MVP Demo Readiness",
    tasks: [
      "Prepare demo flow with 20 banking users",
      "Generate normal requests",
      "Generate ambiguous requests",
      "Generate risky but genuine requests",
      "Generate prompt-injection requests",
      "Show dashboard live updating",
      "Show customer threshold slider",
      "Show how thresholds change behavior",
      "Show ELAH only scores intention",
      "Prepare investor/customer explanation page",
    ],
  },
];

export const TASK_BOARD: RoadmapTask[] = [
  { id: "p1", title: "Define exact meaning of ELAH score", status: "in_progress", priority: "high", owner: "Product", effort: "3d", group: "Product", milestoneId: 1 },
  { id: "p2", title: "Finalize banking-only intent taxonomy", status: "in_progress", priority: "high", owner: "Product", effort: "5d", group: "Product", milestoneId: 1 },
  { id: "p3", title: "Finalize input/output JSON contract", status: "todo", priority: "high", owner: "Product", effort: "2d", group: "Product", milestoneId: 1 },
  { id: "p4", title: "Define customer-owned thresholds", status: "todo", priority: "medium", owner: "Product", effort: "2d", group: "Product", milestoneId: 1 },
  { id: "d1", title: "Create ElahTrainingEvent schema", status: "todo", priority: "high", owner: "Data", effort: "3d", group: "Data", milestoneId: 2 },
  { id: "d2", title: "Export assistant messages + tool calls", status: "in_progress", priority: "high", owner: "Data", effort: "5d", group: "Data", milestoneId: 2 },
  { id: "d3", title: "Redact sensitive values + hash user IDs", status: "todo", priority: "high", owner: "Data", effort: "3d", group: "Data", milestoneId: 2 },
  { id: "d4", title: "Create daily export job", status: "todo", priority: "medium", owner: "Data", effort: "2d", group: "Data", milestoneId: 2 },
  { id: "b1", title: "Create elah-service repository", status: "todo", priority: "high", owner: "Backend", effort: "2d", group: "Backend", milestoneId: 3 },
  { id: "b2", title: "Add /v1/infer and /v1/batch-infer", status: "todo", priority: "high", owner: "Backend", effort: "5d", group: "Backend", milestoneId: 3 },
  { id: "b3", title: "Store prediction logs + model version", status: "todo", priority: "medium", owner: "Backend", effort: "3d", group: "Backend", milestoneId: 3 },
  { id: "m1", title: "Build banking keyword classifier", status: "todo", priority: "high", owner: "Model", effort: "5d", group: "Model", milestoneId: 4 },
  { id: "m2", title: "Add amount + recipient detectors", status: "todo", priority: "high", owner: "Model", effort: "3d", group: "Model", milestoneId: 4 },
  { id: "m3", title: "Add explanation generator", status: "todo", priority: "high", owner: "Model", effort: "4d", group: "Model", milestoneId: 4 },
  { id: "m4", title: "Train TF-IDF + score regressor v0.1", status: "todo", priority: "medium", owner: "Model", effort: "8d", group: "Model", milestoneId: 8 },
  { id: "m5", title: "Hybrid scoring (rules + model)", status: "todo", priority: "medium", owner: "Model", effort: "5d", group: "Model", milestoneId: 9 },
  { id: "dash1", title: "Call ELAH service for every assistant message", status: "todo", priority: "high", owner: "Dashboard", effort: "3d", group: "Dashboard", milestoneId: 5 },
  { id: "dash2", title: "Show ELAH score on intent matrix graph", status: "todo", priority: "high", owner: "Dashboard", effort: "4d", group: "Dashboard", milestoneId: 5 },
  { id: "dash3", title: "Score distribution over time chart", status: "todo", priority: "medium", owner: "Dashboard", effort: "3d", group: "Dashboard", milestoneId: 5 },
  { id: "dash4", title: "ELAH Model Roadmap page", status: "done", priority: "high", owner: "Dashboard", effort: "2d", group: "Dashboard" },
  { id: "e1", title: "Build golden dataset review UI", status: "todo", priority: "high", owner: "Evaluation", effort: "5d", group: "Evaluation", milestoneId: 7 },
  { id: "e2", title: "Benchmark rules vs model on golden set", status: "todo", priority: "high", owner: "Evaluation", effort: "4d", group: "Evaluation", milestoneId: 9 },
  { id: "e3", title: "Explanation quality rating workflow", status: "todo", priority: "medium", owner: "Evaluation", effort: "3d", group: "Evaluation", milestoneId: 7 },
  { id: "demo1", title: "Prepare 20-user demo flow", status: "todo", priority: "high", owner: "Demo", effort: "5d", group: "Demo", milestoneId: 10 },
  { id: "demo2", title: "Customer threshold slider demo", status: "todo", priority: "high", owner: "Demo", effort: "2d", group: "Demo", milestoneId: 10 },
  { id: "demo3", title: "Investor explanation walkthrough", status: "todo", priority: "medium", owner: "Demo", effort: "2d", group: "Demo", milestoneId: 10 },
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

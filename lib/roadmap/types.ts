/** Roadmap domain types for the ELAH founder operating dashboard. */

export const TASK_STATUSES = [
  "backlog",
  "planned",
  "ready",
  "in_progress",
  "in_review",
  "blocked",
  "done",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["critical", "high", "medium", "low"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const WORKSTREAMS = [
  "Product",
  "Engineering",
  "Data",
  "Model",
  "Security",
  "Dashboard",
  "Business",
  "Legal",
  "Operations",
] as const;

export type Workstream = (typeof WORKSTREAMS)[number];

export const OUTREACH_STATUSES = [
  "research",
  "identified",
  "ready_to_contact",
  "contacted",
  "replied",
  "meeting_scheduled",
  "follow_up",
  "interested",
  "pilot_discussion",
  "due_diligence",
  "passed",
  "closed",
] as const;

export type OutreachStatus = (typeof OUTREACH_STATUSES)[number];

export const CONTACT_TYPES = [
  "potential_banking_customer",
  "design_partner",
  "security_expert",
  "ai_researcher",
  "banking_domain_expert",
  "investor",
  "accelerator",
  "regulatory_contact",
  "technical_advisor",
  "potential_cofounder",
] as const;

export type ContactType = (typeof CONTACT_TYPES)[number];

export const DECISION_STATUSES = [
  "open",
  "under_investigation",
  "decided",
  "revisit_later",
] as const;

export type DecisionStatus = (typeof DECISION_STATUSES)[number];

export interface RoadmapTaskRecord {
  id: string;
  title: string;
  description: string | null;
  category: string;
  workstream: string;
  phase: string;
  status: TaskStatus;
  priority: TaskPriority;
  owner: string | null;
  createdAt: Date;
  updatedAt: Date;
  startDate: Date | null;
  dueDate: Date | null;
  completedAt: Date | null;
  estimatedEffort: string | null;
  actualEffort: string | null;
  progressPercentage: number;
  milestoneId: string | null;
  parentTaskId: string | null;
  dependencyIds: string[];
  blockedBy: string | null;
  blockingReason: string | null;
  successCriteria: string | null;
  deliverables: string | null;
  notes: string | null;
  links: string[];
  tags: string[];
  riskLevel: string | null;
  isCriticalPath: boolean;
  order: number;
}

export interface RoadmapMilestoneRecord {
  id: string;
  title: string;
  description: string | null;
  targetDate: Date | null;
  status: string;
  completionPercentage: number;
  exitCriteria: string | null;
  risks: string | null;
  owner: string | null;
  evidence: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoadmapContactRecord {
  id: string;
  name: string;
  organization: string | null;
  role: string | null;
  contactType: string;
  email: string | null;
  linkedInUrl: string | null;
  sector: string | null;
  relevance: string | null;
  outreachStatus: string;
  lastContactDate: Date | null;
  nextFollowUp: Date | null;
  notes: string | null;
  associatedTasks: string[];
  potentialValue: string | null;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoadmapDecisionRecord {
  id: string;
  question: string;
  context: string | null;
  options: string[];
  chosenOption: string | null;
  status: string;
  owner: string | null;
  decisionDate: Date | null;
  rationale: string | null;
  risks: string | null;
  relatedTaskIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RoadmapExperimentRecord {
  id: string;
  title: string;
  hypothesis: string | null;
  testMethod: string | null;
  dataset: string | null;
  successMetric: string | null;
  baseline: string | null;
  result: string | null;
  conclusion: string | null;
  followUpAction: string | null;
  milestoneId: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoadmapRiskRecord {
  id: string;
  description: string;
  riskType: string | null;
  probability: string | null;
  impact: string | null;
  severity: string | null;
  mitigationPlan: string | null;
  owner: string | null;
  status: string;
  relatedTaskIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RoadmapMetrics {
  overallCompletion: number;
  tasksCompleted: number;
  tasksTotal: number;
  tasksInProgress: number;
  tasksBlocked: number;
  tasksOverdue: number;
  criticalPathCompletion: number;
  currentPhase: string;
  nextMilestone: RoadmapMilestoneRecord | null;
  daysToNextMilestone: number | null;
  completionByPhase: { phase: string; percent: number; done: number; total: number }[];
  completionByWorkstream: { workstream: string; percent: number; done: number; total: number }[];
  readiness: {
    technical: number;
    data: number;
    model: number;
    product: number;
    pilot: number;
    customerValidation: number;
    fundraising: number;
  };
  topPriorities: RoadmapTaskRecord[];
  weeklyDue: RoadmapTaskRecord[];
  overdueFollowUps: RoadmapContactRecord[];
}

export type TaskCreateInput = Omit<
  RoadmapTaskRecord,
  "id" | "createdAt" | "updatedAt"
> & { id?: string };

export type TaskUpdateInput = Partial<
  Omit<RoadmapTaskRecord, "id" | "createdAt" | "updatedAt">
>;

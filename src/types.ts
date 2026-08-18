export type TaskStatus =
  | "backlog"
  | "in_progress"
  | "blocked"
  | "in_review"
  | "done";

export type TaskPriority = "critical" | "high" | "medium" | "low";

export type RoadmapTask = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  workstream: string;
  phase: string;
  status: TaskStatus;
  priority: TaskPriority;
  owner: string | null;
  createdAt: string;
  updatedAt: string;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
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
};

export type RoadmapContact = {
  id: string;
  name: string;
  organization: string | null;
  role: string | null;
  contactType: string;
  email: string | null;
  linkedInUrl: string | null;
  outreachStatus: string;
  lastContactDate: string | null;
  nextFollowUp: string | null;
  notes: string | null;
  priority: string;
};

export type RoadmapMetrics = {
  overallCompletion: number;
  tasksCompleted: number;
  tasksTotal: number;
  tasksInProgress: number;
  tasksBlocked: number;
  tasksOverdue: number;
  criticalPathCompletion: number;
  currentPhase: string;
  topPriorities: RoadmapTask[];
  weeklyDue: RoadmapTask[];
  overdueFollowUps: RoadmapContact[];
};

export type RoadmapMilestone = {
  id: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  status: string;
  completionPercentage: number;
  exitCriteria: string | null;
};

export type Bootstrap = {
  tasks: RoadmapTask[];
  contacts: RoadmapContact[];
  milestones?: RoadmapMilestone[];
  metrics: RoadmapMetrics;
};

export type ContentPublishStatus = {
  linkedin: boolean;
  facebook: boolean;
  linkedinNotes: string | null;
  facebookNotes: string | null;
  facebookPage: string | null;
  contentEngineUrl: string;
};

export type ContentDraft = {
  id: string;
  title: string | null;
  body: string;
  hashtags: string;
  status: "draft" | "approved" | "rejected" | "published" | string;
  reviewerNotes: string | null;
  publishedAt: string | null;
  facebookPostId: string | null;
  facebookPublishedAt: string | null;
  externalPostId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReminderDigest = {
  generatedAt: string;
  tasks: {
    dueToday: Array<Pick<RoadmapTask, "id" | "title" | "status" | "priority" | "phase" | "owner" | "dueDate">>;
    overdue: Array<Pick<RoadmapTask, "id" | "title" | "status" | "priority" | "phase" | "owner" | "dueDate"> & { daysOverdue?: number }>;
    dueThisWeek: Array<Pick<RoadmapTask, "id" | "title" | "status" | "priority" | "phase" | "owner" | "dueDate">>;
    blocked: Array<Pick<RoadmapTask, "id" | "title" | "status" | "priority" | "phase" | "owner" | "dueDate">>;
  };
  contacts: {
    followUpToday: RoadmapContact[];
    overdueFollowUp: RoadmapContact[];
  };
  summary: {
    tasksDueToday: number;
    tasksOverdue: number;
    tasksBlocked: number;
    contactsNeedingFollowUp: number;
  };
};

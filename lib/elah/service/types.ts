import type { ElahBankingIntent } from "@/lib/elah/types";
import type { ElahEvent } from "@/lib/elah/envelope";

export const ELAH_CONTRACT_VERSION = "1.0" as const;
export const ELAH_SCORE_MODE = "pre_tool" as const;
export const ELAH_SCORER = "rules_v0" as const;
export const ELAH_SERVICE_VERSION = "0.3.0" as const;
export const ELAH_HEALTH_SERVICE = "elah-scorer" as const;

export type ScoreMode = typeof ELAH_SCORE_MODE;
export type ScoreStatus = "scored" | "abstained";
export type PolicyRecommendation = "none" | "watch" | "review" | "step_up_hint";
export type ScoreProvenanceScorer =
  | "rules_v0"
  | "intent_matrix"
  | "model"
  | "hybrid"
  | "manual";
export type ScoreLabelSource = "rules_v0" | "intent_matrix" | "backfill" | "manual";

export type ScoreRequest = {
  contractVersion: typeof ELAH_CONTRACT_VERSION;
  requestId: string;
  mode: ScoreMode;
  event: ElahEvent;
};

export type IntentionCoordinates = {
  humanAgency: number;
  financialRisk: number;
  emotionalUrgency: number;
};

export type ElahExplanation = {
  matchedSignals: string[];
  weakSignals: string[];
  negativeSignals: string[];
  summary?: string;
};

export type PolicyHook = {
  recommendation: PolicyRecommendation;
  reasons: string[];
};

export type ScoreProvenance = {
  scorer: ScoreProvenanceScorer;
  modelVersion: string | null;
  labelSource: ScoreLabelSource;
};

export type ElahScore = {
  elahScore: number;
  confidence: number;
  uncertainty: number;
  intentLabel: ElahBankingIntent;
  coordinates: IntentionCoordinates;
  explanation: ElahExplanation;
  policyHook: PolicyHook;
  provenance: ScoreProvenance;
};

export type ScoreResponse = {
  contractVersion: typeof ELAH_CONTRACT_VERSION;
  requestId: string;
  eventId: string;
  status: ScoreStatus;
  scoredAt: string;
  score: ElahScore;
};

export type ErrorCode =
  | "invalid_json"
  | "additional_properties"
  | "missing_field"
  | "unauthorized"
  | "forbidden_app"
  | "idempotency_conflict"
  | "payload_too_large"
  | "unsupported_contract_version"
  | "unsupported_mode"
  | "event_schema_violation"
  | "sanitization_failed"
  | "wrong_execution_state"
  | "app_id_mismatch"
  | "rate_limited"
  | "internal_error"
  | "unavailable";

export type ErrorDetail = {
  path: string;
  reason: string;
};

export type ErrorResponse = {
  contractVersion: typeof ELAH_CONTRACT_VERSION;
  requestId: string | null;
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetail[];
  };
};

export type HandleScoreResult = {
  status: number;
  body: ScoreResponse | ErrorResponse;
};

export type HealthResponse = {
  status: "ok";
  service: typeof ELAH_HEALTH_SERVICE;
};

export type VersionResponse = {
  contractVersion: typeof ELAH_CONTRACT_VERSION;
  scorer: typeof ELAH_SCORER;
  serviceVersion: typeof ELAH_SERVICE_VERSION;
};

export type ScoreHeaders =
  | Headers
  | { get(name: string): string | null | undefined }
  | Record<string, string | string[] | undefined>;

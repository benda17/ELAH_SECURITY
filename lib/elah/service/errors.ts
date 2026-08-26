import {
  ELAH_CONTRACT_VERSION,
  type ErrorCode,
  type ErrorDetail,
  type ErrorResponse,
} from "./types";

export function errorBody(
  code: ErrorCode,
  message: string,
  requestId: string | null,
  details?: ErrorDetail[],
): ErrorResponse {
  const error: ErrorResponse["error"] = { code, message };
  if (details && details.length > 0) {
    error.details = details;
  }
  return {
    contractVersion: ELAH_CONTRACT_VERSION,
    requestId,
    error,
  };
}

export function errorResult(
  status: number,
  code: ErrorCode,
  message: string,
  requestId: string | null,
  details?: ErrorDetail[],
): { status: number; body: ErrorResponse } {
  return { status, body: errorBody(code, message, requestId, details) };
}

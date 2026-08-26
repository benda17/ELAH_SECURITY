import {
  ELAH_CONTRACT_VERSION,
  ELAH_HEALTH_SERVICE,
  ELAH_SCORER,
  ELAH_SERVICE_VERSION,
  type HealthResponse,
  type VersionResponse,
} from "./types";

export function getHealth(): HealthResponse {
  return { status: "ok", service: ELAH_HEALTH_SERVICE };
}

export function getVersion(): VersionResponse {
  return {
    contractVersion: ELAH_CONTRACT_VERSION,
    scorer: ELAH_SCORER,
    serviceVersion: ELAH_SERVICE_VERSION,
  };
}

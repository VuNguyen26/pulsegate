import type {
  DownstreamServiceError,
} from "../errors/downstream-service-error.js";

export function buildDownstreamErrorLogPayload(
  error: DownstreamServiceError,
  requestId: string,
) {
  return {
    event: "downstream_service_error" as const,
    requestId,
    errorCode: error.code,
    service: error.service,
  };
}

export function buildUnhandledGatewayErrorLogPayload(
  requestId: string,
) {
  return {
    event: "gateway_request_failed" as const,
    requestId,
    errorCode: "INTERNAL_SERVER_ERROR" as const,
  };
}
export function buildRuntimeRouteFallbackLogPayload(
  fallbackRouteCount: number,
) {
  return {
    event: "runtime_routes_database_fallback" as const,
    errorCode: "DATABASE_ROUTE_LOAD_FAILED" as const,
    fallbackRouteCount,
  };
}

export function buildRedisClientErrorLogPayload() {
  return {
    event: "redis_client_error" as const,
    errorCode: "REDIS_CLIENT_ERROR" as const,
  };
}

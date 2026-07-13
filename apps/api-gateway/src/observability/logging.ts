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
export function buildGatewayStartedLogPayload(
  port: number,
) {
  return {
    event: "api_gateway_started" as const,
    port,
  };
}

export function buildGatewayShutdownLogPayload(
  signal: "SIGINT" | "SIGTERM",
) {
  return {
    event: "api_gateway_shutdown_started" as const,
    signal,
  };
}

export function buildGatewayShutdownFailedLogPayload(
  signal: "SIGINT" | "SIGTERM",
) {
  return {
    event: "api_gateway_shutdown_failed" as const,
    errorCode: "GATEWAY_SHUTDOWN_FAILED" as const,
    signal,
  };
}

export function buildGatewayStartupFailedLogPayload() {
  return {
    event: "api_gateway_startup_failed" as const,
    errorCode: "GATEWAY_STARTUP_FAILED" as const,
  };
}

export function buildGatewayStartupCleanupFailedLogPayload() {
  return {
    event: "api_gateway_startup_cleanup_failed" as const,
    errorCode: "GATEWAY_STARTUP_CLEANUP_FAILED" as const,
  };
}

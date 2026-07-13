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
export function buildJwtInvalidLogPayload(
  requestId: string,
) {
  return {
    event: "jwt_token_invalid" as const,
    requestId,
    errorCode: "JWT_TOKEN_INVALID" as const,
  };
}
export function buildUsageRecordingFailedLogPayload(
  requestId: string,
  route: string,
) {
  return {
    event: "api_usage_recording_failed" as const,
    errorCode: "API_USAGE_RECORDING_FAILED" as const,
    requestId,
    route,
  };
}

export function buildQuotaRejectionRecordingFailedLogPayload(
  requestId: string,
  route: string,
) {
  return {
    event: "quota_rejection_recording_failed" as const,
    errorCode: "QUOTA_REJECTION_RECORDING_FAILED" as const,
    requestId,
    route,
  };
}

export function buildRateLimitRejectionRecordingFailedLogPayload(
  requestId: string,
  route: string,
) {
  return {
    event: "rate_limit_rejection_recording_failed" as const,
    errorCode: "RATE_LIMIT_REJECTION_RECORDING_FAILED" as const,
    requestId,
    route,
  };
}

export function buildAuthRejectionRecordingFailedLogPayload(
  requestId: string,
  route: string,
  authType: "api-key" | "jwt",
) {
  return {
    event: "auth_rejection_recording_failed" as const,
    errorCode: "AUTH_REJECTION_RECORDING_FAILED" as const,
    requestId,
    route,
    authType,
  };
}
export function buildResponseCacheStoreFailedLogPayload(
  requestId: string,
) {
  return {
    event: "response_cache_store_failed" as const,
    errorCode: "RESPONSE_CACHE_STORE_FAILED" as const,
    requestId,
  };
}

export function buildTracingLifecycleFailedLogPayload(
  operation: "forceFlush" | "shutdown",
) {
  return {
    event: "tracing_lifecycle_operation_failed" as const,
    errorCode:
      "TRACING_LIFECYCLE_OPERATION_FAILED" as const,
    operation,
  };
}
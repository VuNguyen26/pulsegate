export function buildProductErrorLogPayload(
  requestId: string,
) {
  return {
    event: "product_request_failed" as const,
    requestId,
    errorCode: "INTERNAL_SERVER_ERROR" as const,
  };
}
export function buildProductStartedLogPayload(
  port: number,
) {
  return {
    event: "product_service_started" as const,
    port,
  };
}

export function buildProductShutdownLogPayload(
  signal: "SIGINT" | "SIGTERM",
) {
  return {
    event: "product_service_shutdown_started" as const,
    signal,
  };
}

export function buildProductShutdownFailedLogPayload(
  signal: "SIGINT" | "SIGTERM",
) {
  return {
    event: "product_service_shutdown_failed" as const,
    errorCode: "PRODUCT_SHUTDOWN_FAILED" as const,
    signal,
  };
}

export function buildProductStartupFailedLogPayload() {
  return {
    event: "product_service_startup_failed" as const,
    errorCode: "PRODUCT_STARTUP_FAILED" as const,
  };
}

export function buildProductStartupCleanupFailedLogPayload() {
  return {
    event: "product_service_startup_cleanup_failed" as const,
    errorCode: "PRODUCT_STARTUP_CLEANUP_FAILED" as const,
  };
}

import { describe, expect, it } from "vitest";

import {
  DownstreamServiceError,
} from "../errors/downstream-service-error.js";
import {
  buildDownstreamErrorLogPayload,
  buildRateLimitIdentifierMissingLogPayload,
  buildTracingLifecycleFailedLogPayload,
  buildUnhandledGatewayErrorLogPayload,
} from "./logging.js";

describe("bounded Gateway error logging", () => {
  it("excludes raw downstream exceptions", () => {
    const error = new DownstreamServiceError({
      code: "DOWNSTREAM_SERVICE_UNAVAILABLE",
      message: "sensitive message",
      service: "product-service",
      statusCode: 503,
      originalError: new Error("secret upstream detail"),
    });

    const payload =
      buildDownstreamErrorLogPayload(error, "request-1");

    expect(payload).toEqual({
      event: "downstream_service_error",
      requestId: "request-1",
      errorCode: "DOWNSTREAM_SERVICE_UNAVAILABLE",
      service: "product-service",
    });

    expect(JSON.stringify(payload)).not.toContain("sensitive");
    expect(JSON.stringify(payload)).not.toContain("secret");
    expect(JSON.stringify(payload)).not.toContain("stack");
  });

  it("uses a fixed code for unhandled errors", () => {
    expect(
      buildUnhandledGatewayErrorLogPayload("request-2"),
    ).toEqual({
      event: "gateway_request_failed",
      requestId: "request-2",
      errorCode: "INTERNAL_SERVER_ERROR",
    });
  });

  it("uses bounded tracing lifecycle fields", () => {
    expect(
      buildTracingLifecycleFailedLogPayload(
        "forceFlush",
      ),
    ).toEqual({
      event: "tracing_lifecycle_operation_failed",
      errorCode:
        "TRACING_LIFECYCLE_OPERATION_FAILED",
      operation: "forceFlush",
    });
  });

  it("uses bounded missing rate-limit identifier fields", () => {
    expect(
      buildRateLimitIdentifierMissingLogPayload(
        "request-3",
        "api-key",
      ),
    ).toEqual({
      event: "rate_limit_identifier_missing",
      errorCode: "RATE_LIMIT_IDENTIFIER_MISSING",
      requestId: "request-3",
      identityType: "api-key",
    });
  });
});
import { describe, expect, it } from "vitest";

import {
  DownstreamServiceError,
} from "../errors/downstream-service-error.js";
import {
  buildDownstreamErrorLogPayload,
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
});
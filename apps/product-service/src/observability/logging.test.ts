import { describe, expect, it } from "vitest";

import {
  buildProductErrorLogPayload,
  buildTracingLifecycleFailedLogPayload,
} from "./logging.js";

describe("bounded Product Service error logging", () => {
  it("uses only bounded operational fields", () => {
    const payload =
      buildProductErrorLogPayload("request-1");

    expect(payload).toEqual({
      event: "product_request_failed",
      requestId: "request-1",
      errorCode: "INTERNAL_SERVER_ERROR",
    });

    expect(JSON.stringify(payload)).not.toContain(
      "secret exception detail",
    );
  });

  it("uses bounded tracing lifecycle fields", () => {
    expect(
      buildTracingLifecycleFailedLogPayload(
        "shutdown",
      ),
    ).toEqual({
      event: "tracing_lifecycle_operation_failed",
      errorCode:
        "TRACING_LIFECYCLE_OPERATION_FAILED",
      operation: "shutdown",
    });
  });
});
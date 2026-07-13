import { describe, expect, it } from "vitest";

import {
  buildProductShutdownFailedLogPayload,
  buildProductShutdownLogPayload,
  buildProductStartedLogPayload,
  buildProductStartupCleanupFailedLogPayload,
  buildProductStartupFailedLogPayload,
} from "./logging.js";

describe("bounded Product Service lifecycle logging", () => {
  it("uses bounded startup and shutdown payloads", () => {
    expect(buildProductStartedLogPayload(3001)).toEqual({
      event: "product_service_started",
      port: 3001,
    });

    expect(buildProductShutdownLogPayload("SIGTERM")).toEqual({
      event: "product_service_shutdown_started",
      signal: "SIGTERM",
    });
  });

  it("uses fixed lifecycle error codes", () => {
    const payloads = [
      buildProductShutdownFailedLogPayload("SIGINT"),
      buildProductStartupFailedLogPayload(),
      buildProductStartupCleanupFailedLogPayload(),
    ];

    expect(JSON.stringify(payloads)).not.toContain(
      "secret exception detail",
    );

    expect(payloads).toEqual([
      {
        event: "product_service_shutdown_failed",
        errorCode: "PRODUCT_SHUTDOWN_FAILED",
        signal: "SIGINT",
      },
      {
        event: "product_service_startup_failed",
        errorCode: "PRODUCT_STARTUP_FAILED",
      },
      {
        event: "product_service_startup_cleanup_failed",
        errorCode: "PRODUCT_STARTUP_CLEANUP_FAILED",
      },
    ]);
  });
});
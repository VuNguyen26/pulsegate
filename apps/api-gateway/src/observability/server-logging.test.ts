import { describe, expect, it } from "vitest";

import {
  buildGatewayShutdownFailedLogPayload,
  buildGatewayShutdownLogPayload,
  buildGatewayStartedLogPayload,
  buildGatewayStartupCleanupFailedLogPayload,
  buildGatewayStartupFailedLogPayload,
} from "./logging.js";

describe("bounded API Gateway lifecycle logging", () => {
  it("uses bounded startup and shutdown payloads", () => {
    expect(buildGatewayStartedLogPayload(3000)).toEqual({
      event: "api_gateway_started",
      port: 3000,
    });

    expect(buildGatewayShutdownLogPayload("SIGTERM")).toEqual({
      event: "api_gateway_shutdown_started",
      signal: "SIGTERM",
    });
  });

  it("uses fixed lifecycle error codes", () => {
    const payloads = [
      buildGatewayShutdownFailedLogPayload("SIGINT"),
      buildGatewayStartupFailedLogPayload(),
      buildGatewayStartupCleanupFailedLogPayload(),
    ];

    expect(JSON.stringify(payloads)).not.toContain(
      "secret exception detail",
    );

    expect(payloads).toEqual([
      {
        event: "api_gateway_shutdown_failed",
        errorCode: "GATEWAY_SHUTDOWN_FAILED",
        signal: "SIGINT",
      },
      {
        event: "api_gateway_startup_failed",
        errorCode: "GATEWAY_STARTUP_FAILED",
      },
      {
        event: "api_gateway_startup_cleanup_failed",
        errorCode: "GATEWAY_STARTUP_CLEANUP_FAILED",
      },
    ]);
  });
});
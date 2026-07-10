import { describe, expect, it } from "vitest";

import {
  DEFAULT_ADMIN_API_KEY_HEADER,
  DEFAULT_ADMIN_REQUEST_TIMEOUT_MS,
  readDashboardAdminApiConfig,
} from "./admin-api-config";

const validEnvironment = {
  PULSEGATE_GATEWAY_BASE_URL: "http://127.0.0.1:3000",
  ADMIN_READ_ONLY_API_KEY: "read-only-test-key",
};

describe("readDashboardAdminApiConfig", () => {
  it("returns a bounded read-only configuration", () => {
    expect(
      readDashboardAdminApiConfig(validEnvironment),
    ).toEqual({
      ok: true,
      config: {
        gatewayBaseUrl: "http://127.0.0.1:3000",
        apiKeyHeader: DEFAULT_ADMIN_API_KEY_HEADER,
        readOnlyApiKey: "read-only-test-key",
        requestTimeoutMs:
          DEFAULT_ADMIN_REQUEST_TIMEOUT_MS,
        accessMode: "read-only",
      },
    });
  });

  it("fails closed when the Gateway URL is missing", () => {
    const result = readDashboardAdminApiConfig({
      ADMIN_READ_ONLY_API_KEY: "read-only-test-key",
    });

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_CONFIG_MISSING",
        field: "PULSEGATE_GATEWAY_BASE_URL",
      },
    });
  });

  it("rejects a Gateway URL containing credentials", () => {
    const result = readDashboardAdminApiConfig({
      ...validEnvironment,
      PULSEGATE_GATEWAY_BASE_URL:
        "http://user:password@127.0.0.1:3000",
    });

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_CONFIG_INVALID",
        field: "PULSEGATE_GATEWAY_BASE_URL",
      },
    });
  });

  it("fails closed when the read-only key is missing", () => {
    const result = readDashboardAdminApiConfig({
      PULSEGATE_GATEWAY_BASE_URL:
        "http://127.0.0.1:3000",
    });

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_CONFIG_MISSING",
        field: "ADMIN_READ_ONLY_API_KEY",
      },
    });
  });

  it("rejects invalid header names", () => {
    const result = readDashboardAdminApiConfig({
      ...validEnvironment,
      ADMIN_API_KEY_HEADER: "invalid header",
    });

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_CONFIG_INVALID",
        field: "ADMIN_API_KEY_HEADER",
      },
    });
  });

  it("rejects an unbounded timeout", () => {
    const result = readDashboardAdminApiConfig({
      ...validEnvironment,
      ADMIN_DASHBOARD_REQUEST_TIMEOUT_MS: "60000",
    });

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_CONFIG_INVALID",
        field: "ADMIN_DASHBOARD_REQUEST_TIMEOUT_MS",
      },
    });
  });
});
import { describe, expect, it, vi } from "vitest";

import type {
  DashboardAdminApiConfig,
} from "./admin-api-config";
import {
  ADMIN_RUNTIME_STATUS_PATH,
  fetchAdminRuntimeStatus,
} from "./admin-api-client";

const config: DashboardAdminApiConfig = {
  gatewayBaseUrl: "http://127.0.0.1:3000",
  apiKeyHeader: "x-admin-api-key",
  readOnlyApiKey: "secret-read-only-key",
  requestTimeoutMs: 100,
  accessMode: "read-only",
};

describe("fetchAdminRuntimeStatus", () => {
  it("uses only the allowlisted GET endpoint", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: {
          mode: "runtime-registry",
          available: true,
          version: 2,
          loadedAt: "2026-07-10T00:00:00.000Z",
          routeCount: 1,
          routes: [
            {
              method: "GET",
              gatewayPath: "/api/products",
              serviceName: "product-service",
            },
          ],
        },
      }),
    );

    const result = await fetchAdminRuntimeStatus(
      config,
      fetchMock,
    );

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      new URL(
        ADMIN_RUNTIME_STATUS_PATH,
        config.gatewayBaseUrl,
      ),
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        headers: {
          accept: "application/json",
          "x-admin-api-key":
            "secret-read-only-key",
        },
      }),
    );
  });

  it("normalizes an unauthorized response", async () => {
    const result = await fetchAdminRuntimeStatus(
      config,
      async () =>
        Response.json(
          {
            error: {
              code: "ADMIN_API_KEY_MISSING",
              message: "Admin API key is required",
              requestId: "request-401",
            },
          },
          { status: 401 },
        ),
    );

    expect(result).toEqual({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_UNAUTHORIZED",
        message:
          "The Dashboard Admin API credential was not accepted.",
        status: 401,
        requestId: "request-401",
      },
    });
  });

  it("does not expose the Admin key in errors", async () => {
    const result = await fetchAdminRuntimeStatus(
      config,
      async () => {
        throw new Error(
          `connection failed: ${config.readOnlyApiKey}`,
        );
      },
    );

    expect(JSON.stringify(result)).not.toContain(
      config.readOnlyApiKey,
    );
    expect(result).toMatchObject({
      ok: false,
      error: {
        code:
          "ADMIN_DASHBOARD_GATEWAY_UNAVAILABLE",
      },
    });
  });

  it("rejects an invalid success payload", async () => {
    const result = await fetchAdminRuntimeStatus(
      config,
      async () =>
        Response.json({
          data: {
            available: true,
          },
        }),
    );

    expect(result).toMatchObject({
      ok: false,
      error: {
        code:
          "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });
  });
});
import { describe, expect, it, vi } from "vitest";

import type {
  DashboardAdminApiConfig,
} from "./admin-api-config";
import {
  ADMIN_GATEWAY_READ_RESOURCE_PATHS,
  fetchAdminReadResource,
  mapAdminReadResourceResponse,
  type AdminGatewayReadResource,
} from "./admin-read-resource";

const config: DashboardAdminApiConfig = {
  gatewayBaseUrl: "http://127.0.0.1:3000",
  apiKeyHeader: "x-admin-api-key",
  readOnlyApiKey: "server-only-read-key",
  requestTimeoutMs: 100,
  accessMode: "read-only",
};

type TestItem = {
  id: string;
};

function isTestItemArray(
  value: unknown,
): value is TestItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        typeof item.id === "string",
    )
  );
}

describe("fetchAdminReadResource", () => {
  it("uses only the fixed GET resource endpoint", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: [
          {
            id: "consumer_1",
          },
        ],
      }),
    );

    const result = await fetchAdminReadResource(
      config,
      "consumers",
      isTestItemArray,
      fetchMock,
    );

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      new URL(
        ADMIN_GATEWAY_READ_RESOURCE_PATHS.consumers,
        config.gatewayBaseUrl,
      ),
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        headers: {
          accept: "application/json",
          "x-admin-api-key": "server-only-read-key",
        },
      }),
    );
  });

  it("rejects a non-allowlisted resource before fetch", async () => {
    const fetchMock = vi.fn();

    const result = await fetchAdminReadResource(
      config,
      "arbitrary-path" as AdminGatewayReadResource,
      isTestItemArray,
      fetchMock,
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });
  });

  it("rejects sensitive fields in an otherwise valid payload", async () => {
    const result = await fetchAdminReadResource(
      config,
      "consumers",
      isTestItemArray,
      async () =>
        Response.json({
          data: [
            {
              id: "consumer_1",
              rawKey: "must-not-cross-the-bff",
            },
          ],
        }),
    );

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });
    expect(JSON.stringify(result)).not.toContain(
      "must-not-cross-the-bff",
    );
  });

  it("normalizes forbidden responses and preserves a safe request ID", async () => {
    const result = await fetchAdminReadResource(
      config,
      "routes",
      isTestItemArray,
      async () =>
        Response.json(
          {
            error: {
              code: "ADMIN_API_KEY_INVALID",
              message: "raw upstream detail",
              requestId: "request-403",
            },
          },
          {
            status: 403,
          },
        ),
    );

    expect(result).toEqual({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_FORBIDDEN",
        message:
          "The Dashboard is not permitted to read this resource.",
        status: 403,
        requestId: "request-403",
      },
    });
  });

  it("does not preserve an unsafe request ID", async () => {
    const result = await fetchAdminReadResource(
      config,
      "routes",
      isTestItemArray,
      async () =>
        Response.json(
          {
            error: {
              requestId: "request id with spaces",
            },
          },
          {
            status: 403,
          },
        ),
    );

    expect(result).toMatchObject({
      ok: false,
      error: {
        requestId: null,
      },
    });
  });

  it("normalizes timeouts without exposing details", async () => {
    const timeoutConfig = {
      ...config,
      requestTimeoutMs: 5,
    };

    const fetchMock: typeof fetch = async (
      _input,
      init,
    ) =>
      await new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("aborted", "AbortError"));
        });
      });

    const result = await fetchAdminReadResource(
      timeoutConfig,
      "usagePlans",
      isTestItemArray,
      fetchMock,
    );

    expect(result).toEqual({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_TIMEOUT",
        message: "PulseGate Gateway request timed out.",
        status: null,
        requestId: null,
      },
    });
  });
});

describe("mapAdminReadResourceResponse", () => {
  it("maps a successful resource without access credentials", () => {
    const response = mapAdminReadResourceResponse({
      ok: true,
      accessMode: "read-only",
      data: [
        {
          id: "consumer_1",
        },
      ],
    });

    expect(response).toEqual({
      status: 200,
      body: {
        data: [
          {
            id: "consumer_1",
          },
        ],
      },
    });
    expect(JSON.stringify(response)).not.toContain(
      config.readOnlyApiKey,
    );
  });

  it("maps configuration failures to service unavailable", () => {
    const response = mapAdminReadResourceResponse({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_CONFIG_MISSING",
        field: "ADMIN_READ_ONLY_API_KEY",
        message:
          "Read-only Admin API credential is required.",
      },
    });

    expect(response).toMatchObject({
      status: 503,
      body: {
        error: {
          code: "ADMIN_DASHBOARD_CONFIG_MISSING",
          requestId: null,
        },
      },
    });
  });
});

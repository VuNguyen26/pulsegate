import { describe, expect, it, vi } from "vitest";

import {
  DASHBOARD_RUNTIME_STATUS_PATH,
  loadDashboardRuntimeStatus,
} from "./runtime-status";

const successPayload = {
  data: {
    accessMode: "read-only",
    runtime: {
      mode: "runtime-registry",
      available: true,
      version: 2,
      loadedAt: "2026-07-10T09:05:44.086Z",
      routeCount: 1,
      routes: [
        {
          method: "GET",
          gatewayPath: "/api/products",
          serviceName: "product-service",
        },
      ],
    },
  },
};

describe("loadDashboardRuntimeStatus", () => {
  it("calls only the fixed Dashboard BFF GET endpoint", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json(successPayload),
    );

    await loadDashboardRuntimeStatus(fetchMock);

    expect(fetchMock).toHaveBeenCalledWith(
      DASHBOARD_RUNTIME_STATUS_PATH,
      {
        method: "GET",
        headers: {
          accept: "application/json",
        },
        cache: "no-store",
      },
    );

    expect(
      JSON.stringify(fetchMock.mock.calls),
    ).not.toContain("x-admin-api-key");
  });

  it("accepts the safe read-only runtime response", async () => {
    const result = await loadDashboardRuntimeStatus(
      async () => Response.json(successPayload),
    );

    expect(result).toEqual({
      status: "connected",
      data: successPayload.data,
    });
  });

  it("preserves a safe BFF error response", async () => {
    const result = await loadDashboardRuntimeStatus(
      async () =>
        Response.json(
          {
            error: {
              code: "ADMIN_DASHBOARD_FORBIDDEN",
              message:
                "The Dashboard is not permitted to read this resource.",
              requestId: "request-403",
            },
          },
          { status: 403 },
        ),
    );

    expect(result).toEqual({
      status: "error",
      error: {
        code: "ADMIN_DASHBOARD_FORBIDDEN",
        message:
          "The Dashboard is not permitted to read this resource.",
        requestId: "request-403",
      },
    });
  });

  it("rejects inconsistent runtime metadata", async () => {
    const result = await loadDashboardRuntimeStatus(
      async () =>
        Response.json({
          data: {
            ...successPayload.data,
            runtime: {
              ...successPayload.data.runtime,
              routeCount: 2,
            },
          },
        }),
    );

    expect(result).toMatchObject({
      status: "error",
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });
  });

  it("normalizes network failures without exposing details", async () => {
    const result = await loadDashboardRuntimeStatus(
      async () => {
        throw new Error("secret network detail");
      },
    );

    expect(result).toEqual({
      status: "error",
      error: {
        code: "ADMIN_DASHBOARD_UNAVAILABLE",
        message:
          "The Dashboard runtime status endpoint is unavailable.",
        requestId: null,
      },
    });

    expect(JSON.stringify(result)).not.toContain(
      "secret network detail",
    );
  });
});

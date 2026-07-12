import { describe, expect, it, vi } from "vitest";

import type {
  DashboardAdminApiConfig,
} from "./admin-api-config";
import {
  fetchAdminRouteById,
  fetchAdminRouteRuntime,
  fetchAdminRoutes,
} from "./admin-routes";

const config: DashboardAdminApiConfig = {
  gatewayBaseUrl: "http://127.0.0.1:3000",
  apiKeyHeader: "x-admin-api-key",
  readOnlyApiKey: "server-only-read-key",
  requestTimeoutMs: 100,
  accessMode: "read-only",
};

const validRoute = {
  id: "route_products",
  serviceName: "product-service",
  gatewayPath: "/api/products",
  downstreamUrl:
    "http://product-service:3001/products",
  serviceInstances: [
    {
      baseUrl:
        "http://product-service:3001",
    },
  ],
  method: "GET",
  enabled: true,
  priority: 100,
  policies: {
    auth: {
      requireApiKey: true,
      requireJwt: true,
    },
    timeout: {
      enabled: true,
      timeoutMs: 3000,
    },
    cache: {
      enabled: true,
      ttlSeconds: 30,
    },
    rateLimit: {
      enabled: true,
      limit: 5,
      windowMs: 60000,
    },
    requestTransform: {
      enabled: false,
      addHeaders: null,
      removeHeaders: null,
    },
    responseTransform: {
      enabled: false,
      addHeaders: null,
      removeHeaders: null,
    },
    retry: {
      enabled: false,
      attempts: 0,
      retryOnStatuses: [502, 503, 504],
    },
  },
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T01:00:00.000Z",
  createdBy: "admin",
  updatedBy: "admin",
  deletedAt: null,
  deletedBy: null,
};

const runtimeSnapshot = {
  mode: "runtime-registry",
  available: true,
  version: 2,
  loadedAt: "2026-07-10T12:00:00.000Z",
  routeCount: 1,
  routes: [
    {
      method: "GET",
      gatewayPath: "/api/products",
      serviceName: "product-service",
    },
  ],
};

describe("admin route readers", () => {
  it("uses the allowlisted persisted route list endpoint", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: [validRoute],
      }),
    );

    const result = await fetchAdminRoutes(
      config,
      fetchMock,
    );

    expect(result).toEqual({
      ok: true,
      accessMode: "read-only",
      data: [validRoute],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      new URL(
        "/internal/admin/routes",
        config.gatewayBaseUrl,
      ),
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        headers: {
          accept: "application/json",
          "x-admin-api-key":
            "server-only-read-key",
        },
      }),
    );
  });

  it("uses the fixed persisted route detail endpoint", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: validRoute,
      }),
    );

    const result = await fetchAdminRouteById(
      config,
      "route_products",
      fetchMock,
    );

    expect(result).toEqual({
      ok: true,
      accessMode: "read-only",
      data: validRoute,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      new URL(
        "/internal/admin/routes/route_products",
        config.gatewayBaseUrl,
      ),
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        headers: {
          accept: "application/json",
          "x-admin-api-key":
            "server-only-read-key",
        },
      }),
    );
  });

  it("rejects invalid detail ids before Gateway", async () => {
    const fetchMock = vi.fn();

    const result = await fetchAdminRouteById(
      config,
      "../runtime",
      fetchMock,
    );

    expect(result).toEqual({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_NOT_FOUND",
        message:
          "The selected persisted route was not found.",
        status: 404,
        requestId: null,
      },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed on a mismatched detail identity", async () => {
    const result = await fetchAdminRouteById(
      config,
      "route_products",
      async () =>
        Response.json({
          data: {
            ...validRoute,
            id: "route_health",
          },
        }),
    );

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });
  });

  it("uses the separate fixed runtime registry endpoint", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: runtimeSnapshot,
      }),
    );

    const result = await fetchAdminRouteRuntime(
      config,
      fetchMock,
    );

    expect(result).toEqual({
      ok: true,
      accessMode: "read-only",
      data: runtimeSnapshot,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      new URL(
        "/internal/admin/routes/runtime",
        config.gatewayBaseUrl,
      ),
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        headers: {
          accept: "application/json",
          "x-admin-api-key":
            "server-only-read-key",
        },
      }),
    );
  });

  it("normalizes a missing persisted route", async () => {
    const result = await fetchAdminRouteById(
      config,
      "route_products",
      async () =>
        Response.json(
          {
            error: {
              code: "ROUTE_CONFIG_NOT_FOUND",
              message: "raw Gateway detail",
              requestId: "request-404",
            },
          },
          {
            status: 404,
          },
        ),
    );

    expect(result).toEqual({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_NOT_FOUND",
        message:
          "The selected persisted route was not found.",
        status: 404,
        requestId: "request-404",
      },
    });
    expect(JSON.stringify(result)).not.toContain(
      "raw Gateway detail",
    );
  });

  it("rejects sensitive nested response fields", async () => {
    const result = await fetchAdminRouteById(
      config,
      "route_products",
      async () =>
        Response.json({
          data: {
            ...validRoute,
            policies: {
              ...validRoute.policies,
              rawKey: "must-not-cross-boundary",
            },
          },
        }),
    );

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });
    expect(JSON.stringify(result)).not.toContain(
      "must-not-cross-boundary",
    );
  });
});

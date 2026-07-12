import { describe, expect, it, vi } from "vitest";

import {
  MAX_DASHBOARD_ROUTES,
  countEnabledRoutePolicies,
  getDashboardRoutePath,
  isDashboardPersistedRouteList,
  isDashboardRouteId,
  isDashboardRouteRuntimeSnapshot,
  loadDashboardRoute,
  loadDashboardRouteRuntime,
  loadDashboardRoutes,
  summarizeDashboardRoutes,
  type DashboardPersistedRoute,
  type DashboardRouteRuntimeSnapshot,
} from "./routes";

const productRoute: DashboardPersistedRoute = {
  id: "route_products",
  serviceName: "product-service",
  gatewayPath: "/api/products",
  downstreamUrl:
    "http://product-service:3001/products",
  weightedUpstreams: null,
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

const healthRoute: DashboardPersistedRoute = {
  ...productRoute,
  id: "route_health",
  gatewayPath: "/api/product-service/health",
  downstreamUrl:
    "http://product-service:3001/health",
  enabled: false,
  priority: 200,
  policies: {
    ...productRoute.policies,
    auth: {
      requireApiKey: false,
      requireJwt: false,
    },
    cache: {
      enabled: false,
      ttlSeconds: 30,
    },
    rateLimit: {
      enabled: false,
      limit: 100,
      windowMs: 60000,
    },
  },
};

const runtimeSnapshot:
  DashboardRouteRuntimeSnapshot = {
    mode: "runtime-registry",
    available: true,
    version: 3,
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

describe("Dashboard route registry contract", () => {
  it("accepts safe ids and builds only a fixed detail path", () => {
    expect(isDashboardRouteId("route_products")).toBe(true);
    expect(
      isDashboardRouteId(
        "cmr1pothd0000uyp4kdr4en17",
      ),
    ).toBe(true);
    expect(isDashboardRouteId("../runtime")).toBe(false);
    expect(isDashboardRouteId("route/products")).toBe(false);
    expect(isDashboardRouteId(" route_products")).toBe(false);

    expect(
      getDashboardRoutePath("route_products"),
    ).toBe("/api/admin/routes/route_products");
  });

  it("loads persisted routes through the allowlisted GET resource", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: [productRoute, healthRoute],
      }),
    );

    const result = await loadDashboardRoutes(
      fetchMock,
    );

    expect(result).toEqual({
      status: "success",
      data: [productRoute, healthRoute],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/routes",
      {
        method: "GET",
        headers: {
          accept: "application/json",
        },
        cache: "no-store",
      },
    );
  });

  it("loads one fixed persisted route detail", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: productRoute,
      }),
    );

    const result = await loadDashboardRoute(
      "route_products",
      fetchMock,
    );

    expect(result).toEqual({
      status: "success",
      data: productRoute,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/routes/route_products",
      {
        method: "GET",
        headers: {
          accept: "application/json",
        },
        cache: "no-store",
      },
    );
  });

  it("rejects invalid detail ids before fetch", async () => {
    const fetchMock = vi.fn();

    const result = await loadDashboardRoute(
      "../routes",
      fetchMock,
    );

    expect(result).toMatchObject({
      status: "error",
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed when detail identity differs", async () => {
    const result = await loadDashboardRoute(
      "route_products",
      async () =>
        Response.json({
          data: healthRoute,
        }),
    );

    expect(result).toMatchObject({
      status: "error",
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });
  });

  it("loads runtime registry from its separate fixed path", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: runtimeSnapshot,
      }),
    );

    const result =
      await loadDashboardRouteRuntime(fetchMock);

    expect(result).toEqual({
      status: "success",
      data: runtimeSnapshot,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/routes/runtime",
      {
        method: "GET",
        headers: {
          accept: "application/json",
        },
        cache: "no-store",
      },
    );
  });

  it("rejects runtime snapshots whose count differs from routes", () => {
    expect(
      isDashboardRouteRuntimeSnapshot({
        ...runtimeSnapshot,
        routeCount: 2,
      }),
    ).toBe(false);
  });

  it("validates bounded weighted upstream metadata", () => {
    const weightedRoute: DashboardPersistedRoute = {
      ...productRoute,
      weightedUpstreams: [
        {
          downstreamUrl: productRoute.downstreamUrl,
          weight: 1,
        },
        {
          downstreamUrl:
            "http://product-service-canary:3001/products",
          weight: 3,
        },
      ],
    };

    expect(
      isDashboardPersistedRouteList([weightedRoute]),
    ).toBe(true);

    expect(
      isDashboardPersistedRouteList([
        {
          ...weightedRoute,
          weightedUpstreams: [
            {
              downstreamUrl:
                productRoute.downstreamUrl,
              weight: 1,
            },
          ],
        },
      ]),
    ).toBe(false);

    expect(
      isDashboardPersistedRouteList([
        {
          ...weightedRoute,
          weightedUpstreams: [
            {
              downstreamUrl:
                productRoute.downstreamUrl,
              weight: 1,
            },
            {
              downstreamUrl:
                productRoute.downstreamUrl,
              weight: 3,
            },
          ],
        },
      ]),
    ).toBe(false);

    expect(
      isDashboardPersistedRouteList([
        {
          ...weightedRoute,
          weightedUpstreams: [
            {
              downstreamUrl:
                "http://product-service-canary:3001/products",
              weight: 1,
            },
            {
              downstreamUrl:
                "http://product-service-next:3001/products",
              weight: 3,
            },
          ],
        },
      ]),
    ).toBe(false);

    expect(
      isDashboardPersistedRouteList([
        {
          ...weightedRoute,
          weightedUpstreams: [
            {
              downstreamUrl:
                productRoute.downstreamUrl,
              weight: 0,
            },
            {
              downstreamUrl:
                "http://product-service-canary:3001/products",
              weight: 3,
            },
          ],
        },
      ]),
    ).toBe(false);
  });
  it("rejects credential-bearing downstream URLs and oversized lists", () => {
    expect(
      isDashboardPersistedRouteList([
        {
          ...productRoute,
          downstreamUrl:
            "http://user:secret@product-service:3001/products",
        },
      ]),
    ).toBe(false);

    expect(
      isDashboardPersistedRouteList(
        Array.from(
          {
            length: MAX_DASHBOARD_ROUTES + 1,
          },
          (_, index) => ({
            ...productRoute,
            id: `route_${index}`,
          }),
        ),
      ),
    ).toBe(false);
  });

  it("summarizes persisted routes separately from runtime", () => {
    expect(
      summarizeDashboardRoutes([
        productRoute,
        healthRoute,
      ]),
    ).toEqual({
      total: 2,
      enabled: 1,
      disabled: 1,
      apiKeyProtected: 1,
      jwtProtected: 1,
    });
  });

  it("counts enabled policy groups", () => {
    expect(
      countEnabledRoutePolicies(productRoute),
    ).toBe(4);
  });
});

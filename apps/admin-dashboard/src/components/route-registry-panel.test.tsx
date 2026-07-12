import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  PersistedRouteDetail,
  RouteRegistryPanel,
  RouteRegistrySummary,
  RouteRuntimeSnapshotView,
} from "./route-registry-panel";
import type {
  DashboardPersistedRoute,
  DashboardRouteRuntimeSnapshot,
} from "../lib/routes";

const route: DashboardPersistedRoute = {
  id: "route_products",
  serviceName: "product-service",
  gatewayPath: "/api/products",
  downstreamUrl:
    "http://product-service:3001/products",
  weightedUpstreams: [
    {
      downstreamUrl:
        "http://product-service:3001/products",
      weight: 1,
    },
    {
      downstreamUrl:
        "http://product-service-canary:3001/products",
      weight: 3,
    },
  ],
  serviceInstances: [
    {
      baseUrl:
        "http://product-service:3001",
    },
    {
      baseUrl:
        "http://product-service-canary:3001",
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
    },
    responseTransform: {
      enabled: false,
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

const runtimeSnapshot:
  DashboardRouteRuntimeSnapshot = {
    mode: "runtime-registry",
    available: true,
    version: 4,
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

describe("route registry read view", () => {
  it("renders persisted summary separately", () => {
    const html = renderToStaticMarkup(
      <RouteRegistrySummary routes={[route]} />,
    );

    expect(html).toContain("Persisted routes");
    expect(html).toContain("API key protected");
    expect(html).toContain("JWT protected");
  });

  it("renders persisted policy detail without mutation controls", () => {
    const html = renderToStaticMarkup(
      <PersistedRouteDetail route={route} />,
    );

    expect(html).toContain("Persisted configuration");
    expect(html).toContain("GET");
    expect(html).toContain("/api/products");
    expect(html).toContain("API key auth");
    expect(html).toContain("Rate limit");
    expect(html).toContain("Weighted routing");
    expect(html).toContain("2 targets");
    expect(html).toContain("Weighted target 1");
    expect(html).toContain(
      "http://product-service-canary:3001/products",
    );
    expect(html).toContain("weight 3");
    expect(html).toContain("Discovery mode");
    expect(html).toContain("Service discovery");
    expect(html).toContain("2 instances");
    expect(html).toContain("Service instance 1");
    expect(html).toContain(
      "http://product-service-canary:3001",
    );
    expect(html).toContain(
      "cannot create, update, delete, or",
    );
    expect(html).not.toContain(">Reload<");
    expect(html).not.toContain(">Delete<");
    expect(html).not.toContain(">Save<");
  });

  it("renders legacy routes as single-upstream configuration", () => {
    const html = renderToStaticMarkup(
      <PersistedRouteDetail
        route={{
          ...route,
          weightedUpstreams: null,
          serviceInstances: null,
        }}
      />,
    );

    expect(html).toContain("Single upstream");
    expect(html).toContain("Static upstream");
    expect(html).not.toContain("Weighted target 1");
    expect(html).not.toContain("Service instance 1");
  });
  it("renders runtime snapshot as distinct operational state", () => {
    const html = renderToStaticMarkup(
      <RouteRuntimeSnapshotView
        snapshot={runtimeSnapshot}
      />,
    );

    expect(html).toContain("Runtime registry");
    expect(html).toContain(
      "operational runtime state",
    );
    expect(html).toContain("Version");
    expect(html).toContain("Route count");
  });

  it("server-renders safe loading states", () => {
    const html = renderToStaticMarkup(
      <RouteRegistryPanel />,
    );

    expect(html).toContain("Route registry");
    expect(html).toContain(
      "Runtime route registry",
    );
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain("x-admin-api-key");
    expect(html).not.toContain(
      "ADMIN_READ_ONLY_API_KEY",
    );
    expect(html).not.toContain("ADMIN_API_KEY");
  });
});

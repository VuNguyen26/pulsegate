import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildApiGatewayApp } from "../app.js";
import { InMemoryRateLimitStore } from "../rate-limit/in-memory-rate-limit-store.js";
import type {
  RouteConfigReadModel,
  RouteManagementRepository,
} from "../route-management/route-management.types.js";

const createdAt = new Date("2026-07-01T00:00:00.000Z");
const updatedAt = new Date("2026-07-01T01:00:00.000Z");

const protectedProductRoute: RouteConfigReadModel = {
  id: "route_products",
  serviceName: "product-service",
  gatewayPath: "/api/products",
  downstreamUrl: "http://product-service:3001/products",
  method: "GET",
  enabled: true,
  priority: 100,
  requireApiKey: true,
  requireJwt: true,
  timeoutEnabled: true,
  timeoutMs: 3000,
  cacheEnabled: true,
  cacheTtlSeconds: 30,
  rateLimitEnabled: true,
  rateLimitLimit: 5,
  rateLimitWindowMs: 60000,
  requestTransformEnabled: false,
  requestAddHeaders: null,
  requestRemoveHeaders: null,
  responseTransformEnabled: false,
  responseAddHeaders: null,
  responseRemoveHeaders: null,
  retryEnabled: false,
  retryAttempts: 0,
  retryOnStatuses: [502, 503, 504],
  createdAt,
  updatedAt,
};

const disabledHealthRoute: RouteConfigReadModel = {
  id: "route_health",
  serviceName: "product-service",
  gatewayPath: "/api/product-service/health",
  downstreamUrl: "http://product-service:3001/health",
  method: "GET",
  enabled: false,
  priority: 200,
  requireApiKey: false,
  requireJwt: false,
  timeoutEnabled: true,
  timeoutMs: 3000,
  cacheEnabled: false,
  cacheTtlSeconds: 30,
  rateLimitEnabled: false,
  rateLimitLimit: 100,
  rateLimitWindowMs: 60000,
  requestTransformEnabled: false,
  requestAddHeaders: null,
  requestRemoveHeaders: null,
  responseTransformEnabled: false,
  responseAddHeaders: null,
  responseRemoveHeaders: null,
  retryEnabled: false,
  retryAttempts: 0,
  retryOnStatuses: [502, 503, 504],
  createdAt,
  updatedAt,
};

function createTestRepository(
  routes: RouteConfigReadModel[],
): RouteManagementRepository {
  return {
    listRoutes: vi.fn(async () => routes),
    findRouteById: vi.fn(async (id: string) => {
      return routes.find((route) => route.id === id) ?? null;
    }),
  };
}

describe("adminRouteConfigRoute", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApiGatewayApp({
      logger: false,
      productProxy: {
        rateLimitStore: new InMemoryRateLimitStore(),
      },
      routeManagement: {
        repository: createTestRepository([
          protectedProductRoute,
          disabledHealthRoute,
        ]),
        adminApiKey: "test-admin-key",
        adminApiKeyHeader: "x-admin-api-key",
      },
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it("should reject route config list request when admin API key is missing", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/routes",
    });

    expect(response.statusCode).toBe(401);

    expect(response.json()).toMatchObject({
      error: {
        code: "ADMIN_API_KEY_MISSING",
        message: "Admin API key is required",
        requestId: expect.any(String),
      },
    });
  });

  it("should reject route config list request when admin API key is invalid", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/routes",
      headers: {
        "x-admin-api-key": "wrong-admin-key",
      },
    });

    expect(response.statusCode).toBe(403);

    expect(response.json()).toMatchObject({
      error: {
        code: "ADMIN_API_KEY_INVALID",
        message: "Admin API key is invalid",
        requestId: expect.any(String),
      },
    });
  });

  it("should return all route configs for an authenticated admin request", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/routes",
      headers: {
        "x-admin-api-key": "test-admin-key",
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();

    expect(body.data).toHaveLength(2);

    expect(body.data[0]).toMatchObject({
      id: "route_products",
      serviceName: "product-service",
      gatewayPath: "/api/products",
      downstreamUrl: "http://product-service:3001/products",
      method: "GET",
      enabled: true,
      priority: 100,
      policies: {
        auth: {
          requireApiKey: true,
          requireJwt: true,
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
      },
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-01T01:00:00.000Z",
    });

    expect(body.data[1]).toMatchObject({
      id: "route_health",
      gatewayPath: "/api/product-service/health",
      enabled: false,
    });
  });

  it("should return a route config by id for an authenticated admin request", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/routes/route_products",
      headers: {
        "x-admin-api-key": "test-admin-key",
      },
    });

    expect(response.statusCode).toBe(200);

    expect(response.json()).toMatchObject({
      data: {
        id: "route_products",
        gatewayPath: "/api/products",
        method: "GET",
        enabled: true,
      },
    });
  });

  it("should return 404 when route config id does not exist", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/routes/missing_route",
      headers: {
        "x-admin-api-key": "test-admin-key",
      },
    });

    expect(response.statusCode).toBe(404);

    expect(response.json()).toMatchObject({
      error: {
        code: "ROUTE_CONFIG_NOT_FOUND",
        message: "Route config was not found",
        requestId: expect.any(String),
      },
    });
  });
});
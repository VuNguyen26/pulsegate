import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildApiGatewayApp } from "../app.js";
import { InMemoryRateLimitStore } from "../rate-limit/in-memory-rate-limit-store.js";
import type {
  RouteConfigCreateData,
  RouteConfigReadModel,
  RouteConfigUpdateData,
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
  const storedRoutes = [...routes];

  return {
    listRoutes: vi.fn(async () => {
      return storedRoutes.filter((route) => !route.deletedAt);
    }),

    findRouteById: vi.fn(async (id: string) => {
      return (
        storedRoutes.find((route) => route.id === id && !route.deletedAt) ?? null
      );
    }),

    findRouteByMethodAndGatewayPath: vi.fn(
      async (method, gatewayPath) => {
        return (
          storedRoutes.find(
            (route) =>
              route.method === method &&
              route.gatewayPath === gatewayPath &&
              !route.deletedAt,
          ) ?? null
        );
      },
    ),

    createRoute: vi.fn(async (data: RouteConfigCreateData) => {
      const createdRoute: RouteConfigReadModel = {
        id: `route_${storedRoutes.length + 1}`,
        serviceName: data.serviceName,
        gatewayPath: data.gatewayPath,
        downstreamUrl: data.downstreamUrl,
        method: data.method,
        enabled: data.enabled,
        priority: data.priority,
        requireApiKey: data.requireApiKey,
        requireJwt: data.requireJwt,
        timeoutEnabled: data.timeoutEnabled,
        timeoutMs: data.timeoutMs,
        cacheEnabled: data.cacheEnabled,
        cacheTtlSeconds: data.cacheTtlSeconds,
        rateLimitEnabled: data.rateLimitEnabled,
        rateLimitLimit: data.rateLimitLimit,
        rateLimitWindowMs: data.rateLimitWindowMs,
        requestTransformEnabled: data.requestTransformEnabled,
        requestAddHeaders: data.requestAddHeaders,
        requestRemoveHeaders: data.requestRemoveHeaders,
        responseTransformEnabled: data.responseTransformEnabled,
        responseAddHeaders: data.responseAddHeaders,
        responseRemoveHeaders: data.responseRemoveHeaders,
        retryEnabled: data.retryEnabled,
        retryAttempts: data.retryAttempts,
        retryOnStatuses: data.retryOnStatuses,
        createdAt,
        updatedAt,
        createdBy: data.createdBy ?? null,
        updatedBy: data.updatedBy ?? null,
        deletedAt: null,
        deletedBy: null,
      };

      storedRoutes.push(createdRoute);

      return createdRoute;
    }),

    updateRoute: vi.fn(async (id: string, data: RouteConfigUpdateData) => {
      const routeIndex = storedRoutes.findIndex((route) => route.id === id);

      if (routeIndex === -1) {
        throw new Error("Route config not found");
      }

      const updatedRoute: RouteConfigReadModel = {
        id,
        serviceName: data.serviceName,
        gatewayPath: data.gatewayPath,
        downstreamUrl: data.downstreamUrl,
        method: data.method,
        enabled: data.enabled,
        priority: data.priority,
        requireApiKey: data.requireApiKey,
        requireJwt: data.requireJwt,
        timeoutEnabled: data.timeoutEnabled,
        timeoutMs: data.timeoutMs,
        cacheEnabled: data.cacheEnabled,
        cacheTtlSeconds: data.cacheTtlSeconds,
        rateLimitEnabled: data.rateLimitEnabled,
        rateLimitLimit: data.rateLimitLimit,
        rateLimitWindowMs: data.rateLimitWindowMs,
        requestTransformEnabled: data.requestTransformEnabled,
        requestAddHeaders: data.requestAddHeaders,
        requestRemoveHeaders: data.requestRemoveHeaders,
        responseTransformEnabled: data.responseTransformEnabled,
        responseAddHeaders: data.responseAddHeaders,
        responseRemoveHeaders: data.responseRemoveHeaders,
        retryEnabled: data.retryEnabled,
        retryAttempts: data.retryAttempts,
        retryOnStatuses: data.retryOnStatuses,
        createdAt: storedRoutes[routeIndex].createdAt,
        updatedAt,
        createdBy: storedRoutes[routeIndex].createdBy ?? null,
        updatedBy: data.updatedBy ?? null,
        deletedAt: storedRoutes[routeIndex].deletedAt ?? null,
        deletedBy: storedRoutes[routeIndex].deletedBy ?? null,
      };

      storedRoutes[routeIndex] = updatedRoute;

      return updatedRoute;
    }),

    softDeleteRoute: vi.fn(async (id: string, actor: string) => {
      const routeIndex = storedRoutes.findIndex((route) => route.id === id);

      if (routeIndex === -1) {
        throw new Error("Route config not found");
      }

      const deletedRoute: RouteConfigReadModel = {
        ...storedRoutes[routeIndex],
        enabled: false,
        updatedAt,
        updatedBy: actor,
        deletedAt: updatedAt,
        deletedBy: actor,
      };

      storedRoutes[routeIndex] = deletedRoute;

      return deletedRoute;
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

  it("should create a route config for an authenticated admin request", async () => {
  const response = await app.inject({
    method: "POST",
    url: "/internal/admin/routes",
    headers: {
      "content-type": "application/json",
      "x-admin-api-key": "test-admin-key",
    },
    payload: JSON.stringify({
      serviceName: "product-service",
      gatewayPath: "/api/product-service/new-health",
      downstreamUrl: "http://product-service:3001/health",
      method: "GET",
      enabled: true,
      priority: 300,
      policies: {
        auth: {
          requireApiKey: false,
          requireJwt: false,
        },
        timeout: {
          enabled: true,
          timeoutMs: 3000,
        },
        cache: {
          enabled: false,
        },
        rateLimit: {
          enabled: false,
        },
      },
    }),
  });

  expect(response.statusCode).toBe(201);

  expect(response.json()).toMatchObject({
    data: {
      id: "route_3",
      serviceName: "product-service",
      gatewayPath: "/api/product-service/new-health",
      downstreamUrl: "http://product-service:3001/health",
      method: "GET",
      enabled: true,
      priority: 300,
      policies: {
        auth: {
          requireApiKey: false,
          requireJwt: false,
        },
        timeout: {
          enabled: true,
          timeoutMs: 3000,
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
    },
  });
});

it("should reject route config create request when downstreamUrl is invalid", async () => {
  const response = await app.inject({
    method: "POST",
    url: "/internal/admin/routes",
    headers: {
      "content-type": "application/json",
      "x-admin-api-key": "test-admin-key",
    },
    payload: JSON.stringify({
      serviceName: "product-service",
      gatewayPath: "/api/invalid-route",
      downstreamUrl: "not-a-url",
      method: "GET",
    }),
  });

  expect(response.statusCode).toBe(400);

  expect(response.json()).toMatchObject({
    error: {
      code: "ROUTE_CONFIG_INVALID",
      message: "Route config is invalid",
      details: expect.stringContaining("downstreamUrl must be a valid URL"),
      requestId: expect.any(String),
    },
  });
});

it("should reject route config create request when method and gateway path already exist", async () => {
  const response = await app.inject({
    method: "POST",
    url: "/internal/admin/routes",
    headers: {
      "content-type": "application/json",
      "x-admin-api-key": "test-admin-key",
    },
    payload: JSON.stringify({
      serviceName: "product-service",
      gatewayPath: "/api/products",
      downstreamUrl: "http://product-service:3001/products",
      method: "GET",
    }),
  });

  expect(response.statusCode).toBe(409);

  expect(response.json()).toMatchObject({
    error: {
      code: "ROUTE_CONFIG_ALREADY_EXISTS",
      message: "Route config already exists for this method and gateway path",
      requestId: expect.any(String),
    },
  });
});

it("should reject route config create request when admin API key is missing", async () => {
  const response = await app.inject({
    method: "POST",
    url: "/internal/admin/routes",
    headers: {
      "content-type": "application/json",
    },
    payload: JSON.stringify({
      serviceName: "product-service",
      gatewayPath: "/api/product-service/new-health",
      downstreamUrl: "http://product-service:3001/health",
      method: "GET",
    }),
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

it("should update a route config for an authenticated admin request", async () => {
  const response = await app.inject({
    method: "PATCH",
    url: "/internal/admin/routes/route_health",
    headers: {
      "content-type": "application/json",
      "x-admin-api-key": "test-admin-key",
    },
    payload: JSON.stringify({
      enabled: true,
      priority: 250,
      policies: {
        timeout: {
          timeoutMs: 4000,
        },
      },
    }),
  });

  expect(response.statusCode).toBe(200);

  expect(response.json()).toMatchObject({
    data: {
      id: "route_health",
      serviceName: "product-service",
      gatewayPath: "/api/product-service/health",
      downstreamUrl: "http://product-service:3001/health",
      method: "GET",
      enabled: true,
      priority: 250,
      policies: {
        auth: {
          requireApiKey: false,
          requireJwt: false,
        },
        timeout: {
          enabled: true,
          timeoutMs: 4000,
        },
      },
    },
  });
});

it("should return 404 when updating a route config that does not exist", async () => {
  const response = await app.inject({
    method: "PATCH",
    url: "/internal/admin/routes/missing_route",
    headers: {
      "content-type": "application/json",
      "x-admin-api-key": "test-admin-key",
    },
    payload: JSON.stringify({
      enabled: false,
    }),
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

it("should reject route config update request when merged route config is invalid", async () => {
  const response = await app.inject({
    method: "PATCH",
    url: "/internal/admin/routes/route_health",
    headers: {
      "content-type": "application/json",
      "x-admin-api-key": "test-admin-key",
    },
    payload: JSON.stringify({
      downstreamUrl: "not-a-url",
    }),
  });

  expect(response.statusCode).toBe(400);

  expect(response.json()).toMatchObject({
    error: {
      code: "ROUTE_CONFIG_INVALID",
      message: "Route config is invalid",
      details: expect.stringContaining("downstreamUrl must be a valid URL"),
      requestId: expect.any(String),
    },
  });
});

it("should reject route config update request when method and gateway path conflict with another route", async () => {
  const response = await app.inject({
    method: "PATCH",
    url: "/internal/admin/routes/route_health",
    headers: {
      "content-type": "application/json",
      "x-admin-api-key": "test-admin-key",
    },
    payload: JSON.stringify({
      gatewayPath: "/api/products",
      method: "GET",
    }),
  });

  expect(response.statusCode).toBe(409);

  expect(response.json()).toMatchObject({
    error: {
      code: "ROUTE_CONFIG_ALREADY_EXISTS",
      message: "Route config already exists for this method and gateway path",
      requestId: expect.any(String),
    },
  });
});

it("should reject route config update request when admin API key is missing", async () => {
  const response = await app.inject({
    method: "PATCH",
    url: "/internal/admin/routes/route_health",
    headers: {
      "content-type": "application/json",
    },
    payload: JSON.stringify({
      enabled: false,
    }),
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

  it("should soft delete a route config for an authenticated admin request", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: "/internal/admin/routes/route_health",
      headers: {
        "x-admin-api-key": "test-admin-key",
        "x-admin-actor": "test-admin",
      },
    });

    expect(response.statusCode).toBe(200);

    expect(response.json()).toMatchObject({
      data: {
        id: "route_health",
        gatewayPath: "/api/product-service/health",
        enabled: false,
        updatedBy: "test-admin",
        deletedAt: "2026-07-01T01:00:00.000Z",
        deletedBy: "test-admin",
      },
    });
  });

  it("should hide a soft deleted route from route config list", async () => {
    const deleteResponse = await app.inject({
      method: "DELETE",
      url: "/internal/admin/routes/route_health",
      headers: {
        "x-admin-api-key": "test-admin-key",
        "x-admin-actor": "test-admin",
      },
    });

    expect(deleteResponse.statusCode).toBe(200);

    const listResponse = await app.inject({
      method: "GET",
      url: "/internal/admin/routes",
      headers: {
        "x-admin-api-key": "test-admin-key",
      },
    });

    expect(listResponse.statusCode).toBe(200);

    const body = listResponse.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      id: "route_products",
      gatewayPath: "/api/products",
    });
  });

  it("should return 404 when reading a soft deleted route config by id", async () => {
    const deleteResponse = await app.inject({
      method: "DELETE",
      url: "/internal/admin/routes/route_health",
      headers: {
        "x-admin-api-key": "test-admin-key",
      },
    });

    expect(deleteResponse.statusCode).toBe(200);

    const detailResponse = await app.inject({
      method: "GET",
      url: "/internal/admin/routes/route_health",
      headers: {
        "x-admin-api-key": "test-admin-key",
      },
    });

    expect(detailResponse.statusCode).toBe(404);

    expect(detailResponse.json()).toMatchObject({
      error: {
        code: "ROUTE_CONFIG_NOT_FOUND",
        message: "Route config was not found",
        requestId: expect.any(String),
      },
    });
  });

  it("should return 404 when deleting a route config that does not exist", async () => {
    const response = await app.inject({
      method: "DELETE",
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

  it("should reject route config delete request when admin API key is missing", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: "/internal/admin/routes/route_health",
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

    it("should validate route configs for reload without applying runtime changes", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/internal/admin/routes/reload",
      headers: {
        "x-admin-api-key": "test-admin-key",
      },
    });

    expect(response.statusCode).toBe(200);

    expect(response.json()).toMatchObject({
      data: {
        mode: "validation-only",
        runtimeApplied: false,
        requiresRestart: true,
        routeCount: 1,
        routes: [
          {
            method: "GET",
            gatewayPath: "/api/products",
            enabled: true,
            priority: 100,
          },
        ],
      },
    });
  });

  it("should reject route config reload validation when admin API key is missing", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/internal/admin/routes/reload",
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

  it("should reject route config reload validation when admin API key is invalid", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/internal/admin/routes/reload",
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

  it("should return runtime route registry status for an authenticated admin request", async () => {
  const response = await app.inject({
    method: "GET",
    url: "/internal/admin/routes/runtime",
    headers: {
      "x-admin-api-key": "test-admin-key",
    },
  });

  expect(response.statusCode).toBe(200);
  expect(response.json()).toMatchObject({
    data: {
      mode: "runtime-registry",
      available: true,
      version: 1,
      loadedAt: expect.any(String),
      routeCount: 2,
      routes: [
        {
          method: "GET",
          gatewayPath: "/api/products",
          serviceName: "product-service",
        },
        {
          method: "GET",
          gatewayPath: "/api/product-service/health",
          serviceName: "product-service",
        },
      ],
    },
  });
});

it("should reject runtime route registry status request when admin API key is missing", async () => {
  const response = await app.inject({
    method: "GET",
    url: "/internal/admin/routes/runtime",
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
});
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildApiGatewayApp } from "../app.js";
import {
  productProductsRouteConfig,
  type DownstreamRouteConfig,
} from "../config/downstream-routes.js";
import { InMemoryRateLimitStore } from "../rate-limit/in-memory-rate-limit-store.js";
import {
  createRouteRuntimeRegistry,
  type RouteRuntimeRegistry,
} from "../runtime/route-runtime-registry.js";

const dynamicHealthRouteConfig: DownstreamRouteConfig = {
  serviceName: "product-service",
  gatewayPath: "/api/dynamic-health",
  downstreamUrl: "http://product-service:3001/health",
  method: "GET",
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
      ttlSeconds: 0,
    },
    rateLimit: {
      enabled: false,
      limit: 0,
      windowMs: 0,
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
};

describe("dynamic downstream proxy route", () => {
  let app: FastifyInstance;
  let routeRuntimeRegistry: RouteRuntimeRegistry;

  beforeEach(async () => {
    routeRuntimeRegistry = createRouteRuntimeRegistry({
      initialRoutes: [productProductsRouteConfig],
    });

    app = await buildApiGatewayApp({
      logger: false,
      routeConfigs: [productProductsRouteConfig],
      routeRuntimeRegistry,
      productProxy: {
        rateLimitStore: new InMemoryRateLimitStore(),
      },
    });
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await app.close();
  });

  it("should proxy a brand-new API path after runtime registry replacement without app restart", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          service: "product-service",
          status: "ok",
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    const beforeReloadResponse = await app.inject({
      method: "GET",
      url: "/api/dynamic-health",
    });

    expect(beforeReloadResponse.statusCode).toBe(404);
    expect(beforeReloadResponse.json()).toMatchObject({
      error: {
        code: "ROUTE_NOT_FOUND",
        message: "Route not found",
        requestId: expect.any(String),
      },
    });

    expect(fetchMock).not.toHaveBeenCalled();

    routeRuntimeRegistry.replaceRoutes([
      productProductsRouteConfig,
      dynamicHealthRouteConfig,
    ]);

    const afterReloadResponse = await app.inject({
      method: "GET",
      url: "/api/dynamic-health",
    });

    expect(afterReloadResponse.statusCode).toBe(200);
    expect(afterReloadResponse.headers["x-cache"]).toBe("BYPASS");
    expect(afterReloadResponse.json()).toMatchObject({
      service: "product-service",
      status: "ok",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [downstreamUrl, downstreamOptions] = fetchMock.mock.calls[0];

    expect(downstreamUrl).toBe("http://product-service:3001/health");
    expect(downstreamOptions).toMatchObject({
      method: "GET",
      headers: {
        "x-request-id": expect.any(String),
      },
    });
  });
});
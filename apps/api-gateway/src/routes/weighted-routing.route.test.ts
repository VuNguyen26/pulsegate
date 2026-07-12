import Fastify, {
  type FastifyInstance,
} from "fastify";
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  ResponseCacheStore,
} from "../cache/redis-response-cache-store.js";
import {
  productProductsRouteConfig,
  type DownstreamRouteConfig,
} from "../config/downstream-routes.js";
import {
  InMemoryRateLimitStore,
} from "../rate-limit/in-memory-rate-limit-store.js";
import {
  createRouteRuntimeRegistry,
  type RouteRuntimeRegistry,
} from "../runtime/route-runtime-registry.js";
import {
  downstreamProxyRoute,
} from "./product-proxy.route.js";

type WeightedRouteOptions = {
  requestHost?: string;
  gatewayPath?: string;
  targetName?: string;
  cacheEnabled?: boolean;
  retryEnabled?: boolean;
  discoveryEnabled?: boolean;
};

function createWeightedRoute(
  options: WeightedRouteOptions = {},
): DownstreamRouteConfig {
  const baseRoute =
    structuredClone(productProductsRouteConfig);

  const targetName =
    options.targetName ?? "product-service";

  const primaryDownstreamUrl =
    `http://${targetName}-a:3001/products`;

  return {
    ...baseRoute,
    ...(options.requestHost
      ? {
          requestHost: options.requestHost,
        }
      : {}),
    gatewayPath:
      options.gatewayPath ?? "/api/products",
    downstreamUrl: primaryDownstreamUrl,
    weightedUpstreams: [
      {
        downstreamUrl: primaryDownstreamUrl,
        weight: 1,
      },
      {
        downstreamUrl:
          `http://${targetName}-b:3001/products`,
        weight: 3,
      },
    ],
    ...(options.discoveryEnabled
      ? {
          serviceInstances: [
            {
              baseUrl:
                `http://${targetName}-a:3001`,
            },
            {
              baseUrl:
                `http://${targetName}-b:3001`,
            },
          ],
        }
      : {}),
    policies: {
      ...baseRoute.policies,
      auth: {
        requireApiKey: false,
        requireJwt: false,
      },
      cache: {
        enabled: options.cacheEnabled ?? false,
        ttlSeconds: 30,
      },
      rateLimit: {
        enabled: false,
        limit: 1,
        windowMs: 60_000,
      },
      retry: {
        enabled: options.retryEnabled ?? false,
        attempts: options.retryEnabled ? 1 : 0,
        retryOnStatuses: [502],
      },
    },
  };
}

async function buildWeightedApp(options: {
  routes: DownstreamRouteConfig[];
  weightedRandomSource: () => number;
  responseCacheStore?: ResponseCacheStore;
  routeRuntimeRegistry?: RouteRuntimeRegistry;
}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
  });

  await app.register(downstreamProxyRoute, {
    routeConfigs: options.routes,
    routeRuntimeRegistry:
      options.routeRuntimeRegistry,
    rateLimitStore:
      new InMemoryRateLimitStore(),
    responseCacheStore:
      options.responseCacheStore,
    weightedRandomSource:
      options.weightedRandomSource,
  });

  return app;
}

function installSuccessfulFetchMock() {
  const fetchMock = vi.fn(
    async (
      input: string | URL | Request,
    ): Promise<Response> =>
      new Response(
        JSON.stringify({
          downstreamUrl: String(input),
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

  return fetchMock;
}

describe("weighted downstream routing", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    vi.unstubAllGlobals();

    if (app) {
      await app.close();
      app = undefined;
    }
  });

  it("should select a configured target for a path-only route", async () => {
    const fetchMock =
      installSuccessfulFetchMock();

    const weightedRandomSource =
      vi.fn(() => 0.25);

    app = await buildWeightedApp({
      routes: [createWeightedRoute()],
      weightedRandomSource,
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/products",
    });

    expect(response.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://product-service-b:3001/products",
    );
    expect(weightedRandomSource).toHaveBeenCalledTimes(1);
  });

  it("should match an exact host before weighted selection", async () => {
    const fetchMock =
      installSuccessfulFetchMock();

    const weightedRandomSource =
      vi.fn(() => 0.25);

    app = await buildWeightedApp({
      routes: [
        createWeightedRoute({
          requestHost: "tenant.example.com",
          targetName: "tenant-product",
        }),
        createWeightedRoute({
          targetName: "fallback-product",
        }),
      ],
      weightedRandomSource,
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/products",
      headers: {
        host: "tenant.example.com",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://tenant-product-b:3001/products",
    );
    expect(weightedRandomSource).toHaveBeenCalledTimes(1);
  });

  it("should reuse one selected target for every retry", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: "temporary failure",
          }),
          {
            status: 503,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
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

    const weightedRandomSource =
      vi.fn(() => 0.25);

    app = await buildWeightedApp({
      routes: [
        createWeightedRoute({
          retryEnabled: true,
        }),
      ],
      weightedRandomSource,
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/products",
    });

    expect(response.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(
      fetchMock.mock.calls.map(
        ([downstreamUrl]) => downstreamUrl,
      ),
    ).toEqual([
      "http://product-service-b:3001/products",
      "http://product-service-b:3001/products",
    ]);
    expect(weightedRandomSource).toHaveBeenCalledTimes(1);
  });

  it("should fail over across eligible weighted discovery instances", async () => {
    const route =
      createWeightedRoute({
        retryEnabled: true,
        discoveryEnabled: true,
      });

    const registry =
      createRouteRuntimeRegistry({
        initialRoutes: [route],
      });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: "temporary failure",
          }),
          {
            status: 503,
            headers: {
              "content-type":
                "application/json",
            },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: "ok",
          }),
          {
            status: 200,
            headers: {
              "content-type":
                "application/json",
            },
          },
        ),
      );

    vi.stubGlobal("fetch", fetchMock);

    const weightedRandomSource =
      vi.fn(() => 0.25);

    app = await buildWeightedApp({
      routes: [route],
      routeRuntimeRegistry: registry,
      weightedRandomSource,
    });

    const response = await app.inject({
      method: "GET",
      url: route.gatewayPath,
    });

    expect(response.statusCode).toBe(200);

    expect(
      fetchMock.mock.calls.map(
        ([downstreamUrl]) =>
          downstreamUrl,
      ),
    ).toEqual([
      "http://product-service-b:3001/products",
      "http://product-service-a:3001/products",
    ]);

    expect(
      weightedRandomSource,
    ).toHaveBeenCalledTimes(2);

    expect(
      registry.getServiceInstanceHealthStatus(
        "product-service",
        "http://product-service-b:3001",
      ),
    ).toMatchObject({
      consecutiveFailures: 1,
      state: "healthy",
      eligible: true,
    });
  });
  it("should not select or fetch a target on a cache hit", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const weightedRandomSource =
      vi.fn(() => 0.25);

    const responseCacheStore:
      ResponseCacheStore = {
        async get() {
          return {
            hit: true as const,
            value: {
              statusCode: 200,
              body: {
                source: "cache",
              },
            },
          };
        },

        async set() {
          return;
        },
      };

    app = await buildWeightedApp({
      routes: [
        createWeightedRoute({
          cacheEnabled: true,
        }),
      ],
      weightedRandomSource,
      responseCacheStore,
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/products",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-cache"]).toBe("HIT");
    expect(response.json()).toEqual({
      source: "cache",
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(weightedRandomSource).not.toHaveBeenCalled();
  });

  it("should apply weighted selection after a runtime route replacement", async () => {
    const fetchMock =
      installSuccessfulFetchMock();

    const weightedRandomSource =
      vi.fn(() => 0.25);

    const initialRoute =
      createWeightedRoute();

    const dynamicRoute =
      createWeightedRoute({
        gatewayPath: "/api/weighted-health",
        targetName: "dynamic-product",
      });

    const routeRuntimeRegistry =
      createRouteRuntimeRegistry({
        initialRoutes: [initialRoute],
      });

    app = await buildWeightedApp({
      routes: [initialRoute],
      routeRuntimeRegistry,
      weightedRandomSource,
    });

    routeRuntimeRegistry.replaceRoutes([
      initialRoute,
      dynamicRoute,
    ]);

    const response = await app.inject({
      method: "GET",
      url: "/api/weighted-health",
    });

    expect(response.statusCode).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://dynamic-product-b:3001/products",
    );
    expect(weightedRandomSource).toHaveBeenCalledTimes(1);
  });
});

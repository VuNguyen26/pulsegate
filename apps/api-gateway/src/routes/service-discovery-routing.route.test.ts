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
  registerErrorHandlers,
} from "../middlewares/error-handler.middleware.js";
import {
  createDownstreamProxyHandler,
} from "../proxy/downstream-proxy-handler.js";
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

function createDiscoveryRoute(
  options: {
    gatewayPath?: string;
    downstreamPath?: string;
    cacheEnabled?: boolean;
    retryEnabled?: boolean;
  } = {},
): DownstreamRouteConfig {
  const route =
    structuredClone(
      productProductsRouteConfig,
    );

  const downstreamPath =
    options.downstreamPath ??
    "/products";

  return {
    ...route,
    gatewayPath:
      options.gatewayPath ??
      "/api/products",
    downstreamUrl:
      `http://product-a:3001${downstreamPath}`,
    serviceInstances: [
      {
        baseUrl:
          "http://product-a:3001",
      },
      {
        baseUrl:
          "http://product-b:3001",
      },
    ],
    policies: {
      ...route.policies,
      auth: {
        requireApiKey: false,
        requireJwt: false,
      },
      cache: {
        enabled:
          options.cacheEnabled ??
          false,
        ttlSeconds: 30,
      },
      rateLimit: {
        enabled: false,
        limit: 1,
        windowMs: 60_000,
      },
      retry: {
        enabled:
          options.retryEnabled ??
          false,
        attempts:
          options.retryEnabled
            ? 1
            : 0,
        retryOnStatuses: [502],
      },
    },
  };
}

async function buildDiscoveryApp(
  options: {
    routes:
      readonly DownstreamRouteConfig[];
    serviceDiscoveryRandomSource:
      () => number;
    routeRuntimeRegistry?:
      RouteRuntimeRegistry;
    responseCacheStore?:
      ResponseCacheStore;
  },
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
  });

  registerErrorHandlers(app);

  await app.register(
    downstreamProxyRoute,
    {
      routeConfigs: options.routes,
      routeRuntimeRegistry:
        options.routeRuntimeRegistry,
      rateLimitStore:
        new InMemoryRateLimitStore(),
      responseCacheStore:
        options.responseCacheStore,
      serviceDiscoveryRandomSource:
        options.serviceDiscoveryRandomSource,
    },
  );

  return app;
}

function installSuccessfulFetchMock() {
  const fetchMock = vi.fn(
    async (
      input:
        | string
        | URL
        | Request,
    ): Promise<Response> =>
      new Response(
        JSON.stringify({
          downstreamUrl:
            String(input),
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

  return fetchMock;
}

describe(
  "service discovery routing",
  () => {
    let app:
      | FastifyInstance
      | undefined;

    afterEach(async () => {
      vi.unstubAllGlobals();

      if (app) {
        await app.close();
        app = undefined;
      }
    });

    it(
      "selects one configured instance for a fixed route",
      async () => {
        const fetchMock =
          installSuccessfulFetchMock();

        const randomSource =
          vi.fn(() => 0.999);

        app =
          await buildDiscoveryApp({
            routes: [
              createDiscoveryRoute(),
            ],
            serviceDiscoveryRandomSource:
              randomSource,
          });

        const response =
          await app.inject({
            method: "GET",
            url: "/api/products",
          });

        expect(
          response.statusCode,
        ).toBe(200);

        expect(
          fetchMock.mock.calls[0]?.[0],
        ).toBe(
          "http://product-b:3001/products",
        );

        expect(
          randomSource,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      "reuses one discovered target for every retry",
      async () => {
        const fetchMock = vi
          .fn()
          .mockResolvedValueOnce(
            new Response(
              JSON.stringify({
                error:
                  "temporary failure",
              }),
              {
                status: 502,
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
                ok: true,
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

        vi.stubGlobal(
          "fetch",
          fetchMock,
        );

        const randomSource =
          vi.fn(() => 0.999);

        app =
          await buildDiscoveryApp({
            routes: [
              createDiscoveryRoute({
                retryEnabled: true,
              }),
            ],
            serviceDiscoveryRandomSource:
              randomSource,
          });

        const response =
          await app.inject({
            method: "GET",
            url: "/api/products",
          });

        expect(
          response.statusCode,
        ).toBe(200);

        expect(
          fetchMock.mock.calls.map(
            ([target]) => target,
          ),
        ).toEqual([
          "http://product-b:3001/products",
          "http://product-b:3001/products",
        ]);

        expect(
          randomSource,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      "does not resolve or fetch a target on a cache hit",
      async () => {
        const fetchMock = vi.fn();

        vi.stubGlobal(
          "fetch",
          fetchMock,
        );

        const randomSource =
          vi.fn(() => 0.999);

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

        app =
          await buildDiscoveryApp({
            routes: [
              createDiscoveryRoute({
                cacheEnabled: true,
              }),
            ],
            responseCacheStore,
            serviceDiscoveryRandomSource:
              randomSource,
          });

        const response =
          await app.inject({
            method: "GET",
            url: "/api/products",
          });

        expect(
          response.statusCode,
        ).toBe(200);

        expect(
          response.headers["x-cache"],
        ).toBe("HIT");

        expect(response.json()).toEqual({
          source: "cache",
        });

        expect(
          fetchMock,
        ).not.toHaveBeenCalled();

        expect(
          randomSource,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "uses the replaced discovery snapshot for a dynamic route",
      async () => {
        const fetchMock =
          installSuccessfulFetchMock();

        const initialRoute =
          createDiscoveryRoute();

        const dynamicRoute =
          createDiscoveryRoute({
            gatewayPath:
              "/api/discovered-health",
            downstreamPath:
              "/health",
          });

        const registry =
          createRouteRuntimeRegistry({
            initialRoutes: [
              initialRoute,
            ],
          });

        const randomSource =
          vi.fn(() => 0.999);

        app =
          await buildDiscoveryApp({
            routes: [
              initialRoute,
            ],
            routeRuntimeRegistry:
              registry,
            serviceDiscoveryRandomSource:
              randomSource,
          });

        registry.replaceRoutes([
          initialRoute,
          dynamicRoute,
        ]);

        const response =
          await app.inject({
            method: "GET",
            url:
              "/api/discovered-health",
          });

        expect(
          response.statusCode,
        ).toBe(200);

        expect(
          fetchMock.mock.calls[0]?.[0],
        ).toBe(
          "http://product-b:3001/health",
        );

        expect(
          randomSource,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      "fails closed when the runtime snapshot cannot resolve the service",
      async () => {
        const route =
          createDiscoveryRoute();

        const fetchMock = vi.fn();

        vi.stubGlobal(
          "fetch",
          fetchMock,
        );

        const randomSource =
          vi.fn(() => 0);

        app = Fastify({
          logger: false,
        });

        registerErrorHandlers(app);

        app.get(
          route.gatewayPath,
          createDownstreamProxyHandler({
            routeConfigResolver:
              () => route,
            routeRuntimeRegistry:
              createRouteRuntimeRegistry(),
            serviceDiscoveryRandomSource:
              randomSource,
          }),
        );

        const response =
          await app.inject({
            method: "GET",
            url: route.gatewayPath,
          });

        expect(
          response.statusCode,
        ).toBe(503);

        expect(response.json()).toMatchObject({
          error: {
            code:
              "DOWNSTREAM_SERVICE_UNAVAILABLE",
            service:
              "product-service",
          },
        });

        expect(
          fetchMock,
        ).not.toHaveBeenCalled();

        expect(
          randomSource,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
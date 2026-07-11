import Fastify, {
  type FastifyInstance,
  type FastifyRequest,
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
} from "../runtime/route-runtime-registry.js";
import {
  downstreamProxyRoute,
} from "./product-proxy.route.js";

type CreateRouteOptions = {
  requestHost?: string;
  downstreamUrl: string;
  cacheEnabled?: boolean;
  rateLimitEnabled?: boolean;
};

function createRoute(
  options: CreateRouteOptions,
): DownstreamRouteConfig {
  const baseRoute =
    structuredClone(productProductsRouteConfig);

  return {
    ...baseRoute,
    ...(options.requestHost
      ? {
          requestHost: options.requestHost,
        }
      : {}),
    downstreamUrl: options.downstreamUrl,
    policies: {
      ...baseRoute.policies,
      auth: {
        requireApiKey:
          options.rateLimitEnabled ?? false,
        requireJwt: false,
      },
      cache: {
        enabled: options.cacheEnabled ?? false,
        ttlSeconds: 30,
      },
      rateLimit: {
        enabled:
          options.rateLimitEnabled ?? false,
        limit: 1,
        windowMs: 60_000,
      },
    },
  };
}

function createMemoryResponseCacheStore():
  ResponseCacheStore {
  const values = new Map<
    string,
    {
      statusCode: number;
      body: unknown;
    }
  >();

  return {
    async get(key) {
      const value = values.get(key);

      return value
        ? {
            hit: true as const,
            value,
          }
        : {
            hit: false as const,
          };
    },

    async set(key, value) {
      values.set(key, value);
    },
  };
}

function installFetchMock() {
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

async function buildHostRoutingApp(
  routes: DownstreamRouteConfig[],
  options: {
    responseCacheStore?: ResponseCacheStore;
    rateLimitStore?: InMemoryRateLimitStore;
  } = {},
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
  });

  const routeRuntimeRegistry =
    createRouteRuntimeRegistry({
      initialRoutes: routes,
    });

  await app.register(downstreamProxyRoute, {
    routeConfigs: routes,
    routeRuntimeRegistry,
    responseCacheStore:
      options.responseCacheStore,
    rateLimitStore:
      options.rateLimitStore ??
      new InMemoryRateLimitStore(),
    apiKeyAuthMiddleware: async (request: FastifyRequest) => {
      request.apiKey = "shared-api-key";
    },
  });

  await app.ready();

  return app;
}

let app: FastifyInstance | undefined;

afterEach(async () => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();

  if (app) {
    await app.close();
    app = undefined;
  }
});

describe("host-based downstream routing", () => {
  it("routes the same method and path to different configured hosts", async () => {
    installFetchMock();

    app = await buildHostRoutingApp([
      createRoute({
        requestHost: "api-a.example.com",
        downstreamUrl:
          "http://service-a:3001/products",
      }),
      createRoute({
        requestHost: "api-b.example.com",
        downstreamUrl:
          "http://service-b:3001/products",
      }),
    ]);

    const responseA = await app.inject({
      method: "GET",
      url: "/api/products",
      headers: {
        host: "Api-A.Example.COM:443",
      },
    });

    const responseB = await app.inject({
      method: "GET",
      url: "/api/products",
      headers: {
        host: "api-b.example.com.",
      },
    });

    expect(responseA.statusCode).toBe(200);
    expect(responseA.json()).toEqual({
      downstreamUrl:
        "http://service-a:3001/products",
    });

    expect(responseB.statusCode).toBe(200);
    expect(responseB.json()).toEqual({
      downstreamUrl:
        "http://service-b:3001/products",
    });
  });

  it("uses a path-only fallback for an unknown valid host", async () => {
    installFetchMock();

    app = await buildHostRoutingApp([
      createRoute({
        downstreamUrl:
          "http://fallback-service:3001/products",
      }),
      createRoute({
        requestHost: "api-a.example.com",
        downstreamUrl:
          "http://service-a:3001/products",
      }),
    ]);

    const response = await app.inject({
      method: "GET",
      url: "/api/products",
      headers: {
        host: "unknown.example.com",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      downstreamUrl:
        "http://fallback-service:3001/products",
    });
  });

  it("returns a bounded route miss without a host route or fallback", async () => {
    const fetchMock = installFetchMock();

    app = await buildHostRoutingApp([
      createRoute({
        requestHost: "api-a.example.com",
        downstreamUrl:
          "http://service-a:3001/products",
      }),
    ]);

    const response = await app.inject({
      method: "GET",
      url: "/api/products",
      headers: {
        host: "unknown.example.com",
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      error: {
        code: "ROUTE_NOT_FOUND",
        message: "Route not found",
      },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not fall back when the Host header is malformed", async () => {
    const fetchMock = installFetchMock();

    app = await buildHostRoutingApp([
      createRoute({
        downstreamUrl:
          "http://fallback-service:3001/products",
      }),
    ]);

    const response = await app.inject({
      method: "GET",
      url: "/api/products",
      headers: {
        host: "api.example.com:0",
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      error: {
        code: "ROUTE_NOT_FOUND",
      },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ignores X-Forwarded-Host while trustProxy is disabled", async () => {
    installFetchMock();

    app = await buildHostRoutingApp([
      createRoute({
        requestHost: "api-a.example.com",
        downstreamUrl:
          "http://service-a:3001/products",
      }),
      createRoute({
        requestHost: "api-b.example.com",
        downstreamUrl:
          "http://service-b:3001/products",
      }),
    ]);

    const response = await app.inject({
      method: "GET",
      url: "/api/products",
      headers: {
        host: "api-a.example.com",
        "x-forwarded-host":
          "api-b.example.com",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      downstreamUrl:
        "http://service-a:3001/products",
    });
  });

  it("isolates response cache entries by configured host", async () => {
    const fetchMock = installFetchMock();

    app = await buildHostRoutingApp(
      [
        createRoute({
          requestHost: "api-a.example.com",
          downstreamUrl:
            "http://service-a:3001/products",
          cacheEnabled: true,
        }),
        createRoute({
          requestHost: "api-b.example.com",
          downstreamUrl:
            "http://service-b:3001/products",
          cacheEnabled: true,
        }),
      ],
      {
        responseCacheStore:
          createMemoryResponseCacheStore(),
      },
    );

    const firstA = await app.inject({
      method: "GET",
      url: "/api/products",
      headers: {
        host: "api-a.example.com",
      },
    });

    const firstB = await app.inject({
      method: "GET",
      url: "/api/products",
      headers: {
        host: "api-b.example.com",
      },
    });

    const secondA = await app.inject({
      method: "GET",
      url: "/api/products",
      headers: {
        host: "api-a.example.com",
      },
    });

    expect(firstA.statusCode).toBe(200);
    expect(firstB.statusCode).toBe(200);
    expect(secondA.statusCode).toBe(200);

    expect(firstA.json()).toEqual({
      downstreamUrl:
        "http://service-a:3001/products",
    });

    expect(firstB.json()).toEqual({
      downstreamUrl:
        "http://service-b:3001/products",
    });

    expect(secondA.json()).toEqual({
      downstreamUrl:
        "http://service-a:3001/products",
    });

    expect(secondA.headers["x-cache"]).toBe("HIT");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("isolates rate-limit buckets by configured host", async () => {
    installFetchMock();

    app = await buildHostRoutingApp(
      [
        createRoute({
          requestHost: "api-a.example.com",
          downstreamUrl:
            "http://service-a:3001/products",
          rateLimitEnabled: true,
        }),
        createRoute({
          requestHost: "api-b.example.com",
          downstreamUrl:
            "http://service-b:3001/products",
          rateLimitEnabled: true,
        }),
      ],
      {
        rateLimitStore:
          new InMemoryRateLimitStore(),
      },
    );

    const firstA = await app.inject({
      method: "GET",
      url: "/api/products",
      headers: {
        host: "api-a.example.com",
      },
    });

    const secondA = await app.inject({
      method: "GET",
      url: "/api/products",
      headers: {
        host: "api-a.example.com",
      },
    });

    const firstB = await app.inject({
      method: "GET",
      url: "/api/products",
      headers: {
        host: "api-b.example.com",
      },
    });

    expect(firstA.statusCode).toBe(200);
    expect(secondA.statusCode).toBe(429);
    expect(firstB.statusCode).toBe(200);

    expect(firstA.headers["x-ratelimit-remaining"])
      .toBe("0");

    expect(secondA.json()).toMatchObject({
      error: {
        code: "TOO_MANY_REQUESTS",
      },
    });

    expect(firstB.headers["x-ratelimit-remaining"])
      .toBe("0");
  });
});
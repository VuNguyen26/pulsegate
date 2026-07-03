import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";

import { buildApiGatewayApp } from "../app.js";
import type { DownstreamRouteConfig } from "../config/downstream-routes.js";
import type { RuntimePreHandlerMiddleware } from "../proxy/downstream-proxy-handler.js";
import { InMemoryRateLimitStore } from "../rate-limit/in-memory-rate-limit-store.js";

const testRouteConfig: DownstreamRouteConfig = {
  serviceName: "test-service",
  gatewayPath: "/api/test-key-auth",
  downstreamUrl: "http://test-service.local/products",
  method: "GET",
  policies: {
    auth: {
      requireApiKey: true,
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
    requestTransform: {
      enabled: false,
      addHeaders: {},
      removeHeaders: [],
    },
    responseTransform: {
      enabled: false,
      addHeaders: {},
      removeHeaders: [],
    },
    retry: {
      enabled: false,
      attempts: 0,
      retryOnStatuses: [502, 503, 504],
    },
  },
};

function createFetchMock() {
  return vi.fn(async () => {
    return new Response(JSON.stringify({ data: "ok" }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
  });
}

describe("downstream proxy API key auth integration", () => {
  let app: FastifyInstance | null = null;

  afterEach(async () => {
    vi.unstubAllGlobals();

    if (app) {
      await app.close();
      app = null;
    }
  });

  it("should use injected API key middleware before proxying downstream", async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    const injectedApiKeyMiddleware: RuntimePreHandlerMiddleware = vi.fn(
      async (request: FastifyRequest, reply: FastifyReply) => {
        const apiKey = request.headers["x-api-key"];

        if (apiKey !== "pgk_live_valid") {
          reply.status(403).send({
            error: {
              code: "API_KEY_INVALID",
              message: "API key is invalid",
              requestId: request.id,
            },
          });
          return;
        }

        request.apiKey = "pgk_live_valid";
        request.apiKeyId = "key_1";
        request.apiConsumerId = "consumer_1";
        request.apiKeyAuthSource = "database";
      },
    );

    app = await buildApiGatewayApp({
      logger: false,
      routeConfigs: [testRouteConfig],
      productProxy: {
        rateLimitStore: new InMemoryRateLimitStore(),
        apiKeyAuthMiddleware: injectedApiKeyMiddleware,
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/test-key-auth",
      headers: {
        "x-api-key": "pgk_live_valid",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ data: "ok" });
    expect(injectedApiKeyMiddleware).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("should stop proxying when injected API key middleware rejects the request", async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    const injectedApiKeyMiddleware: RuntimePreHandlerMiddleware = vi.fn(
      async (_request: FastifyRequest, reply: FastifyReply) => {
        reply.status(403).send({
          error: {
            code: "API_KEY_INVALID",
            message: "API key is invalid",
            requestId: "test-request-id",
          },
        });
      },
    );

    app = await buildApiGatewayApp({
      logger: false,
      routeConfigs: [testRouteConfig],
      productProxy: {
        rateLimitStore: new InMemoryRateLimitStore(),
        apiKeyAuthMiddleware: injectedApiKeyMiddleware,
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/test-key-auth",
      headers: {
        "x-api-key": "wrong-key",
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      error: {
        code: "API_KEY_INVALID",
        message: "API key is invalid",
      },
    });
    expect(injectedApiKeyMiddleware).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

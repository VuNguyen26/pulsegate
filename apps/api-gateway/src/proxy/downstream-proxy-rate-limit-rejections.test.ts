import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ApiRejectedEventRecorder } from "../api-rejections/api-rejected-event-recorder.js";
import {
  productProductsRouteConfig,
  type DownstreamRouteConfig,
} from "../config/downstream-routes.js";
import { InMemoryRateLimitStore } from "../rate-limit/in-memory-rate-limit-store.js";
import {
  createRuntimePolicyPreHandler,
  type RuntimePreHandlerMiddleware,
} from "./downstream-proxy-handler.js";

function createRateLimitedRouteConfig(): DownstreamRouteConfig {
  return {
    ...productProductsRouteConfig,
    gatewayPath: "/test",
    policies: {
      ...productProductsRouteConfig.policies,
      auth: {
        ...productProductsRouteConfig.policies.auth,
        requireApiKey: true,
        requireJwt: false,
      },
      rateLimit: {
        ...productProductsRouteConfig.policies.rateLimit,
        enabled: true,
        limit: 1,
        windowMs: 1000,
      },
    },
  };
}

function createDatabaseApiKeyMiddleware(): RuntimePreHandlerMiddleware {
  return (request, _reply, done) => {
    request.apiKey = "pgk_live_test";
    request.apiKeyId = "key_1";
    request.apiConsumerId = "consumer_1";
    request.apiKeyAuthSource = "database";
    done();
  };
}

function createRejectedEventRecorder(): ApiRejectedEventRecorder {
  return {
    record: vi.fn().mockResolvedValue(undefined),
  };
}

async function buildTestApp(options: {
  apiKeyAuthMiddleware: RuntimePreHandlerMiddleware;
  rejectedEventRecorder?: ApiRejectedEventRecorder;
}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
  });

  const registeredRouteConfig = createRateLimitedRouteConfig();

  app.get(
    "/test",
    {
      preHandler: [
        createRuntimePolicyPreHandler({
          registeredRouteConfig,
          rateLimitStore: new InMemoryRateLimitStore(),
          apiKeyAuthMiddleware: options.apiKeyAuthMiddleware,
          rejectedEventRecorder: options.rejectedEventRecorder,
        }),
      ],
    },
    async () => {
      return {
        ok: true,
      };
    },
  );

  return app;
}

describe("downstream proxy rate limit rejected event tracking", () => {
  let app: FastifyInstance | null = null;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
  });

  it("should record rejected event when route rate limit is exceeded", async () => {
    const rejectedEventRecorder = createRejectedEventRecorder();

    app = await buildTestApp({
      apiKeyAuthMiddleware: createDatabaseApiKeyMiddleware(),
      rejectedEventRecorder,
    });

    const allowedResponse = await app.inject({
      method: "GET",
      url: "/test",
    });

    const blockedResponse = await app.inject({
      method: "GET",
      url: "/test",
    });

    expect(allowedResponse.statusCode).toBe(200);
    expect(blockedResponse.statusCode).toBe(429);
    expect(blockedResponse.json()).toMatchObject({
      error: {
        code: "TOO_MANY_REQUESTS",
        message: "Too many requests. Please try again later.",
        requestId: expect.any(String),
      },
    });

    expect(rejectedEventRecorder.record).toHaveBeenCalledTimes(1);
    expect(rejectedEventRecorder.record).toHaveBeenCalledWith({
      requestId: expect.any(String),
      routePath: "/test",
      routeMethod: "GET",
      statusCode: 429,
      rejectionReason: "RATE_LIMIT_EXCEEDED",
      apiKeyAuthSource: "database",
      apiKeyId: "key_1",
      consumerId: "consumer_1",
      metadata: {
        identityType: "api-key",
        limit: 1,
        remaining: 0,
        retryAfterSeconds: expect.any(Number),
        resetAt: expect.any(String),
      },
    });
  });
});

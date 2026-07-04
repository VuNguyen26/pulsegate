import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ApiRejectedEventRecorder } from "../api-rejections/api-rejected-event-recorder.js";
import {
  productProductsRouteConfig,
  type DownstreamRouteConfig,
} from "../config/downstream-routes.js";
import { createApiKeyAuthMiddleware } from "../middlewares/api-key-auth.middleware.js";
import { InMemoryRateLimitStore } from "../rate-limit/in-memory-rate-limit-store.js";
import { createRuntimePolicyPreHandler } from "./downstream-proxy-handler.js";

function createApiKeyOnlyRouteConfig(): DownstreamRouteConfig {
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
        enabled: false,
      },
    },
  };
}

function createJwtOnlyRouteConfig(): DownstreamRouteConfig {
  return {
    ...productProductsRouteConfig,
    gatewayPath: "/test",
    policies: {
      ...productProductsRouteConfig.policies,
      auth: {
        ...productProductsRouteConfig.policies.auth,
        requireApiKey: false,
        requireJwt: true,
      },
      rateLimit: {
        ...productProductsRouteConfig.policies.rateLimit,
        enabled: false,
      },
    },
  };
}

function createRejectedEventRecorder(): ApiRejectedEventRecorder {
  return {
    record: vi.fn().mockResolvedValue(undefined),
  };
}

async function buildTestApp(options: {
  registeredRouteConfig: DownstreamRouteConfig;
  rejectedEventRecorder?: ApiRejectedEventRecorder;
}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
  });

  app.get(
    "/test",
    {
      preHandler: [
        createRuntimePolicyPreHandler({
          registeredRouteConfig: options.registeredRouteConfig,
          rateLimitStore: new InMemoryRateLimitStore(),
          apiKeyAuthMiddleware: createApiKeyAuthMiddleware({
            verifier: async (apiKey) => {
              if (apiKey === "pgk_live_valid") {
                return {
                  valid: true,
                  source: "database",
                  apiKeyId: "key_1",
                  consumerId: "consumer_1",
                };
              }

              return {
                valid: false,
                source: "database",
                reason: "API_KEY_INVALID",
              };
            },
          }),
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

describe("downstream proxy auth rejected event tracking", () => {
  let app: FastifyInstance | null = null;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
  });

  it("should record API_KEY_MISSING rejected event", async () => {
    const rejectedEventRecorder = createRejectedEventRecorder();

    app = await buildTestApp({
      registeredRouteConfig: createApiKeyOnlyRouteConfig(),
      rejectedEventRecorder,
    });

    const response = await app.inject({
      method: "GET",
      url: "/test",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: {
        code: "API_KEY_MISSING",
        message: "API key is required",
        requestId: expect.any(String),
      },
    });

    expect(rejectedEventRecorder.record).toHaveBeenCalledWith({
      requestId: expect.any(String),
      routePath: "/test",
      routeMethod: "GET",
      statusCode: 401,
      rejectionReason: "API_KEY_MISSING",
      apiKeyAuthSource: undefined,
      apiKeyId: undefined,
      consumerId: undefined,
      metadata: {
        authType: "api-key",
      },
    });
  });

  it("should record API_KEY_INVALID rejected event", async () => {
    const rejectedEventRecorder = createRejectedEventRecorder();

    app = await buildTestApp({
      registeredRouteConfig: createApiKeyOnlyRouteConfig(),
      rejectedEventRecorder,
    });

    const response = await app.inject({
      method: "GET",
      url: "/test",
      headers: {
        "x-api-key": "pgk_live_invalid",
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      error: {
        code: "API_KEY_INVALID",
        message: "API key is invalid",
        requestId: expect.any(String),
      },
    });

    expect(rejectedEventRecorder.record).toHaveBeenCalledWith({
      requestId: expect.any(String),
      routePath: "/test",
      routeMethod: "GET",
      statusCode: 403,
      rejectionReason: "API_KEY_INVALID",
      apiKeyAuthSource: undefined,
      apiKeyId: undefined,
      consumerId: undefined,
      metadata: {
        authType: "api-key",
      },
    });
  });

  it("should record JWT_TOKEN_MISSING rejected event", async () => {
    const rejectedEventRecorder = createRejectedEventRecorder();

    app = await buildTestApp({
      registeredRouteConfig: createJwtOnlyRouteConfig(),
      rejectedEventRecorder,
    });

    const response = await app.inject({
      method: "GET",
      url: "/test",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: {
        code: "JWT_TOKEN_MISSING",
        message: "Bearer token is required",
        requestId: expect.any(String),
      },
    });

    expect(rejectedEventRecorder.record).toHaveBeenCalledWith({
      requestId: expect.any(String),
      routePath: "/test",
      routeMethod: "GET",
      statusCode: 401,
      rejectionReason: "JWT_TOKEN_MISSING",
      apiKeyAuthSource: undefined,
      apiKeyId: undefined,
      consumerId: undefined,
      metadata: {
        authType: "jwt",
      },
    });
  });

  it("should record JWT_TOKEN_INVALID rejected event", async () => {
    const rejectedEventRecorder = createRejectedEventRecorder();

    app = await buildTestApp({
      registeredRouteConfig: createJwtOnlyRouteConfig(),
      rejectedEventRecorder,
    });

    const response = await app.inject({
      method: "GET",
      url: "/test",
      headers: {
        authorization: "Bearer invalid-token",
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      error: {
        code: "JWT_TOKEN_INVALID",
        message: "Bearer token is invalid",
        requestId: expect.any(String),
      },
    });

    expect(rejectedEventRecorder.record).toHaveBeenCalledWith({
      requestId: expect.any(String),
      routePath: "/test",
      routeMethod: "GET",
      statusCode: 403,
      rejectionReason: "JWT_TOKEN_INVALID",
      apiKeyAuthSource: undefined,
      apiKeyId: undefined,
      consumerId: undefined,
      metadata: {
        authType: "jwt",
      },
    });
  });
});

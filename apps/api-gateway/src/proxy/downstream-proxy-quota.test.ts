import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ApiRejectedEventRecorder } from "../api-rejections/api-rejected-event-recorder.js";
import {
  productProductsRouteConfig,
  type DownstreamRouteConfig,
} from "../config/downstream-routes.js";
import { InMemoryRateLimitStore } from "../rate-limit/in-memory-rate-limit-store.js";
import type {
  UsageQuotaChecker,
  UsageQuotaCheckResult,
} from "../usage-plans/usage-quota-checker.js";
import {
  createRuntimePolicyPreHandler,
  type RuntimePreHandlerMiddleware,
} from "./downstream-proxy-handler.js";

function createTestRouteConfig(): DownstreamRouteConfig {
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

function createDatabaseApiKeyMiddleware(
  apiKeyId = "key_1",
): RuntimePreHandlerMiddleware {
  return (request, _reply, done) => {
    request.apiKey = "pgk_live_test";
    request.apiKeyId = apiKeyId;
    request.apiConsumerId = "consumer_1";
    request.apiKeyAuthSource = "database";
    done();
  };
}

function createEnvApiKeyMiddleware(): RuntimePreHandlerMiddleware {
  return (request, _reply, done) => {
    request.apiKey = "dev-api-key";
    request.apiKeyAuthSource = "env";
    done();
  };
}

function createQuotaChecker(
  result: UsageQuotaCheckResult,
): UsageQuotaChecker {
  return {
    checkApiKeyQuota: vi.fn(async () => result),
  };
}

function createRejectedEventRecorder(): ApiRejectedEventRecorder {
  return {
    record: vi.fn().mockResolvedValue(undefined),
  };
}

async function buildTestApp(options: {
  apiKeyAuthMiddleware: RuntimePreHandlerMiddleware;
  usageQuotaChecker?: UsageQuotaChecker;
  rejectedEventRecorder?: ApiRejectedEventRecorder;
}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
  });

  const registeredRouteConfig = createTestRouteConfig();

  app.get(
    "/test",
    {
      preHandler: [
        createRuntimePolicyPreHandler({
          registeredRouteConfig,
          rateLimitStore: new InMemoryRateLimitStore(),
          apiKeyAuthMiddleware: options.apiKeyAuthMiddleware,
          usageQuotaChecker: options.usageQuotaChecker,
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

describe("downstream proxy quota preHandler", () => {
  let app: FastifyInstance | null = null;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
  });

  it("should reject DB-backed API key request when quota is exceeded", async () => {
    const usageQuotaChecker = createQuotaChecker({
      allowed: false,
      code: "QUOTA_EXCEEDED",
      usagePlanId: "plan_starter",
      quotaLimit: 1,
      quotaWindow: "DAILY",
      usedRequests: 1,
      windowStartedAt: new Date("2026-07-04T00:00:00.000Z"),
      windowEndsAt: new Date("2026-07-05T00:00:00.000Z"),
    });

    const rejectedEventRecorder = createRejectedEventRecorder();

    app = await buildTestApp({
      apiKeyAuthMiddleware: createDatabaseApiKeyMiddleware("key_1"),
      usageQuotaChecker,
      rejectedEventRecorder,
    });

    const response = await app.inject({
      method: "GET",
      url: "/test",
    });

    expect(response.statusCode).toBe(429);
    expect(response.json()).toMatchObject({
      error: {
        code: "QUOTA_EXCEEDED",
        message:
          "API key quota has been exceeded for the current quota window.",
        details: {
          quotaLimit: 1,
          quotaWindow: "DAILY",
          usedRequests: 1,
          remainingRequests: 0,
          windowStartedAt: "2026-07-04T00:00:00.000Z",
          windowEndsAt: "2026-07-05T00:00:00.000Z",
          resetAt: "2026-07-05T00:00:00.000Z",
        },
        requestId: expect.any(String),
      },
    });

    expect(usageQuotaChecker.checkApiKeyQuota).toHaveBeenCalledWith("key_1");
    expect(rejectedEventRecorder.record).toHaveBeenCalledWith({
      requestId: expect.any(String),
      routePath: "/test",
      routeMethod: "GET",
      statusCode: 429,
      rejectionReason: "QUOTA_EXCEEDED",
      apiKeyAuthSource: "database",
      apiKeyId: "key_1",
      consumerId: "consumer_1",
      metadata: {
        quotaLimit: 1,
        quotaWindow: "DAILY",
        usedRequests: 1,
        remainingRequests: 0,
        windowStartedAt: "2026-07-04T00:00:00.000Z",
        windowEndsAt: "2026-07-05T00:00:00.000Z",
        resetAt: "2026-07-05T00:00:00.000Z",
      },
    });
  });

  it("should allow DB-backed API key request when quota is under limit", async () => {
    const usageQuotaChecker = createQuotaChecker({
      allowed: true,
      reason: "UNDER_LIMIT",
      usagePlanId: "plan_starter",
      quotaLimit: 10,
      quotaWindow: "DAILY",
      usedRequests: 1,
      windowStartedAt: new Date("2026-07-04T00:00:00.000Z"),
      windowEndsAt: new Date("2026-07-05T00:00:00.000Z"),
    });

    app = await buildTestApp({
      apiKeyAuthMiddleware: createDatabaseApiKeyMiddleware("key_1"),
      usageQuotaChecker,
    });

    const response = await app.inject({
      method: "GET",
      url: "/test",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
    });
    expect(usageQuotaChecker.checkApiKeyQuota).toHaveBeenCalledWith("key_1");
  });

  it("should not enforce quota for env fallback API key traffic", async () => {
    const usageQuotaChecker = createQuotaChecker({
      allowed: false,
      code: "QUOTA_EXCEEDED",
      usagePlanId: "plan_starter",
      quotaLimit: 1,
      quotaWindow: "DAILY",
      usedRequests: 1,
      windowStartedAt: new Date("2026-07-04T00:00:00.000Z"),
      windowEndsAt: new Date("2026-07-05T00:00:00.000Z"),
    });

    app = await buildTestApp({
      apiKeyAuthMiddleware: createEnvApiKeyMiddleware(),
      usageQuotaChecker,
    });

    const response = await app.inject({
      method: "GET",
      url: "/test",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
    });
    expect(usageQuotaChecker.checkApiKeyQuota).not.toHaveBeenCalled();
  });
});

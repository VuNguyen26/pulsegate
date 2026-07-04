import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildApiGatewayApp } from "../app.js";
import { InMemoryRateLimitStore } from "../rate-limit/in-memory-rate-limit-store.js";
import type {
  UsagePlanCreateData,
  UsagePlanManagementRepository,
  UsagePlanReadModel,
  UsagePlanUpdateData,
} from "../usage-plans/usage-plan-management.types.js";
import type {
  UsagePlanUsageSummaryReadModel,
  UsagePlanUsageSummaryReader,
} from "../usage-plans/usage-plan-usage-summary.js";

const createdAt = new Date("2026-07-04T00:00:00.000Z");
const updatedAt = new Date("2026-07-04T01:00:00.000Z");

const starterPlan: UsagePlanReadModel = {
  id: "plan_starter",
  name: "Starter",
  description: "Starter daily quota",
  quotaLimit: 1000,
  quotaWindow: "DAILY",
  enabled: true,
  createdAt,
  updatedAt,
  createdBy: "admin",
  updatedBy: "admin",
};

const enterprisePlan: UsagePlanReadModel = {
  id: "plan_enterprise",
  name: "Enterprise",
  description: null,
  quotaLimit: 100000,
  quotaWindow: "MONTHLY",
  enabled: false,
  createdAt,
  updatedAt,
  createdBy: "admin",
  updatedBy: "admin",
};

const starterPlanUsageSummary: UsagePlanUsageSummaryReadModel = {
  usagePlan: {
    id: "plan_starter",
    name: "Starter",
    quotaLimit: 1000,
    quotaWindow: "DAILY",
    enabled: true,
  },
  windowStartedAt: new Date("2026-07-04T00:00:00.000Z"),
  windowEndsAt: new Date("2026-07-05T00:00:00.000Z"),
  resetAt: new Date("2026-07-05T00:00:00.000Z"),
  assignedApiKeys: 2,
  activeApiKeys: 1,
  totalRequestsInCurrentWindow: 850,
  exceededApiKeys: 0,
  nearLimitApiKeys: 1,
  topApiKeysByUsage: [
    {
      apiKeyId: "key_mobile_prod",
      consumerId: "consumer_mobile",
      name: "Mobile Production Key",
      keyPrefix: "pgk_live_existing",
      status: "ACTIVE",
      usedRequests: 850,
      remainingRequests: 150,
      usageRatio: 0.85,
      exceeded: false,
    },
  ],
};

function createTestRepository(
  usagePlans: UsagePlanReadModel[],
): UsagePlanManagementRepository {
  const storedUsagePlans = [...usagePlans];

  return {
    listUsagePlans: vi.fn(async () => {
      return storedUsagePlans;
    }),

    findUsagePlanById: vi.fn(async (id: string) => {
      return storedUsagePlans.find((usagePlan) => usagePlan.id === id) ?? null;
    }),

    createUsagePlan: vi.fn(async (data: UsagePlanCreateData) => {
      const createdUsagePlan: UsagePlanReadModel = {
        id: `plan_${storedUsagePlans.length + 1}`,
        name: data.name,
        description: data.description,
        quotaLimit: data.quotaLimit,
        quotaWindow: data.quotaWindow,
        enabled: data.enabled,
        createdAt,
        updatedAt,
        createdBy: data.createdBy ?? null,
        updatedBy: data.updatedBy ?? null,
      };

      storedUsagePlans.push(createdUsagePlan);

      return createdUsagePlan;
    }),

    updateUsagePlan: vi.fn(async (id: string, data: UsagePlanUpdateData) => {
      const usagePlanIndex = storedUsagePlans.findIndex(
        (usagePlan) => usagePlan.id === id,
      );

      if (usagePlanIndex === -1) {
        throw new Error("Usage plan not found");
      }

      const updatedUsagePlan: UsagePlanReadModel = {
        id,
        name: data.name,
        description: data.description,
        quotaLimit: data.quotaLimit,
        quotaWindow: data.quotaWindow,
        enabled: data.enabled,
        createdAt: storedUsagePlans[usagePlanIndex].createdAt,
        updatedAt,
        createdBy: storedUsagePlans[usagePlanIndex].createdBy ?? null,
        updatedBy: data.updatedBy ?? null,
      };

      storedUsagePlans[usagePlanIndex] = updatedUsagePlan;

      return updatedUsagePlan;
    }),
  };
}

function createTestUsageSummaryReader(
  summaries: Record<string, UsagePlanUsageSummaryReadModel>,
): UsagePlanUsageSummaryReader {
  return {
    getUsagePlanUsageSummary: vi.fn(async (usagePlanId: string) => {
      return summaries[usagePlanId] ?? null;
    }),
  };
}

describe("adminUsagePlanRoute", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApiGatewayApp({
      logger: false,
      productProxy: {
        rateLimitStore: new InMemoryRateLimitStore(),
      },
      usagePlanManagement: {
        repository: createTestRepository([starterPlan, enterprisePlan]),
        usageSummaryReader: createTestUsageSummaryReader({
          plan_starter: starterPlanUsageSummary,
        }),
        adminApiKey: "test-admin-key",
        adminApiKeyHeader: "x-admin-api-key",
      },
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it("should reject usage plan list request when admin API key is missing", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/usage-plans",
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

  it("should reject usage plan list request when admin API key is invalid", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/usage-plans",
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

  it("should return all usage plans for an authenticated admin request", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/usage-plans",
      headers: {
        "x-admin-api-key": "test-admin-key",
      },
    });

    expect(response.statusCode).toBe(200);

    expect(response.json()).toMatchObject({
      data: [
        {
          id: "plan_starter",
          name: "Starter",
          description: "Starter daily quota",
          quotaLimit: 1000,
          quotaWindow: "DAILY",
          enabled: true,
          createdAt: "2026-07-04T00:00:00.000Z",
          updatedAt: "2026-07-04T01:00:00.000Z",
          createdBy: "admin",
          updatedBy: "admin",
        },
        {
          id: "plan_enterprise",
          name: "Enterprise",
          description: null,
          quotaLimit: 100000,
          quotaWindow: "MONTHLY",
          enabled: false,
        },
      ],
    });
  });

  it("should return a usage plan by id for an authenticated admin request", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/usage-plans/plan_starter",
      headers: {
        "x-admin-api-key": "test-admin-key",
      },
    });

    expect(response.statusCode).toBe(200);

    expect(response.json()).toMatchObject({
      data: {
        id: "plan_starter",
        name: "Starter",
        quotaLimit: 1000,
        quotaWindow: "DAILY",
        enabled: true,
      },
    });
  });

  it("should return 404 when usage plan id does not exist", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/usage-plans/missing_plan",
      headers: {
        "x-admin-api-key": "test-admin-key",
      },
    });

    expect(response.statusCode).toBe(404);

    expect(response.json()).toMatchObject({
      error: {
        code: "USAGE_PLAN_NOT_FOUND",
        message: "Usage plan was not found",
        requestId: expect.any(String),
      },
    });
  });

  it("should reject usage plan usage summary request when admin API key is missing", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/usage-plans/plan_starter/usage-summary",
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

  it("should return 404 when usage plan usage summary is requested for a missing plan", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/usage-plans/missing_plan/usage-summary",
      headers: {
        "x-admin-api-key": "test-admin-key",
      },
    });

    expect(response.statusCode).toBe(404);

    expect(response.json()).toMatchObject({
      error: {
        code: "USAGE_PLAN_NOT_FOUND",
        message: "Usage plan was not found",
        requestId: expect.any(String),
      },
    });
  });

  it("should return usage plan usage summary for an authenticated admin request", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/usage-plans/plan_starter/usage-summary",
      headers: {
        "x-admin-api-key": "test-admin-key",
      },
    });

    expect(response.statusCode).toBe(200);

    expect(response.json()).toEqual({
      data: {
        usagePlan: {
          id: "plan_starter",
          name: "Starter",
          quotaLimit: 1000,
          quotaWindow: "DAILY",
          enabled: true,
        },
        windowStartedAt: "2026-07-04T00:00:00.000Z",
        windowEndsAt: "2026-07-05T00:00:00.000Z",
        resetAt: "2026-07-05T00:00:00.000Z",
        assignedApiKeys: 2,
        activeApiKeys: 1,
        totalRequestsInCurrentWindow: 850,
        exceededApiKeys: 0,
        nearLimitApiKeys: 1,
        topApiKeysByUsage: [
          {
            apiKeyId: "key_mobile_prod",
            consumerId: "consumer_mobile",
            name: "Mobile Production Key",
            keyPrefix: "pgk_live_existing",
            status: "ACTIVE",
            usedRequests: 850,
            remainingRequests: 150,
            usageRatio: 0.85,
            exceeded: false,
          },
        ],
      },
    });
  });

  it("should create a usage plan for an authenticated admin request", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/internal/admin/usage-plans",
      headers: {
        "content-type": "application/json",
        "x-admin-api-key": "test-admin-key",
        "x-admin-actor": "test-admin",
      },
      payload: JSON.stringify({
        name: "Professional",
        description: "Professional daily quota",
        quotaLimit: 10000,
        quotaWindow: "DAILY",
      }),
    });

    expect(response.statusCode).toBe(201);

    expect(response.json()).toMatchObject({
      data: {
        id: "plan_3",
        name: "Professional",
        description: "Professional daily quota",
        quotaLimit: 10000,
        quotaWindow: "DAILY",
        enabled: true,
        createdBy: "test-admin",
        updatedBy: "test-admin",
      },
    });
  });

  it("should reject create request when usage plan payload is invalid", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/internal/admin/usage-plans",
      headers: {
        "content-type": "application/json",
        "x-admin-api-key": "test-admin-key",
      },
      payload: JSON.stringify({
        name: "Broken",
        quotaLimit: 0,
        quotaWindow: "DAILY",
      }),
    });

    expect(response.statusCode).toBe(400);

    expect(response.json()).toMatchObject({
      error: {
        code: "USAGE_PLAN_INVALID",
        message: "Usage plan is invalid",
        details: "quotaLimit must be a positive integer",
        requestId: expect.any(String),
      },
    });
  });

  it("should update a usage plan for an authenticated admin request", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/internal/admin/usage-plans/plan_starter",
      headers: {
        "content-type": "application/json",
        "x-admin-api-key": "test-admin-key",
        "x-admin-actor": "test-admin",
      },
      payload: JSON.stringify({
        name: "Starter v2",
        description: null,
        quotaLimit: 2000,
        quotaWindow: "MONTHLY",
        enabled: false,
      }),
    });

    expect(response.statusCode).toBe(200);

    expect(response.json()).toMatchObject({
      data: {
        id: "plan_starter",
        name: "Starter v2",
        description: null,
        quotaLimit: 2000,
        quotaWindow: "MONTHLY",
        enabled: false,
        createdBy: "admin",
        updatedBy: "test-admin",
      },
    });
  });

  it("should return 404 when updating a usage plan that does not exist", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/internal/admin/usage-plans/missing_plan",
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
        code: "USAGE_PLAN_NOT_FOUND",
        message: "Usage plan was not found",
        requestId: expect.any(String),
      },
    });
  });

  it("should reject update request when usage plan payload is invalid", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/internal/admin/usage-plans/plan_starter",
      headers: {
        "content-type": "application/json",
        "x-admin-api-key": "test-admin-key",
      },
      payload: JSON.stringify({
        quotaWindow: "YEARLY",
      }),
    });

    expect(response.statusCode).toBe(400);

    expect(response.json()).toMatchObject({
      error: {
        code: "USAGE_PLAN_INVALID",
        message: "Usage plan is invalid",
        details: "quotaWindow must be one of: DAILY, MONTHLY",
        requestId: expect.any(String),
      },
    });
  });

  it("should reject update request when admin API key is missing", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/internal/admin/usage-plans/plan_starter",
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
});

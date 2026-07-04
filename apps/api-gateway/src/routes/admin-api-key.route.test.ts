import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildApiGatewayApp } from "../app.js";
import type {
  ApiConsumerManagementRepository,
  ApiConsumerReadModel,
} from "../api-consumers/api-consumer-management.types.js";
import type {
  ApiKeyCreateData,
  ApiKeyManagementRepository,
  ApiKeyReadModel,
} from "../api-keys/api-key-management.types.js";
import { InMemoryRateLimitStore } from "../rate-limit/in-memory-rate-limit-store.js";
import type {
  UsagePlanCreateData,
  UsagePlanManagementRepository,
  UsagePlanReadModel,
  UsagePlanUpdateData,
} from "../usage-plans/usage-plan-management.types.js";

const createdAt = new Date("2026-07-03T00:00:00.000Z");
const updatedAt = new Date("2026-07-03T01:00:00.000Z");
const revokedAt = new Date("2026-07-03T02:00:00.000Z");

const activeConsumer: ApiConsumerReadModel = {
  id: "consumer_mobile",
  name: "Mobile App",
  description: "Main mobile application",
  status: "ACTIVE",
  createdAt,
  updatedAt,
  createdBy: "admin",
  updatedBy: "admin",
};

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

const existingApiKey: ApiKeyReadModel = {
  id: "key_mobile_prod",
  consumerId: "consumer_mobile",
  usagePlanId: null,
  name: "Mobile Production Key",
  keyPrefix: "pgk_live_existing",
  keyHash: "a".repeat(64),
  status: "ACTIVE",
  expiresAt: null,
  lastUsedAt: null,
  createdAt,
  updatedAt,
  createdBy: "admin",
  revokedAt: null,
  revokedBy: null,
};

function createTestConsumerRepository(
  consumers: ApiConsumerReadModel[],
): ApiConsumerManagementRepository {
  return {
    listConsumers: vi.fn(async () => consumers),

    findConsumerById: vi.fn(async (id: string) => {
      return consumers.find((consumer) => consumer.id === id) ?? null;
    }),

    createConsumer: vi.fn(async () => {
      throw new Error("createConsumer is not used in this test");
    }),

    updateConsumer: vi.fn(async () => {
      throw new Error("updateConsumer is not used in this test");
    }),
  };
}

function createTestUsagePlanRepository(
  usagePlans: UsagePlanReadModel[],
): UsagePlanManagementRepository {
  return {
    listUsagePlans: vi.fn(async () => usagePlans),

    findUsagePlanById: vi.fn(async (id: string) => {
      return usagePlans.find((usagePlan) => usagePlan.id === id) ?? null;
    }),

    createUsagePlan: vi.fn(async (_data: UsagePlanCreateData) => {
      throw new Error("createUsagePlan is not used in this test");
    }),

    updateUsagePlan: vi.fn(
      async (_id: string, _data: UsagePlanUpdateData) => {
        throw new Error("updateUsagePlan is not used in this test");
      },
    ),
  };
}

function createTestApiKeyRepository(
  apiKeys: ApiKeyReadModel[],
): ApiKeyManagementRepository {
  const storedApiKeys = [...apiKeys];

  return {
    listApiKeysByConsumerId: vi.fn(async (consumerId: string) => {
      return storedApiKeys.filter((apiKey) => apiKey.consumerId === consumerId);
    }),

    findApiKeyById: vi.fn(async (id: string) => {
      return storedApiKeys.find((apiKey) => apiKey.id === id) ?? null;
    }),

    createApiKey: vi.fn(async (data: ApiKeyCreateData) => {
      const createdApiKey: ApiKeyReadModel = {
        id: `key_${storedApiKeys.length + 1}`,
        consumerId: data.consumerId,
        usagePlanId: null,
        name: data.name,
        keyPrefix: data.keyPrefix,
        keyHash: data.keyHash,
        status: data.status,
        expiresAt: data.expiresAt,
        lastUsedAt: null,
        createdAt,
        updatedAt,
        createdBy: data.createdBy ?? null,
        revokedAt: null,
        revokedBy: null,
      };

      storedApiKeys.push(createdApiKey);

      return createdApiKey;
    }),

    revokeApiKey: vi.fn(async (id: string, actor: string) => {
      const apiKeyIndex = storedApiKeys.findIndex((apiKey) => apiKey.id === id);

      if (apiKeyIndex === -1) {
        throw new Error("API key not found");
      }

      const revokedApiKey: ApiKeyReadModel = {
        ...storedApiKeys[apiKeyIndex],
        status: "REVOKED",
        updatedAt,
        revokedAt,
        revokedBy: actor,
      };

      storedApiKeys[apiKeyIndex] = revokedApiKey;

      return revokedApiKey;
    }),

    assignUsagePlanToApiKey: vi.fn(
      async (id: string, usagePlanId: string | null) => {
        const apiKeyIndex = storedApiKeys.findIndex(
          (apiKey) => apiKey.id === id,
        );

        if (apiKeyIndex === -1) {
          throw new Error("API key not found");
        }

        const updatedApiKey: ApiKeyReadModel = {
          ...storedApiKeys[apiKeyIndex],
          usagePlanId,
          updatedAt,
        };

        storedApiKeys[apiKeyIndex] = updatedApiKey;

        return updatedApiKey;
      },
    ),
  };
}

describe("adminApiKeyRoute", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApiGatewayApp({
      logger: false,
      productProxy: {
        rateLimitStore: new InMemoryRateLimitStore(),
      },
      apiKeyManagement: {
        consumerRepository: createTestConsumerRepository([activeConsumer]),
        apiKeyRepository: createTestApiKeyRepository([existingApiKey]),
        usagePlanRepository: createTestUsagePlanRepository([starterPlan]),
        adminApiKey: "test-admin-key",
        adminApiKeyHeader: "x-admin-api-key",
        generateApiKey: () => ({
          rawKey: "pgk_live_raw_secret",
          keyPrefix: "pgk_live_raw_secret",
          keyHash: "b".repeat(64),
        }),
      },
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it("should reject API key list request when admin API key is missing", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/consumers/consumer_mobile/api-keys",
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

  it("should reject API key list request when admin API key is invalid", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/consumers/consumer_mobile/api-keys",
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

  it("should return API keys for an authenticated admin request", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/consumers/consumer_mobile/api-keys",
      headers: {
        "x-admin-api-key": "test-admin-key",
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      id: "key_mobile_prod",
      consumerId: "consumer_mobile",
      usagePlanId: null,
      name: "Mobile Production Key",
      keyPrefix: "pgk_live_existing",
      status: "ACTIVE",
      createdAt: "2026-07-03T00:00:00.000Z",
      updatedAt: "2026-07-03T01:00:00.000Z",
      createdBy: "admin",
      revokedAt: null,
      revokedBy: null,
    });

    expect(body.data[0]).not.toHaveProperty("keyHash");
    expect(body.data[0]).not.toHaveProperty("rawKey");
  });

  it("should return 404 when listing API keys for a missing consumer", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/consumers/missing_consumer/api-keys",
      headers: {
        "x-admin-api-key": "test-admin-key",
      },
    });

    expect(response.statusCode).toBe(404);

    expect(response.json()).toMatchObject({
      error: {
        code: "API_CONSUMER_NOT_FOUND",
        message: "API consumer was not found",
        requestId: expect.any(String),
      },
    });
  });

  it("should issue a new API key for an authenticated admin request", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/internal/admin/consumers/consumer_mobile/api-keys",
      headers: {
        "content-type": "application/json",
        "x-admin-api-key": "test-admin-key",
        "x-admin-actor": "test-admin",
      },
      payload: JSON.stringify({
        name: "Mobile Staging Key",
        expiresAt: "2026-08-01T00:00:00.000Z",
      }),
    });

    expect(response.statusCode).toBe(201);

    const body = response.json();

    expect(body.data).toMatchObject({
      id: "key_2",
      consumerId: "consumer_mobile",
      usagePlanId: null,
      name: "Mobile Staging Key",
      keyPrefix: "pgk_live_raw_secret",
      status: "ACTIVE",
      expiresAt: "2026-08-01T00:00:00.000Z",
      createdBy: "test-admin",
      rawKey: "pgk_live_raw_secret",
    });

    expect(body.data).not.toHaveProperty("keyHash");
  });

  it("should return 404 when issuing an API key for a missing consumer", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/internal/admin/consumers/missing_consumer/api-keys",
      headers: {
        "content-type": "application/json",
        "x-admin-api-key": "test-admin-key",
      },
      payload: JSON.stringify({
        name: "Mobile Staging Key",
      }),
    });

    expect(response.statusCode).toBe(404);

    expect(response.json()).toMatchObject({
      error: {
        code: "API_CONSUMER_NOT_FOUND",
        message: "API consumer was not found",
        requestId: expect.any(String),
      },
    });
  });

  it("should reject issue request when API key payload is invalid", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/internal/admin/consumers/consumer_mobile/api-keys",
      headers: {
        "content-type": "application/json",
        "x-admin-api-key": "test-admin-key",
      },
      payload: JSON.stringify({
        name: "",
      }),
    });

    expect(response.statusCode).toBe(400);

    expect(response.json()).toMatchObject({
      error: {
        code: "API_KEY_INVALID",
        message: "API key is invalid",
        details: "name must be a non-empty string",
        requestId: expect.any(String),
      },
    });
  });

  it("should reject issue request when admin API key is missing", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/internal/admin/consumers/consumer_mobile/api-keys",
      headers: {
        "content-type": "application/json",
      },
      payload: JSON.stringify({
        name: "Mobile Staging Key",
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

  it("should revoke an API key for an authenticated admin request", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/internal/admin/api-keys/key_mobile_prod/revoke",
      headers: {
        "x-admin-api-key": "test-admin-key",
        "x-admin-actor": "test-admin",
      },
    });

    expect(response.statusCode).toBe(200);

    expect(response.json()).toMatchObject({
      data: {
        id: "key_mobile_prod",
        consumerId: "consumer_mobile",
        name: "Mobile Production Key",
        keyPrefix: "pgk_live_existing",
        status: "REVOKED",
        revokedAt: "2026-07-03T02:00:00.000Z",
        revokedBy: "test-admin",
      },
    });
  });

  it("should return 404 when revoking a missing API key", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/internal/admin/api-keys/missing_key/revoke",
      headers: {
        "x-admin-api-key": "test-admin-key",
      },
    });

    expect(response.statusCode).toBe(404);

    expect(response.json()).toMatchObject({
      error: {
        code: "API_KEY_NOT_FOUND",
        message: "API key was not found",
        requestId: expect.any(String),
      },
    });
  });

  it("should reject revoke request when admin API key is missing", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/internal/admin/api-keys/key_mobile_prod/revoke",
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

  it("should assign a usage plan to an API key for an authenticated admin request", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/internal/admin/api-keys/key_mobile_prod/usage-plan",
      headers: {
        "content-type": "application/json",
        "x-admin-api-key": "test-admin-key",
      },
      payload: JSON.stringify({
        usagePlanId: "plan_starter",
      }),
    });

    expect(response.statusCode).toBe(200);

    expect(response.json()).toMatchObject({
      data: {
        id: "key_mobile_prod",
        usagePlanId: "plan_starter",
      },
    });
  });

  it("should remove usage plan assignment from an API key for an authenticated admin request", async () => {
    await app.inject({
      method: "PATCH",
      url: "/internal/admin/api-keys/key_mobile_prod/usage-plan",
      headers: {
        "content-type": "application/json",
        "x-admin-api-key": "test-admin-key",
      },
      payload: JSON.stringify({
        usagePlanId: "plan_starter",
      }),
    });

    const response = await app.inject({
      method: "PATCH",
      url: "/internal/admin/api-keys/key_mobile_prod/usage-plan",
      headers: {
        "content-type": "application/json",
        "x-admin-api-key": "test-admin-key",
      },
      payload: JSON.stringify({
        usagePlanId: null,
      }),
    });

    expect(response.statusCode).toBe(200);

    expect(response.json()).toMatchObject({
      data: {
        id: "key_mobile_prod",
        usagePlanId: null,
      },
    });
  });

  it("should return 404 when assigning usage plan to a missing API key", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/internal/admin/api-keys/missing_key/usage-plan",
      headers: {
        "content-type": "application/json",
        "x-admin-api-key": "test-admin-key",
      },
      payload: JSON.stringify({
        usagePlanId: "plan_starter",
      }),
    });

    expect(response.statusCode).toBe(404);

    expect(response.json()).toMatchObject({
      error: {
        code: "API_KEY_NOT_FOUND",
        message: "API key was not found",
        requestId: expect.any(String),
      },
    });
  });

  it("should return 404 when assigning a missing usage plan to an API key", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/internal/admin/api-keys/key_mobile_prod/usage-plan",
      headers: {
        "content-type": "application/json",
        "x-admin-api-key": "test-admin-key",
      },
      payload: JSON.stringify({
        usagePlanId: "missing_plan",
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

  it("should reject invalid usage plan assignment payload", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/internal/admin/api-keys/key_mobile_prod/usage-plan",
      headers: {
        "content-type": "application/json",
        "x-admin-api-key": "test-admin-key",
      },
      payload: JSON.stringify({
        usagePlanId: "",
      }),
    });

    expect(response.statusCode).toBe(400);

    expect(response.json()).toMatchObject({
      error: {
        code: "API_KEY_USAGE_PLAN_ASSIGNMENT_INVALID",
        message: "API key usage plan assignment is invalid",
        details: "usagePlanId must be a non-empty string or null",
        requestId: expect.any(String),
      },
    });
  });

  it("should reject usage plan assignment when admin API key is missing", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/internal/admin/api-keys/key_mobile_prod/usage-plan",
      headers: {
        "content-type": "application/json",
      },
      payload: JSON.stringify({
        usagePlanId: "plan_starter",
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
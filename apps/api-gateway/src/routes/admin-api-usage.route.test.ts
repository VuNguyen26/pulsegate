import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ApiConsumerManagementRepository } from "../api-consumers/api-consumer-management.types.js";
import type { ApiKeyManagementRepository } from "../api-keys/api-key-management.types.js";
import type { ApiUsageSummaryRepository } from "../api-usage/api-usage-summary.types.js";
import { adminApiUsageRoute } from "./admin-api-usage.route.js";

const createdAt = new Date("2026-07-03T00:00:00.000Z");
const updatedAt = new Date("2026-07-03T01:00:00.000Z");
const lastRequestAt = new Date("2026-07-03T16:00:00.000Z");

function createConsumerRepository(
  consumer: Awaited<
    ReturnType<ApiConsumerManagementRepository["findConsumerById"]>
  > = {
    id: "consumer_1",
    name: "Local Consumer",
    description: null,
    status: "ACTIVE",
    createdAt,
    updatedAt,
    createdBy: "admin",
    updatedBy: "admin",
  },
): ApiConsumerManagementRepository {
  return {
    listConsumers: vi.fn(),
    findConsumerById: vi.fn(async () => consumer),
    createConsumer: vi.fn(),
    updateConsumer: vi.fn(),
  };
}

function createApiKeyRepository(
  apiKey: Awaited<ReturnType<ApiKeyManagementRepository["findApiKeyById"]>> = {
    id: "key_1",
    consumerId: "consumer_1",
    usagePlanId: null,
    name: "Local Key",
    keyPrefix: "pgk_live_abcdefghijk",
    keyHash: "a".repeat(64),
    status: "ACTIVE",
    expiresAt: null,
    lastUsedAt: null,
    createdAt,
    updatedAt,
    createdBy: "admin",
    revokedAt: null,
    revokedBy: null,
  },
): ApiKeyManagementRepository {
  return {
    listApiKeysByConsumerId: vi.fn(),
    findApiKeyById: vi.fn(async () => apiKey),
    createApiKey: vi.fn(),
    revokeApiKey: vi.fn(),
    assignUsagePlanToApiKey: vi.fn(),
  };
}

function createUsageSummaryRepository(): ApiUsageSummaryRepository {
  return {
    getConsumerUsageSummary: vi.fn(async (consumerId: string) => ({
      subjectType: "consumer" as const,
      subjectId: consumerId,
      totalRequests: 10,
      successfulRequests: 8,
      errorRequests: 2,
      averageDurationMs: 43,
      cacheHits: 3,
      cacheMisses: 4,
      cacheBypasses: 3,
      lastRequestAt,
    })),
    getApiKeyUsageSummary: vi.fn(async (apiKeyId: string) => ({
      subjectType: "apiKey" as const,
      subjectId: apiKeyId,
      totalRequests: 5,
      successfulRequests: 5,
      errorRequests: 0,
      averageDurationMs: 21,
      cacheHits: 1,
      cacheMisses: 2,
      cacheBypasses: 2,
      lastRequestAt,
    })),
  };
}

async function buildTestApp(options: {
  consumerRepository?: ApiConsumerManagementRepository;
  apiKeyRepository?: ApiKeyManagementRepository;
  usageSummaryRepository?: ApiUsageSummaryRepository;
} = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
  });

  await app.register(adminApiUsageRoute, {
    consumerRepository:
      options.consumerRepository ?? createConsumerRepository(),
    apiKeyRepository: options.apiKeyRepository ?? createApiKeyRepository(),
    usageSummaryRepository:
      options.usageSummaryRepository ?? createUsageSummaryRepository(),
  });

  return app;
}

describe("adminApiUsageRoute", () => {
  let app: FastifyInstance | null = null;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
  });

  it("should reject consumer usage summary request when admin API key is missing", async () => {
    app = await buildTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/usage/consumers/consumer_1/summary",
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

  it("should return 404 when consumer does not exist", async () => {
    app = await buildTestApp({
      consumerRepository: createConsumerRepository(null),
    });

    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/usage/consumers/missing_consumer/summary",
      headers: {
        "x-admin-api-key": "local-admin-key",
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

  it("should return consumer usage summary", async () => {
    const usageSummaryRepository = createUsageSummaryRepository();

    app = await buildTestApp({
      usageSummaryRepository,
    });

    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/usage/consumers/consumer_1/summary",
      headers: {
        "x-admin-api-key": "local-admin-key",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        subjectType: "consumer" as const,
        subjectId: "consumer_1",
        totalRequests: 10,
        successfulRequests: 8,
        errorRequests: 2,
        averageDurationMs: 43,
        cacheHits: 3,
        cacheMisses: 4,
        cacheBypasses: 3,
        lastRequestAt: "2026-07-03T16:00:00.000Z",
      },
    });

    expect(
      usageSummaryRepository.getConsumerUsageSummary,
    ).toHaveBeenCalledWith("consumer_1");
  });

  it("should return 404 when API key does not exist", async () => {
    app = await buildTestApp({
      apiKeyRepository: createApiKeyRepository(null),
    });

    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/usage/api-keys/missing_key/summary",
      headers: {
        "x-admin-api-key": "local-admin-key",
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

  it("should return API key usage summary", async () => {
    const usageSummaryRepository = createUsageSummaryRepository();

    app = await buildTestApp({
      usageSummaryRepository,
    });

    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/usage/api-keys/key_1/summary",
      headers: {
        "x-admin-api-key": "local-admin-key",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        subjectType: "apiKey" as const,
        subjectId: "key_1",
        totalRequests: 5,
        successfulRequests: 5,
        errorRequests: 0,
        averageDurationMs: 21,
        cacheHits: 1,
        cacheMisses: 2,
        cacheBypasses: 2,
        lastRequestAt: "2026-07-03T16:00:00.000Z",
      },
    });

    expect(
      usageSummaryRepository.getApiKeyUsageSummary,
    ).toHaveBeenCalledWith("key_1");
  });
});

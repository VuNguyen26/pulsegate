import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AnalyticsRollupReadService } from "../analytics/analytics-rollup-read-service.js";
import type { AnalyticsUsageRollupReadRecord } from "../analytics/analytics-usage-rollup-read.repository.js";
import type { ApiConsumerManagementRepository } from "../api-consumers/api-consumer-management.types.js";
import type { ApiKeyManagementRepository } from "../api-keys/api-key-management.types.js";
import type { ApiUsageEventsListingRepository } from "../api-usage/api-usage-events-listing.types.js";
import type { ApiUsageSummaryRepository } from "../api-usage/api-usage-summary.types.js";
import { adminApiUsageRoute } from "./admin-api-usage.route.js";

const createdAt = new Date("2026-07-03T00:00:00.000Z");
const updatedAt = new Date("2026-07-03T01:00:00.000Z");
const lastRequestAt = new Date("2026-07-03T16:00:00.000Z");

function createConsumerRepository(): ApiConsumerManagementRepository {
  return {
    listConsumers: vi.fn(),
    findConsumerById: vi.fn(async () => ({
      id: "consumer_1",
      name: "Local Consumer",
      description: null,
      status: "ACTIVE" as const,
      createdAt,
      updatedAt,
      createdBy: "admin",
      updatedBy: "admin",
    })),
    createConsumer: vi.fn(),
    updateConsumer: vi.fn(),
  };
}

function createApiKeyRepository(): ApiKeyManagementRepository {
  return {
    listApiKeysByConsumerId: vi.fn(),
    findApiKeyById: vi.fn(async () => ({
      id: "key_1",
      consumerId: "consumer_1",
      usagePlanId: null,
      name: "Local Key",
      keyPrefix: "pgk_live_abcdefghijk",
      keyHash: "a".repeat(64),
      status: "ACTIVE" as const,
      expiresAt: null,
      lastUsedAt: null,
      createdAt,
      updatedAt,
      createdBy: "admin",
      revokedAt: null,
      revokedBy: null,
    })),
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

function createUsageEventsListingRepository(): ApiUsageEventsListingRepository {
  return {
    listEvents: vi.fn(async (query) => ({
      items: [],
      pagination: {
        limit: query.limit,
        offset: query.offset,
        total: 0,
        hasNextPage: false,
      },
      filters: query.filters,
    })),
  };
}

function fakeUsageRollupReadService(
  records: readonly AnalyticsUsageRollupReadRecord[],
): AnalyticsRollupReadService {
  return {
    readRollups: vi.fn(async () => ({
      source: "usage" as const,
      records: [...records],
      count: records.length,
    })),
  };
}

async function buildTestApp(options: {
  usageSummaryRepository?: ApiUsageSummaryRepository;
  rollupReadService?: AnalyticsRollupReadService;
} = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
  });

  await app.register(adminApiUsageRoute, {
    consumerRepository: createConsumerRepository(),
    apiKeyRepository: createApiKeyRepository(),
    usageSummaryRepository:
      options.usageSummaryRepository ?? createUsageSummaryRepository(),
    usageEventsListingRepository: createUsageEventsListingRepository(),
    rollupReadService:
      options.rollupReadService ?? fakeUsageRollupReadService([]),
  });

  return app;
}

describe("adminApiUsageRoute rollup summary runtime read", () => {
  let app: FastifyInstance | null = null;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
  });

  it("keeps consumer usage summary on raw summary path when runtime flag is absent", async () => {
    const rollupReadService = fakeUsageRollupReadService([
      usageRollupRecord({
        totalRequests: 99,
        successfulRequests: 99,
        totalDurationMs: 990,
      }),
    ]);
    app = await buildTestApp({
      rollupReadService,
    });

    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/usage/consumers/consumer_1/summary?from=2026-07-04T00:00:00.000Z&to=2026-07-05T00:00:00.000Z",
      headers: {
        "x-admin-api-key": "local-admin-key",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: {
        subjectType: "consumer",
        subjectId: "consumer_1",
        totalRequests: 10,
      },
      filters: {
        from: "2026-07-04T00:00:00.000Z",
        to: "2026-07-05T00:00:00.000Z",
      },
    });
    expect(rollupReadService.readRollups).not.toHaveBeenCalled();
  });

  it("returns consumer usage summary from rollup read model when runtime flag and bounded query are present", async () => {
    const rollupReadService = fakeUsageRollupReadService([
      usageRollupRecord({
        consumerId: "consumer_1",
        totalRequests: 3,
        successfulRequests: 2,
        errorRequests: 1,
        totalDurationMs: 90,
        cacheHits: 1,
        cacheMisses: 1,
        cacheBypasses: 1,
        lastRequestAt: new Date("2026-07-04T12:00:00.000Z"),
      }),
    ]);
    app = await buildTestApp({
      rollupReadService,
    });

    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/usage/consumers/consumer_1/summary?rollupSummaryRuntimeRead=true&from=2026-07-04T00:00:00.000Z&to=2026-07-05T00:00:00.000Z",
      headers: {
        "x-admin-api-key": "local-admin-key",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        subjectType: "consumer",
        subjectId: "consumer_1",
        totalRequests: 3,
        successfulRequests: 2,
        errorRequests: 1,
        averageDurationMs: 30,
        cacheHits: 1,
        cacheMisses: 1,
        cacheBypasses: 1,
        lastRequestAt: "2026-07-04T12:00:00.000Z",
      },
      filters: {
        from: "2026-07-04T00:00:00.000Z",
        to: "2026-07-05T00:00:00.000Z",
      },
    });
    expect(rollupReadService.readRollups).toHaveBeenCalledOnce();
    expect(rollupReadService.readRollups).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "usage",
        filters: expect.objectContaining({
          consumerId: "consumer_1",
        }),
      }),
    );
  });

  it("falls back to raw consumer usage summary without invoking rollup service when runtime query is unbounded", async () => {
    const rollupReadService = fakeUsageRollupReadService([
      usageRollupRecord({
        totalRequests: 99,
        successfulRequests: 99,
        totalDurationMs: 990,
      }),
    ]);
    app = await buildTestApp({
      rollupReadService,
    });

    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/usage/consumers/consumer_1/summary?rollupSummaryRuntimeRead=true&routePath=/api/products",
      headers: {
        "x-admin-api-key": "local-admin-key",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: {
        subjectType: "consumer",
        subjectId: "consumer_1",
        totalRequests: 10,
      },
      filters: {
        routePath: "/api/products",
      },
    });
    expect(rollupReadService.readRollups).not.toHaveBeenCalled();
  });

  it("returns API key usage summary from rollup read model when runtime flag and bounded query are present", async () => {
    const rollupReadService = fakeUsageRollupReadService([
      usageRollupRecord({
        apiKeyId: "key_1",
        totalRequests: 4,
        successfulRequests: 4,
        errorRequests: 0,
        totalDurationMs: 80,
        cacheHits: 2,
        cacheMisses: 2,
        cacheBypasses: 0,
        lastRequestAt: new Date("2026-07-04T13:00:00.000Z"),
      }),
    ]);
    app = await buildTestApp({
      rollupReadService,
    });

    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/usage/api-keys/key_1/summary?rollupSummaryRuntimeRead=true&from=2026-07-04T00:00:00.000Z&to=2026-07-05T00:00:00.000Z",
      headers: {
        "x-admin-api-key": "local-admin-key",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        subjectType: "apiKey",
        subjectId: "key_1",
        totalRequests: 4,
        successfulRequests: 4,
        errorRequests: 0,
        averageDurationMs: 20,
        cacheHits: 2,
        cacheMisses: 2,
        cacheBypasses: 0,
        lastRequestAt: "2026-07-04T13:00:00.000Z",
      },
      filters: {
        from: "2026-07-04T00:00:00.000Z",
        to: "2026-07-05T00:00:00.000Z",
      },
    });
    expect(rollupReadService.readRollups).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "usage",
        filters: expect.objectContaining({
          apiKeyId: "key_1",
        }),
      }),
    );
  });
});

function usageRollupRecord(
  overrides: Partial<AnalyticsUsageRollupReadRecord>,
): AnalyticsUsageRollupReadRecord {
  const bucketStart = new Date("2026-07-04T00:00:00.000Z");
  const bucketEnd = new Date("2026-07-04T01:00:00.000Z");

  return {
    id: "usage-rollup",
    granularity: "hour",
    bucketStart,
    bucketEnd,
    dimensionHash: "dimension-hash",
    consumerId: "consumer_1",
    apiKeyId: "key_1",
    routePath: "/api/products",
    routeMethod: "GET",
    statusClass: "2xx",
    cacheStatus: "HIT",
    apiKeyAuthSource: "database",
    totalRequests: 1,
    successfulRequests: 1,
    errorRequests: 0,
    totalDurationMs: 10,
    averageDurationMs: 10,
    cacheHits: 1,
    cacheMisses: 0,
    cacheBypasses: 0,
    lastRequestAt: bucketStart,
    rolledUpAt: bucketEnd,
    updatedAt: bucketEnd,
    ...overrides,
  };
}
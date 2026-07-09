import { Buffer } from "node:buffer";

import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ApiConsumerManagementRepository } from "../api-consumers/api-consumer-management.types.js";
import type { ApiKeyManagementRepository } from "../api-keys/api-key-management.types.js";
import type { ApiUsageEventsListingRepository } from "../api-usage/api-usage-events-listing.types.js";
import type { ApiUsageSummaryRepository } from "../api-usage/api-usage-summary.types.js";
import { adminApiUsageRoute } from "./admin-api-usage.route.js";

function encodeCursor(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

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

function createUsageEventsListingRepository(): ApiUsageEventsListingRepository {
  return {
    listEvents: vi.fn(async (query) => ({
      items: [
        {
          id: "usage_event_1",
          requestId: "request_1",
          routePath: "/api/products",
          routeMethod: "GET" as const,
          statusCode: 200,
          durationMs: 42,
          cacheStatus: "HIT",
          apiKeyAuthSource: "database",
          apiKeyId: "api_key_1",
          consumerId: "consumer_1",
          occurredAt: new Date("2026-07-04T11:00:00.000Z"),
        },
      ],
      pagination: {
        limit: query.limit,
        offset: query.offset,
        total: 1,
        hasNextPage: false,
      },
      filters: query.filters,
    })),
  };
}

async function buildTestApp(options: {
  consumerRepository?: ApiConsumerManagementRepository;
  apiKeyRepository?: ApiKeyManagementRepository;
  usageSummaryRepository?: ApiUsageSummaryRepository;
  usageEventsListingRepository?: ApiUsageEventsListingRepository;
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
    usageEventsListingRepository:
      options.usageEventsListingRepository ??
      createUsageEventsListingRepository(),
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

  it("should reject usage events listing request when admin API key is missing", async () => {
    app = await buildTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/usage/events",
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

  it("should return usage events listing with default pagination", async () => {
    const usageEventsListingRepository = createUsageEventsListingRepository();

    app = await buildTestApp({
      usageEventsListingRepository,
    });

    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/usage/events",
      headers: {
        "x-admin-api-key": "local-admin-key",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        items: [
          {
            id: "usage_event_1",
            requestId: "request_1",
            routePath: "/api/products",
            routeMethod: "GET",
            statusCode: 200,
            durationMs: 42,
            cacheStatus: "HIT",
            apiKeyAuthSource: "database",
            apiKeyId: "api_key_1",
            consumerId: "consumer_1",
            occurredAt: "2026-07-04T11:00:00.000Z",
          },
        ],
        pagination: {
          limit: 20,
          offset: 0,
          total: 1,
          hasNextPage: false,
          nextCursor: null,
        },
        filters: {
          from: null,
          to: null,
          routePath: null,
          routeMethod: null,
          statusCode: null,
          cacheStatus: null,
          apiKeyAuthSource: null,
          apiKeyId: null,
          consumerId: null,
        },
      },
    });

    expect(usageEventsListingRepository.listEvents).toHaveBeenCalledWith({
      limit: 20,
      offset: 0,
      filters: {},
    });
  });

  it("should pass usage events listing filters to repository", async () => {
    const usageEventsListingRepository = createUsageEventsListingRepository();

    app = await buildTestApp({
      usageEventsListingRepository,
    });

    const query = new URLSearchParams({
      limit: "50",
      offset: "10",
      from: "2026-07-04T00:00:00.000Z",
      to: "2026-07-05T00:00:00.000Z",
      routePath: "/api/products",
      routeMethod: "get",
      statusCode: "200",
      cacheStatus: "miss",
      apiKeyAuthSource: "database",
      apiKeyId: "api_key_1",
      consumerId: "consumer_1",
    });

    const response = await app.inject({
      method: "GET",
      url: `/internal/admin/usage/events?${query.toString()}`,
      headers: {
        "x-admin-api-key": "local-admin-key",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(usageEventsListingRepository.listEvents).toHaveBeenCalledWith({
      limit: 50,
      offset: 10,
      filters: {
        from: new Date("2026-07-04T00:00:00.000Z"),
        to: new Date("2026-07-05T00:00:00.000Z"),
        routePath: "/api/products",
        routeMethod: "GET",
        statusCode: 200,
        cacheStatus: "MISS",
        apiKeyAuthSource: "database",
        apiKeyId: "api_key_1",
        consumerId: "consumer_1",
      },
    });
  });

  it("should pass usage events listing cursor to repository", async () => {
    const usageEventsListingRepository = createUsageEventsListingRepository();
    const cursor = encodeCursor({
      occurredAt: "2026-07-04T11:00:00.000Z",
      id: "usage_event_1",
    });

    app = await buildTestApp({
      usageEventsListingRepository,
    });

    const response = await app.inject({
      method: "GET",
      url: `/internal/admin/usage/events?limit=10&cursor=${cursor}`,
      headers: {
        "x-admin-api-key": "local-admin-key",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(usageEventsListingRepository.listEvents).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
      cursor: {
        occurredAt: new Date("2026-07-04T11:00:00.000Z"),
        id: "usage_event_1",
      },
      filters: {},
    });
  });

  it("should reject invalid usage events listing query", async () => {
    const usageEventsListingRepository = createUsageEventsListingRepository();

    app = await buildTestApp({
      usageEventsListingRepository,
    });

    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/usage/events?limit=101",
      headers: {
        "x-admin-api-key": "local-admin-key",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: "limit must be an integer between 1 and 100",
        requestId: expect.any(String),
      },
    });

    expect(usageEventsListingRepository.listEvents).not.toHaveBeenCalled();
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

  it("should reject invalid consumer usage summary query", async () => {
    const consumerRepository = createConsumerRepository();
    const usageSummaryRepository = createUsageSummaryRepository();

    app = await buildTestApp({
      consumerRepository,
      usageSummaryRepository,
    });

    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/usage/consumers/consumer_1/summary?statusCode=99",
      headers: {
        "x-admin-api-key": "local-admin-key",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: "statusCode must be an integer between 100 and 599",
        requestId: expect.any(String),
      },
    });

    expect(consumerRepository.findConsumerById).not.toHaveBeenCalled();
    expect(
      usageSummaryRepository.getConsumerUsageSummary,
    ).not.toHaveBeenCalled();
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
      filters: {},
    });

    expect(
      usageSummaryRepository.getConsumerUsageSummary,
    ).toHaveBeenCalledWith("consumer_1", {});
  });

  it("should return filtered consumer usage summary", async () => {
    const usageSummaryRepository = createUsageSummaryRepository();

    app = await buildTestApp({
      usageSummaryRepository,
    });

    const query = new URLSearchParams({
      from: "2026-07-04T00:00:00.000Z",
      to: "2026-07-05T00:00:00.000Z",
      routePath: "/api/products",
      routeMethod: "get",
      statusCode: "200",
      cacheStatus: "miss",
      apiKeyAuthSource: "database",
    });

    const response = await app.inject({
      method: "GET",
      url: `/internal/admin/usage/consumers/consumer_1/summary?${query.toString()}`,
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
      filters: {
        from: "2026-07-04T00:00:00.000Z",
        to: "2026-07-05T00:00:00.000Z",
        routePath: "/api/products",
        routeMethod: "GET",
        statusCode: 200,
        cacheStatus: "MISS",
        apiKeyAuthSource: "database",
      },
    });

    expect(
      usageSummaryRepository.getConsumerUsageSummary,
    ).toHaveBeenCalledWith("consumer_1", {
      from: new Date("2026-07-04T00:00:00.000Z"),
      to: new Date("2026-07-05T00:00:00.000Z"),
      routePath: "/api/products",
      routeMethod: "GET",
      statusCode: 200,
      cacheStatus: "MISS",
      apiKeyAuthSource: "database",
    });
  });

  it("should expose consumer usage rollup summary preview only when requested", async () => {
    const usageSummaryRepository = createUsageSummaryRepository();

    app = await buildTestApp({
      usageSummaryRepository,
    });

    const query = new URLSearchParams({
      rollupSummaryPreview: "true",
      from: "2026-07-04T00:00:00.000Z",
      to: "2026-07-05T00:00:00.000Z",
      routeMethod: "get",
    });

    const response = await app.inject({
      method: "GET",
      url: `/internal/admin/usage/consumers/consumer_1/summary?${query.toString()}`,
      headers: {
        "x-admin-api-key": "local-admin-key",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: {
        subjectType: "consumer",
        subjectId: "consumer_1",
      },
      filters: {
        from: "2026-07-04T00:00:00.000Z",
        to: "2026-07-05T00:00:00.000Z",
        routeMethod: "GET",
      },
      rollupSummaryPreview: {
        target: "usage-consumer-summary",
        status: "summary-api-rollup-preview-fallback-required",
        fallbackPlan: {
          selectedPath: "raw-event-summary",
          effectiveReason: "rollup-data-unknown",
          queryFallbackReason: null,
          rollupFallbackReason: "rollup-data-unknown",
        },
        operatorDecision: {
          currentRuntimePath: "raw-event-summary",
          runtimeSwitchApplied: false,
          rawSummaryRuntimeRetained: true,
        },
        safety: {
          endpointRuntimeChanged: false,
          readsDatabaseInPreviewModel: false,
          invokesRepositoryInPreviewModel: false,
          persistsRollups: false,
          mutatesQuotaCounting: false,
          deletesRawEvents: false,
          wiresSchedulerOrBackgroundJob: false,
          wiresRetentionExecution: false,
        },
      },
    });

    expect(
      usageSummaryRepository.getConsumerUsageSummary,
    ).toHaveBeenCalledWith("consumer_1", {
      from: new Date("2026-07-04T00:00:00.000Z"),
      to: new Date("2026-07-05T00:00:00.000Z"),
      routeMethod: "GET",
    });
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
      filters: {},
    });

    expect(
      usageSummaryRepository.getApiKeyUsageSummary,
    ).toHaveBeenCalledWith("key_1", {});
  });

  it("should return filtered API key usage summary", async () => {
    const usageSummaryRepository = createUsageSummaryRepository();

    app = await buildTestApp({
      usageSummaryRepository,
    });

    const query = new URLSearchParams({
      statusCode: "500",
      cacheStatus: "bypass",
      routeMethod: "post",
    });

    const response = await app.inject({
      method: "GET",
      url: `/internal/admin/usage/api-keys/key_1/summary?${query.toString()}`,
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
      filters: {
        routeMethod: "POST",
        statusCode: 500,
        cacheStatus: "BYPASS",
      },
    });

    expect(
      usageSummaryRepository.getApiKeyUsageSummary,
    ).toHaveBeenCalledWith("key_1", {
      routeMethod: "POST",
      statusCode: 500,
      cacheStatus: "BYPASS",
    });
  });

  it("should expose API key usage rollup summary preview only when requested", async () => {
    const usageSummaryRepository = createUsageSummaryRepository();

    app = await buildTestApp({
      usageSummaryRepository,
    });

    const query = new URLSearchParams({
      rollupSummaryPreview: "true",
      from: "2026-07-04T00:00:00.000Z",
      to: "2026-07-05T00:00:00.000Z",
    });

    const response = await app.inject({
      method: "GET",
      url: `/internal/admin/usage/api-keys/key_1/summary?${query.toString()}`,
      headers: {
        "x-admin-api-key": "local-admin-key",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: {
        subjectType: "apiKey",
        subjectId: "key_1",
      },
      rollupSummaryPreview: {
        target: "usage-api-key-summary",
        status: "summary-api-rollup-preview-fallback-required",
        operatorDecision: {
          currentRuntimePath: "raw-event-summary",
          runtimeSwitchApplied: false,
          rawSummaryRuntimeRetained: true,
        },
        fallbackPlan: {
          selectedPath: "raw-event-summary",
          effectiveReason: "rollup-data-unknown",
        },
      },
    });

    expect(
      usageSummaryRepository.getApiKeyUsageSummary,
    ).toHaveBeenCalledWith("key_1", {
      from: new Date("2026-07-04T00:00:00.000Z"),
      to: new Date("2026-07-05T00:00:00.000Z"),
    });
  });
  it("should not expose consumer usage rollup summary preview when flag is not true", async () => {
    const usageSummaryRepository = createUsageSummaryRepository();

    app = await buildTestApp({
      usageSummaryRepository,
    });

    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/usage/consumers/consumer_1/summary?rollupSummaryPreview=false&from=2026-07-04T00:00:00.000Z&to=2026-07-05T00:00:00.000Z",
      headers: {
        "x-admin-api-key": "local-admin-key",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).not.toHaveProperty("rollupSummaryPreview");
    expect(
      usageSummaryRepository.getConsumerUsageSummary,
    ).toHaveBeenCalledWith("consumer_1", {
      from: new Date("2026-07-04T00:00:00.000Z"),
      to: new Date("2026-07-05T00:00:00.000Z"),
    });
  });

  it("should reject invalid usage summary query before exposing rollup summary preview", async () => {
    const consumerRepository = createConsumerRepository();
    const usageSummaryRepository = createUsageSummaryRepository();

    app = await buildTestApp({
      consumerRepository,
      usageSummaryRepository,
    });

    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/usage/consumers/consumer_1/summary?rollupSummaryPreview=true&statusCode=99",
      headers: {
        "x-admin-api-key": "local-admin-key",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: "statusCode must be an integer between 100 and 599",
        requestId: expect.any(String),
      },
    });

    expect(consumerRepository.findConsumerById).not.toHaveBeenCalled();
    expect(
      usageSummaryRepository.getConsumerUsageSummary,
    ).not.toHaveBeenCalled();
  });
});

import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AnalyticsRejectedRollupReadRecord } from "../analytics/analytics-rejected-rollup-read.repository.js";
import type { AnalyticsRollupReadService } from "../analytics/analytics-rollup-read-service.js";
import type { ApiRejectedEventsListingRepository } from "../api-rejections/api-rejected-events-listing.types.js";
import type { ApiRejectedEventsSummaryRepository } from "../api-rejections/api-rejected-events-summary.types.js";
import { adminApiRejectionRoute } from "./admin-api-rejection.route.js";

const lastRejectedAt = new Date("2026-07-04T10:00:00.000Z");

function createRejectedEventsSummaryRepository(): ApiRejectedEventsSummaryRepository {
  return {
    getSummary: vi.fn(async (filters = {}) => ({
      totalRejectedRequests: 6,
      byReason: [
        {
          rejectionReason: "API_KEY_MISSING" as const,
          count: 2,
        },
        {
          rejectionReason: "RATE_LIMIT_EXCEEDED" as const,
          count: 4,
        },
      ],
      byStatusCode: [
        {
          statusCode: 401,
          count: 2,
        },
        {
          statusCode: 429,
          count: 4,
        },
      ],
      lastRejectedAt,
      filters,
    })),
  };
}

function createRejectedEventsListingRepository(): ApiRejectedEventsListingRepository {
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

function fakeRejectedRollupReadService(
  records: readonly AnalyticsRejectedRollupReadRecord[],
): AnalyticsRollupReadService {
  return {
    readRollups: vi.fn(async () => ({
      source: "rejected" as const,
      records: [...records],
      count: records.length,
    })),
  };
}

async function buildTestApp(
  options: {
    rejectedEventsSummaryRepository?: ApiRejectedEventsSummaryRepository;
    rollupReadService?: AnalyticsRollupReadService;
  } = {},
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
  });

  await app.register(adminApiRejectionRoute, {
    rejectedEventsSummaryRepository:
      options.rejectedEventsSummaryRepository ??
      createRejectedEventsSummaryRepository(),
    rejectedEventsListingRepository: createRejectedEventsListingRepository(),
    rollupReadService:
      options.rollupReadService ?? fakeRejectedRollupReadService([]),
  });

  return app;
}

describe("adminApiRejectionRoute rollup summary runtime read", () => {
  let app: FastifyInstance | null = null;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
  });

  it("keeps rejected summary on raw summary path when runtime flag is absent", async () => {
    const rollupReadService = fakeRejectedRollupReadService([
      rejectedRollupRecord({
        totalRejectedRequests: 99,
      }),
    ]);
    app = await buildTestApp({
      rollupReadService,
    });

    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/api-rejections/summary?from=2026-07-04T00:00:00.000Z&to=2026-07-05T00:00:00.000Z",
      headers: {
        "x-admin-api-key": "local-admin-key",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: {
        totalRejectedRequests: 6,
        byReason: [
          {
            rejectionReason: "API_KEY_MISSING",
            count: 2,
          },
          {
            rejectionReason: "RATE_LIMIT_EXCEEDED",
            count: 4,
          },
        ],
      },
    });
    expect(response.json()).not.toHaveProperty("rollupSummaryPreview");
    expect(rollupReadService.readRollups).not.toHaveBeenCalled();
  });

  it("returns rejected summary from rollup read model when runtime flag and bounded query are present", async () => {
    const rollupReadService = fakeRejectedRollupReadService([
      rejectedRollupRecord({
        rejectionReason: "API_KEY_MISSING",
        statusCode: 401,
        totalRejectedRequests: 3,
        lastRejectedAt: new Date("2026-07-04T11:00:00.000Z"),
      }),
      rejectedRollupRecord({
        id: "rejected-rollup-2",
        dimensionHash: "dimension-hash-2",
        rejectionReason: "RATE_LIMIT_EXCEEDED",
        statusCode: 429,
        totalRejectedRequests: 2,
        lastRejectedAt: new Date("2026-07-04T12:00:00.000Z"),
      }),
    ]);
    app = await buildTestApp({
      rollupReadService,
    });

    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/api-rejections/summary?rollupSummaryRuntimeRead=true&from=2026-07-04T00:00:00.000Z&to=2026-07-05T00:00:00.000Z",
      headers: {
        "x-admin-api-key": "local-admin-key",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        totalRejectedRequests: 5,
        byReason: [
          {
            rejectionReason: "API_KEY_MISSING",
            count: 3,
          },
          {
            rejectionReason: "RATE_LIMIT_EXCEEDED",
            count: 2,
          },
        ],
        byStatusCode: [
          {
            statusCode: 401,
            count: 3,
          },
          {
            statusCode: 429,
            count: 2,
          },
        ],
        lastRejectedAt: "2026-07-04T12:00:00.000Z",
        filters: {
          from: "2026-07-04T00:00:00.000Z",
          to: "2026-07-05T00:00:00.000Z",
          rejectionReason: null,
          statusCode: null,
          routePath: null,
          routeMethod: null,
          apiKeyAuthSource: null,
          apiKeyId: null,
          consumerId: null,
        },
      },
    });
    expect(rollupReadService.readRollups).toHaveBeenCalledOnce();
    expect(rollupReadService.readRollups).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "rejected",
        filters: expect.objectContaining({}),
      }),
    );
  });

  it("falls back to raw rejected summary without invoking rollup service when runtime query is unbounded", async () => {
    const rollupReadService = fakeRejectedRollupReadService([
      rejectedRollupRecord({
        totalRejectedRequests: 99,
      }),
    ]);
    app = await buildTestApp({
      rollupReadService,
    });

    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/api-rejections/summary?rollupSummaryRuntimeRead=true&routePath=/api/products",
      headers: {
        "x-admin-api-key": "local-admin-key",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: {
        totalRejectedRequests: 6,
        filters: {
          routePath: "/api/products",
        },
      },
    });
    expect(rollupReadService.readRollups).not.toHaveBeenCalled();
  });

  it("keeps preview isolated from rejected runtime read flag", async () => {
    const rollupReadService = fakeRejectedRollupReadService([
      rejectedRollupRecord({
        totalRejectedRequests: 1,
      }),
    ]);
    app = await buildTestApp({
      rollupReadService,
    });

    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/api-rejections/summary?rollupSummaryRuntimeRead=true&rollupSummaryPreview=true&from=2026-07-04T00:00:00.000Z&to=2026-07-05T00:00:00.000Z",
      headers: {
        "x-admin-api-key": "local-admin-key",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: {
        totalRejectedRequests: 1,
      },
      rollupSummaryPreview: {
        target: "rejected-summary",
        operatorDecision: {
          currentRuntimePath: "raw-event-summary",
          runtimeSwitchApplied: false,
          rawSummaryRuntimeRetained: true,
        },
      },
    });
  });
});

function rejectedRollupRecord(
  overrides: Partial<AnalyticsRejectedRollupReadRecord>,
): AnalyticsRejectedRollupReadRecord {
  const bucketStart = new Date("2026-07-04T00:00:00.000Z");
  const bucketEnd = new Date("2026-07-04T01:00:00.000Z");

  return {
    id: "rejected-rollup-1",
    granularity: "hour",
    bucketStart,
    bucketEnd,
    dimensionHash: "dimension-hash-1",
    consumerId: "consumer_1",
    apiKeyId: "key_1",
    routePath: "/api/products",
    routeMethod: "GET",
    rejectionReason: "API_KEY_MISSING",
    statusCode: 401,
    apiKeyAuthSource: "database",
    totalRejectedRequests: 1,
    lastRejectedAt: bucketStart,
    rolledUpAt: bucketEnd,
    updatedAt: bucketEnd,
    ...overrides,
  };
}
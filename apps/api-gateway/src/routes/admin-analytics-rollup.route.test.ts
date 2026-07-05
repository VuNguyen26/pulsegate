import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ApiRejectionReason,
  GatewayRouteMethod,
} from "../generated/prisma/index.js";
import type { AnalyticsRollupReadService } from "../analytics/analytics-rollup-read-service.js";
import { adminAnalyticsRollupRoute } from "./admin-analytics-rollup.route.js";

const usageRecord = {
  id: "usage-rollup-1",
  granularity: "hour" as const,
  bucketStart: new Date("2026-07-05T10:00:00.000Z"),
  bucketEnd: new Date("2026-07-05T11:00:00.000Z"),
  dimensionHash: "usage-dimension-hash-1",
  consumerId: "consumer-1",
  apiKeyId: "api-key-1",
  routePath: "/api/products",
  routeMethod: GatewayRouteMethod.GET,
  statusClass: "2xx",
  cacheStatus: "HIT",
  apiKeyAuthSource: "DATABASE",
  totalRequests: 10,
  successfulRequests: 10,
  errorRequests: 0,
  totalDurationMs: 1200,
  averageDurationMs: 120,
  cacheHits: 10,
  cacheMisses: 0,
  cacheBypasses: 0,
  lastRequestAt: new Date("2026-07-05T10:59:00.000Z"),
  rolledUpAt: new Date("2026-07-05T11:01:00.000Z"),
  updatedAt: new Date("2026-07-05T11:01:00.000Z"),
};

const rejectedRecord = {
  id: "rejected-rollup-1",
  granularity: "hour" as const,
  bucketStart: new Date("2026-07-05T10:00:00.000Z"),
  bucketEnd: new Date("2026-07-05T11:00:00.000Z"),
  dimensionHash: "rejected-dimension-hash-1",
  consumerId: "consumer-1",
  apiKeyId: "api-key-1",
  routePath: "/api/products",
  routeMethod: GatewayRouteMethod.GET,
  rejectionReason: ApiRejectionReason.API_KEY_MISSING,
  statusCode: 401,
  apiKeyAuthSource: "MISSING",
  totalRejectedRequests: 5,
  lastRejectedAt: new Date("2026-07-05T10:59:00.000Z"),
  rolledUpAt: new Date("2026-07-05T11:01:00.000Z"),
  updatedAt: new Date("2026-07-05T11:01:00.000Z"),
};

function createRollupReadService(): {
  rollupReadService: AnalyticsRollupReadService;
  readRollups: ReturnType<typeof vi.fn>;
} {
  const readRollups = vi.fn(async (query) => {
    if (query.source === "usage") {
      return {
        source: "usage" as const,
        records: [usageRecord],
        count: 1,
      };
    }

    return {
      source: "rejected" as const,
      records: [rejectedRecord],
      count: 1,
    };
  });

  return {
    rollupReadService: {
      readRollups,
    },
    readRollups,
  };
}

async function buildTestApp(options: {
  rollupReadService?: AnalyticsRollupReadService;
} = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
  });

  await app.register(adminAnalyticsRollupRoute, {
    rollupReadService: options.rollupReadService,
  });

  return app;
}

describe("adminAnalyticsRollupRoute", () => {
  let app: FastifyInstance | null = null;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
  });

  it("should reject rollup read request when admin API key is missing", async () => {
    app = await buildTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/analytics/rollups",
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

  it("should return usage rollups", async () => {
    const dependencies = createRollupReadService();
    app = await buildTestApp({
      rollupReadService: dependencies.rollupReadService,
    });

    const query = new URLSearchParams({
      from: "2026-07-05T10:15:00.000Z",
      to: "2026-07-05T13:00:00.000Z",
      granularity: "hour",
      source: "usage",
      routePath: "/api/products",
      routeMethod: "get",
      statusCode: "200",
      cacheStatus: "HIT",
      apiKeyAuthSource: "DATABASE",
      apiKeyId: "api-key-1",
      consumerId: "consumer-1",
      limit: "50",
    });

    const response = await app.inject({
      method: "GET",
      url: `/internal/admin/analytics/rollups?${query.toString()}`,
      headers: {
        "x-admin-api-key": "local-admin-key",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        source: "usage",
        granularity: "hour",
        window: {
          requestedFrom: "2026-07-05T10:15:00.000Z",
          requestedTo: "2026-07-05T13:00:00.000Z",
          rebuildFrom: "2026-07-05T10:00:00.000Z",
          rebuildTo: "2026-07-05T13:00:00.000Z",
          bucketCount: 3,
        },
        limit: 50,
        filters: {
          routePath: "/api/products",
          routeMethod: "GET",
          statusCode: 200,
          apiKeyAuthSource: "DATABASE",
          apiKeyId: "api-key-1",
          consumerId: "consumer-1",
          cacheStatus: "HIT",
        },
        count: 1,
        items: [
          {
            id: "usage-rollup-1",
            granularity: "hour",
            bucketStart: "2026-07-05T10:00:00.000Z",
            bucketEnd: "2026-07-05T11:00:00.000Z",
            dimensionHash: "usage-dimension-hash-1",
            consumerId: "consumer-1",
            apiKeyId: "api-key-1",
            routePath: "/api/products",
            routeMethod: "GET",
            statusClass: "2xx",
            cacheStatus: "HIT",
            apiKeyAuthSource: "DATABASE",
            totalRequests: 10,
            successfulRequests: 10,
            errorRequests: 0,
            totalDurationMs: 1200,
            averageDurationMs: 120,
            cacheHits: 10,
            cacheMisses: 0,
            cacheBypasses: 0,
            lastRequestAt: "2026-07-05T10:59:00.000Z",
            rolledUpAt: "2026-07-05T11:01:00.000Z",
            updatedAt: "2026-07-05T11:01:00.000Z",
          },
        ],
      },
    });

    expect(dependencies.readRollups).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "usage",
        granularity: "hour",
        limit: 50,
        filters: {
          routePath: "/api/products",
          routeMethod: "GET",
          statusCode: 200,
          cacheStatus: "HIT",
          apiKeyAuthSource: "DATABASE",
          apiKeyId: "api-key-1",
          consumerId: "consumer-1",
        },
      }),
    );
  });

  it("should return rejected rollups", async () => {
    const dependencies = createRollupReadService();
    app = await buildTestApp({
      rollupReadService: dependencies.rollupReadService,
    });

    const query = new URLSearchParams({
      from: "2026-07-05T10:15:00.000Z",
      to: "2026-07-05T13:00:00.000Z",
      granularity: "hour",
      source: "rejected",
      routePath: "/api/products",
      routeMethod: "get",
      statusCode: "401",
      rejectionReason: "API_KEY_MISSING",
      apiKeyAuthSource: "MISSING",
      apiKeyId: "api-key-1",
      consumerId: "consumer-1",
      limit: "50",
    });

    const response = await app.inject({
      method: "GET",
      url: `/internal/admin/analytics/rollups?${query.toString()}`,
      headers: {
        "x-admin-api-key": "local-admin-key",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        source: "rejected",
        granularity: "hour",
        window: {
          requestedFrom: "2026-07-05T10:15:00.000Z",
          requestedTo: "2026-07-05T13:00:00.000Z",
          rebuildFrom: "2026-07-05T10:00:00.000Z",
          rebuildTo: "2026-07-05T13:00:00.000Z",
          bucketCount: 3,
        },
        limit: 50,
        filters: {
          routePath: "/api/products",
          routeMethod: "GET",
          statusCode: 401,
          apiKeyAuthSource: "MISSING",
          apiKeyId: "api-key-1",
          consumerId: "consumer-1",
          rejectionReason: "API_KEY_MISSING",
        },
        count: 1,
        items: [
          {
            id: "rejected-rollup-1",
            granularity: "hour",
            bucketStart: "2026-07-05T10:00:00.000Z",
            bucketEnd: "2026-07-05T11:00:00.000Z",
            dimensionHash: "rejected-dimension-hash-1",
            consumerId: "consumer-1",
            apiKeyId: "api-key-1",
            routePath: "/api/products",
            routeMethod: "GET",
            rejectionReason: "API_KEY_MISSING",
            statusCode: 401,
            apiKeyAuthSource: "MISSING",
            totalRejectedRequests: 5,
            lastRejectedAt: "2026-07-05T10:59:00.000Z",
            rolledUpAt: "2026-07-05T11:01:00.000Z",
            updatedAt: "2026-07-05T11:01:00.000Z",
          },
        ],
      },
    });

    expect(dependencies.readRollups).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "rejected",
        granularity: "hour",
        limit: 50,
        filters: {
          routePath: "/api/products",
          routeMethod: "GET",
          statusCode: 401,
          rejectionReason: "API_KEY_MISSING",
          apiKeyAuthSource: "MISSING",
          apiKeyId: "api-key-1",
          consumerId: "consumer-1",
        },
      }),
    );
  });

  it("should reject invalid rollup read query", async () => {
    const dependencies = createRollupReadService();
    app = await buildTestApp({
      rollupReadService: dependencies.rollupReadService,
    });

    const query = new URLSearchParams({
      from: "2026-07-05T10:15:00.000Z",
      to: "2026-07-05T13:00:00.000Z",
      granularity: "hour",
      source: "rejected",
      cacheStatus: "HIT",
    });

    const response = await app.inject({
      method: "GET",
      url: `/internal/admin/analytics/rollups?${query.toString()}`,
      headers: {
        "x-admin-api-key": "local-admin-key",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: "cacheStatus filter is only supported for usage rollups",
        requestId: expect.any(String),
      },
    });

    expect(dependencies.readRollups).not.toHaveBeenCalled();
  });
});

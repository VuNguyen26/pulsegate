import { describe, expect, it, vi } from "vitest";
import {
  GatewayRouteMethod,
  type AnalyticsUsageRollup,
  type PrismaClient,
} from "../generated/prisma/index.js";
import { createAnalyticsRollupReadQuery } from "./analytics-rollup-read-query.js";
import {
  createPrismaAnalyticsUsageRollupReadRepository,
  type AnalyticsUsageRollupReadQuery,
} from "./analytics-usage-rollup-read.repository.js";

const usageRollupRecord = {
  id: "usage-rollup-1",
  granularity: "hour",
  bucketStart: new Date("2026-07-05T10:00:00.000Z"),
  bucketEnd: new Date("2026-07-05T11:00:00.000Z"),
  dimensionHash: "dimension-hash-1",
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
} satisfies AnalyticsUsageRollup;

function createMockPrisma(records: AnalyticsUsageRollup[] = []) {
  const findMany = vi.fn().mockResolvedValue(records);

  return {
    prisma: {
      analyticsUsageRollup: {
        findMany,
      },
    } as unknown as PrismaClient,
    findMany,
  };
}

function createUsageRollupReadQuery(
  input: Parameters<typeof createAnalyticsRollupReadQuery>[0],
): AnalyticsUsageRollupReadQuery {
  const query = createAnalyticsRollupReadQuery(input);

  if (query.source !== "usage") {
    throw new Error("Expected usage rollup read query");
  }

  return query as AnalyticsUsageRollupReadQuery;
}

describe("createPrismaAnalyticsUsageRollupReadRepository", () => {
  it("should list usage rollups by bucket window and filters", async () => {
    const query = createUsageRollupReadQuery({
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

    const { prisma, findMany } = createMockPrisma([usageRollupRecord]);
    const repository = createPrismaAnalyticsUsageRollupReadRepository(prisma);

    await expect(repository.listUsageRollups(query)).resolves.toEqual({
      records: [
        {
          id: "usage-rollup-1",
          granularity: "hour",
          bucketStart: new Date("2026-07-05T10:00:00.000Z"),
          bucketEnd: new Date("2026-07-05T11:00:00.000Z"),
          dimensionHash: "dimension-hash-1",
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
        },
      ],
      count: 1,
    });

    expect(findMany).toHaveBeenCalledWith({
      where: {
        granularity: "hour",
        bucketStart: {
          gte: new Date("2026-07-05T10:00:00.000Z"),
          lt: new Date("2026-07-05T13:00:00.000Z"),
        },
        consumerId: "consumer-1",
        apiKeyId: "api-key-1",
        routePath: "/api/products",
        routeMethod: GatewayRouteMethod.GET,
        statusClass: "2xx",
        cacheStatus: "HIT",
        apiKeyAuthSource: "DATABASE",
      },
      orderBy: [
        {
          bucketStart: "asc",
        },
        {
          dimensionHash: "asc",
        },
      ],
      take: 50,
    });
  });

  it("should list usage rollups with the minimum indexed window query", async () => {
    const query = createUsageRollupReadQuery({
      from: "2026-07-05T00:00:00.000Z",
      to: "2026-07-07T03:30:00.000Z",
      granularity: "day",
      source: "usage",
    });

    const { prisma, findMany } = createMockPrisma([]);
    const repository = createPrismaAnalyticsUsageRollupReadRepository(prisma);

    await expect(repository.listUsageRollups(query)).resolves.toEqual({
      records: [],
      count: 0,
    });

    expect(findMany).toHaveBeenCalledWith({
      where: {
        granularity: "day",
        bucketStart: {
          gte: new Date("2026-07-05T00:00:00.000Z"),
          lt: new Date("2026-07-08T00:00:00.000Z"),
        },
      },
      orderBy: [
        {
          bucketStart: "asc",
        },
        {
          dimensionHash: "asc",
        },
      ],
      take: 100,
    });
  });

  it("should map statusCode filters to usage rollup statusClass", async () => {
    const query = createUsageRollupReadQuery({
      from: "2026-07-05T10:15:00.000Z",
      to: "2026-07-05T13:00:00.000Z",
      granularity: "hour",
      source: "usage",
      statusCode: 404,
    });

    const { prisma, findMany } = createMockPrisma([]);
    const repository = createPrismaAnalyticsUsageRollupReadRepository(prisma);

    await repository.listUsageRollups(query);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          statusClass: "4xx",
        }),
      }),
    );
  });

  it("should reject non-usage read queries", async () => {
    const query = createAnalyticsRollupReadQuery({
      from: "2026-07-05T10:15:00.000Z",
      to: "2026-07-05T13:00:00.000Z",
      granularity: "hour",
      source: "rejected",
      rejectionReason: "API_KEY_MISSING",
    });

    const { prisma, findMany } = createMockPrisma([]);
    const repository = createPrismaAnalyticsUsageRollupReadRepository(prisma);

    await expect(
      repository.listUsageRollups(
        query as Parameters<typeof repository.listUsageRollups>[0],
      ),
    ).rejects.toThrow(RangeError);

    expect(findMany).not.toHaveBeenCalled();
  });
});

import { describe, expect, it, vi } from "vitest";
import {
  ApiRejectionReason,
  GatewayRouteMethod,
  type AnalyticsRejectedRollup,
  type PrismaClient,
} from "../generated/prisma/index.js";
import { createAnalyticsRollupReadQuery } from "./analytics-rollup-read-query.js";
import {
  createPrismaAnalyticsRejectedRollupReadRepository,
  type AnalyticsRejectedRollupReadQuery,
} from "./analytics-rejected-rollup-read.repository.js";

const rejectedRollupRecord = {
  id: "rejected-rollup-1",
  granularity: "hour",
  bucketStart: new Date("2026-07-05T10:00:00.000Z"),
  bucketEnd: new Date("2026-07-05T11:00:00.000Z"),
  dimensionHash: "dimension-hash-1",
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
} satisfies AnalyticsRejectedRollup;

function createMockPrisma(records: AnalyticsRejectedRollup[] = []) {
  const findMany = vi.fn().mockResolvedValue(records);

  return {
    prisma: {
      analyticsRejectedRollup: {
        findMany,
      },
    } as unknown as PrismaClient,
    findMany,
  };
}

function createRejectedRollupReadQuery(
  input: Parameters<typeof createAnalyticsRollupReadQuery>[0],
): AnalyticsRejectedRollupReadQuery {
  const query = createAnalyticsRollupReadQuery(input);

  if (query.source !== "rejected") {
    throw new Error("Expected rejected rollup read query");
  }

  return query as AnalyticsRejectedRollupReadQuery;
}

describe("createPrismaAnalyticsRejectedRollupReadRepository", () => {
  it("should list rejected rollups by bucket window and filters", async () => {
    const query = createRejectedRollupReadQuery({
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

    const { prisma, findMany } = createMockPrisma([rejectedRollupRecord]);
    const repository = createPrismaAnalyticsRejectedRollupReadRepository(prisma);

    await expect(repository.listRejectedRollups(query)).resolves.toEqual({
      records: [
        {
          id: "rejected-rollup-1",
          granularity: "hour",
          bucketStart: new Date("2026-07-05T10:00:00.000Z"),
          bucketEnd: new Date("2026-07-05T11:00:00.000Z"),
          dimensionHash: "dimension-hash-1",
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
        statusCode: 401,
        rejectionReason: ApiRejectionReason.API_KEY_MISSING,
        apiKeyAuthSource: "MISSING",
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

  it("should list rejected rollups with the minimum indexed window query", async () => {
    const query = createRejectedRollupReadQuery({
      from: "2026-07-05T00:00:00.000Z",
      to: "2026-07-07T03:30:00.000Z",
      granularity: "day",
      source: "rejected",
    });

    const { prisma, findMany } = createMockPrisma([]);
    const repository = createPrismaAnalyticsRejectedRollupReadRepository(prisma);

    await expect(repository.listRejectedRollups(query)).resolves.toEqual({
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

  it("should keep statusCode filters as exact rejected rollup status codes", async () => {
    const query = createRejectedRollupReadQuery({
      from: "2026-07-05T10:15:00.000Z",
      to: "2026-07-05T13:00:00.000Z",
      granularity: "hour",
      source: "rejected",
      statusCode: 429,
    });

    const { prisma, findMany } = createMockPrisma([]);
    const repository = createPrismaAnalyticsRejectedRollupReadRepository(prisma);

    await repository.listRejectedRollups(query);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          statusCode: 429,
        }),
      }),
    );
  });

  it("should reject non-rejected read queries", async () => {
    const query = createAnalyticsRollupReadQuery({
      from: "2026-07-05T10:15:00.000Z",
      to: "2026-07-05T13:00:00.000Z",
      granularity: "hour",
      source: "usage",
      cacheStatus: "HIT",
    });

    const { prisma, findMany } = createMockPrisma([]);
    const repository = createPrismaAnalyticsRejectedRollupReadRepository(prisma);

    await expect(
      repository.listRejectedRollups(
        query as Parameters<typeof repository.listRejectedRollups>[0],
      ),
    ).rejects.toThrow(RangeError);

    expect(findMany).not.toHaveBeenCalled();
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ApiRejectionReason,
  GatewayRouteMethod,
  type PrismaClient,
} from "../generated/prisma/index.js";
import type { AnalyticsRejectedRollupAggregate } from "./analytics-rejected-rollup-aggregate.js";
import { buildAnalyticsRejectedRollupDimensionHash } from "./analytics-rollup-dimension-hash.js";
import { createPrismaAnalyticsRejectedRollupRepository } from "./analytics-rejected-rollup.repository.js";

const rejectedAggregate = {
  granularity: "hour",
  bucketStart: new Date("2026-07-05T14:00:00.000Z"),
  bucketEnd: new Date("2026-07-05T15:00:00.000Z"),
  consumerId: "consumer-1",
  apiKeyId: "api-key-1",
  routePath: "/api/products",
  routeMethod: GatewayRouteMethod.GET,
  rejectionReason: ApiRejectionReason.API_KEY_INVALID,
  statusCode: 401,
  apiKeyAuthSource: "DATABASE",
  totalRejectedRequests: 3,
  lastRejectedAt: new Date("2026-07-05T14:30:00.000Z"),
} satisfies AnalyticsRejectedRollupAggregate;

function createMockPrisma() {
  const upsert = vi.fn().mockResolvedValue({});

  return {
    prisma: {
      analyticsRejectedRollup: {
        upsert,
      },
    } as unknown as PrismaClient,
    upsert,
  };
}

describe("createPrismaAnalyticsRejectedRollupRepository", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should upsert rejected rollup aggregates by dimension hash", async () => {
    const rolledUpAt = new Date("2026-07-05T15:01:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(rolledUpAt);

    const { prisma, upsert } = createMockPrisma();
    const repository = createPrismaAnalyticsRejectedRollupRepository(prisma);

    await expect(repository.upsertAggregates([rejectedAggregate])).resolves.toEqual({
      upsertedCount: 1,
    });

    const dimensionHash =
      buildAnalyticsRejectedRollupDimensionHash(rejectedAggregate);
    const data = {
      granularity: "hour",
      bucketStart: rejectedAggregate.bucketStart,
      bucketEnd: rejectedAggregate.bucketEnd,
      consumerId: "consumer-1",
      apiKeyId: "api-key-1",
      routePath: "/api/products",
      routeMethod: GatewayRouteMethod.GET,
      rejectionReason: ApiRejectionReason.API_KEY_INVALID,
      statusCode: 401,
      apiKeyAuthSource: "DATABASE",
      totalRejectedRequests: 3,
      lastRejectedAt: rejectedAggregate.lastRejectedAt,
      rolledUpAt,
    };

    expect(upsert).toHaveBeenCalledWith({
      where: {
        dimensionHash,
      },
      create: {
        dimensionHash,
        ...data,
      },
      update: data,
    });
  });

  it("should not call Prisma when there are no aggregates", async () => {
    const { prisma, upsert } = createMockPrisma();
    const repository = createPrismaAnalyticsRejectedRollupRepository(prisma);

    await expect(repository.upsertAggregates([])).resolves.toEqual({
      upsertedCount: 0,
    });

    expect(upsert).not.toHaveBeenCalled();
  });

  it("should upsert multiple rejected rollup aggregates", async () => {
    const { prisma, upsert } = createMockPrisma();
    const repository = createPrismaAnalyticsRejectedRollupRepository(prisma);

    await expect(
      repository.upsertAggregates([
        rejectedAggregate,
        {
          ...rejectedAggregate,
          rejectionReason: ApiRejectionReason.RATE_LIMIT_EXCEEDED,
          statusCode: 429,
          totalRejectedRequests: 7,
          lastRejectedAt: new Date("2026-07-05T14:59:00.000Z"),
        },
      ]),
    ).resolves.toEqual({
      upsertedCount: 2,
    });

    expect(upsert).toHaveBeenCalledTimes(2);
    expect(upsert.mock.calls[0][0].where.dimensionHash).not.toBe(
      upsert.mock.calls[1][0].where.dimensionHash,
    );
  });

  it("should preserve nullable route dimensions", async () => {
    const rolledUpAt = new Date("2026-07-05T15:01:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(rolledUpAt);

    const { prisma, upsert } = createMockPrisma();
    const repository = createPrismaAnalyticsRejectedRollupRepository(prisma);

    await repository.upsertAggregates([
      {
        ...rejectedAggregate,
        routePath: null,
        routeMethod: null,
      },
    ]);

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          routePath: null,
          routeMethod: null,
        }),
        update: expect.objectContaining({
          routePath: null,
          routeMethod: null,
        }),
      }),
    );
  });
});

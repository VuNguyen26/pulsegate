import { afterEach, describe, expect, it, vi } from "vitest";

import {
  GatewayRouteMethod,
  type PrismaClient,
} from "../generated/prisma/index.js";
import type { AnalyticsUsageRollupAggregate } from "./analytics-usage-rollup-aggregate.js";
import { buildAnalyticsUsageRollupDimensionHash } from "./analytics-rollup-dimension-hash.js";
import { createPrismaAnalyticsUsageRollupRepository } from "./analytics-usage-rollup.repository.js";

const usageAggregate = {
  granularity: "hour",
  bucketStart: new Date("2026-07-05T14:00:00.000Z"),
  bucketEnd: new Date("2026-07-05T15:00:00.000Z"),
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
  lastRequestAt: new Date("2026-07-05T14:59:00.000Z"),
} satisfies AnalyticsUsageRollupAggregate;

function createMockPrisma() {
  const upsert = vi.fn().mockResolvedValue({});

  return {
    prisma: {
      analyticsUsageRollup: {
        upsert,
      },
    } as unknown as PrismaClient,
    upsert,
  };
}

describe("createPrismaAnalyticsUsageRollupRepository", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should upsert usage rollup aggregates by dimension hash", async () => {
    const rolledUpAt = new Date("2026-07-05T15:01:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(rolledUpAt);

    const { prisma, upsert } = createMockPrisma();
    const repository = createPrismaAnalyticsUsageRollupRepository(prisma);

    await expect(repository.upsertAggregates([usageAggregate])).resolves.toEqual({
      upsertedCount: 1,
    });

    const dimensionHash = buildAnalyticsUsageRollupDimensionHash(usageAggregate);
    const data = {
      granularity: "hour",
      bucketStart: usageAggregate.bucketStart,
      bucketEnd: usageAggregate.bucketEnd,
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
      lastRequestAt: usageAggregate.lastRequestAt,
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
    const repository = createPrismaAnalyticsUsageRollupRepository(prisma);

    await expect(repository.upsertAggregates([])).resolves.toEqual({
      upsertedCount: 0,
    });

    expect(upsert).not.toHaveBeenCalled();
  });

  it("should upsert multiple usage rollup aggregates", async () => {
    const { prisma, upsert } = createMockPrisma();
    const repository = createPrismaAnalyticsUsageRollupRepository(prisma);

    await expect(
      repository.upsertAggregates([
        usageAggregate,
        {
          ...usageAggregate,
          bucketStart: new Date("2026-07-05T15:00:00.000Z"),
          bucketEnd: new Date("2026-07-05T16:00:00.000Z"),
          lastRequestAt: new Date("2026-07-05T15:59:00.000Z"),
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
});

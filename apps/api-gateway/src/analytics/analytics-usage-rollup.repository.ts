import type { PrismaClient } from "../generated/prisma/index.js";
import type { AnalyticsUsageRollupAggregate } from "./analytics-usage-rollup-aggregate.js";
import { buildAnalyticsUsageRollupDimensionHash } from "./analytics-rollup-dimension-hash.js";

export type AnalyticsUsageRollupPersistenceResult = {
  upsertedCount: number;
};

export type AnalyticsUsageRollupRepository = {
  upsertAggregates: (
    aggregates: AnalyticsUsageRollupAggregate[],
  ) => Promise<AnalyticsUsageRollupPersistenceResult>;
};

function buildAnalyticsUsageRollupPersistenceData(
  aggregate: AnalyticsUsageRollupAggregate,
  rolledUpAt: Date,
) {
  return {
    granularity: aggregate.granularity,
    bucketStart: aggregate.bucketStart,
    bucketEnd: aggregate.bucketEnd,
    consumerId: aggregate.consumerId,
    apiKeyId: aggregate.apiKeyId,
    routePath: aggregate.routePath,
    routeMethod: aggregate.routeMethod,
    statusClass: aggregate.statusClass,
    cacheStatus: aggregate.cacheStatus,
    apiKeyAuthSource: aggregate.apiKeyAuthSource,
    totalRequests: aggregate.totalRequests,
    successfulRequests: aggregate.successfulRequests,
    errorRequests: aggregate.errorRequests,
    totalDurationMs: aggregate.totalDurationMs,
    averageDurationMs: aggregate.averageDurationMs,
    cacheHits: aggregate.cacheHits,
    cacheMisses: aggregate.cacheMisses,
    cacheBypasses: aggregate.cacheBypasses,
    lastRequestAt: aggregate.lastRequestAt,
    rolledUpAt,
  };
}

export function createPrismaAnalyticsUsageRollupRepository(
  prisma: PrismaClient,
): AnalyticsUsageRollupRepository {
  return {
    async upsertAggregates(
      aggregates: AnalyticsUsageRollupAggregate[],
    ): Promise<AnalyticsUsageRollupPersistenceResult> {
      for (const aggregate of aggregates) {
        const dimensionHash = buildAnalyticsUsageRollupDimensionHash(aggregate);
        const rolledUpAt = new Date();
        const data = buildAnalyticsUsageRollupPersistenceData(
          aggregate,
          rolledUpAt,
        );

        await prisma.analyticsUsageRollup.upsert({
          where: {
            dimensionHash,
          },
          create: {
            dimensionHash,
            ...data,
          },
          update: data,
        });
      }

      return {
        upsertedCount: aggregates.length,
      };
    },
  };
}

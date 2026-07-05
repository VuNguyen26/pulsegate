import type { PrismaClient } from "../generated/prisma/index.js";
import type { AnalyticsRejectedRollupAggregate } from "./analytics-rejected-rollup-aggregate.js";
import { buildAnalyticsRejectedRollupDimensionHash } from "./analytics-rollup-dimension-hash.js";

export type AnalyticsRejectedRollupPersistenceResult = {
  upsertedCount: number;
};

export type AnalyticsRejectedRollupRepository = {
  upsertAggregates: (
    aggregates: AnalyticsRejectedRollupAggregate[],
  ) => Promise<AnalyticsRejectedRollupPersistenceResult>;
};

function buildAnalyticsRejectedRollupPersistenceData(
  aggregate: AnalyticsRejectedRollupAggregate,
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
    rejectionReason: aggregate.rejectionReason,
    statusCode: aggregate.statusCode,
    apiKeyAuthSource: aggregate.apiKeyAuthSource,
    totalRejectedRequests: aggregate.totalRejectedRequests,
    lastRejectedAt: aggregate.lastRejectedAt,
    rolledUpAt,
  };
}

export function createPrismaAnalyticsRejectedRollupRepository(
  prisma: PrismaClient,
): AnalyticsRejectedRollupRepository {
  return {
    async upsertAggregates(
      aggregates: AnalyticsRejectedRollupAggregate[],
    ): Promise<AnalyticsRejectedRollupPersistenceResult> {
      for (const aggregate of aggregates) {
        const dimensionHash =
          buildAnalyticsRejectedRollupDimensionHash(aggregate);
        const rolledUpAt = new Date();
        const data = buildAnalyticsRejectedRollupPersistenceData(
          aggregate,
          rolledUpAt,
        );

        await prisma.analyticsRejectedRollup.upsert({
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

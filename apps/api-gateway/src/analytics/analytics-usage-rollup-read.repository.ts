import {
  GatewayRouteMethod,
  type AnalyticsUsageRollup,
  type PrismaClient,
} from "../generated/prisma/index.js";
import type { AnalyticsRollupGranularity } from "./analytics-rollup-time-bucket.js";
import type { AnalyticsRollupReadQuery } from "./analytics-rollup-read-query.js";

export type AnalyticsUsageRollupReadQuery = AnalyticsRollupReadQuery & {
  source: "usage";
};

export type AnalyticsUsageRollupReadRecord = {
  id: string;
  granularity: AnalyticsRollupGranularity;
  bucketStart: Date;
  bucketEnd: Date;
  dimensionHash: string;
  consumerId: string | null;
  apiKeyId: string | null;
  routePath: string | null;
  routeMethod: GatewayRouteMethod | null;
  statusClass: string;
  cacheStatus: string | null;
  apiKeyAuthSource: string | null;
  totalRequests: number;
  successfulRequests: number;
  errorRequests: number;
  totalDurationMs: number;
  averageDurationMs: number;
  cacheHits: number;
  cacheMisses: number;
  cacheBypasses: number;
  lastRequestAt: Date;
  rolledUpAt: Date;
  updatedAt: Date;
};

export type AnalyticsUsageRollupReadResult = {
  records: AnalyticsUsageRollupReadRecord[];
  count: number;
};

export type AnalyticsUsageRollupReadRepository = {
  listUsageRollups: (
    query: AnalyticsUsageRollupReadQuery,
  ) => Promise<AnalyticsUsageRollupReadResult>;
};

function statusCodeToStatusClass(statusCode: number): string {
  return `${Math.floor(statusCode / 100)}xx`;
}

function toGatewayRouteMethod(routeMethod: string): GatewayRouteMethod {
  return routeMethod as GatewayRouteMethod;
}

function mapUsageRollupRecord(
  rollup: AnalyticsUsageRollup,
): AnalyticsUsageRollupReadRecord {
  return {
    id: rollup.id,
    granularity: rollup.granularity as AnalyticsRollupGranularity,
    bucketStart: rollup.bucketStart,
    bucketEnd: rollup.bucketEnd,
    dimensionHash: rollup.dimensionHash,
    consumerId: rollup.consumerId,
    apiKeyId: rollup.apiKeyId,
    routePath: rollup.routePath,
    routeMethod: rollup.routeMethod,
    statusClass: rollup.statusClass,
    cacheStatus: rollup.cacheStatus,
    apiKeyAuthSource: rollup.apiKeyAuthSource,
    totalRequests: rollup.totalRequests,
    successfulRequests: rollup.successfulRequests,
    errorRequests: rollup.errorRequests,
    totalDurationMs: rollup.totalDurationMs,
    averageDurationMs: rollup.averageDurationMs,
    cacheHits: rollup.cacheHits,
    cacheMisses: rollup.cacheMisses,
    cacheBypasses: rollup.cacheBypasses,
    lastRequestAt: rollup.lastRequestAt,
    rolledUpAt: rollup.rolledUpAt,
    updatedAt: rollup.updatedAt,
  };
}

function buildUsageRollupWhere(query: AnalyticsUsageRollupReadQuery) {
  if (
    query.windowPlan.rebuildFrom === null ||
    query.windowPlan.rebuildTo === null
  ) {
    return null;
  }

  const filters = query.filters;

  return {
    granularity: query.granularity,
    bucketStart: {
      gte: query.windowPlan.rebuildFrom,
      lt: query.windowPlan.rebuildTo,
    },
    ...(filters.consumerId !== undefined
      ? { consumerId: filters.consumerId }
      : {}),
    ...(filters.apiKeyId !== undefined ? { apiKeyId: filters.apiKeyId } : {}),
    ...(filters.routePath !== undefined
      ? { routePath: filters.routePath }
      : {}),
    ...(filters.routeMethod !== undefined
      ? { routeMethod: toGatewayRouteMethod(filters.routeMethod) }
      : {}),
    ...(filters.statusCode !== undefined
      ? { statusClass: statusCodeToStatusClass(filters.statusCode) }
      : {}),
    ...(filters.cacheStatus !== undefined
      ? { cacheStatus: filters.cacheStatus }
      : {}),
    ...(filters.apiKeyAuthSource !== undefined
      ? { apiKeyAuthSource: filters.apiKeyAuthSource }
      : {}),
  };
}

export function createPrismaAnalyticsUsageRollupReadRepository(
  prisma: PrismaClient,
): AnalyticsUsageRollupReadRepository {
  return {
    async listUsageRollups(
      query: AnalyticsUsageRollupReadQuery,
    ): Promise<AnalyticsUsageRollupReadResult> {
      if (query.source !== "usage") {
        throw new RangeError(
          "usage rollup read repository only supports usage source",
        );
      }

      const where = buildUsageRollupWhere(query);

      if (where === null) {
        return {
          records: [],
          count: 0,
        };
      }

      const records = await prisma.analyticsUsageRollup.findMany({
        where,
        orderBy: [
          {
            bucketStart: "asc",
          },
          {
            dimensionHash: "asc",
          },
        ],
        take: query.limit,
      });

      return {
        records: records.map(mapUsageRollupRecord),
        count: records.length,
      };
    },
  };
}

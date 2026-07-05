import {
  ApiRejectionReason,
  GatewayRouteMethod,
  type AnalyticsRejectedRollup,
  type PrismaClient,
} from "../generated/prisma/index.js";
import type { AnalyticsRollupGranularity } from "./analytics-rollup-time-bucket.js";
import type { AnalyticsRollupReadQuery } from "./analytics-rollup-read-query.js";

export type AnalyticsRejectedRollupReadQuery = AnalyticsRollupReadQuery & {
  source: "rejected";
};

export type AnalyticsRejectedRollupReadRecord = {
  id: string;
  granularity: AnalyticsRollupGranularity;
  bucketStart: Date;
  bucketEnd: Date;
  dimensionHash: string;
  consumerId: string | null;
  apiKeyId: string | null;
  routePath: string | null;
  routeMethod: GatewayRouteMethod | null;
  rejectionReason: ApiRejectionReason;
  statusCode: number;
  apiKeyAuthSource: string | null;
  totalRejectedRequests: number;
  lastRejectedAt: Date;
  rolledUpAt: Date;
  updatedAt: Date;
};

export type AnalyticsRejectedRollupReadResult = {
  records: AnalyticsRejectedRollupReadRecord[];
  count: number;
};

export type AnalyticsRejectedRollupReadRepository = {
  listRejectedRollups: (
    query: AnalyticsRejectedRollupReadQuery,
  ) => Promise<AnalyticsRejectedRollupReadResult>;
};

function toGatewayRouteMethod(routeMethod: string): GatewayRouteMethod {
  return routeMethod as GatewayRouteMethod;
}

function toApiRejectionReason(rejectionReason: string): ApiRejectionReason {
  return rejectionReason as ApiRejectionReason;
}

function mapRejectedRollupRecord(
  rollup: AnalyticsRejectedRollup,
): AnalyticsRejectedRollupReadRecord {
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
    rejectionReason: rollup.rejectionReason,
    statusCode: rollup.statusCode,
    apiKeyAuthSource: rollup.apiKeyAuthSource,
    totalRejectedRequests: rollup.totalRejectedRequests,
    lastRejectedAt: rollup.lastRejectedAt,
    rolledUpAt: rollup.rolledUpAt,
    updatedAt: rollup.updatedAt,
  };
}

function buildRejectedRollupWhere(query: AnalyticsRejectedRollupReadQuery) {
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
      ? { statusCode: filters.statusCode }
      : {}),
    ...(filters.rejectionReason !== undefined
      ? { rejectionReason: toApiRejectionReason(filters.rejectionReason) }
      : {}),
    ...(filters.apiKeyAuthSource !== undefined
      ? { apiKeyAuthSource: filters.apiKeyAuthSource }
      : {}),
  };
}

export function createPrismaAnalyticsRejectedRollupReadRepository(
  prisma: PrismaClient,
): AnalyticsRejectedRollupReadRepository {
  return {
    async listRejectedRollups(
      query: AnalyticsRejectedRollupReadQuery,
    ): Promise<AnalyticsRejectedRollupReadResult> {
      if (query.source !== "rejected") {
        throw new RangeError(
          "rejected rollup read repository only supports rejected source",
        );
      }

      const where = buildRejectedRollupWhere(query);

      if (where === null) {
        return {
          records: [],
          count: 0,
        };
      }

      const records = await prisma.analyticsRejectedRollup.findMany({
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
        records: records.map(mapRejectedRollupRecord),
        count: records.length,
      };
    },
  };
}

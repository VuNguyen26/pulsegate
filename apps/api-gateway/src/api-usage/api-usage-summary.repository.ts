import type {
  GatewayRouteMethod,
  PrismaClient,
} from "../generated/prisma/index.js";
import type { ApiUsageCacheStatus } from "./api-usage-recorder.js";
import type {
  ApiUsageSummaryFilters,
  ApiUsageSummaryReadModel,
  ApiUsageSummarySubjectType,
  ApiUsageSummaryRepository,
} from "./api-usage-summary.types.js";

type ApiUsageSummaryWhere = {
  consumerId?: string;
  apiKeyId?: string;
  occurredAt?: {
    gte?: Date;
    lte?: Date;
  };
  routePath?: string;
  routeMethod?: GatewayRouteMethod;
  statusCode?:
    | number
    | {
        gte?: number;
        lt?: number;
      };
  cacheStatus?: ApiUsageCacheStatus;
  apiKeyAuthSource?: string;
};

function buildSummaryWhere(
  subjectType: ApiUsageSummarySubjectType,
  subjectId: string,
  filters: ApiUsageSummaryFilters = {},
): ApiUsageSummaryWhere {
  const where: ApiUsageSummaryWhere =
    subjectType === "consumer"
      ? {
          consumerId: subjectId,
        }
      : {
          apiKeyId: subjectId,
        };

  if (filters.from || filters.to) {
    where.occurredAt = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    };
  }

  if (filters.routePath) {
    where.routePath = filters.routePath;
  }

  if (filters.routeMethod) {
    where.routeMethod = filters.routeMethod;
  }

  if (typeof filters.statusCode === "number") {
    where.statusCode = filters.statusCode;
  }

  if (filters.cacheStatus) {
    where.cacheStatus = filters.cacheStatus;
  }

  if (filters.apiKeyAuthSource) {
    where.apiKeyAuthSource = filters.apiKeyAuthSource;
  }

  return where;
}

function buildSuccessfulRequestsWhere(
  where: ApiUsageSummaryWhere,
  statusCode?: number,
): ApiUsageSummaryWhere | null {
  if (typeof statusCode === "number") {
    return statusCode >= 200 && statusCode < 400 ? where : null;
  }

  return {
    ...where,
    statusCode: {
      gte: 200,
      lt: 400,
    },
  };
}

function buildErrorRequestsWhere(
  where: ApiUsageSummaryWhere,
  statusCode?: number,
): ApiUsageSummaryWhere | null {
  if (typeof statusCode === "number") {
    return statusCode >= 400 ? where : null;
  }

  return {
    ...where,
    statusCode: {
      gte: 400,
    },
  };
}

function buildCacheStatusWhere(
  where: ApiUsageSummaryWhere,
  requestedCacheStatus: ApiUsageCacheStatus | undefined,
  targetCacheStatus: ApiUsageCacheStatus,
): ApiUsageSummaryWhere | null {
  if (requestedCacheStatus) {
    return requestedCacheStatus === targetCacheStatus ? where : null;
  }

  return {
    ...where,
    cacheStatus: targetCacheStatus,
  };
}

async function countOrZero(
  prisma: PrismaClient,
  where: ApiUsageSummaryWhere | null,
): Promise<number> {
  if (!where) {
    return 0;
  }

  return prisma.apiUsageEvent.count({
    where,
  });
}

async function getUsageSummary(
  prisma: PrismaClient,
  subjectType: ApiUsageSummarySubjectType,
  subjectId: string,
  filters: ApiUsageSummaryFilters = {},
): Promise<ApiUsageSummaryReadModel> {
  const where = buildSummaryWhere(subjectType, subjectId, filters);
  const successfulRequestsWhere = buildSuccessfulRequestsWhere(
    where,
    filters.statusCode,
  );
  const errorRequestsWhere = buildErrorRequestsWhere(
    where,
    filters.statusCode,
  );
  const cacheHitsWhere = buildCacheStatusWhere(
    where,
    filters.cacheStatus,
    "HIT",
  );
  const cacheMissesWhere = buildCacheStatusWhere(
    where,
    filters.cacheStatus,
    "MISS",
  );
  const cacheBypassesWhere = buildCacheStatusWhere(
    where,
    filters.cacheStatus,
    "BYPASS",
  );

  const [
    totalRequests,
    successfulRequests,
    errorRequests,
    durationAggregate,
    cacheHits,
    cacheMisses,
    cacheBypasses,
    lastUsageEvent,
  ] = await Promise.all([
    prisma.apiUsageEvent.count({
      where,
    }),
    countOrZero(prisma, successfulRequestsWhere),
    countOrZero(prisma, errorRequestsWhere),
    prisma.apiUsageEvent.aggregate({
      where,
      _avg: {
        durationMs: true,
      },
    }),
    countOrZero(prisma, cacheHitsWhere),
    countOrZero(prisma, cacheMissesWhere),
    countOrZero(prisma, cacheBypassesWhere),
    prisma.apiUsageEvent.findFirst({
      where,
      orderBy: {
        occurredAt: "desc",
      },
      select: {
        occurredAt: true,
      },
    }),
  ]);

  return {
    subjectType,
    subjectId,
    totalRequests,
    successfulRequests,
    errorRequests,
    averageDurationMs: Math.round(durationAggregate._avg.durationMs ?? 0),
    cacheHits,
    cacheMisses,
    cacheBypasses,
    lastRequestAt: lastUsageEvent?.occurredAt ?? null,
  };
}

export function createPrismaApiUsageSummaryRepository(
  prisma: PrismaClient,
): ApiUsageSummaryRepository {
  return {
    getConsumerUsageSummary: (consumerId, filters) =>
      getUsageSummary(prisma, "consumer", consumerId, filters),

    getApiKeyUsageSummary: (apiKeyId, filters) =>
      getUsageSummary(prisma, "apiKey", apiKeyId, filters),
  };
}

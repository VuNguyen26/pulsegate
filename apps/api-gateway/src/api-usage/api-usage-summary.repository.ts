import type { PrismaClient } from "../generated/prisma/index.js";
import type {
  ApiUsageSummaryReadModel,
  ApiUsageSummarySubjectType,
  ApiUsageSummaryRepository,
} from "./api-usage-summary.types.js";

type ApiUsageSummaryWhere =
  | {
      consumerId: string;
    }
  | {
      apiKeyId: string;
    };

function buildSummaryWhere(
  subjectType: ApiUsageSummarySubjectType,
  subjectId: string,
): ApiUsageSummaryWhere {
  return subjectType === "consumer"
    ? {
        consumerId: subjectId,
      }
    : {
        apiKeyId: subjectId,
      };
}

async function getUsageSummary(
  prisma: PrismaClient,
  subjectType: ApiUsageSummarySubjectType,
  subjectId: string,
): Promise<ApiUsageSummaryReadModel> {
  const where = buildSummaryWhere(subjectType, subjectId);

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
    prisma.apiUsageEvent.count({
      where: {
        ...where,
        statusCode: {
          gte: 200,
          lt: 400,
        },
      },
    }),
    prisma.apiUsageEvent.count({
      where: {
        ...where,
        statusCode: {
          gte: 400,
        },
      },
    }),
    prisma.apiUsageEvent.aggregate({
      where,
      _avg: {
        durationMs: true,
      },
    }),
    prisma.apiUsageEvent.count({
      where: {
        ...where,
        cacheStatus: "HIT",
      },
    }),
    prisma.apiUsageEvent.count({
      where: {
        ...where,
        cacheStatus: "MISS",
      },
    }),
    prisma.apiUsageEvent.count({
      where: {
        ...where,
        cacheStatus: "BYPASS",
      },
    }),
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
    getConsumerUsageSummary: (consumerId) =>
      getUsageSummary(prisma, "consumer", consumerId),

    getApiKeyUsageSummary: (apiKeyId) =>
      getUsageSummary(prisma, "apiKey", apiKeyId),
  };
}

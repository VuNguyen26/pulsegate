import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  createPrismaAnalyticsRejectedRollupReadRepository,
  type AnalyticsRejectedRollupReadRecord,
} from "../analytics/analytics-rejected-rollup-read.repository.js";
import {
  createAnalyticsRollupReadQuery,
  type AnalyticsRollupReadQuery,
  type AnalyticsRollupReadQueryInput,
} from "../analytics/analytics-rollup-read-query.js";
import {
  createAnalyticsRollupReadService,
  type AnalyticsRollupReadResult,
  type AnalyticsRollupReadService,
} from "../analytics/analytics-rollup-read-service.js";
import {
  createPrismaAnalyticsUsageRollupReadRepository,
  type AnalyticsUsageRollupReadRecord,
} from "../analytics/analytics-usage-rollup-read.repository.js";
import { gatewayPrisma } from "../database/gateway-prisma.js";
import { createAdminApiKeyAuthMiddleware } from "../middlewares/admin-api-key-auth.middleware.js";

type QueryValue = string | string[] | undefined;

export type AdminAnalyticsRollupReadQuerystring = {
  from?: QueryValue;
  to?: QueryValue;
  granularity?: QueryValue;
  source?: QueryValue;
  routePath?: QueryValue;
  routeMethod?: QueryValue;
  statusCode?: QueryValue;
  cacheStatus?: QueryValue;
  apiKeyAuthSource?: QueryValue;
  apiKeyId?: QueryValue;
  consumerId?: QueryValue;
  rejectionReason?: QueryValue;
  limit?: QueryValue;
};

export type AdminAnalyticsRollupRouteOptions = {
  rollupReadService?: AnalyticsRollupReadService;
  adminApiKey?: string;
  adminApiKeyHeader?: string;
};

function sendInvalidQueryParameter(
  reply: FastifyReply,
  request: FastifyRequest,
  message: string,
) {
  return reply.status(400).send({
    error: {
      code: "INVALID_QUERY_PARAMETER",
      message,
      requestId: request.id,
    },
  });
}

function parseSingleQueryValue(
  value: QueryValue,
  name: string,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    throw new RangeError(`${name} must be a single query parameter`);
  }

  return value;
}

function parseRequiredQueryValue(value: QueryValue, name: string): string {
  const parsed = parseSingleQueryValue(value, name);

  if (parsed === undefined) {
    throw new RangeError(`${name} is required`);
  }

  return parsed;
}

function buildRollupReadQueryInput(
  querystring: AdminAnalyticsRollupReadQuerystring,
): AnalyticsRollupReadQueryInput {
  return {
    from: parseRequiredQueryValue(querystring.from, "from"),
    to: parseRequiredQueryValue(querystring.to, "to"),
    granularity: parseRequiredQueryValue(
      querystring.granularity,
      "granularity",
    ),
    source: parseRequiredQueryValue(querystring.source, "source"),
    routePath: parseSingleQueryValue(querystring.routePath, "routePath"),
    routeMethod: parseSingleQueryValue(querystring.routeMethod, "routeMethod"),
    statusCode: parseSingleQueryValue(querystring.statusCode, "statusCode"),
    cacheStatus: parseSingleQueryValue(querystring.cacheStatus, "cacheStatus"),
    apiKeyAuthSource: parseSingleQueryValue(
      querystring.apiKeyAuthSource,
      "apiKeyAuthSource",
    ),
    apiKeyId: parseSingleQueryValue(querystring.apiKeyId, "apiKeyId"),
    consumerId: parseSingleQueryValue(querystring.consumerId, "consumerId"),
    rejectionReason: parseSingleQueryValue(
      querystring.rejectionReason,
      "rejectionReason",
    ),
    limit: parseSingleQueryValue(querystring.limit, "limit"),
  };
}

function mapWindowToResponse(query: AnalyticsRollupReadQuery) {
  return {
    requestedFrom: query.windowPlan.requestedFrom.toISOString(),
    requestedTo: query.windowPlan.requestedTo.toISOString(),
    rebuildFrom: query.windowPlan.rebuildFrom?.toISOString() ?? null,
    rebuildTo: query.windowPlan.rebuildTo?.toISOString() ?? null,
    bucketCount: query.windowPlan.bucketCount,
  };
}

function mapFiltersToResponse(query: AnalyticsRollupReadQuery) {
  const filters = query.filters;
  const commonFilters = {
    routePath: filters.routePath ?? null,
    routeMethod: filters.routeMethod ?? null,
    statusCode: filters.statusCode ?? null,
    apiKeyAuthSource: filters.apiKeyAuthSource ?? null,
    apiKeyId: filters.apiKeyId ?? null,
    consumerId: filters.consumerId ?? null,
  };

  if (query.source === "usage") {
    return {
      ...commonFilters,
      cacheStatus: filters.cacheStatus ?? null,
    };
  }

  return {
    ...commonFilters,
    rejectionReason: filters.rejectionReason ?? null,
  };
}

function mapUsageRollupRecordToResponse(record: AnalyticsUsageRollupReadRecord) {
  return {
    id: record.id,
    granularity: record.granularity,
    bucketStart: record.bucketStart.toISOString(),
    bucketEnd: record.bucketEnd.toISOString(),
    dimensionHash: record.dimensionHash,
    consumerId: record.consumerId,
    apiKeyId: record.apiKeyId,
    routePath: record.routePath,
    routeMethod: record.routeMethod,
    statusClass: record.statusClass,
    cacheStatus: record.cacheStatus,
    apiKeyAuthSource: record.apiKeyAuthSource,
    totalRequests: record.totalRequests,
    successfulRequests: record.successfulRequests,
    errorRequests: record.errorRequests,
    totalDurationMs: record.totalDurationMs,
    averageDurationMs: record.averageDurationMs,
    cacheHits: record.cacheHits,
    cacheMisses: record.cacheMisses,
    cacheBypasses: record.cacheBypasses,
    lastRequestAt: record.lastRequestAt.toISOString(),
    rolledUpAt: record.rolledUpAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapRejectedRollupRecordToResponse(
  record: AnalyticsRejectedRollupReadRecord,
) {
  return {
    id: record.id,
    granularity: record.granularity,
    bucketStart: record.bucketStart.toISOString(),
    bucketEnd: record.bucketEnd.toISOString(),
    dimensionHash: record.dimensionHash,
    consumerId: record.consumerId,
    apiKeyId: record.apiKeyId,
    routePath: record.routePath,
    routeMethod: record.routeMethod,
    rejectionReason: record.rejectionReason,
    statusCode: record.statusCode,
    apiKeyAuthSource: record.apiKeyAuthSource,
    totalRejectedRequests: record.totalRejectedRequests,
    lastRejectedAt: record.lastRejectedAt.toISOString(),
    rolledUpAt: record.rolledUpAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapRollupReadResultToResponse(
  query: AnalyticsRollupReadQuery,
  result: AnalyticsRollupReadResult,
) {
  if (result.source === "usage") {
    return {
      source: result.source,
      granularity: query.granularity,
      window: mapWindowToResponse(query),
      limit: query.limit,
      filters: mapFiltersToResponse(query),
      count: result.count,
      items: result.records.map(mapUsageRollupRecordToResponse),
    };
  }

  return {
    source: result.source,
    granularity: query.granularity,
    window: mapWindowToResponse(query),
    limit: query.limit,
    filters: mapFiltersToResponse(query),
    count: result.count,
    items: result.records.map(mapRejectedRollupRecordToResponse),
  };
}

export async function adminAnalyticsRollupRoute(
  app: FastifyInstance,
  options: AdminAnalyticsRollupRouteOptions = {},
): Promise<void> {
  const rollupReadService =
    options.rollupReadService ??
    createAnalyticsRollupReadService({
      usageRollupReadRepository: createPrismaAnalyticsUsageRollupReadRepository(
        gatewayPrisma,
      ),
      rejectedRollupReadRepository:
        createPrismaAnalyticsRejectedRollupReadRepository(gatewayPrisma),
    });

  const requireAdminApiKey = createAdminApiKeyAuthMiddleware({
    apiKey: options.adminApiKey,
    headerName: options.adminApiKeyHeader,
  });

  app.get<{ Querystring: AdminAnalyticsRollupReadQuerystring }>(
    "/internal/admin/analytics/rollups",
    {
      preHandler: requireAdminApiKey,
    },
    async (request, reply) => {
      let query: AnalyticsRollupReadQuery;

      try {
        query = createAnalyticsRollupReadQuery(
          buildRollupReadQueryInput(request.query),
        );
      } catch (error) {
        if (error instanceof RangeError) {
          return sendInvalidQueryParameter(reply, request, error.message);
        }

        throw error;
      }

      const result = await rollupReadService.readRollups(query);

      return {
        data: mapRollupReadResultToResponse(query, result),
      };
    },
  );
}

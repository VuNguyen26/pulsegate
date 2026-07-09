import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { createPrismaAnalyticsRejectedRollupReadRepository } from "../analytics/analytics-rejected-rollup-read.repository.js";
import {
  createAnalyticsRollupReadService,
  type AnalyticsRollupReadService,
} from "../analytics/analytics-rollup-read-service.js";
import { mapApiKeyUsageSummaryPreviewRequest, mapConsumerUsageSummaryPreviewRequest } from "../analytics/analytics-rollup-summary-preview-request-mapper.js";
import {
  mapApiKeyUsageSummaryRuntimeReadDecisionRequest,
  mapConsumerUsageSummaryRuntimeReadDecisionRequest,
} from "../analytics/analytics-rollup-summary-runtime-read-decision-request-mapper.js";
import { resolveUsageSummaryWithRollupRuntimeReadService } from "../analytics/analytics-rollup-summary-runtime-read-service.js";
import { createPrismaAnalyticsUsageRollupReadRepository } from "../analytics/analytics-usage-rollup-read.repository.js";
import { createPrismaApiConsumerManagementRepository } from "../api-consumers/api-consumer-management.repository.js";
import type { ApiConsumerManagementRepository } from "../api-consumers/api-consumer-management.types.js";
import { createPrismaApiKeyManagementRepository } from "../api-keys/api-key-management.repository.js";
import type { ApiKeyManagementRepository } from "../api-keys/api-key-management.types.js";
import {
  parseApiUsageEventsListingQuery,
  type AdminApiUsageEventsQuerystring,
} from "../api-usage/api-usage-events-listing-query.js";
import { mapApiUsageEventsListingReadModelToResponse } from "../api-usage/api-usage-events-listing.mapper.js";
import { createPrismaApiUsageEventsListingRepository } from "../api-usage/api-usage-events-listing.repository.js";
import type { ApiUsageEventsListingRepository } from "../api-usage/api-usage-events-listing.types.js";
import {
  parseApiUsageSummaryQuery,
  type AdminApiUsageSummaryQuerystring,
  type QueryValidationError,
} from "../api-usage/api-usage-summary-query.js";
import { mapApiUsageSummaryReadModelToResponse } from "../api-usage/api-usage-summary.mapper.js";
import { createPrismaApiUsageSummaryRepository } from "../api-usage/api-usage-summary.repository.js";
import type {
  ApiUsageSummaryFilters,
  ApiUsageSummaryRepository,
} from "../api-usage/api-usage-summary.types.js";
import { gatewayPrisma } from "../database/gateway-prisma.js";
import { createAdminApiKeyAuthMiddleware } from "../middlewares/admin-api-key-auth.middleware.js";

export type AdminApiUsageRouteOptions = {
  usageSummaryRepository?: ApiUsageSummaryRepository;
  usageEventsListingRepository?: ApiUsageEventsListingRepository;
  consumerRepository?: ApiConsumerManagementRepository;
  apiKeyRepository?: ApiKeyManagementRepository;
  rollupReadService?: AnalyticsRollupReadService;
  adminApiKey?: string;
  adminApiKeyHeader?: string;
};

type ConsumerUsageSummaryParams = {
  consumerId: string;
};

type ApiKeyUsageSummaryParams = {
  apiKeyId: string;
};

type ApiUsageSummaryFiltersResponse = {
  from?: string;
  to?: string;
  routePath?: string;
  routeMethod?: string;
  statusCode?: number;
  cacheStatus?: string;
  apiKeyAuthSource?: string;
};

function mapApiUsageSummaryFiltersToResponse(
  filters: ApiUsageSummaryFilters,
): ApiUsageSummaryFiltersResponse {
  return {
    ...(filters.from ? { from: filters.from.toISOString() } : {}),
    ...(filters.to ? { to: filters.to.toISOString() } : {}),
    ...(filters.routePath ? { routePath: filters.routePath } : {}),
    ...(filters.routeMethod ? { routeMethod: filters.routeMethod } : {}),
    ...(typeof filters.statusCode === "number"
      ? { statusCode: filters.statusCode }
      : {}),
    ...(filters.cacheStatus ? { cacheStatus: filters.cacheStatus } : {}),
    ...(filters.apiKeyAuthSource
      ? { apiKeyAuthSource: filters.apiKeyAuthSource }
      : {}),
  };
}

function shouldIncludeRollupSummaryPreview(
  query: AdminApiUsageSummaryQuerystring,
): boolean {
  return query.rollupSummaryPreview?.trim().toLowerCase() === "true";
}

function shouldUseRollupSummaryRuntimeRead(
  query: AdminApiUsageSummaryQuerystring,
): boolean {
  return query.rollupSummaryRuntimeRead?.trim().toLowerCase() === "true";
}

function sendInvalidQueryParameter(
  reply: FastifyReply,
  request: FastifyRequest,
  error: QueryValidationError,
) {
  return reply.status(400).send({
    error: {
      code: error.code,
      message: error.message,
      requestId: request.id,
    },
  });
}

function createDefaultRollupReadService(): AnalyticsRollupReadService {
  return createAnalyticsRollupReadService({
    usageRollupReadRepository:
      createPrismaAnalyticsUsageRollupReadRepository(gatewayPrisma),
    rejectedRollupReadRepository:
      createPrismaAnalyticsRejectedRollupReadRepository(gatewayPrisma),
  });
}

export async function adminApiUsageRoute(
  app: FastifyInstance,
  options: AdminApiUsageRouteOptions = {},
): Promise<void> {
  const usageSummaryRepository =
    options.usageSummaryRepository ??
    createPrismaApiUsageSummaryRepository(gatewayPrisma);
  const usageEventsListingRepository =
    options.usageEventsListingRepository ??
    createPrismaApiUsageEventsListingRepository(gatewayPrisma);
  const consumerRepository =
    options.consumerRepository ??
    createPrismaApiConsumerManagementRepository(gatewayPrisma);
  const apiKeyRepository =
    options.apiKeyRepository ??
    createPrismaApiKeyManagementRepository(gatewayPrisma);
  const rollupReadService =
    options.rollupReadService ?? createDefaultRollupReadService();

  const requireAdminApiKey = createAdminApiKeyAuthMiddleware({
    apiKey: options.adminApiKey,
    headerName: options.adminApiKeyHeader,
  });

  app.get<{ Querystring: AdminApiUsageEventsQuerystring }>(
    "/internal/admin/usage/events",
    {
      preHandler: requireAdminApiKey,
    },
    async (request, reply) => {
      const parsedQuery = parseApiUsageEventsListingQuery(request.query);
      if (!parsedQuery.ok) {
        return sendInvalidQueryParameter(reply, request, parsedQuery.error);
      }

      const listing = await usageEventsListingRepository.listEvents(
        parsedQuery.value,
      );

      return {
        data: mapApiUsageEventsListingReadModelToResponse(listing),
      };
    },
  );

  app.get<{
    Params: ConsumerUsageSummaryParams;
    Querystring: AdminApiUsageSummaryQuerystring;
  }>(
    "/internal/admin/usage/consumers/:consumerId/summary",
    {
      preHandler: requireAdminApiKey,
    },
    async (request, reply) => {
      const parsedQuery = parseApiUsageSummaryQuery(request.query);
      if (!parsedQuery.ok) {
        return sendInvalidQueryParameter(reply, request, parsedQuery.error);
      }

      const consumer = await consumerRepository.findConsumerById(
        request.params.consumerId,
      );

      if (!consumer) {
        return reply.status(404).send({
          error: {
            code: "API_CONSUMER_NOT_FOUND",
            message: "API consumer was not found",
            requestId: request.id,
          },
        });
      }

      const filters = parsedQuery.value.filters;
      const rawSummary = await usageSummaryRepository.getConsumerUsageSummary(
        consumer.id,
        filters,
      );

      const summary = shouldUseRollupSummaryRuntimeRead(request.query)
        ? (
            await resolveUsageSummaryWithRollupRuntimeReadService({
              decisionRequest: mapConsumerUsageSummaryRuntimeReadDecisionRequest({
                filters,
                rollupRuntimeReadEnabled: true,
                rollupDataState: "fresh",
              }),
              rawSummary,
              subjectType: "consumer",
              subjectId: consumer.id,
              rollupReadService,
            })
          ).summary
        : rawSummary;

      const response = {
        data: mapApiUsageSummaryReadModelToResponse(summary),
        filters: mapApiUsageSummaryFiltersToResponse(filters),
      };

      if (shouldIncludeRollupSummaryPreview(request.query)) {
        return {
          ...response,
          rollupSummaryPreview: mapConsumerUsageSummaryPreviewRequest({
            filters,
            rollupPreviewEnabled: true,
          }).output,
        };
      }

      return response;
    },
  );

  app.get<{
    Params: ApiKeyUsageSummaryParams;
    Querystring: AdminApiUsageSummaryQuerystring;
  }>(
    "/internal/admin/usage/api-keys/:apiKeyId/summary",
    {
      preHandler: requireAdminApiKey,
    },
    async (request, reply) => {
      const parsedQuery = parseApiUsageSummaryQuery(request.query);
      if (!parsedQuery.ok) {
        return sendInvalidQueryParameter(reply, request, parsedQuery.error);
      }

      const apiKey = await apiKeyRepository.findApiKeyById(
        request.params.apiKeyId,
      );

      if (!apiKey) {
        return reply.status(404).send({
          error: {
            code: "API_KEY_NOT_FOUND",
            message: "API key was not found",
            requestId: request.id,
          },
        });
      }

      const filters = parsedQuery.value.filters;
      const rawSummary = await usageSummaryRepository.getApiKeyUsageSummary(
        apiKey.id,
        filters,
      );

      const summary = shouldUseRollupSummaryRuntimeRead(request.query)
        ? (
            await resolveUsageSummaryWithRollupRuntimeReadService({
              decisionRequest: mapApiKeyUsageSummaryRuntimeReadDecisionRequest({
                filters,
                rollupRuntimeReadEnabled: true,
                rollupDataState: "fresh",
              }),
              rawSummary,
              subjectType: "apiKey",
              subjectId: apiKey.id,
              rollupReadService,
            })
          ).summary
        : rawSummary;

      const response = {
        data: mapApiUsageSummaryReadModelToResponse(summary),
        filters: mapApiUsageSummaryFiltersToResponse(filters),
      };

      if (shouldIncludeRollupSummaryPreview(request.query)) {
        return {
          ...response,
          rollupSummaryPreview: mapApiKeyUsageSummaryPreviewRequest({
            filters,
            rollupPreviewEnabled: true,
          }).output,
        };
      }

      return response;
    },
  );
}
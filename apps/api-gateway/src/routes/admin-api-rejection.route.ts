import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { createPrismaAnalyticsRejectedRollupReadRepository } from "../analytics/analytics-rejected-rollup-read.repository.js";
import {
  createAnalyticsRollupReadService,
  type AnalyticsRollupReadService,
} from "../analytics/analytics-rollup-read-service.js";
import { mapRejectedSummaryPreviewRequest } from "../analytics/analytics-rollup-summary-preview-request-mapper.js";
import { mapRejectedSummaryRuntimeReadDecisionRequest } from "../analytics/analytics-rollup-summary-runtime-read-decision-request-mapper.js";
import { resolveRejectedSummaryWithRollupRuntimeReadService } from "../analytics/analytics-rollup-summary-runtime-read-service.js";
import { createPrismaAnalyticsUsageRollupReadRepository } from "../analytics/analytics-usage-rollup-read.repository.js";
import { createPrismaApiRejectedEventsListingRepository } from "../api-rejections/api-rejected-events-listing.repository.js";
import {
  parseRejectedEventsListingQuery,
  type AdminApiRejectedEventsQuerystring,
  type QueryValidationError,
} from "../api-rejections/api-rejected-events-listing-query.js";
import type { ApiRejectedEventsListingRepository } from "../api-rejections/api-rejected-events-listing.types.js";
import { mapApiRejectedEventsListingReadModelToResponse } from "../api-rejections/api-rejected-events-listing.mapper.js";
import { createPrismaApiRejectedEventsSummaryRepository } from "../api-rejections/api-rejected-events-summary.repository.js";
import type { ApiRejectedEventsSummaryRepository } from "../api-rejections/api-rejected-events-summary.types.js";
import { mapApiRejectedEventsSummaryReadModelToResponse } from "../api-rejections/api-rejected-events-summary.mapper.js";
import { gatewayPrisma } from "../database/gateway-prisma.js";
import { createAdminApiKeyAuthMiddleware } from "../middlewares/admin-api-key-auth.middleware.js";

export type AdminApiRejectionRouteOptions = {
  rejectedEventsSummaryRepository?: ApiRejectedEventsSummaryRepository;
  rejectedEventsListingRepository?: ApiRejectedEventsListingRepository;
  rollupReadService?: AnalyticsRollupReadService;
  adminApiKey?: string;
  adminApiKeyHeader?: string;
};

function sendBadQueryResponse(
  request: FastifyRequest,
  reply: FastifyReply,
  error: QueryValidationError,
) {
  return reply.code(400).send({
    error: {
      code: error.code,
      message: error.message,
      requestId: request.id,
    },
  });
}

function shouldIncludeRollupSummaryPreview(
  query: AdminApiRejectedEventsQuerystring,
): boolean {
  return query.rollupSummaryPreview?.trim().toLowerCase() === "true";
}

function shouldUseRollupSummaryRuntimeRead(
  query: AdminApiRejectedEventsQuerystring,
): boolean {
  return query.rollupSummaryRuntimeRead?.trim().toLowerCase() === "true";
}

function createDefaultRollupReadService(): AnalyticsRollupReadService {
  return createAnalyticsRollupReadService({
    usageRollupReadRepository:
      createPrismaAnalyticsUsageRollupReadRepository(gatewayPrisma),
    rejectedRollupReadRepository:
      createPrismaAnalyticsRejectedRollupReadRepository(gatewayPrisma),
  });
}

export async function adminApiRejectionRoute(
  app: FastifyInstance,
  options: AdminApiRejectionRouteOptions = {},
): Promise<void> {
  const rejectedEventsSummaryRepository =
    options.rejectedEventsSummaryRepository ??
    createPrismaApiRejectedEventsSummaryRepository(gatewayPrisma);
  const rejectedEventsListingRepository =
    options.rejectedEventsListingRepository ??
    createPrismaApiRejectedEventsListingRepository(gatewayPrisma);
  const rollupReadService =
    options.rollupReadService ?? createDefaultRollupReadService();

  const requireAdminApiKey = createAdminApiKeyAuthMiddleware({
    apiKey: options.adminApiKey,
    headerName: options.adminApiKeyHeader,
  });

  app.get<{ Querystring: AdminApiRejectedEventsQuerystring }>(
    "/internal/admin/api-rejections/summary",
    {
      preHandler: requireAdminApiKey,
    },
    async (request, reply) => {
      const parsedQuery = parseRejectedEventsListingQuery(request.query, {
        allowCursor: false,
      });

      if (!parsedQuery.ok) {
        return sendBadQueryResponse(request, reply, parsedQuery.error);
      }

      const filters = parsedQuery.value.filters;
      const rawSummary = await rejectedEventsSummaryRepository.getSummary(
        filters,
      );

      const summary = shouldUseRollupSummaryRuntimeRead(request.query)
        ? (
            await resolveRejectedSummaryWithRollupRuntimeReadService({
              decisionRequest: mapRejectedSummaryRuntimeReadDecisionRequest({
                filters,
                rollupRuntimeReadEnabled: true,
                rollupDataState: "fresh",
              }),
              rawSummary,
              filters,
              rollupReadService,
            })
          ).summary
        : rawSummary;

      const response = {
        data: mapApiRejectedEventsSummaryReadModelToResponse(summary),
      };

      if (shouldIncludeRollupSummaryPreview(request.query)) {
        return {
          ...response,
          rollupSummaryPreview: mapRejectedSummaryPreviewRequest({
            filters,
            rollupPreviewEnabled: true,
          }).output,
        };
      }

      return response;
    },
  );

  app.get<{ Querystring: AdminApiRejectedEventsQuerystring }>(
    "/internal/admin/api-rejections/events",
    {
      preHandler: requireAdminApiKey,
    },
    async (request, reply) => {
      const parsedQuery = parseRejectedEventsListingQuery(request.query);

      if (!parsedQuery.ok) {
        return sendBadQueryResponse(request, reply, parsedQuery.error);
      }

      const listing = await rejectedEventsListingRepository.listEvents(
        parsedQuery.value,
      );

      return {
        data: mapApiRejectedEventsListingReadModelToResponse(listing),
      };
    },
  );
}
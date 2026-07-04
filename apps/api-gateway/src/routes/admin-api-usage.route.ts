import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { createPrismaApiConsumerManagementRepository } from "../api-consumers/api-consumer-management.repository.js";
import type { ApiConsumerManagementRepository } from "../api-consumers/api-consumer-management.types.js";
import { createPrismaApiKeyManagementRepository } from "../api-keys/api-key-management.repository.js";
import type { ApiKeyManagementRepository } from "../api-keys/api-key-management.types.js";
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
  consumerRepository?: ApiConsumerManagementRepository;
  apiKeyRepository?: ApiKeyManagementRepository;
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

export async function adminApiUsageRoute(
  app: FastifyInstance,
  options: AdminApiUsageRouteOptions = {},
): Promise<void> {
  const usageSummaryRepository =
    options.usageSummaryRepository ??
    createPrismaApiUsageSummaryRepository(gatewayPrisma);

  const consumerRepository =
    options.consumerRepository ??
    createPrismaApiConsumerManagementRepository(gatewayPrisma);

  const apiKeyRepository =
    options.apiKeyRepository ??
    createPrismaApiKeyManagementRepository(gatewayPrisma);

  const requireAdminApiKey = createAdminApiKeyAuthMiddleware({
    apiKey: options.adminApiKey,
    headerName: options.adminApiKeyHeader,
  });

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
      const summary = await usageSummaryRepository.getConsumerUsageSummary(
        consumer.id,
        filters,
      );

      return {
        data: mapApiUsageSummaryReadModelToResponse(summary),
        filters: mapApiUsageSummaryFiltersToResponse(filters),
      };
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
      const summary = await usageSummaryRepository.getApiKeyUsageSummary(
        apiKey.id,
        filters,
      );

      return {
        data: mapApiUsageSummaryReadModelToResponse(summary),
        filters: mapApiUsageSummaryFiltersToResponse(filters),
      };
    },
  );
}

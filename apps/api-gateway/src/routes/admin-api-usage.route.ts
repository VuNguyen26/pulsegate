import type { FastifyInstance } from "fastify";

import { createPrismaApiConsumerManagementRepository } from "../api-consumers/api-consumer-management.repository.js";
import type { ApiConsumerManagementRepository } from "../api-consumers/api-consumer-management.types.js";
import { createPrismaApiKeyManagementRepository } from "../api-keys/api-key-management.repository.js";
import type { ApiKeyManagementRepository } from "../api-keys/api-key-management.types.js";
import { mapApiUsageSummaryReadModelToResponse } from "../api-usage/api-usage-summary.mapper.js";
import { createPrismaApiUsageSummaryRepository } from "../api-usage/api-usage-summary.repository.js";
import type { ApiUsageSummaryRepository } from "../api-usage/api-usage-summary.types.js";
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

  app.get<{ Params: ConsumerUsageSummaryParams }>(
    "/internal/admin/usage/consumers/:consumerId/summary",
    {
      preHandler: requireAdminApiKey,
    },
    async (request, reply) => {
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

      const summary = await usageSummaryRepository.getConsumerUsageSummary(
        consumer.id,
      );

      return {
        data: mapApiUsageSummaryReadModelToResponse(summary),
      };
    },
  );

  app.get<{ Params: ApiKeyUsageSummaryParams }>(
    "/internal/admin/usage/api-keys/:apiKeyId/summary",
    {
      preHandler: requireAdminApiKey,
    },
    async (request, reply) => {
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

      const summary = await usageSummaryRepository.getApiKeyUsageSummary(
        apiKey.id,
      );

      return {
        data: mapApiUsageSummaryReadModelToResponse(summary),
      };
    },
  );
}

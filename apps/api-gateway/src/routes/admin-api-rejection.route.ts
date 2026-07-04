import type { FastifyInstance } from "fastify";

import { createPrismaApiRejectedEventsSummaryRepository } from "../api-rejections/api-rejected-events-summary.repository.js";
import type { ApiRejectedEventsSummaryRepository } from "../api-rejections/api-rejected-events-summary.types.js";
import { mapApiRejectedEventsSummaryReadModelToResponse } from "../api-rejections/api-rejected-events-summary.mapper.js";
import { gatewayPrisma } from "../database/gateway-prisma.js";
import { createAdminApiKeyAuthMiddleware } from "../middlewares/admin-api-key-auth.middleware.js";

export type AdminApiRejectionRouteOptions = {
  rejectedEventsSummaryRepository?: ApiRejectedEventsSummaryRepository;
  adminApiKey?: string;
  adminApiKeyHeader?: string;
};

export async function adminApiRejectionRoute(
  app: FastifyInstance,
  options: AdminApiRejectionRouteOptions = {},
): Promise<void> {
  const rejectedEventsSummaryRepository =
    options.rejectedEventsSummaryRepository ??
    createPrismaApiRejectedEventsSummaryRepository(gatewayPrisma);

  const requireAdminApiKey = createAdminApiKeyAuthMiddleware({
    apiKey: options.adminApiKey,
    headerName: options.adminApiKeyHeader,
  });

  app.get(
    "/internal/admin/api-rejections/summary",
    {
      preHandler: requireAdminApiKey,
    },
    async () => {
      const summary = await rejectedEventsSummaryRepository.getSummary();

      return {
        data: mapApiRejectedEventsSummaryReadModelToResponse(summary),
      };
    },
  );
}

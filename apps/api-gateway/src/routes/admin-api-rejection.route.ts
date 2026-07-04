import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

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

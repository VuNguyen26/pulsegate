import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  createPrismaAnalyticsRetentionCandidateReadRepository,
} from "../analytics/analytics-retention-candidate-read.repository.js";
import {
  createAnalyticsRetentionAdminPreviewService,
  type AnalyticsRetentionAdminPreview,
} from "../analytics/analytics-retention-admin-preview.js";
import {
  gatewayPrisma,
} from "../database/gateway-prisma.js";
import {
  createAdminApiKeyAuthMiddleware,
} from "../middlewares/admin-api-key-auth.middleware.js";

export type AdminAnalyticsRetentionPreviewRouteOptions = {
  adminApiKey?: string;
  adminApiKeyHeader?: string;
  previewRetention?: (
    now?: Date,
  ) => Promise<AnalyticsRetentionAdminPreview>;
};

type AdminAnalyticsRetentionPreviewQuerystring =
  Record<
    string,
    string | string[] | undefined
  >;

function sendInvalidQueryParameter(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  return reply.status(400).send({
    error: {
      code: "INVALID_QUERY_PARAMETER",
      message:
        "Retention preview does not accept query parameters.",
      requestId: request.id,
    },
  });
}

export async function adminAnalyticsRetentionPreviewRoute(
  app: FastifyInstance,
  options:
    AdminAnalyticsRetentionPreviewRouteOptions = {},
): Promise<void> {
  const previewRetention =
    options.previewRetention ??
    createAnalyticsRetentionAdminPreviewService(
      createPrismaAnalyticsRetentionCandidateReadRepository(
        gatewayPrisma,
      ),
    ).previewRetention;

  const requireAdminApiKey =
    createAdminApiKeyAuthMiddleware({
      apiKey: options.adminApiKey,
      headerName: options.adminApiKeyHeader,
    });

  app.get<{
    Querystring:
      AdminAnalyticsRetentionPreviewQuerystring;
  }>(
    "/internal/admin/analytics/retention-preview",
    {
      preHandler: requireAdminApiKey,
    },
    async (request, reply) => {
      if (
        Object.keys(request.query).length > 0
      ) {
        return sendInvalidQueryParameter(
          request,
          reply,
        );
      }

      return {
        data:
          await previewRetention(),
      };
    },
  );
}
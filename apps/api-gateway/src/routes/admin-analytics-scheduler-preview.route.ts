import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  buildAnalyticsRollupSchedulerAdminPreview,
  type AnalyticsRollupSchedulerAdminPreview,
} from "../analytics/analytics-rollup-scheduler-admin-preview.js";
import {
  createAdminApiKeyAuthMiddleware,
} from "../middlewares/admin-api-key-auth.middleware.js";

export type AdminAnalyticsSchedulerPreviewRouteOptions = {
  adminApiKey?: string;
  adminApiKeyHeader?: string;
  buildPreview?: (
    now?: Date,
  ) => AnalyticsRollupSchedulerAdminPreview;
};

type AdminAnalyticsSchedulerPreviewQuerystring =
  Record<string, string | string[] | undefined>;

function sendInvalidQueryParameter(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  return reply.status(400).send({
    error: {
      code: "INVALID_QUERY_PARAMETER",
      message:
        "Scheduler preview does not accept query parameters.",
      requestId: request.id,
    },
  });
}

export async function adminAnalyticsSchedulerPreviewRoute(
  app: FastifyInstance,
  options:
    AdminAnalyticsSchedulerPreviewRouteOptions = {},
): Promise<void> {
  const buildPreview =
    options.buildPreview ??
    buildAnalyticsRollupSchedulerAdminPreview;

  const requireAdminApiKey =
    createAdminApiKeyAuthMiddleware({
      apiKey: options.adminApiKey,
      headerName: options.adminApiKeyHeader,
    });

  app.get<{
    Querystring:
      AdminAnalyticsSchedulerPreviewQuerystring;
  }>(
    "/internal/admin/analytics/scheduler-preview",
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
        data: buildPreview(),
      };
    },
  );
}
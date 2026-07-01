import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../config/env.js";

export type AdminApiKeyAuthOptions = {
  headerName?: string;
  apiKey?: string;
};

function getSingleHeaderValue(
  headerValue: string | string[] | undefined,
): string | undefined {
  if (typeof headerValue === "string") {
    return headerValue;
  }

  return undefined;
}

export function createAdminApiKeyAuthMiddleware(
  options: AdminApiKeyAuthOptions = {},
) {
  const headerName = (options.headerName ?? env.ADMIN_API_KEY_HEADER).toLowerCase();
  const expectedApiKey = options.apiKey ?? env.ADMIN_API_KEY;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const providedApiKey = getSingleHeaderValue(request.headers[headerName]);

    if (!providedApiKey) {
      return reply.status(401).send({
        error: {
          code: "ADMIN_API_KEY_MISSING",
          message: "Admin API key is required",
          requestId: request.id,
        },
      });
    }

    if (providedApiKey !== expectedApiKey) {
      return reply.status(403).send({
        error: {
          code: "ADMIN_API_KEY_INVALID",
          message: "Admin API key is invalid",
          requestId: request.id,
        },
      });
    }

    return undefined;
  };
}
import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../config/env.js";

export type AdminApiKeyAuthOptions = {
  headerName?: string;
  apiKey?: string;
};

export const ADMIN_API_KEY_AUTH_GUARD = Symbol(
  "admin-api-key-auth-guard",
);

export type AdminApiKeyAuthMiddleware = ((
  request: FastifyRequest,
  reply: FastifyReply,
) => Promise<unknown>) & {
  readonly [ADMIN_API_KEY_AUTH_GUARD]: true;
};

function getSingleHeaderValue(
  headerValue: string | string[] | undefined,
): string | undefined {
  if (typeof headerValue === "string") {
    return headerValue;
  }

  return undefined;
}

export function isAdminApiKeyAuthMiddleware(
  value: unknown,
): value is AdminApiKeyAuthMiddleware {
  return (
    typeof value === "function" &&
    (
      value as {
        [ADMIN_API_KEY_AUTH_GUARD]?: unknown;
      }
    )[ADMIN_API_KEY_AUTH_GUARD] === true
  );
}

export function createAdminApiKeyAuthMiddleware(
  options: AdminApiKeyAuthOptions = {},
): AdminApiKeyAuthMiddleware {
  const headerName = (
    options.headerName ?? env.ADMIN_API_KEY_HEADER
  ).toLowerCase();
  const expectedApiKey = options.apiKey ?? env.ADMIN_API_KEY;

  const middleware = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const providedApiKey = getSingleHeaderValue(
      request.headers[headerName],
    );

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

  Object.defineProperty(middleware, ADMIN_API_KEY_AUTH_GUARD, {
    value: true,
    configurable: false,
    enumerable: false,
    writable: false,
  });

  return middleware as AdminApiKeyAuthMiddleware;
}
import type { FastifyReply, FastifyRequest } from "fastify";

import {
  hashApiKey,
  verifyApiKeyHash,
} from "../api-keys/api-key-hashing.js";
import {
  env,
} from "../config/env.js";
import {
  recordRequestTracingOutcome,
} from "./tracing.middleware.js";

import { setAdminAuthContext } from "./admin-actor.js";

export type AdminApiKeyAuthOptions = {
  headerName?: string;
  apiKey?: string;
  readOnlyApiKey?: string;
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

const READ_ONLY_ADMIN_METHODS = new Set([
  "GET",
  "HEAD",
  "OPTIONS",
]);

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
  const configuredReadOnlyApiKey =
    options.readOnlyApiKey ?? env.ADMIN_READ_ONLY_API_KEY;
  const readOnlyApiKey =
    configuredReadOnlyApiKey?.trim() || undefined;
  const expectedApiKeyHash = hashApiKey(expectedApiKey);
  const readOnlyApiKeyHash = readOnlyApiKey
    ? hashApiKey(readOnlyApiKey)
    : undefined;

  if (
    readOnlyApiKey &&
    verifyApiKeyHash(readOnlyApiKey, expectedApiKeyHash)
  ) {
    throw new Error(
      "Admin full-access and read-only API keys must be different",
    );
  }

  const middleware = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const providedApiKey = getSingleHeaderValue(
      request.headers[headerName],
    );

    if (!providedApiKey) {
      recordRequestTracingOutcome(request, {
        errorCode: "ADMIN_API_KEY_MISSING",
        rejectionReason: "ADMIN_API_KEY_MISSING",
      });

      return reply.status(401).send({
        error: {
          code: "ADMIN_API_KEY_MISSING",
          message: "Admin API key is required",
          requestId: request.id,
        },
      });
    }

    const hasComparableApiKey =
      providedApiKey.trim().length > 0;

    if (
      hasComparableApiKey &&
      verifyApiKeyHash(providedApiKey, expectedApiKeyHash)
    ) {
      setAdminAuthContext(request, "full-access");

      return undefined;
    }

    if (
      hasComparableApiKey &&
      readOnlyApiKeyHash &&
      verifyApiKeyHash(providedApiKey, readOnlyApiKeyHash)
    ) {
      if (
        READ_ONLY_ADMIN_METHODS.has(
          request.method.toUpperCase(),
        )
      ) {
        setAdminAuthContext(request, "read-only");

        return undefined;
      }

      recordRequestTracingOutcome(request, {
        errorCode: "ADMIN_API_KEY_READ_ONLY",
        rejectionReason: "ADMIN_API_KEY_READ_ONLY",
      });

      return reply.status(403).send({
        error: {
          code: "ADMIN_API_KEY_READ_ONLY",
          message: "Admin API key is read-only",
          requestId: request.id,
        },
      });
    }

    recordRequestTracingOutcome(request, {
      errorCode: "ADMIN_API_KEY_INVALID",
      rejectionReason: "ADMIN_API_KEY_INVALID",
    });

    return reply.status(403).send({
      error: {
        code: "ADMIN_API_KEY_INVALID",
        message: "Admin API key is invalid",
        requestId: request.id,
      },
    });
  };

  Object.defineProperty(middleware, ADMIN_API_KEY_AUTH_GUARD, {
    value: true,
    configurable: false,
    enumerable: false,
    writable: false,
  });

  return middleware as AdminApiKeyAuthMiddleware;
}
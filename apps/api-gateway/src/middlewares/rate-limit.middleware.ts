import type { FastifyReply, FastifyRequest } from "fastify";

import {
  InMemoryRateLimitStore,
  type RateLimitConfig,
  type RateLimitResult,
} from "../rate-limit/in-memory-rate-limit-store.js";

export type RateLimitIdentityType = "api-key" | "ip";

export type RateLimitMiddlewareOptions = RateLimitConfig & {
  routePath: string;
  identityType?: RateLimitIdentityType;
  store?: InMemoryRateLimitStore;
};

export type BuildRateLimitKeyOptions = {
  identityType: RateLimitIdentityType;
  identifier: string;
  method: string;
  routePath: string;
};

export function buildRateLimitKey(options: BuildRateLimitKeyOptions): string {
  return [
    options.identityType,
    options.identifier,
    "route",
    options.method.toUpperCase(),
    options.routePath,
  ].join(":");
}

function getRateLimitIdentifier(
  request: FastifyRequest,
  identityType: RateLimitIdentityType
): string | undefined {
  if (identityType === "api-key") {
    return request.apiKey;
  }

  return request.ip;
}

function setRateLimitHeaders(
  reply: FastifyReply,
  result: RateLimitResult
): void {
  reply.header("x-ratelimit-limit", String(result.limit));
  reply.header("x-ratelimit-remaining", String(result.remaining));
  reply.header("x-ratelimit-reset", String(Math.ceil(result.resetAt / 1000)));
}

export function createRateLimitMiddleware(
  options: RateLimitMiddlewareOptions
) {
  const store = options.store ?? new InMemoryRateLimitStore();
  const identityType = options.identityType ?? "api-key";

  return async function rateLimitMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const identifier = getRateLimitIdentifier(request, identityType);

    if (!identifier) {
      request.log.error(
        {
          identityType,
          requestId: request.id,
        },
        "Rate limit identifier is missing"
      );

      reply.status(500).send({
        error: {
          code: "RATE_LIMIT_IDENTIFIER_MISSING",
          message: "Rate limit identifier is missing",
          requestId: request.id,
        },
      });
      return;
    }

    const key = buildRateLimitKey({
      identityType,
      identifier,
      method: request.method,
      routePath: options.routePath,
    });

    const result = store.consume(key, {
      limit: options.limit,
      windowMs: options.windowMs,
    });

    setRateLimitHeaders(reply, result);

    if (!result.allowed) {
      reply.header("retry-after", String(result.retryAfterSeconds));

      reply.status(429).send({
        error: {
          code: "TOO_MANY_REQUESTS",
          message: "Too many requests. Please try again later.",
          requestId: request.id,
        },
      });
    }
  };
}
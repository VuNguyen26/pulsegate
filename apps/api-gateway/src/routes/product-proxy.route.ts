import type { FastifyInstance } from "fastify";

import type { ResponseCacheStore } from "../cache/redis-response-cache-store.js";
import { productProductsRouteConfig } from "../config/downstream-routes.js";
import { DownstreamServiceError } from "../errors/downstream-service-error.js";
import { apiKeyAuthMiddleware } from "../middlewares/api-key-auth.middleware.js";
import { jwtAuthMiddleware } from "../middlewares/jwt-auth.middleware.js";
import {
  createRateLimitMiddleware,
  type RateLimitStore,
} from "../middlewares/rate-limit.middleware.js";
import {
  buildResponseCacheKey,
  resolveRouteCachePolicy,
} from "../policies/cache.policy.js";
import { createDownstreamTimeout } from "../policies/timeout.policy.js";
import { RedisRateLimitStore } from "../rate-limit/redis-rate-limit-store.js";
import { getRedisClient } from "../redis/redis-client.js";
import { resolveRouteRateLimitPolicy } from "../policies/rate-limit.policy.js";

export { buildResponseCacheKey } from "../policies/cache.policy.js";

export type ProductProxyRouteOptions = {
  rateLimitStore?: RateLimitStore;
  responseCacheStore?: ResponseCacheStore;
  responseCacheTtlSeconds?: number;
};

export async function productProxyRoute(
  app: FastifyInstance,
  options: ProductProxyRouteOptions = {},
): Promise<void> {
  const routeConfig = productProductsRouteConfig;
  const routePolicies = routeConfig.policies;

  const rateLimitStore =
    options.rateLimitStore ?? new RedisRateLimitStore(getRedisClient());

  const rateLimit = resolveRouteRateLimitPolicy({
    policy: routePolicies.rateLimit,
    routePath: routeConfig.gatewayPath,
    identityType: "api-key",
    store: rateLimitStore,
  });

  const responseCache = resolveRouteCachePolicy({
    policy: routePolicies.cache,
    store: options.responseCacheStore,
    ttlSecondsOverride: options.responseCacheTtlSeconds,
  });

  app.get(
    routeConfig.gatewayPath,
    {
      preHandler: [
        ...(routePolicies.auth.requireApiKey ? [apiKeyAuthMiddleware] : []),
        ...(rateLimit.enabled
          ? [
              createRateLimitMiddleware({
                limit: rateLimit.limit,
                windowMs: rateLimit.windowMs,
                routePath: rateLimit.routePath,
                identityType: rateLimit.identityType,
                store: rateLimit.store,
              }),
            ]
          : []),
        ...(routePolicies.auth.requireJwt ? [jwtAuthMiddleware] : []),
      ],
    },
    async (request, reply) => {
      const cacheKey = buildResponseCacheKey(
        routeConfig.method,
        routeConfig.gatewayPath,
      );

      if (responseCache.enabled && responseCache.store) {
        const cachedResponse = await responseCache.store.get(cacheKey);

        if (cachedResponse.hit) {
          reply.header("x-cache", "HIT");

          return reply
            .status(cachedResponse.value.statusCode)
            .send(cachedResponse.value.body);
        }
      }

      const downstreamTimeout = createDownstreamTimeout(routePolicies.timeout);

      let response: Response;

      try {
        response = await fetch(routeConfig.downstreamUrl, {
          method: routeConfig.method,
          headers: {
            "x-request-id": request.id,
          },
          signal: downstreamTimeout.signal,
        });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw new DownstreamServiceError({
            code: "DOWNSTREAM_TIMEOUT",
            message: "Product Service did not respond in time",
            service: routeConfig.serviceName,
            statusCode: 504,
            originalError: error,
          });
        }

        throw new DownstreamServiceError({
          code: "DOWNSTREAM_SERVICE_UNAVAILABLE",
          message: "Product Service is currently unavailable",
          service: routeConfig.serviceName,
          statusCode: 503,
          originalError: error,
        });
      } finally {
        downstreamTimeout.cleanup();
      }

      if (!response.ok) {
        throw new DownstreamServiceError({
          code: "DOWNSTREAM_HTTP_ERROR",
          message: "Product Service returned an error",
          service: routeConfig.serviceName,
          statusCode: response.status >= 500 ? 502 : response.status,
        });
      }

      let data: unknown;

      try {
        data = await response.json();
      } catch (error) {
        throw new DownstreamServiceError({
          code: "DOWNSTREAM_INVALID_RESPONSE",
          message: "Product Service returned an invalid response",
          service: routeConfig.serviceName,
          statusCode: 502,
          originalError: error,
        });
      }

      if (responseCache.enabled && responseCache.store) {
        try {
          await responseCache.store.set(
            cacheKey,
            {
              statusCode: 200,
              body: data,
            },
            {
              ttlSeconds: responseCache.ttlSeconds,
            },
          );
        } catch (error) {
          request.log.error(
            {
              error,
              cacheKey,
              requestId: request.id,
            },
            "Failed to store response cache",
          );
        }
      }

      reply.header("x-cache", responseCache.enabled ? "MISS" : "BYPASS");

      return reply.status(200).send(data);
    },
  );
}
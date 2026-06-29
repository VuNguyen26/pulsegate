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
import { getRedisClient } from "../redis/redis-client.js";
import { RedisRateLimitStore } from "../rate-limit/redis-rate-limit-store.js";

export type ProductProxyRouteOptions = {
  rateLimitStore?: RateLimitStore;
  responseCacheStore?: ResponseCacheStore;
  responseCacheTtlSeconds?: number;
};

export function buildResponseCacheKey(method: string, routePath: string): string {
  return `${method.toUpperCase()}:${routePath}`;
}

export async function productProxyRoute(
  app: FastifyInstance,
  options: ProductProxyRouteOptions = {},
): Promise<void> {
  const routeConfig = productProductsRouteConfig;
  const routePolicies = routeConfig.policies;

  const rateLimitStore =
    options.rateLimitStore ?? new RedisRateLimitStore(getRedisClient());

  const responseCacheStore = options.responseCacheStore;
  const isResponseCacheEnabled =
    routePolicies.cache.enabled && responseCacheStore !== undefined;

  const responseCacheTtlSeconds =
    options.responseCacheTtlSeconds ?? routePolicies.cache.ttlSeconds;

  app.get(
    routeConfig.gatewayPath,
    {
      preHandler: [
        ...(routePolicies.auth.requireApiKey ? [apiKeyAuthMiddleware] : []),
        ...(routePolicies.rateLimit.enabled
          ? [
              createRateLimitMiddleware({
                limit: routePolicies.rateLimit.limit,
                windowMs: routePolicies.rateLimit.windowMs,
                routePath: routeConfig.gatewayPath,
                identityType: "api-key",
                store: rateLimitStore,
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

      if (isResponseCacheEnabled && responseCacheStore) {
        const cachedResponse = await responseCacheStore.get(cacheKey);

        if (cachedResponse.hit) {
          reply.header("x-cache", "HIT");

          return reply
            .status(cachedResponse.value.statusCode)
            .send(cachedResponse.value.body);
        }
      }

      const controller = new AbortController();

      let timeout: ReturnType<typeof setTimeout> | undefined;

      if (routePolicies.timeout.enabled) {
        timeout = setTimeout(() => {
          controller.abort();
        }, routePolicies.timeout.timeoutMs);
      }

      let response: Response;

      try {
        response = await fetch(routeConfig.downstreamUrl, {
          method: routeConfig.method,
          headers: {
            "x-request-id": request.id,
          },
          signal: routePolicies.timeout.enabled
            ? controller.signal
            : undefined,
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
        if (timeout) {
          clearTimeout(timeout);
        }
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

      if (isResponseCacheEnabled && responseCacheStore) {
        try {
          await responseCacheStore.set(
            cacheKey,
            {
              statusCode: 200,
              body: data,
            },
            {
              ttlSeconds: responseCacheTtlSeconds,
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

      reply.header("x-cache", isResponseCacheEnabled ? "MISS" : "BYPASS");

      return reply.status(200).send(data);
    },
  );
}
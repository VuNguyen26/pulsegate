import type { FastifyInstance } from "fastify";

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
};

export async function productProxyRoute(
  app: FastifyInstance,
  options: ProductProxyRouteOptions = {}
): Promise<void> {
  const routeConfig = productProductsRouteConfig;
  const rateLimitStore =
    options.rateLimitStore ?? new RedisRateLimitStore(getRedisClient());

  app.get(
    routeConfig.gatewayPath,
    {
      preHandler: [
        ...(routeConfig.auth.requireApiKey ? [apiKeyAuthMiddleware] : []),
        createRateLimitMiddleware({
          limit: routeConfig.rateLimit.limit,
          windowMs: routeConfig.rateLimit.windowMs,
          routePath: routeConfig.gatewayPath,
          identityType: "api-key",
          store: rateLimitStore,
        }),
        ...(routeConfig.auth.requireJwt ? [jwtAuthMiddleware] : []),
      ],
    },
    async (request, reply) => {
      const controller = new AbortController();

      const timeout = setTimeout(() => {
        controller.abort();
      }, routeConfig.timeoutMs);

      let response: Response;

      try {
        response = await fetch(routeConfig.downstreamUrl, {
          method: routeConfig.method,
          headers: {
            "x-request-id": request.id,
          },
          signal: controller.signal,
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
        clearTimeout(timeout);
      }

      if (!response.ok) {
        throw new DownstreamServiceError({
          code: "DOWNSTREAM_HTTP_ERROR",
          message: "Product Service returned an error",
          service: routeConfig.serviceName,
          statusCode: response.status >= 500 ? 502 : response.status,
        });
      }

      try {
        const data = await response.json();

        return reply.status(200).send(data);
      } catch (error) {
        throw new DownstreamServiceError({
          code: "DOWNSTREAM_INVALID_RESPONSE",
          message: "Product Service returned an invalid response",
          service: routeConfig.serviceName,
          statusCode: 502,
          originalError: error,
        });
      }
    }
  );
}
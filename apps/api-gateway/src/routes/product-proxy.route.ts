import type { FastifyInstance, FastifyReply } from "fastify";

import type { ResponseCacheStore } from "../cache/redis-response-cache-store.js";
import {
  productProductsRouteConfig,
  type DownstreamRouteConfig,
} from "../config/downstream-routes.js";
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
import { resolveRouteRateLimitPolicy } from "../policies/rate-limit.policy.js";
import { applyRequestHeaderTransform } from "../policies/request-transform.policy.js";
import { applyResponseHeaderTransform } from "../policies/response-transform.policy.js";
import {
  executeWithRetry,
  shouldRetryStatus,
} from "../policies/retry.policy.js";
import { createDownstreamTimeout } from "../policies/timeout.policy.js";
import { RedisRateLimitStore } from "../rate-limit/redis-rate-limit-store.js";
import { getRedisClient } from "../redis/redis-client.js";

export { buildResponseCacheKey } from "../policies/cache.policy.js";

export type ProductProxyRouteOptions = {
  rateLimitStore?: RateLimitStore;
  responseCacheStore?: ResponseCacheStore;
  responseCacheTtlSeconds?: number;
};

export type DownstreamProxyRouteOptions = ProductProxyRouteOptions & {
  routeConfigs?: readonly DownstreamRouteConfig[];
};

function applyHeadersToReply(
  reply: FastifyReply,
  headers: Record<string, string>,
): void {
  for (const [headerName, headerValue] of Object.entries(headers)) {
    reply.header(headerName, headerValue);
  }
}

function shouldRetryDownstreamError(
  error: unknown,
  retryOnStatuses: number[],
): boolean {
  return (
    error instanceof DownstreamServiceError &&
    retryOnStatuses.includes(error.statusCode)
  );
}

function toServiceDisplayName(serviceName: string): string {
  return serviceName
    .split("-")
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function buildDownstreamHttpErrorMessage(
  routeConfig: DownstreamRouteConfig,
): string {
  return `${toServiceDisplayName(routeConfig.serviceName)} returned an error`;
}

function buildDownstreamTimeoutMessage(
  routeConfig: DownstreamRouteConfig,
): string {
  return `${toServiceDisplayName(routeConfig.serviceName)} did not respond in time`;
}

function buildDownstreamUnavailableMessage(
  routeConfig: DownstreamRouteConfig,
): string {
  return `${toServiceDisplayName(routeConfig.serviceName)} is currently unavailable`;
}

function buildDownstreamInvalidResponseMessage(
  routeConfig: DownstreamRouteConfig,
): string {
  return `${toServiceDisplayName(routeConfig.serviceName)} returned an invalid response`;
}

export async function downstreamProxyRoute(
  app: FastifyInstance,
  options: DownstreamProxyRouteOptions = {},
): Promise<void> {
  const routeConfigs = options.routeConfigs ?? [productProductsRouteConfig];

  const rateLimitStore =
    options.rateLimitStore ?? new RedisRateLimitStore(getRedisClient());

  for (const routeConfig of routeConfigs) {
    const routePolicies = routeConfig.policies;

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

    app.route({
      method: routeConfig.method,
      url: routeConfig.gatewayPath,
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
      handler: async (request, reply) => {
        const cacheKey = buildResponseCacheKey(
          routeConfig.method,
          routeConfig.gatewayPath,
        );

        const transformedResponseHeaders = applyResponseHeaderTransform(
          {},
          routePolicies.responseTransform,
        );

        if (responseCache.enabled && responseCache.store) {
          const cachedResponse = await responseCache.store.get(cacheKey);

          if (cachedResponse.hit) {
            applyHeadersToReply(reply, transformedResponseHeaders);
            reply.header("x-cache", "HIT");

            return reply
              .status(cachedResponse.value.statusCode)
              .send(cachedResponse.value.body);
          }
        }

        const downstreamRequestHeaders = applyRequestHeaderTransform(
          {
            "x-request-id": request.id,
          },
          routePolicies.requestTransform,
        );

        const fetchDownstreamResponse = async (): Promise<Response> => {
          const downstreamTimeout = createDownstreamTimeout(
            routePolicies.timeout,
          );

          try {
            const downstreamResponse = await fetch(routeConfig.downstreamUrl, {
              method: routeConfig.method,
              headers: downstreamRequestHeaders,
              signal: downstreamTimeout.signal,
            });

            if (!downstreamResponse.ok) {
              throw new DownstreamServiceError({
                code: "DOWNSTREAM_HTTP_ERROR",
                message: buildDownstreamHttpErrorMessage(routeConfig),
                service: routeConfig.serviceName,
                statusCode:
                  downstreamResponse.status >= 500
                    ? 502
                    : downstreamResponse.status,
              });
            }

            return downstreamResponse;
          } catch (error) {
            if (error instanceof DownstreamServiceError) {
              throw error;
            }

            if (error instanceof Error && error.name === "AbortError") {
              throw new DownstreamServiceError({
                code: "DOWNSTREAM_TIMEOUT",
                message: buildDownstreamTimeoutMessage(routeConfig),
                service: routeConfig.serviceName,
                statusCode: 504,
                originalError: error,
              });
            }

            throw new DownstreamServiceError({
              code: "DOWNSTREAM_SERVICE_UNAVAILABLE",
              message: buildDownstreamUnavailableMessage(routeConfig),
              service: routeConfig.serviceName,
              statusCode: 503,
              originalError: error,
            });
          } finally {
            downstreamTimeout.cleanup();
          }
        };

        const response = await executeWithRetry({
          method: routeConfig.method,
          policy: routePolicies.retry,
          operation: fetchDownstreamResponse,
          shouldRetryError: (error) =>
            shouldRetryDownstreamError(
              error,
              routePolicies.retry.retryOnStatuses,
            ),
        });

        if (
          shouldRetryStatus(routePolicies.retry, response.status) &&
          routePolicies.retry.enabled
        ) {
          request.log.warn(
            {
              requestId: request.id,
              statusCode: response.status,
              route: routeConfig.gatewayPath,
            },
            "Received retryable downstream response after retry execution",
          );
        }

        let data: unknown;

        try {
          data = await response.json();
        } catch (error) {
          throw new DownstreamServiceError({
            code: "DOWNSTREAM_INVALID_RESPONSE",
            message: buildDownstreamInvalidResponseMessage(routeConfig),
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
                statusCode: response.status,
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

        applyHeadersToReply(reply, transformedResponseHeaders);
        reply.header("x-cache", responseCache.enabled ? "MISS" : "BYPASS");

        return reply.status(response.status).send(data);
      },
    });
  }
}

export async function productProxyRoute(
  app: FastifyInstance,
  options: ProductProxyRouteOptions = {},
): Promise<void> {
  await downstreamProxyRoute(app, {
    ...options,
    routeConfigs: [productProductsRouteConfig],
  });
}
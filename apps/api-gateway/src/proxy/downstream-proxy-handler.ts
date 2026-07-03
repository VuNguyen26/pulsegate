import type {
  FastifyReply,
  FastifyRequest,
  HookHandlerDoneFunction,
} from "fastify";

import type { ResponseCacheStore } from "../cache/redis-response-cache-store.js";
import type { DownstreamRouteConfig } from "../config/downstream-routes.js";
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
import type { RouteRuntimeRegistry } from "../runtime/route-runtime-registry.js";

export { buildResponseCacheKey };

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

export function buildRouteNotFoundResponse(requestId: string) {
  return {
    error: {
      code: "ROUTE_NOT_FOUND",
      message: "Route not found",
      requestId,
    },
  };
}

export function resolveRuntimeRouteConfig(
  registeredRouteConfig: DownstreamRouteConfig,
  routeRuntimeRegistry?: RouteRuntimeRegistry,
): DownstreamRouteConfig | null {
  if (!routeRuntimeRegistry) {
    return registeredRouteConfig;
  }

  return routeRuntimeRegistry.findRoute(
    registeredRouteConfig.method,
    registeredRouteConfig.gatewayPath,
  );
}

type RuntimePreHandlerMiddleware = (
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction,
) => void | Promise<void>;

function isPromiseLike(value: unknown): value is PromiseLike<void> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof (value as PromiseLike<void>).then === "function"
  );
}

function runRuntimePreHandler(
  middleware: RuntimePreHandlerMiddleware,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const finish: HookHandlerDoneFunction = (error?: Error) => {
      if (settled) {
        return;
      }

      settled = true;

      if (error) {
        reject(error);
        return;
      }

      resolve();
    };

    try {
      const result = middleware(request, reply, finish);

      if (isPromiseLike(result)) {
        result.then(() => finish(), finish);
        return;
      }

      if (reply.sent) {
        finish();
      }
    } catch (error) {
      reject(error);
    }
  });
}

export function createRuntimePolicyPreHandler(options: {
  registeredRouteConfig: DownstreamRouteConfig;
  routeRuntimeRegistry?: RouteRuntimeRegistry;
  rateLimitStore: RateLimitStore;
}) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const runtimeRouteConfig = resolveRuntimeRouteConfig(
      options.registeredRouteConfig,
      options.routeRuntimeRegistry,
    );

    if (!runtimeRouteConfig) {
      return reply.status(404).send(buildRouteNotFoundResponse(request.id));
    }

    const routePolicies = runtimeRouteConfig.policies;

    if (routePolicies.auth.requireApiKey) {
      await runRuntimePreHandler(apiKeyAuthMiddleware, request, reply);

      if (reply.sent) {
        return;
      }
    }

    const rateLimit = resolveRouteRateLimitPolicy({
      policy: routePolicies.rateLimit,
      routePath: runtimeRouteConfig.gatewayPath,
      identityType: "api-key",
      store: options.rateLimitStore,
    });

    if (rateLimit.enabled) {
      const rateLimitMiddleware = createRateLimitMiddleware({
        limit: rateLimit.limit,
        windowMs: rateLimit.windowMs,
        routePath: rateLimit.routePath,
        identityType: rateLimit.identityType,
        store: rateLimit.store,
      });

      await runRuntimePreHandler(rateLimitMiddleware, request, reply);

      if (reply.sent) {
        return;
      }
    }

    if (routePolicies.auth.requireJwt) {
      await runRuntimePreHandler(jwtAuthMiddleware, request, reply);
    }
  };
}

export function createDownstreamProxyHandler(options: {
  registeredRouteConfig: DownstreamRouteConfig;
  routeRuntimeRegistry?: RouteRuntimeRegistry;
  responseCacheStore?: ResponseCacheStore;
  responseCacheTtlSeconds?: number;
}) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const routeConfig = resolveRuntimeRouteConfig(
      options.registeredRouteConfig,
      options.routeRuntimeRegistry,
    );

    if (!routeConfig) {
      return reply.status(404).send(buildRouteNotFoundResponse(request.id));
    }

    const routePolicies = routeConfig.policies;

    const responseCache = resolveRouteCachePolicy({
      policy: routePolicies.cache,
      store: options.responseCacheStore,
      ttlSecondsOverride: options.responseCacheTtlSeconds,
    });

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
      const downstreamTimeout = createDownstreamTimeout(routePolicies.timeout);

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
  };
}
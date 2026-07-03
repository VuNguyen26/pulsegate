import type { FastifyInstance, FastifyRequest } from "fastify";

import type { ResponseCacheStore } from "../cache/redis-response-cache-store.js";
import {
  productProductsRouteConfig,
  type DownstreamRouteConfig,
  type HttpMethod,
} from "../config/downstream-routes.js";
import type { RateLimitStore } from "../middlewares/rate-limit.middleware.js";
import {
  buildResponseCacheKey,
  createDownstreamProxyHandler,
  createRuntimePolicyPreHandler,
  type DownstreamRouteConfigResolver,
  type RuntimePreHandlerMiddleware,
} from "../proxy/downstream-proxy-handler.js";
import { RedisRateLimitStore } from "../rate-limit/redis-rate-limit-store.js";
import { getRedisClient } from "../redis/redis-client.js";
import type { RouteRuntimeRegistry } from "../runtime/route-runtime-registry.js";

export { buildResponseCacheKey };

export type ProductProxyRouteOptions = {
  rateLimitStore?: RateLimitStore;
  responseCacheStore?: ResponseCacheStore;
  responseCacheTtlSeconds?: number;
  apiKeyAuthMiddleware?: RuntimePreHandlerMiddleware;
};

export type DownstreamProxyRouteOptions = ProductProxyRouteOptions & {
  routeConfigs?: readonly DownstreamRouteConfig[];
  routeRuntimeRegistry?: RouteRuntimeRegistry;
};

const dynamicProxyMethods: HttpMethod[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
];

function isSupportedHttpMethod(method: string): method is HttpMethod {
  return dynamicProxyMethods.includes(method as HttpMethod);
}

function getRequestPath(request: FastifyRequest): string {
  return new URL(request.url, "http://pulsegate.local").pathname;
}

function createDynamicRouteConfigResolver(
  routeRuntimeRegistry: RouteRuntimeRegistry,
): DownstreamRouteConfigResolver {
  return (request) => {
    const method = request.method.toUpperCase();

    if (!isSupportedHttpMethod(method)) {
      return null;
    }

    return routeRuntimeRegistry.findRoute(method, getRequestPath(request));
  };
}

export async function downstreamProxyRoute(
  app: FastifyInstance,
  options: DownstreamProxyRouteOptions = {},
): Promise<void> {
  const routeConfigs = options.routeConfigs ?? [productProductsRouteConfig];

  const rateLimitStore =
    options.rateLimitStore ?? new RedisRateLimitStore(getRedisClient());

  for (const registeredRouteConfig of routeConfigs) {
    app.route({
      method: registeredRouteConfig.method,
      url: registeredRouteConfig.gatewayPath,
      preHandler: [
        createRuntimePolicyPreHandler({
          registeredRouteConfig,
          routeRuntimeRegistry: options.routeRuntimeRegistry,
          rateLimitStore,
          apiKeyAuthMiddleware: options.apiKeyAuthMiddleware,
        }),
      ],
      handler: createDownstreamProxyHandler({
        registeredRouteConfig,
        routeRuntimeRegistry: options.routeRuntimeRegistry,
        responseCacheStore: options.responseCacheStore,
        responseCacheTtlSeconds: options.responseCacheTtlSeconds,
      }),
    });
  }

  if (options.routeRuntimeRegistry) {
    const routeConfigResolver = createDynamicRouteConfigResolver(
      options.routeRuntimeRegistry,
    );

    app.route({
      method: dynamicProxyMethods,
      url: "/api/*",
      preHandler: [
        createRuntimePolicyPreHandler({
          routeConfigResolver,
          rateLimitStore,
          apiKeyAuthMiddleware: options.apiKeyAuthMiddleware,
        }),
      ],
      handler: createDownstreamProxyHandler({
        routeConfigResolver,
        responseCacheStore: options.responseCacheStore,
        responseCacheTtlSeconds: options.responseCacheTtlSeconds,
      }),
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
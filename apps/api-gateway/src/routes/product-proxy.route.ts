import type { FastifyInstance, FastifyRequest } from "fastify";

import type { ApiRejectedEventRecorder } from "../api-rejections/api-rejected-event-recorder.js";
import type { ApiUsageRecorder } from "../api-usage/api-usage-recorder.js";
import type { UsageQuotaChecker } from "../usage-plans/usage-quota-checker.js";

import type { ResponseCacheStore } from "../cache/redis-response-cache-store.js";
import {
  productProductsRouteConfig,
  type DownstreamRouteConfig,
  type HttpMethod,
} from "../config/downstream-routes.js";
import type { WeightedRandomSource } from "../config/weighted-upstream-selector.js";
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
import { parseRequestHostHeader } from "../config/request-host.js";
import {
  createRouteRuntimeRegistry,
  type ServiceDiscoveryRandomSource,
  type RouteRuntimeRegistry,
} from "../runtime/route-runtime-registry.js";

export { buildResponseCacheKey };

export type ProductProxyRouteOptions = {
  rateLimitStore?: RateLimitStore;
  responseCacheStore?: ResponseCacheStore;
  responseCacheTtlSeconds?: number;
  apiKeyAuthMiddleware?: RuntimePreHandlerMiddleware;
  usageRecorder?: ApiUsageRecorder;
  usageQuotaChecker?: UsageQuotaChecker;
  rejectedEventRecorder?: ApiRejectedEventRecorder;
  weightedRandomSource?: WeightedRandomSource;
  serviceDiscoveryRandomSource?: ServiceDiscoveryRandomSource;
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

function resolveRequestHost(
  request: FastifyRequest,
): string | null {
  const parsedHost = parseRequestHostHeader(
    request.headers.host,
  );

  return parsedHost.ok ? parsedHost.requestHost : null;
}

function resolveRouteConfigForRequest(
  routeRuntimeRegistry: RouteRuntimeRegistry,
  request: FastifyRequest,
  gatewayPath: string,
): DownstreamRouteConfig | null {
  const method = request.method.toUpperCase();

  if (!isSupportedHttpMethod(method)) {
    return null;
  }

  const requestHost = resolveRequestHost(request);

  if (requestHost === null) {
    return null;
  }

  return routeRuntimeRegistry.findRoute(
    method,
    gatewayPath,
    requestHost,
  );
}

function createFixedRouteConfigResolver(
  routeRuntimeRegistry: RouteRuntimeRegistry,
  gatewayPath: string,
): DownstreamRouteConfigResolver {
  return (request) =>
    resolveRouteConfigForRequest(
      routeRuntimeRegistry,
      request,
      gatewayPath,
    );
}

function createDynamicRouteConfigResolver(
  routeRuntimeRegistry: RouteRuntimeRegistry,
): DownstreamRouteConfigResolver {
  return (request) =>
    resolveRouteConfigForRequest(
      routeRuntimeRegistry,
      request,
      getRequestPath(request),
    );
}

export async function downstreamProxyRoute(
  app: FastifyInstance,
  options: DownstreamProxyRouteOptions = {},
): Promise<void> {
  const routeConfigs = options.routeConfigs ?? [productProductsRouteConfig];

  const rateLimitStore =
    options.rateLimitStore ?? new RedisRateLimitStore(getRedisClient());

  const effectiveRouteRuntimeRegistry =
    options.routeRuntimeRegistry ??
    createRouteRuntimeRegistry({
      initialRoutes: routeConfigs,
    });

  const registeredFastifyRouteKeys = new Set<string>();

  for (const registeredRouteConfig of routeConfigs) {
    const fastifyRouteKey = JSON.stringify([
      registeredRouteConfig.method,
      registeredRouteConfig.gatewayPath,
    ]);

    if (registeredFastifyRouteKeys.has(fastifyRouteKey)) {
      continue;
    }

    registeredFastifyRouteKeys.add(fastifyRouteKey);

    const routeConfigResolver =
      createFixedRouteConfigResolver(
        effectiveRouteRuntimeRegistry,
        registeredRouteConfig.gatewayPath,
      );

    app.route({
      method: registeredRouteConfig.method,
      url: registeredRouteConfig.gatewayPath,
      preHandler: [
        createRuntimePolicyPreHandler({
          routeConfigResolver,
          rateLimitStore,
          apiKeyAuthMiddleware: options.apiKeyAuthMiddleware,
          usageQuotaChecker: options.usageQuotaChecker,
          rejectedEventRecorder: options.rejectedEventRecorder,
        }),
      ],
      handler: createDownstreamProxyHandler({
        routeConfigResolver,
        responseCacheStore: options.responseCacheStore,
        responseCacheTtlSeconds: options.responseCacheTtlSeconds,
        usageRecorder: options.usageRecorder,
        routeRuntimeRegistry: effectiveRouteRuntimeRegistry,
        weightedRandomSource: options.weightedRandomSource,
        serviceDiscoveryRandomSource: options.serviceDiscoveryRandomSource,
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
          usageQuotaChecker: options.usageQuotaChecker,
          rejectedEventRecorder: options.rejectedEventRecorder,
        }),
      ],
      handler: createDownstreamProxyHandler({
        routeConfigResolver,
        responseCacheStore: options.responseCacheStore,
        responseCacheTtlSeconds: options.responseCacheTtlSeconds,
        usageRecorder: options.usageRecorder,
        routeRuntimeRegistry: effectiveRouteRuntimeRegistry,
        weightedRandomSource: options.weightedRandomSource,
        serviceDiscoveryRandomSource: options.serviceDiscoveryRandomSource,
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

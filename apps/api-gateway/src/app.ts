import Fastify from "fastify";

import { RedisResponseCacheStore } from "./cache/redis-response-cache-store.js";
import { createPrismaApiRejectedEventRecorder } from "./api-rejections/api-rejected-event-recorder.js";
import { createPrismaApiUsageRecorder } from "./api-usage/api-usage-recorder.js";
import { createPrismaUsageQuotaChecker } from "./usage-plans/usage-quota-checker.js";
import {
  downstreamRouteConfigs,
  type DownstreamRouteConfig,
} from "./config/downstream-routes.js";
import { env } from "./config/env.js";
import {
  disconnectGatewayPrisma,
  gatewayPrisma,
} from "./database/gateway-prisma.js";
import { registerAccessLogMiddleware } from "./middlewares/access-log.middleware.js";
import { registerErrorHandlers } from "./middlewares/error-handler.middleware.js";
import { registerMetricsMiddleware } from "./middlewares/metrics.middleware.js";
import { generateRequestId } from "./middlewares/request-id.middleware.js";
import { createRequestSizeLimitMiddleware } from "./middlewares/request-size-limit.middleware.js";
import { securityHeadersMiddleware } from "./middlewares/security-headers.middleware.js";
import {
  createHttpMetrics,
  type HttpMetrics,
} from "./observability/metrics.js";
import { RedisRateLimitStore } from "./rate-limit/redis-rate-limit-store.js";
import { disconnectRedis, getRedisClient } from "./redis/redis-client.js";
import {
  adminApiUsageRoute,
  type AdminApiUsageRouteOptions,
} from "./routes/admin-api-usage.route.js";
import {
  adminApiRejectionRoute,
  type AdminApiRejectionRouteOptions,
} from "./routes/admin-api-rejection.route.js";
import {
  adminUsagePlanRoute,
  type AdminUsagePlanRouteOptions,
} from "./routes/admin-usage-plan.route.js";
import {
  adminApiKeyRoute,
  type AdminApiKeyRouteOptions,
} from "./routes/admin-api-key.route.js";
import { createPrismaApiKeyAuthVerifier } from "./api-keys/api-key-auth-verifier.js";
import { createApiKeyAuthMiddleware } from "./middlewares/api-key-auth.middleware.js";
import {
  adminConsumerRoute,
  type AdminConsumerRouteOptions,
} from "./routes/admin-consumer.route.js";
import {
  adminRouteConfigRoute,
  type AdminRouteConfigRouteOptions,
} from "./routes/admin-route-config.route.js";
import { healthRoute } from "./routes/health.route.js";
import { metricsRoute } from "./routes/metrics.route.js";
import {
  downstreamProxyRoute,
  type DownstreamProxyRouteOptions,
} from "./routes/product-proxy.route.js";
import {
  createRouteRuntimeRegistry,
  type RouteRuntimeRegistry,
} from "./runtime/route-runtime-registry.js";

type BuildApiGatewayAppOptions = {
  logger?: boolean;
  productProxy?: DownstreamProxyRouteOptions;
  metrics?: HttpMetrics;
  routeConfigs?: readonly DownstreamRouteConfig[];
  routeManagement?: AdminRouteConfigRouteOptions;
  consumerManagement?: AdminConsumerRouteOptions;
  apiKeyManagement?: AdminApiKeyRouteOptions;
  apiUsageManagement?: AdminApiUsageRouteOptions;
  apiRejectionManagement?: AdminApiRejectionRouteOptions;
  usagePlanManagement?: AdminUsagePlanRouteOptions;
  routeRuntimeRegistry?: RouteRuntimeRegistry;
};

export async function buildApiGatewayApp(
  options: BuildApiGatewayAppOptions = {},
) {
  const app = Fastify({
    logger: options.logger ?? true,
    genReqId: generateRequestId,
    bodyLimit: env.MAX_REQUEST_BODY_BYTES,
  });

  const metrics = options.metrics ?? createHttpMetrics();

  app.addHook("onClose", async () => {
    await disconnectRedis();
    await disconnectGatewayPrisma();
  });

  app.addHook("onRequest", async (request, reply) => {
    reply.header("x-request-id", request.id);
  });

  registerAccessLogMiddleware(app);
  registerMetricsMiddleware(app, metrics);

  app.addHook("onRequest", securityHeadersMiddleware);
  app.addHook(
    "onRequest",
    createRequestSizeLimitMiddleware({
      maxBodyBytes: env.MAX_REQUEST_BODY_BYTES,
    }),
  );

  registerErrorHandlers(app);

  const redisClient = getRedisClient();

  const resolvedRouteConfigs =
    options.routeConfigs ??
    options.productProxy?.routeConfigs ??
    downstreamRouteConfigs;

  const routeRuntimeRegistry =
    options.routeRuntimeRegistry ??
    createRouteRuntimeRegistry({
      initialRoutes: resolvedRouteConfigs,
    });

  const apiKeyAuthMiddleware =
    options.productProxy?.apiKeyAuthMiddleware ??
    createApiKeyAuthMiddleware({
      verifier: createPrismaApiKeyAuthVerifier(gatewayPrisma),
    });

  const apiUsageRecorder =
    options.productProxy?.usageRecorder ??
    (options.productProxy
      ? undefined
      : createPrismaApiUsageRecorder(gatewayPrisma));

  const usageQuotaChecker =
    options.productProxy?.usageQuotaChecker ??
    (options.productProxy
      ? undefined
      : createPrismaUsageQuotaChecker(gatewayPrisma));

  const apiRejectedEventRecorder =
    options.productProxy?.rejectedEventRecorder ??
    (options.productProxy
      ? undefined
      : createPrismaApiRejectedEventRecorder(gatewayPrisma));

  const downstreamProxyOptions: DownstreamProxyRouteOptions = {
    ...(options.productProxy ?? {
      rateLimitStore: new RedisRateLimitStore(redisClient),
      responseCacheStore: new RedisResponseCacheStore(redisClient),
    }),
    apiKeyAuthMiddleware,
    usageRecorder: apiUsageRecorder,
    usageQuotaChecker,
    rejectedEventRecorder: apiRejectedEventRecorder,
    routeConfigs: resolvedRouteConfigs,
    routeRuntimeRegistry,
  };

  const routeManagementOptions: AdminRouteConfigRouteOptions = {
    ...(options.routeManagement ?? {}),
    routeRuntimeRegistry:
      options.routeManagement?.routeRuntimeRegistry ?? routeRuntimeRegistry,
  };

  const consumerManagementOptions: AdminConsumerRouteOptions = {
    ...(options.consumerManagement ?? {}),
  };

  const apiKeyManagementOptions: AdminApiKeyRouteOptions = {
    ...(options.apiKeyManagement ?? {}),
  };

  const apiUsageManagementOptions: AdminApiUsageRouteOptions = {
    ...(options.apiUsageManagement ?? {}),
  };

  const apiRejectionManagementOptions: AdminApiRejectionRouteOptions = {
    ...(options.apiRejectionManagement ?? {}),
  };

  const usagePlanManagementOptions: AdminUsagePlanRouteOptions = {
    ...(options.usagePlanManagement ?? {}),
  };

  await app.register(healthRoute);
  await app.register(metricsRoute, { metrics });
  await app.register(adminRouteConfigRoute, routeManagementOptions);
  await app.register(adminConsumerRoute, consumerManagementOptions);
  await app.register(adminApiKeyRoute, apiKeyManagementOptions);
  await app.register(adminApiUsageRoute, apiUsageManagementOptions);
  await app.register(adminApiRejectionRoute, apiRejectionManagementOptions);
  await app.register(adminUsagePlanRoute, usagePlanManagementOptions);
  await app.register(downstreamProxyRoute, downstreamProxyOptions);

  return app;
}
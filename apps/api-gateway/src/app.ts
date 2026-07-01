import Fastify from "fastify";

import { RedisResponseCacheStore } from "./cache/redis-response-cache-store.js";
import {
  downstreamRouteConfigs,
  type DownstreamRouteConfig,
} from "./config/downstream-routes.js";
import { env } from "./config/env.js";
import { disconnectGatewayPrisma } from "./database/gateway-prisma.js";
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
  adminRouteConfigRoute,
  type AdminRouteConfigRouteOptions,
} from "./routes/admin-route-config.route.js";
import { healthRoute } from "./routes/health.route.js";
import { metricsRoute } from "./routes/metrics.route.js";
import {
  downstreamProxyRoute,
  type DownstreamProxyRouteOptions,
} from "./routes/product-proxy.route.js";

type BuildApiGatewayAppOptions = {
  logger?: boolean;
  productProxy?: DownstreamProxyRouteOptions;
  metrics?: HttpMetrics;
  routeConfigs?: readonly DownstreamRouteConfig[];
  routeManagement?: AdminRouteConfigRouteOptions;
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

  const downstreamProxyOptions: DownstreamProxyRouteOptions = {
    ...(options.productProxy ?? {
      rateLimitStore: new RedisRateLimitStore(redisClient),
      responseCacheStore: new RedisResponseCacheStore(redisClient),
    }),
    routeConfigs:
      options.routeConfigs ??
      options.productProxy?.routeConfigs ??
      downstreamRouteConfigs,
  };

  await app.register(healthRoute);
  await app.register(metricsRoute, { metrics });
  await app.register(adminRouteConfigRoute, options.routeManagement ?? {});
  await app.register(downstreamProxyRoute, downstreamProxyOptions);

  return app;
}
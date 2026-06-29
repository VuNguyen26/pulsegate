import Fastify from "fastify";

import { RedisResponseCacheStore } from "./cache/redis-response-cache-store.js";
import { env } from "./config/env.js";
import { registerAccessLogMiddleware } from "./middlewares/access-log.middleware.js";
import { registerErrorHandlers } from "./middlewares/error-handler.middleware.js";
import { registerMetricsMiddleware } from "./middlewares/metrics.middleware.js";
import { generateRequestId } from "./middlewares/request-id.middleware.js";
import { createRequestSizeLimitMiddleware } from "./middlewares/request-size-limit.middleware.js";
import { securityHeadersMiddleware } from "./middlewares/security-headers.middleware.js";
import { createHttpMetrics, type HttpMetrics } from "./observability/metrics.js";
import { RedisRateLimitStore } from "./rate-limit/redis-rate-limit-store.js";
import { disconnectRedis, getRedisClient } from "./redis/redis-client.js";
import { healthRoute } from "./routes/health.route.js";
import { metricsRoute } from "./routes/metrics.route.js";
import {
  productProxyRoute,
  type ProductProxyRouteOptions,
} from "./routes/product-proxy.route.js";

type BuildApiGatewayAppOptions = {
  logger?: boolean;
  productProxy?: ProductProxyRouteOptions;
  metrics?: HttpMetrics;
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

  const productProxyOptions =
    options.productProxy ?? {
      rateLimitStore: new RedisRateLimitStore(redisClient),
      responseCacheStore: new RedisResponseCacheStore(redisClient),
    };

  await app.register(healthRoute);
  await app.register(metricsRoute, { metrics });
  await app.register(productProxyRoute, productProxyOptions);

  return app;
}
import Fastify from "fastify";

import { env } from "./config/env.js";
import { registerErrorHandlers } from "./middlewares/error-handler.middleware.js";
import { generateRequestId } from "./middlewares/request-id.middleware.js";
import { createRequestSizeLimitMiddleware } from "./middlewares/request-size-limit.middleware.js";
import { securityHeadersMiddleware } from "./middlewares/security-headers.middleware.js";
import { disconnectRedis } from "./redis/redis-client.js";
import { healthRoute } from "./routes/health.route.js";
import {
  productProxyRoute,
  type ProductProxyRouteOptions,
} from "./routes/product-proxy.route.js";

type BuildApiGatewayAppOptions = {
  logger?: boolean;
  productProxy?: ProductProxyRouteOptions;
};

export async function buildApiGatewayApp(
  options: BuildApiGatewayAppOptions = {}
) {
  const app = Fastify({
    logger: options.logger ?? true,
    genReqId: generateRequestId,
    bodyLimit: env.MAX_REQUEST_BODY_BYTES,
  });

  app.addHook("onClose", async () => {
    await disconnectRedis();
  });

  app.addHook("onRequest", async (request, reply) => {
    reply.header("x-request-id", request.id);
  });

  app.addHook("onRequest", securityHeadersMiddleware);

  app.addHook(
    "onRequest",
    createRequestSizeLimitMiddleware({
      maxBodyBytes: env.MAX_REQUEST_BODY_BYTES,
    })
  );

  registerErrorHandlers(app);

  await app.register(healthRoute);
  await app.register(productProxyRoute, options.productProxy ?? {});

  return app;
}
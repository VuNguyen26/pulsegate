import Fastify from "fastify";

import { registerErrorHandlers } from "./middlewares/error-handler.middleware.js";
import { generateRequestId } from "./middlewares/request-id.middleware.js";
import { healthRoute } from "./routes/health.route.js";
import { productProxyRoute } from "./routes/product-proxy.route.js";

type BuildApiGatewayAppOptions = {
  logger?: boolean;
};

export async function buildApiGatewayApp(
  options: BuildApiGatewayAppOptions = {}
) {
  const app = Fastify({
    logger: options.logger ?? true,
    genReqId: generateRequestId,
  });

  app.addHook("onRequest", async (request, reply) => {
    reply.header("x-request-id", request.id);
  });

  registerErrorHandlers(app);

  await app.register(healthRoute);
  await app.register(productProxyRoute);

  return app;
}
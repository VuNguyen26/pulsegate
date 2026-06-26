import Fastify from "fastify";

import { env } from "./config/env.js";
import { registerErrorHandlers } from "./middlewares/error-handler.middleware.js";
import { generateRequestId } from "./middlewares/request-id.middleware.js";
import { healthRoute } from "./routes/health.route.js";
import { productProxyRoute } from "./routes/product-proxy.route.js";

const app = Fastify({
  logger: true,
  genReqId: generateRequestId,
});

app.addHook("onRequest", async (request, reply) => {
  reply.header("x-request-id", request.id);
});

registerErrorHandlers(app);

const start = async () => {
  try {
    await app.register(healthRoute);
    await app.register(productProxyRoute);

    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    app.log.info(`API Gateway is running on port ${env.PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
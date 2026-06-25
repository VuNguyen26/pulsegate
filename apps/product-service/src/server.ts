import Fastify from "fastify";

import { env } from "./config/env.js";
import { registerErrorHandlers } from "./middlewares/error-handler.middleware.js";
import { generateRequestId } from "./middlewares/request-id.middleware.js";
import { healthRoute } from "./routes/health.route.js";
import { productRoute } from "./routes/product.route.js";

const app = Fastify({
  logger: true,
  genReqId: generateRequestId,
});

const start = async () => {
  try {
    await app.register(healthRoute);
    await app.register(productRoute);

    registerErrorHandlers(app);

    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    app.log.info(`Product Service is running on port ${env.PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
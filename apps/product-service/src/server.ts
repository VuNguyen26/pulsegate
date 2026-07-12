import Fastify from "fastify";

import { env } from "./config/env.js";
import { prisma } from "./database/prisma.js";
import { registerErrorHandlers } from "./middlewares/error-handler.middleware.js";
import { generateRequestId } from "./middlewares/request-id.middleware.js";
import { healthRoute } from "./routes/health.route.js";
import { productRoute } from "./routes/product.route.js";

type ShutdownSignal = "SIGINT" | "SIGTERM";

const app = Fastify({
  logger: true,
  genReqId: generateRequestId,
});

registerErrorHandlers(app);

app.addHook("onClose", async () => {
  await prisma.$disconnect();
});

const start = async () => {
  let shutdownPromise: Promise<void> | undefined;

  const shutdown = (signal: ShutdownSignal): Promise<void> => {
    shutdownPromise ??= (async () => {
      app.log.info({ signal }, "Shutting down Product Service");

      try {
        await app.close();
      } catch (error) {
        app.log.error(error, "Failed to close Product Service cleanly");
        process.exitCode = 1;
      }
    })();

    return shutdownPromise;
  };

  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });

  try {
    await app.register(healthRoute);
    await app.register(productRoute);

    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    app.log.info(`Product Service is running on port ${env.PORT}`);
  } catch (error) {
    app.log.error(error);

    try {
      await app.close();
    } catch (closeError) {
      app.log.error(
        closeError,
        "Failed to close Product Service after startup error",
      );
    }

    process.exitCode = 1;
  }
};

void start();
import { buildApiGatewayApp } from "./app.js";
import { env } from "./config/env.js";
import { loadRuntimeDownstreamRouteConfigs } from "./config/runtime-downstream-routes.js";
import { connectRedis } from "./redis/redis-client.js";

type ShutdownSignal = "SIGINT" | "SIGTERM";

const start = async () => {
  const routeConfigs = await loadRuntimeDownstreamRouteConfigs();
  const app = await buildApiGatewayApp({
    routeConfigs,
  });

  let shutdownPromise: Promise<void> | undefined;

  const shutdown = (signal: ShutdownSignal): Promise<void> => {
    shutdownPromise ??= (async () => {
      app.log.info({ signal }, "Shutting down API Gateway");

      try {
        await app.close();
      } catch (error) {
        app.log.error(error, "Failed to close API Gateway cleanly");
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
    await connectRedis();

    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    app.log.info(`API Gateway is running on port ${env.PORT}`);
  } catch (error) {
    app.log.error(error);

    try {
      await app.close();
    } catch (closeError) {
      app.log.error(
        closeError,
        "Failed to close API Gateway after startup error",
      );
    }

    process.exitCode = 1;
  }
};

void start();
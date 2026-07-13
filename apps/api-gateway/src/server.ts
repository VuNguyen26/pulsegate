import { buildApiGatewayApp } from "./app.js";
import { env } from "./config/env.js";
import { loadRuntimeDownstreamRouteConfigs } from "./config/runtime-downstream-routes.js";
import {
  buildGatewayShutdownFailedLogPayload,
  buildGatewayShutdownLogPayload,
  buildGatewayStartedLogPayload,
  buildGatewayStartupCleanupFailedLogPayload,
  buildGatewayStartupFailedLogPayload,
} from "./observability/logging.js";
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
      app.log.info(
        buildGatewayShutdownLogPayload(signal),
        "Shutting down API Gateway",
      );

      try {
        await app.close();
      } catch {
        app.log.error(
          buildGatewayShutdownFailedLogPayload(signal),
          "Failed to close API Gateway cleanly",
        );
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

    app.log.info(
      buildGatewayStartedLogPayload(env.PORT),
      "API Gateway started",
    );
  } catch {
    app.log.error(
      buildGatewayStartupFailedLogPayload(),
      "Failed to start API Gateway",
    );

    try {
      await app.close();
    } catch {
      app.log.error(
        buildGatewayStartupCleanupFailedLogPayload(),
        "Failed to close API Gateway after startup error",
      );
    }

    process.exitCode = 1;
  }
};

void start();
import Fastify from "fastify";
import {
  env,
} from "./config/env.js";
import {
  prisma,
} from "./database/prisma.js";
import {
  registerErrorHandlers,
} from "./middlewares/error-handler.middleware.js";
import {
  generateRequestId,
} from "./middlewares/request-id.middleware.js";
import {
  registerProductTracingMiddleware,
} from "./middlewares/tracing.middleware.js";
import {
  buildProductShutdownFailedLogPayload,
  buildProductShutdownLogPayload,
  buildProductStartedLogPayload,
  buildProductStartupCleanupFailedLogPayload,
  buildProductStartupFailedLogPayload,
} from "./observability/logging.js";
import {
  createTracingRuntime,
} from "./observability/tracing.js";
import {
  healthRoute,
} from "./routes/health.route.js";
import {
  productRoute,
} from "./routes/product.route.js";

type ShutdownSignal =
  | "SIGINT"
  | "SIGTERM";

const app = Fastify({
  logger: true,
  genReqId: generateRequestId,
});

const tracing =
  createTracingRuntime({
    serviceName: "product-service",
    onLifecycleError(operation) {
      app.log.warn(
        { operation },
        "Tracing lifecycle operation failed",
      );
    },
  });

registerProductTracingMiddleware(
  app,
  tracing,
);

registerErrorHandlers(app);

app.addHook(
  "onClose",
  async () => {
    await prisma.$disconnect();
    await tracing.forceFlush();
    await tracing.shutdown();
  },
);

const start = async () => {
  let shutdownPromise:
    | Promise<void>
    | undefined;

  const shutdown = (
    signal: ShutdownSignal,
  ): Promise<void> => {
    shutdownPromise ??=
      (async () => {
        app.log.info(
          buildProductShutdownLogPayload(signal),
          "Shutting down Product Service",
        );

        try {
          await app.close();
        } catch {
          app.log.error(
            buildProductShutdownFailedLogPayload(signal),
            "Failed to close Product Service cleanly",
          );

          process.exitCode = 1;
        }
      })();

    return shutdownPromise;
  };

  process.once(
    "SIGINT",
    () => {
      void shutdown("SIGINT");
    },
  );

  process.once(
    "SIGTERM",
    () => {
      void shutdown("SIGTERM");
    },
  );

  try {
    await app.register(healthRoute);
    await app.register(productRoute);

    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    app.log.info(
      buildProductStartedLogPayload(env.PORT),
      "Product Service started",
    );
  } catch {
    app.log.error(
      buildProductStartupFailedLogPayload(),
      "Failed to start Product Service",
    );

    try {
      await app.close();
    } catch {
      app.log.error(
        buildProductStartupCleanupFailedLogPayload(),
        "Failed to close Product Service after startup error",
      );
    }

    process.exitCode = 1;
  }
};

void start();

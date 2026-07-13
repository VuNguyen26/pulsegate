import type {
  FastifyInstance,
} from "fastify";
import {
  buildProductErrorLogPayload,
} from "../observability/logging.js";
import {
  recordProductTracingOutcome,
} from "./tracing.middleware.js";

export function registerErrorHandlers(
  app: FastifyInstance,
): void {
  app.setNotFoundHandler(
    (request, reply) => {
      recordProductTracingOutcome(
        request,
        "ROUTE_NOT_FOUND",
      );

      return reply.status(404).send({
        error: {
          message: "Route not found",
          path: request.url,
          requestId: request.id,
        },
      });
    },
  );

  app.setErrorHandler(
    (error, request, reply) => {
      recordProductTracingOutcome(
        request,
        "INTERNAL_SERVER_ERROR",
      );

      request.log.error(
        buildProductErrorLogPayload(
          request.id,
        ),
        "Unhandled Product Service error",
      );

      return reply.status(500).send({
        error: {
          message:
            "Internal Server Error",
          requestId: request.id,
        },
      });
    },
  );
}

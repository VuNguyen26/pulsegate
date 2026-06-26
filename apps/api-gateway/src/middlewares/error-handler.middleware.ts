import type { FastifyInstance } from "fastify";

import { isDownstreamServiceError } from "../errors/downstream-service-error.js";

export function registerErrorHandlers(app: FastifyInstance): void {
  app.setNotFoundHandler((request, reply) => {
    return reply.status(404).send({
      error: {
        message: "Route not found",
        path: request.url,
        requestId: request.id,
      },
    });
  });

  app.setErrorHandler((error, request, reply) => {
    if (isDownstreamServiceError(error)) {
      request.log.warn(
        {
          code: error.code,
          service: error.service,
          requestId: request.id,
          originalError: error.originalError,
        },
        "Downstream service error"
      );

      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          service: error.service,
          requestId: request.id,
        },
      });
    }

    request.log.error(
      {
        error,
        requestId: request.id,
      },
      "Unhandled API Gateway error"
    );

    return reply.status(500).send({
      error: {
        message: "Internal Server Error",
        requestId: request.id,
      },
    });
  });
}
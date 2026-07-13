import type { FastifyInstance } from "fastify";

import {
  isDownstreamServiceError,
} from "../errors/downstream-service-error.js";
import {
  buildDownstreamErrorLogPayload,
  buildUnhandledGatewayErrorLogPayload,
} from "../observability/logging.js";
import {
  recordRequestTracingOutcome,
} from "./tracing.middleware.js";

export function registerErrorHandlers(app: FastifyInstance): void {
  app.setNotFoundHandler((request, reply) => {
    recordRequestTracingOutcome(request, {
      errorCode: "ROUTE_NOT_FOUND",
      rejectionReason: "ROUTE_NOT_FOUND",
    });

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
      recordRequestTracingOutcome(request, {
        errorCode: error.code,
      });

      request.log.warn(
        buildDownstreamErrorLogPayload(error, request.id),
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

    recordRequestTracingOutcome(request, {
      errorCode: "INTERNAL_SERVER_ERROR",
    });

    request.log.error(
      buildUnhandledGatewayErrorLogPayload(request.id),
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
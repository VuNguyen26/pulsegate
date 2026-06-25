import type { FastifyInstance } from "fastify";

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
    request.log.error(error);

    return reply.status(500).send({
      error: {
        message: "Internal Server Error",
        requestId: request.id,
      },
    });
  });
}
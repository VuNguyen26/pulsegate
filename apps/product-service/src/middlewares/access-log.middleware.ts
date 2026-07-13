import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  getProductRequestTraceIdentifiers,
} from "./tracing.middleware.js";

const UNMATCHED_ROUTE =
  "__unmatched__";

const HTTP_METHODS =
  new Set([
    "DELETE",
    "GET",
    "HEAD",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
  ]);

declare module "fastify" {
  interface FastifyRequest {
    productAccessLogStartedAt?: bigint;
  }
}

export type ProductAccessLogPayload = {
  event: "http_request_completed";
  requestId: string;
  traceId?: string;
  spanId?: string;
  method: string;
  route: string;
  statusCode: number;
  durationMs: number;
};

function roundDurationMs(
  durationMs: number,
): number {
  return (
    Math.round(durationMs * 100) /
    100
  );
}

export function calculateProductDurationMs(
  startedAt: bigint,
  endedAt: bigint =
    process.hrtime.bigint(),
): number {
  return roundDurationMs(
    Number(endedAt - startedAt) /
      1_000_000,
  );
}

export function getProductAccessLogRoute(
  request: FastifyRequest,
): string {
  const route =
    request.routeOptions.url;

  if (
    typeof route !== "string" ||
    route.length === 0 ||
    route.length > 128 ||
    !route.startsWith("/") ||
    route.includes("?") ||
    route.includes("#")
  ) {
    return UNMATCHED_ROUTE;
  }

  return route;
}

function getProductAccessLogMethod(
  request: FastifyRequest,
): string {
  const method =
    request.method.toUpperCase();

  return HTTP_METHODS.has(method)
    ? method
    : "OTHER";
}

export function buildProductAccessLogPayload(
  request: FastifyRequest,
  reply: FastifyReply,
  durationMs: number,
): ProductAccessLogPayload {
  const traceIdentifiers =
    getProductRequestTraceIdentifiers(
      request,
    );

  return {
    event: "http_request_completed",
    requestId: request.id,
    ...(traceIdentifiers ?? {}),
    method:
      getProductAccessLogMethod(
        request,
      ),
    route:
      getProductAccessLogRoute(
        request,
      ),
    statusCode: reply.statusCode,
    durationMs,
  };
}

export function registerProductAccessLogMiddleware(
  app: FastifyInstance,
): void {
  app.addHook(
    "onRequest",
    async (request) => {
      request.productAccessLogStartedAt =
        process.hrtime.bigint();
    },
  );

  app.addHook(
    "onResponse",
    async (request, reply) => {
      const startedAt =
        request.productAccessLogStartedAt;

      if (startedAt === undefined) {
        return;
      }

      request.log.info(
        buildProductAccessLogPayload(
          request,
          reply,
          calculateProductDurationMs(
            startedAt,
          ),
        ),
      );
    },
  );
}
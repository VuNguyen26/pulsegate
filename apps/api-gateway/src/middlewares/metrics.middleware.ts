import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import type { HttpMetrics } from "../observability/metrics.js";

const CACHE_HEADER = "x-cache";

export const UNMATCHED_ROUTE_LABEL = "__unmatched__";

declare module "fastify" {
  interface FastifyRequest {
    metricsStartedAt?: bigint;
  }
}

function toSingleHeaderValue(
  value: string | number | string[] | undefined,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value[0];
  }

  return String(value);
}

function calculateDurationMs(startedAt: bigint): number {
  return Number(process.hrtime.bigint() - startedAt) / 1_000_000;
}

export function getMetricsRouteLabel(request: FastifyRequest): string {
  return request.routeOptions.url ?? UNMATCHED_ROUTE_LABEL;
}

export function getReplyHeaderValue(
  reply: FastifyReply,
  headerName: string,
): string | undefined {
  return toSingleHeaderValue(reply.getHeader(headerName));
}

export function registerMetricsMiddleware(
  app: FastifyInstance,
  metrics: HttpMetrics,
): void {
  app.addHook("onRequest", async (request) => {
    request.metricsStartedAt = process.hrtime.bigint();
  });

  app.addHook("onResponse", async (request, reply) => {
    const startedAt = request.metricsStartedAt;

    if (startedAt === undefined) {
      return;
    }

    const route = getMetricsRouteLabel(request);
    const durationMs = calculateDurationMs(startedAt);
    const cacheStatus = getReplyHeaderValue(reply, CACHE_HEADER);

    metrics.observeHttpRequest({
      method: request.method,
      route,
      statusCode: reply.statusCode,
      durationMs,
    });

    metrics.observeResponseCache({
      route,
      cacheStatus,
    });
  });
}
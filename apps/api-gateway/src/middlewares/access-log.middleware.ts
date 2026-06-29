import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

const REQUEST_ID_HEADER = "x-request-id";
const CACHE_HEADER = "x-cache";
const RESPONSE_TIME_HEADER = "x-response-time-ms";

declare module "fastify" {
  interface FastifyRequest {
    accessLogStartedAt?: bigint;
  }
}

export type AccessLogPayload = {
  event: "http_request_completed";
  requestId?: string;
  method: string;
  path: string;
  route: string;
  statusCode: number;
  durationMs: number;
  cacheStatus?: string;
  userAgent?: string;
  remoteAddress?: string;
};

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

function roundDurationMs(durationMs: number): number {
  return Math.round(durationMs * 100) / 100;
}

export function calculateDurationMs(
  startedAt: bigint,
  endedAt: bigint = process.hrtime.bigint(),
): number {
  return roundDurationMs(Number(endedAt - startedAt) / 1_000_000);
}

export function formatDurationHeader(durationMs: number): string {
  return durationMs.toFixed(2);
}

export function getRequestPath(request: FastifyRequest): string {
  const rawUrl = request.raw.url ?? request.url;
  const path = rawUrl.split("?")[0];

  return path || request.url;
}

export function getRouteLabel(request: FastifyRequest): string {
  return request.routeOptions.url ?? getRequestPath(request);
}

export function buildAccessLogPayload(params: {
  request: FastifyRequest;
  reply: FastifyReply;
  durationMs: number;
}): AccessLogPayload {
  const { request, reply, durationMs } = params;

  const requestId =
    toSingleHeaderValue(reply.getHeader(REQUEST_ID_HEADER)) ??
    toSingleHeaderValue(request.headers[REQUEST_ID_HEADER]);

  const cacheStatus = toSingleHeaderValue(reply.getHeader(CACHE_HEADER));

  return {
    event: "http_request_completed",
    requestId,
    method: request.method,
    path: getRequestPath(request),
    route: getRouteLabel(request),
    statusCode: reply.statusCode,
    durationMs,
    cacheStatus,
    userAgent: toSingleHeaderValue(request.headers["user-agent"]),
    remoteAddress: request.ip,
  };
}

export function registerAccessLogMiddleware(app: FastifyInstance): void {
  app.addHook("onRequest", async (request) => {
    request.accessLogStartedAt = process.hrtime.bigint();
  });

  app.addHook("onSend", async (request, reply, payload) => {
    const startedAt = request.accessLogStartedAt;

    if (startedAt === undefined) {
      return payload;
    }

    const durationMs = calculateDurationMs(startedAt);

    reply.header(RESPONSE_TIME_HEADER, formatDurationHeader(durationMs));

    return payload;
  });

  app.addHook("onResponse", async (request, reply) => {
    const startedAt = request.accessLogStartedAt;

    if (startedAt === undefined) {
      return;
    }

    const durationMs = calculateDurationMs(startedAt);

    request.log.info(
      buildAccessLogPayload({
        request,
        reply,
        durationMs,
      }),
    );
  });
}
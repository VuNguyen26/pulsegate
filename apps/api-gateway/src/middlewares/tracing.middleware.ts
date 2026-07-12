import {
  SpanKind,
  SpanStatusCode,
  isSpanContextValid,
  type Context,
  type Span,
} from "@opentelemetry/api";
import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import {
  UNMATCHED_ROUTE_LABEL,
  getMetricsRouteLabel,
  getReplyHeaderValue,
} from "./metrics.middleware.js";
import type {
  TracingRuntime,
} from "../observability/tracing.js";

const CACHE_HEADER = "x-cache";

const HTTP_METHODS = new Set([
  "DELETE",
  "GET",
  "HEAD",
  "OPTIONS",
  "PATCH",
  "POST",
  "PUT",
]);

const CACHE_STATUSES = new Set([
  "BYPASS",
  "HIT",
  "MISS",
]);

const ERROR_CODES = new Set([
  "ADMIN_API_KEY_INVALID",
  "ADMIN_API_KEY_MISSING",
  "ADMIN_API_KEY_READ_ONLY",
  "API_KEY_INVALID",
  "API_KEY_MISSING",
  "DOWNSTREAM_HTTP_ERROR",
  "DOWNSTREAM_INVALID_RESPONSE",
  "DOWNSTREAM_SERVICE_UNAVAILABLE",
  "DOWNSTREAM_TIMEOUT",
  "INTERNAL_SERVER_ERROR",
  "JWT_TOKEN_INVALID",
  "JWT_TOKEN_MISSING",
  "QUOTA_EXCEEDED",
  "RATE_LIMIT_IDENTIFIER_MISSING",
  "REQUEST_BODY_TOO_LARGE",
  "ROUTE_NOT_FOUND",
  "TOO_MANY_REQUESTS",
]);

const REJECTION_REASONS = new Set([
  "ADMIN_API_KEY_INVALID",
  "ADMIN_API_KEY_MISSING",
  "ADMIN_API_KEY_READ_ONLY",
  "API_KEY_INVALID",
  "API_KEY_MISSING",
  "JWT_TOKEN_INVALID",
  "JWT_TOKEN_MISSING",
  "QUOTA_EXCEEDED",
  "RATE_LIMIT_EXCEEDED",
  "REQUEST_BODY_TOO_LARGE",
  "ROUTE_NOT_FOUND",
]);

export type GatewayTracingErrorCode =
  | "ADMIN_API_KEY_INVALID"
  | "ADMIN_API_KEY_MISSING"
  | "ADMIN_API_KEY_READ_ONLY"
  | "API_KEY_INVALID"
  | "API_KEY_MISSING"
  | "DOWNSTREAM_HTTP_ERROR"
  | "DOWNSTREAM_INVALID_RESPONSE"
  | "DOWNSTREAM_SERVICE_UNAVAILABLE"
  | "DOWNSTREAM_TIMEOUT"
  | "INTERNAL_SERVER_ERROR"
  | "JWT_TOKEN_INVALID"
  | "JWT_TOKEN_MISSING"
  | "QUOTA_EXCEEDED"
  | "RATE_LIMIT_IDENTIFIER_MISSING"
  | "REQUEST_BODY_TOO_LARGE"
  | "ROUTE_NOT_FOUND"
  | "TOO_MANY_REQUESTS";

export type GatewayTracingRejectionReason =
  | "ADMIN_API_KEY_INVALID"
  | "ADMIN_API_KEY_MISSING"
  | "ADMIN_API_KEY_READ_ONLY"
  | "API_KEY_INVALID"
  | "API_KEY_MISSING"
  | "JWT_TOKEN_INVALID"
  | "JWT_TOKEN_MISSING"
  | "QUOTA_EXCEEDED"
  | "RATE_LIMIT_EXCEEDED"
  | "REQUEST_BODY_TOO_LARGE"
  | "ROUTE_NOT_FOUND";

type GatewayTracingState = {
  span: Span;
  context: Context;
  method: string;
  route: string;
  errorCode?: GatewayTracingErrorCode;
  rejectionReason?: GatewayTracingRejectionReason;
  ended: boolean;
};

declare module "fastify" {
  interface FastifyRequest {
    gatewayTracingState?: GatewayTracingState;
  }
}

export type RequestTraceIdentifiers = {
  traceId: string;
  spanId: string;
};

export type RequestTracingOutcome = {
  errorCode?: GatewayTracingErrorCode;
  rejectionReason?: GatewayTracingRejectionReason;
};

function getBoundedMethod(
  request: FastifyRequest,
): string {
  const method =
    request.method.toUpperCase();

  return HTTP_METHODS.has(method)
    ? method
    : "OTHER";
}

function getBoundedRoute(
  request: FastifyRequest,
): string {
  const route =
    getMetricsRouteLabel(request);

  if (route === UNMATCHED_ROUTE_LABEL) {
    return route;
  }

  if (
    route.length === 0 ||
    route.length > 128 ||
    !route.startsWith("/") ||
    route.includes("?") ||
    route.includes("#")
  ) {
    return UNMATCHED_ROUTE_LABEL;
  }

  return route;
}

function getBoundedCacheStatus(
  reply: FastifyReply,
): string | undefined {
  const cacheStatus =
    getReplyHeaderValue(
      reply,
      CACHE_HEADER,
    );

  if (
    cacheStatus === undefined ||
    !CACHE_STATUSES.has(cacheStatus)
  ) {
    return undefined;
  }

  return cacheStatus;
}

function buildSpanName(
  method: string,
  route: string,
): string {
  return `${method} ${route}`;
}

export function getRequestTracingContext(
  request: FastifyRequest,
): Context | undefined {
  return request.gatewayTracingState
    ?.context;
}

export function getRequestTraceIdentifiers(
  request: FastifyRequest,
): RequestTraceIdentifiers | undefined {
  const spanContext =
    request.gatewayTracingState
      ?.span.spanContext();

  if (
    spanContext === undefined ||
    !isSpanContextValid(spanContext)
  ) {
    return undefined;
  }

  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
  };
}

export function recordRequestTracingOutcome(
  request: FastifyRequest,
  outcome: RequestTracingOutcome,
): void {
  const state =
    request.gatewayTracingState;

  if (!state || state.ended) {
    return;
  }

  if (
    outcome.errorCode !== undefined &&
    ERROR_CODES.has(outcome.errorCode)
  ) {
    state.errorCode =
      outcome.errorCode;
  }

  if (
    outcome.rejectionReason !== undefined &&
    REJECTION_REASONS.has(
      outcome.rejectionReason,
    )
  ) {
    state.rejectionReason =
      outcome.rejectionReason;
  }
}

function endRequestSpan(
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  const state =
    request.gatewayTracingState;

  if (!state || state.ended) {
    return;
  }

  state.ended = true;

  const route =
    getBoundedRoute(request);

  if (route !== state.route) {
    state.route = route;
    state.span.updateName(
      buildSpanName(
        state.method,
        route,
      ),
    );
  }

  state.span.setAttribute(
    "http.route",
    route,
  );

  state.span.setAttribute(
    "http.response.status_code",
    reply.statusCode,
  );

  const cacheStatus =
    getBoundedCacheStatus(reply);

  if (cacheStatus !== undefined) {
    state.span.setAttribute(
      "pulsegate.cache.status",
      cacheStatus,
    );
  }

  if (state.errorCode !== undefined) {
    state.span.setAttribute(
      "pulsegate.error.code",
      state.errorCode,
    );
  }

  if (
    state.rejectionReason !== undefined
  ) {
    state.span.setAttribute(
      "pulsegate.rejection.reason",
      state.rejectionReason,
    );
  }

  if (reply.statusCode >= 500) {
    state.span.setStatus({
      code: SpanStatusCode.ERROR,
    });
  }

  state.span.end();
}

export function registerTracingMiddleware(
  app: FastifyInstance,
  tracing: TracingRuntime,
): void {
  app.addHook(
    "onRequest",
    async (request) => {
      const parentContext =
        tracing.extractContext(
          request.headers,
        );

      const method =
        getBoundedMethod(request);

      const route =
        getBoundedRoute(request);

      const span =
        tracing.tracer.startSpan(
          buildSpanName(
            method,
            route,
          ),
          {
            kind: SpanKind.SERVER,
            attributes: {
              "http.request.method":
                method,
              "http.route": route,
            },
          },
          parentContext,
        );

      request.gatewayTracingState = {
        span,
        context:
          tracing.contextWithSpan(
            parentContext,
            span,
          ),
        method,
        route,
        ended: false,
      };
    },
  );

  app.addHook(
    "onResponse",
    async (request, reply) => {
      endRequestSpan(
        request,
        reply,
      );
    },
  );
}

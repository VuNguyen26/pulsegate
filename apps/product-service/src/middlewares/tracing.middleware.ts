import {
  SpanKind,
  SpanStatusCode,
  type Context,
  type Span,
} from "@opentelemetry/api";
import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import type {
  TracingRuntime,
} from "../observability/tracing.js";

const UNMATCHED_ROUTE =
  "__unmatched__";

const HTTP_METHODS = new Set([
  "DELETE",
  "GET",
  "HEAD",
  "OPTIONS",
  "PATCH",
  "POST",
  "PUT",
]);

export type ProductTracingErrorCode =
  | "INTERNAL_SERVER_ERROR"
  | "ROUTE_NOT_FOUND";

type ProductTracingState = {
  span: Span;
  context: Context;
  method: string;
  route: string;
  errorCode?: ProductTracingErrorCode;
  ended: boolean;
};

declare module "fastify" {
  interface FastifyRequest {
    productTracingState?:
      ProductTracingState;
  }
}

export function getProductRequestTraceIdentifiers(
  request: FastifyRequest,
):
  | {
      traceId: string;
      spanId: string;
    }
  | undefined {
  const state =
    request.productTracingState;

  if (!state) {
    return undefined;
  }

  const {
    traceId,
    spanId,
  } = state.span.spanContext();

  if (
    !/^[0-9a-f]{32}$/.test(traceId) ||
    !/^[0-9a-f]{16}$/.test(spanId)
  ) {
    return undefined;
  }

  return {
    traceId,
    spanId,
  };
}



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

function buildSpanName(
  method: string,
  route: string,
): string {
  return `${method} ${route}`;
}

export function recordProductTracingOutcome(
  request: FastifyRequest,
  errorCode: ProductTracingErrorCode,
): void {
  const state =
    request.productTracingState;

  if (!state || state.ended) {
    return;
  }

  state.errorCode = errorCode;
}

function endProductRequestSpan(
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  const state =
    request.productTracingState;

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

  if (state.errorCode !== undefined) {
    state.span.setAttribute(
      "pulsegate.error.code",
      state.errorCode,
    );
  }

  if (reply.statusCode >= 500) {
    state.span.setStatus({
      code: SpanStatusCode.ERROR,
    });
  }

  state.span.end();
}

export function registerProductTracingMiddleware(
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

      request.productTracingState = {
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
      endProductRequestSpan(
        request,
        reply,
      );
    },
  );
}

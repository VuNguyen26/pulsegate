import {
  SpanStatusCode,
  TraceFlags,
} from "@opentelemetry/api";
import type {
  FastifyInstance,
} from "fastify";
import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";
import {
  buildApiGatewayApp,
} from "../app.js";
import {
  productProductsRouteConfig,
} from "../config/downstream-routes.js";
import {
  createInMemoryTracingRuntime,
} from "../observability/tracing.js";
import {
  InMemoryRateLimitStore,
} from "../rate-limit/in-memory-rate-limit-store.js";

const REMOTE_TRACE_ID =
  "4bf92f3577b34da6a3ce929d0e0e4736";

const REMOTE_PARENT_SPAN_ID =
  "00f067aa0ba902b7";

const REMOTE_TRACEPARENT =
  `00-${REMOTE_TRACE_ID}-${REMOTE_PARENT_SPAN_ID}-01`;

describe("Gateway inbound tracing middleware", () => {
  let app:
    | FastifyInstance
    | undefined;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = undefined;
    }
  });

  async function buildTestApp() {
    const tracing =
      createInMemoryTracingRuntime(
        "api-gateway",
      );

    app =
      await buildApiGatewayApp({
        logger: false,
        tracing: tracing.runtime,
        productProxy: {
          rateLimitStore:
            new InMemoryRateLimitStore(),
        },
      });

    return tracing;
  }

  it("continues a valid remote W3C trace with bounded server-span data", async () => {
    const {
      exporter,
    } =
      await buildTestApp();

    const response =
      await app!.inject({
        method: "GET",
        url:
          "/health?credential=secret-query",
        headers: {
          traceparent:
            REMOTE_TRACEPARENT,
          tracestate:
            "vendor=value",
          baggage:
            "credential=secret-baggage",
          "x-api-key":
            "secret-api-key",
          authorization:
            "Bearer secret-jwt-token",
          cookie:
            "session=secret-cookie",
          "user-agent":
            "secret-user-agent",
          "x-request-id":
            "client-request-id",
        },
      });

    expect(response.statusCode).toBe(200);
    expect(
      response.headers.traceparent,
    ).toBeUndefined();
    expect(
      response.headers.tracestate,
    ).toBeUndefined();

    const spans =
      exporter.getFinishedSpans();

    expect(spans).toHaveLength(1);

    const span = spans[0]!;

    expect(span.name).toBe(
      "GET /health",
    );
    expect(
      span.spanContext().traceId,
    ).toBe(REMOTE_TRACE_ID);
    expect(
      span.spanContext().traceFlags,
    ).toBe(TraceFlags.SAMPLED);
    expect(
      span.parentSpanContext,
    ).toMatchObject({
      traceId: REMOTE_TRACE_ID,
      spanId: REMOTE_PARENT_SPAN_ID,
      isRemote: true,
    });
    expect(span.attributes).toEqual({
      "http.request.method": "GET",
      "http.route": "/health",
      "http.response.status_code": 200,
    });
    expect(span.status.code).toBe(
      SpanStatusCode.UNSET,
    );

    const serializedSpan =
      JSON.stringify({
        name: span.name,
        attributes: span.attributes,
      });

    for (const sensitiveValue of [
      "secret-query",
      "secret-baggage",
      "secret-api-key",
      "secret-jwt-token",
      "secret-cookie",
      "secret-user-agent",
      "client-request-id",
    ]) {
      expect(
        serializedSpan,
      ).not.toContain(sensitiveValue);
    }
  });

  it("creates a new trace for malformed client context", async () => {
    const {
      exporter,
    } =
      await buildTestApp();

    const response =
      await app!.inject({
        method: "GET",
        url: "/health",
        headers: {
          traceparent:
            "malformed-client-value",
          tracestate:
            "vendor=value",
        },
      });

    expect(response.statusCode).toBe(200);

    const span =
      exporter.getFinishedSpans()[0]!;

    expect(
      span.spanContext().traceId,
    ).not.toBe(REMOTE_TRACE_ID);
    expect(
      span.parentSpanContext,
    ).toBeUndefined();
  });

  it("uses the bounded unmatched route and records route-not-found outcome", async () => {
    const {
      exporter,
    } =
      await buildTestApp();

    const response =
      await app!.inject({
        method: "GET",
        url:
          "/missing/consumer/value?secret=query",
      });

    expect(response.statusCode).toBe(404);

    const span =
      exporter.getFinishedSpans()[0]!;

    expect(span.name).toBe(
      "GET __unmatched__",
    );
    expect(span.attributes).toEqual({
      "http.request.method": "GET",
      "http.route":
        "__unmatched__",
      "http.response.status_code": 404,
      "pulsegate.error.code":
        "ROUTE_NOT_FOUND",
      "pulsegate.rejection.reason":
        "ROUTE_NOT_FOUND",
    });
    expect(span.status.code).toBe(
      SpanStatusCode.UNSET,
    );
    expect(
      JSON.stringify(span.attributes),
    ).not.toContain(
      "/missing/consumer/value",
    );
  });

  it("records bounded authentication rejection without credentials", async () => {
    const {
      exporter,
    } =
      await buildTestApp();

    const response =
      await app!.inject({
        method: "GET",
        url: "/api/products",
        headers: {
          authorization:
            "Bearer secret-jwt-token",
          cookie:
            "session=secret-cookie",
        },
      });

    expect(response.statusCode).toBe(401);

    const span =
      exporter.getFinishedSpans()[0]!;

    expect(span.name).toBe(
      "GET /api/products",
    );
    expect(span.attributes).toMatchObject({
      "http.request.method": "GET",
      "http.route": "/api/products",
      "http.response.status_code": 401,
      "pulsegate.error.code":
        "API_KEY_MISSING",
      "pulsegate.rejection.reason":
        "API_KEY_MISSING",
    });

    const serialized =
      JSON.stringify(span.attributes);

    expect(serialized).not.toContain(
      "secret-jwt-token",
    );
    expect(serialized).not.toContain(
      "secret-cookie",
    );
  });

  it("records request-size rejection with no body data", async () => {
    const {
      exporter,
    } =
      await buildTestApp();

    const sensitiveBody =
      "secret-request-body";

    const response =
      await app!.inject({
        method: "POST",
        url: "/api/products",
        headers: {
          "content-length":
            "1048577",
          "content-type":
            "application/json",
        },
        payload: {
          value: sensitiveBody,
        },
      });

    expect(response.statusCode).toBe(413);

    const span =
      exporter.getFinishedSpans()[0]!;

    expect(span.attributes).toMatchObject({
      "http.request.method": "POST",
      "http.route": "/api/*",
      "http.response.status_code": 413,
      "pulsegate.error.code":
        "REQUEST_BODY_TOO_LARGE",
      "pulsegate.rejection.reason":
        "REQUEST_BODY_TOO_LARGE",
    });
    expect(
      JSON.stringify(span.attributes),
    ).not.toContain(sensitiveBody);
  });

  it("marks an unhandled 5xx span as error without recording the exception message", async () => {
    const {
      exporter,
    } =
      await buildTestApp();

    app!.get(
      "/trace-test-error",
      async () => {
        throw new Error(
          "secret-internal-error-message",
        );
      },
    );

    const response =
      await app!.inject({
        method: "GET",
        url: "/trace-test-error",
      });

    expect(response.statusCode).toBe(500);

    const span =
      exporter.getFinishedSpans()[0]!;

    expect(span.name).toBe(
      "GET /trace-test-error",
    );
    expect(span.status.code).toBe(
      SpanStatusCode.ERROR,
    );
    expect(span.status.message).toBeUndefined();
    expect(span.attributes).toMatchObject({
      "http.request.method": "GET",
      "http.route":
        "/trace-test-error",
      "http.response.status_code": 500,
      "pulsegate.error.code":
        "INTERNAL_SERVER_ERROR",
    });
    expect(
      JSON.stringify(span.attributes),
    ).not.toContain(
      "secret-internal-error-message",
    );
  });
  it("records bounded rate-limit rejection on the blocked request", async () => {
    const tracing =
      createInMemoryTracingRuntime(
        "api-gateway",
      );

    app =
      await buildApiGatewayApp({
        logger: false,
        tracing: tracing.runtime,
        routeConfigs: [
          {
            ...productProductsRouteConfig,
            policies: {
              ...productProductsRouteConfig.policies,
              auth: {
                requireApiKey: true,
                requireJwt: true,
              },
              rateLimit: {
                enabled: true,
                limit: 1,
                windowMs: 60_000,
              },
            },
          },
        ],
        productProxy: {
          rateLimitStore:
            new InMemoryRateLimitStore(),
          apiKeyAuthMiddleware(
            request,
            _reply,
            done,
          ) {
            request.apiKey =
              "secret-api-key";
            request.apiKeyAuthSource =
              "env";
            done();
          },
        },
      });

    const firstResponse =
      await app.inject({
        method: "GET",
        url: "/api/products",
      });

    const blockedResponse =
      await app.inject({
        method: "GET",
        url: "/api/products",
      });

    expect(firstResponse.statusCode).toBe(401);
    expect(blockedResponse.statusCode).toBe(429);

    const spans =
      tracing.exporter.getFinishedSpans();

    expect(spans).toHaveLength(2);

    const blockedSpan =
      spans[1]!;

    expect(blockedSpan.attributes).toMatchObject({
      "http.request.method": "GET",
      "http.route": "/api/products",
      "http.response.status_code": 429,
      "pulsegate.error.code":
        "TOO_MANY_REQUESTS",
      "pulsegate.rejection.reason":
        "RATE_LIMIT_EXCEEDED",
    });

    expect(
      JSON.stringify(
        blockedSpan.attributes,
      ),
    ).not.toContain(
      "secret-api-key",
    );
  });

  it("records bounded quota rejection without consumer or API-key identifiers", async () => {
    const tracing =
      createInMemoryTracingRuntime(
        "api-gateway",
      );

    app =
      await buildApiGatewayApp({
        logger: false,
        tracing: tracing.runtime,
        routeConfigs: [
          {
            ...productProductsRouteConfig,
            policies: {
              ...productProductsRouteConfig.policies,
              auth: {
                requireApiKey: true,
                requireJwt: false,
              },
              rateLimit: {
                enabled: false,
                limit: 0,
                windowMs: 0,
              },
            },
          },
        ],
        productProxy: {
          rateLimitStore:
            new InMemoryRateLimitStore(),
          apiKeyAuthMiddleware(
            request,
            _reply,
            done,
          ) {
            request.apiKey =
              "secret-database-key";
            request.apiKeyId =
              "secret-key-id";
            request.apiConsumerId =
              "secret-consumer-id";
            request.apiKeyAuthSource =
              "database";
            done();
          },
          usageQuotaChecker: {
            async checkApiKeyQuota() {
              return {
                allowed: false,
                code:
                  "QUOTA_EXCEEDED",
                usagePlanId:
                  "plan_starter",
                quotaLimit: 1,
                quotaWindow:
                  "DAILY",
                usedRequests: 1,
                windowStartedAt:
                  new Date(
                    "2026-07-04T00:00:00.000Z",
                  ),
                windowEndsAt:
                  new Date(
                    "2026-07-05T00:00:00.000Z",
                  ),
              };
            },
          },
        },
      });

    const response =
      await app.inject({
        method: "GET",
        url: "/api/products",
      });

    expect(response.statusCode).toBe(429);

    const span =
      tracing.exporter
        .getFinishedSpans()[0]!;

    expect(span.attributes).toMatchObject({
      "http.request.method": "GET",
      "http.route": "/api/products",
      "http.response.status_code": 429,
      "pulsegate.error.code":
        "QUOTA_EXCEEDED",
      "pulsegate.rejection.reason":
        "QUOTA_EXCEEDED",
    });

    const serialized =
      JSON.stringify(span.attributes);

    for (const sensitiveValue of [
      "secret-database-key",
      "secret-key-id",
      "secret-consumer-id",
    ]) {
      expect(serialized).not.toContain(
        sensitiveValue,
      );
    }
  });
});

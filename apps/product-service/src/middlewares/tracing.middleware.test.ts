import {
  SpanStatusCode,
  TraceFlags,
} from "@opentelemetry/api";
import Fastify, {
  type FastifyInstance,
} from "fastify";
import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";
import {
  registerErrorHandlers,
} from "./error-handler.middleware.js";
import {
  registerProductTracingMiddleware,
} from "./tracing.middleware.js";
import {
  createInMemoryTracingRuntime,
  type TracingRuntime,
} from "../observability/tracing.js";

const REMOTE_TRACE_ID =
  "4bf92f3577b34da6a3ce929d0e0e4736";

const REMOTE_PARENT_SPAN_ID =
  "00f067aa0ba902b7";

const REMOTE_TRACEPARENT =
  `00-${REMOTE_TRACE_ID}-${REMOTE_PARENT_SPAN_ID}-01`;

describe(
  "Product Service inbound tracing",
  () => {
    let app:
      | FastifyInstance
      | undefined;

    let tracingRuntime:
      | TracingRuntime
      | undefined;

    afterEach(async () => {
      if (app) {
        await app.close();
        app = undefined;
      }

      if (tracingRuntime) {
        await tracingRuntime.shutdown();
        tracingRuntime = undefined;
      }
    });

    async function buildTestApp() {
      const tracing =
        createInMemoryTracingRuntime(
          "product-service",
        );

      tracingRuntime =
        tracing.runtime;

      app = Fastify({
        logger: false,
      });

      registerProductTracingMiddleware(
        app,
        tracing.runtime,
      );

      registerErrorHandlers(app);

      app.get(
        "/products",
        async () => ({
          data: [],
        }),
      );

      return tracing;
    }

    it("continues the Gateway client span context with one bounded Product server span", async () => {
      const {
        exporter,
      } =
        await buildTestApp();

      const response =
        await app!.inject({
          method: "GET",
          url:
            "/products?credential=secret-query",
          headers: {
            traceparent:
              REMOTE_TRACEPARENT,
            tracestate:
              "vendor=value",
            baggage:
              "credential=secret-baggage",
            authorization:
              "Bearer secret-jwt",
            cookie:
              "session=secret-cookie",
            "x-api-key":
              "secret-api-key",
            "x-request-id":
              "gateway-request-id",
          },
        });

      expect(response.statusCode).toBe(
        200,
      );

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
        "GET /products",
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
        spanId:
          REMOTE_PARENT_SPAN_ID,
        isRemote: true,
      });

      expect(span.attributes).toEqual({
        "http.request.method":
          "GET",
        "http.route":
          "/products",
        "http.response.status_code":
          200,
      });

      expect(span.status.code).toBe(
        SpanStatusCode.UNSET,
      );

      const serialized =
        JSON.stringify({
          name: span.name,
          attributes:
            span.attributes,
        });

      for (const sensitiveValue of [
        "secret-query",
        "secret-baggage",
        "secret-jwt",
        "secret-cookie",
        "secret-api-key",
        "gateway-request-id",
      ]) {
        expect(serialized).not.toContain(
          sensitiveValue,
        );
      }
    });

    it("starts a new Product trace when incoming context is malformed", async () => {
      const {
        exporter,
      } =
        await buildTestApp();

      const response =
        await app!.inject({
          method: "GET",
          url: "/products",
          headers: {
            traceparent:
              "malformed-client-value",
            tracestate:
              "vendor=value",
          },
        });

      expect(response.statusCode).toBe(
        200,
      );

      const span =
        exporter.getFinishedSpans()[0]!;

      expect(
        span.spanContext().traceId,
      ).not.toBe(REMOTE_TRACE_ID);

      expect(
        span.parentSpanContext,
      ).toBeUndefined();
    });

    it("uses the bounded unmatched route for Product 404 responses", async () => {
      const {
        exporter,
      } =
        await buildTestApp();

      const response =
        await app!.inject({
          method: "GET",
          url:
            "/missing/customer/value?secret=query",
        });

      expect(response.statusCode).toBe(
        404,
      );

      const span =
        exporter.getFinishedSpans()[0]!;

      expect(span.name).toBe(
        "GET __unmatched__",
      );

      expect(span.attributes).toEqual({
        "http.request.method":
          "GET",
        "http.route":
          "__unmatched__",
        "http.response.status_code":
          404,
        "pulsegate.error.code":
          "ROUTE_NOT_FOUND",
      });

      expect(
        JSON.stringify(
          span.attributes,
        ),
      ).not.toContain(
        "/missing/customer/value",
      );
    });

    it("marks Product 5xx as error without recording the exception message", async () => {
      const {
        exporter,
      } =
        await buildTestApp();

      app!.get(
        "/trace-test-error",
        async () => {
          throw new Error(
            "secret-product-error-message",
          );
        },
      );

      const response =
        await app!.inject({
          method: "GET",
          url: "/trace-test-error",
        });

      expect(response.statusCode).toBe(
        500,
      );

      const span =
        exporter.getFinishedSpans()[0]!;

      expect(span.name).toBe(
        "GET /trace-test-error",
      );

      expect(span.status.code).toBe(
        SpanStatusCode.ERROR,
      );

      expect(
        span.status.message,
      ).toBeUndefined();

      expect(span.attributes).toEqual({
        "http.request.method":
          "GET",
        "http.route":
          "/trace-test-error",
        "http.response.status_code":
          500,
        "pulsegate.error.code":
          "INTERNAL_SERVER_ERROR",
      });

      expect(
        JSON.stringify(
          span.attributes,
        ),
      ).not.toContain(
        "secret-product-error-message",
      );
    });
  },
);

import {
  SpanKind,
  SpanStatusCode,
} from "@opentelemetry/api";
import Fastify, {
  type FastifyInstance,
} from "fastify";
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type {
  ResponseCacheStore,
} from "../cache/redis-response-cache-store.js";
import {
  productProductsRouteConfig,
  type DownstreamRouteConfig,
} from "../config/downstream-routes.js";
import {
  registerErrorHandlers,
} from "../middlewares/error-handler.middleware.js";
import {
  registerTracingMiddleware,
} from "../middlewares/tracing.middleware.js";
import {
  createInMemoryTracingRuntime,
  type TracingRuntime,
} from "../observability/tracing.js";
import {
  InMemoryRateLimitStore,
} from "../rate-limit/in-memory-rate-limit-store.js";
import {
  createRouteRuntimeRegistry,
  type RouteRuntimeRegistry,
} from "../runtime/route-runtime-registry.js";
import {
  downstreamProxyRoute,
} from "../routes/product-proxy.route.js";

const REMOTE_TRACE_ID =
  "4bf92f3577b34da6a3ce929d0e0e4736";

const REMOTE_PARENT_SPAN_ID =
  "00f067aa0ba902b7";

const REMOTE_TRACEPARENT =
  `00-${REMOTE_TRACE_ID}-${REMOTE_PARENT_SPAN_ID}-01`;

function createRoute(options: {
  method?:
    DownstreamRouteConfig["method"];
  cacheEnabled?: boolean;
  retryEnabled?: boolean;
  serviceDiscovery?: boolean;
} = {}): DownstreamRouteConfig {
  const route =
    structuredClone(
      productProductsRouteConfig,
    );

  return {
    ...route,
    method: options.method ?? "GET",
    downstreamUrl:
      "http://product-a:3001/products",
    ...(options.serviceDiscovery
      ? {
          serviceInstances: [
            {
              baseUrl:
                "http://product-a:3001",
            },
            {
              baseUrl:
                "http://product-b:3001",
            },
          ],
        }
      : {}),
    policies: {
      ...route.policies,
      auth: {
        requireApiKey: false,
        requireJwt: false,
      },
      cache: {
        enabled:
          options.cacheEnabled ?? false,
        ttlSeconds: 30,
      },
      rateLimit: {
        enabled: false,
        limit: 1,
        windowMs: 60_000,
      },
      requestTransform: {
        ...route.policies
          .requestTransform,
        enabled: true,
        addHeaders: {
          TraceParent:
            "00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01",
          TraceState:
            "attacker=value",
          baggage:
            "credential=must-not-propagate",
        },
        removeHeaders: [],
      },
      retry: {
        enabled:
          options.retryEnabled ?? false,
        attempts:
          options.retryEnabled ? 1 : 0,
        retryOnStatuses: [
          502,
          503,
          504,
        ],
      },
    },
  };
}

describe(
  "downstream proxy tracing",
  () => {
    let app:
      | FastifyInstance
      | undefined;

    let tracingRuntime:
      | TracingRuntime
      | undefined;

    afterEach(async () => {
      vi.unstubAllGlobals();

      if (app) {
        await app.close();
        app = undefined;
      }

      if (tracingRuntime) {
        await tracingRuntime.shutdown();
        tracingRuntime = undefined;
      }
    });

    async function buildApp(options: {
      route: DownstreamRouteConfig;
      routeRuntimeRegistry?:
        RouteRuntimeRegistry;
      responseCacheStore?:
        ResponseCacheStore;
      randomSource?: () => number;
    }) {
      const tracing =
        createInMemoryTracingRuntime(
          "api-gateway",
        );

      tracingRuntime =
        tracing.runtime;

      app = Fastify({
        logger: false,
      });

      registerTracingMiddleware(
        app,
        tracing.runtime,
      );

      registerErrorHandlers(app);

      await app.register(
        downstreamProxyRoute,
        {
          routeConfigs: [
            options.route,
          ],
          routeRuntimeRegistry:
            options.routeRuntimeRegistry,
          responseCacheStore:
            options.responseCacheStore,
          rateLimitStore:
            new InMemoryRateLimitStore(),
          serviceDiscoveryRandomSource:
            options.randomSource,
        },
      );

      return tracing;
    }

    it("creates one child client span and overwrites configured trace headers", async () => {
      const tracing =
        await buildApp({
          route: createRoute(),
        });

      const fetchMock =
        vi.fn(
          async (
            _input:
              | string
              | URL
              | Request,
            init?: RequestInit,
          ) => {
            const headers =
              init?.headers as
                | Record<
                    string,
                    string
                  >
                | undefined;

            expect(headers).toBeDefined();
            expect(
              headers?.baggage,
            ).toBeUndefined();
            expect(
              headers?.TraceParent,
            ).toBeUndefined();
            expect(
              headers?.TraceState,
            ).toBeUndefined();

            return new Response(
              JSON.stringify({
                ok: true,
              }),
              {
                status: 200,
                headers: {
                  "content-type":
                    "application/json",
                },
              },
            );
          },
        );

      vi.stubGlobal(
        "fetch",
        fetchMock,
      );

      const response =
        await app!.inject({
          method: "GET",
          url: "/api/products",
          headers: {
            traceparent:
              REMOTE_TRACEPARENT,
            tracestate:
              "vendor=value",
          },
        });

      expect(response.statusCode).toBe(
        200,
      );

      const spans =
        tracing.exporter
          .getFinishedSpans();

      const serverSpan =
        spans.find(
          (span) =>
            span.kind ===
            SpanKind.SERVER,
        );

      const clientSpan =
        spans.find(
          (span) =>
            span.kind ===
            SpanKind.CLIENT,
        );

      expect(serverSpan).toBeDefined();
      expect(clientSpan).toBeDefined();

      expect(clientSpan?.name).toBe(
        "GET product-service",
      );

      expect(
        clientSpan?.spanContext()
          .traceId,
      ).toBe(REMOTE_TRACE_ID);

      expect(
        clientSpan
          ?.parentSpanContext
          ?.spanId,
      ).toBe(
        serverSpan?.spanContext()
          .spanId,
      );

      expect(
        clientSpan?.attributes,
      ).toEqual({
        "http.request.method":
          "GET",
        "http.response.status_code":
          200,
        "pulsegate.service.name":
          "product-service",
        "pulsegate.retry.attempt":
          0,
        "pulsegate.failover":
          false,
      });

      const fetchHeaders =
        fetchMock.mock.calls[0]?.[1]
          ?.headers as
          | Record<string, string>
          | undefined;

      expect(
        fetchHeaders?.traceparent,
      ).toBe(
        `00-${REMOTE_TRACE_ID}-${clientSpan?.spanContext().spanId}-01`,
      );

      expect(
        fetchHeaders?.tracestate,
      ).toBe("vendor=value");

      const serialized =
        JSON.stringify({
          name: clientSpan?.name,
          attributes:
            clientSpan?.attributes,
        });

      expect(serialized).not.toContain(
        "http://product-a:3001",
      );
      expect(serialized).not.toContain(
        "credential=must-not-propagate",
      );
    });

    it("creates no client span or downstream request on a cache hit", async () => {
      const fetchMock = vi.fn();

      vi.stubGlobal(
        "fetch",
        fetchMock,
      );

      const responseCacheStore:
        ResponseCacheStore = {
          async get() {
            return {
              hit: true as const,
              value: {
                statusCode: 200,
                body: {
                  source: "cache",
                },
              },
            };
          },

          async set() {
            return;
          },
        };

      const tracing =
        await buildApp({
          route:
            createRoute({
              cacheEnabled: true,
            }),
          responseCacheStore,
        });

      const response =
        await app!.inject({
          method: "GET",
          url: "/api/products",
        });

      expect(response.statusCode).toBe(
        200,
      );

      expect(fetchMock).not.toHaveBeenCalled();

      expect(
        tracing.exporter
          .getFinishedSpans()
          .filter(
            (span) =>
              span.kind ===
              SpanKind.CLIENT,
          ),
      ).toHaveLength(0);
    });

    it("creates one client span per retry and marks actual service-discovery failover", async () => {
      const route =
        createRoute({
          retryEnabled: true,
          serviceDiscovery: true,
        });

      const registry =
        createRouteRuntimeRegistry({
          initialRoutes: [route],
        });

      const propagatedHeaders:
        Record<string, string>[] = [];

      const fetchMock =
        vi
          .fn()
          .mockImplementationOnce(
            async (
              _input:
                | string
                | URL
                | Request,
              init?: RequestInit,
            ) => {
              propagatedHeaders.push({
                ...(
                  init?.headers as
                    Record<
                      string,
                      string
                    >
                ),
              });

              return new Response(
                JSON.stringify({
                  error:
                    "temporary failure",
                }),
                {
                  status: 503,
                  headers: {
                    "content-type":
                      "application/json",
                  },
                },
              );
            },
          )
          .mockImplementationOnce(
            async (
              _input:
                | string
                | URL
                | Request,
              init?: RequestInit,
            ) => {
              propagatedHeaders.push({
                ...(
                  init?.headers as
                    Record<
                      string,
                      string
                    >
                ),
              });

              return new Response(
                JSON.stringify({
                  ok: true,
                }),
                {
                  status: 200,
                  headers: {
                    "content-type":
                      "application/json",
                  },
                },
              );
            },
          );

      vi.stubGlobal(
        "fetch",
        fetchMock,
      );

      const tracing =
        await buildApp({
          route,
          routeRuntimeRegistry:
            registry,
          randomSource: () => 0,
        });

      const response =
        await app!.inject({
          method: "GET",
          url: "/api/products",
        });

      expect(response.statusCode).toBe(
        200,
      );

      expect(fetchMock).toHaveBeenCalledTimes(
        2,
      );

      const clientSpans =
        tracing.exporter
          .getFinishedSpans()
          .filter(
            (span) =>
              span.kind ===
              SpanKind.CLIENT,
          );

      expect(clientSpans).toHaveLength(
        2,
      );

      expect(
        clientSpans.map(
          (span) =>
            span.attributes[
              "pulsegate.retry.attempt"
            ],
        ),
      ).toEqual([0, 1]);

      expect(
        clientSpans.map(
          (span) =>
            span.attributes[
              "pulsegate.failover"
            ],
        ),
      ).toEqual([false, true]);

      expect(
        clientSpans.map(
          (span) =>
            span.attributes[
              "http.response.status_code"
            ],
        ),
      ).toEqual([503, 200]);

      expect(
        clientSpans[0]?.status.code,
      ).toBe(SpanStatusCode.ERROR);

      expect(
        clientSpans[1]?.status.code,
      ).toBe(SpanStatusCode.UNSET);

      expect(
        propagatedHeaders[0]
          ?.traceparent,
      ).not.toBe(
        propagatedHeaders[1]
          ?.traceparent,
      );
    });

    it("does not replay a non-GET request and records one bounded unavailable span", async () => {
      const fetchMock =
        vi.fn(async () => {
          throw new Error(
            "connection refused secret",
          );
        });

      vi.stubGlobal(
        "fetch",
        fetchMock,
      );

      const tracing =
        await buildApp({
          route:
            createRoute({
              method: "POST",
              retryEnabled: true,
              serviceDiscovery: true,
            }),
          randomSource: () => 0,
        });

      const response =
        await app!.inject({
          method: "POST",
          url: "/api/products",
        });

      expect(response.statusCode).toBe(
        503,
      );

      expect(fetchMock).toHaveBeenCalledTimes(
        1,
      );

      const clientSpans =
        tracing.exporter
          .getFinishedSpans()
          .filter(
            (span) =>
              span.kind ===
              SpanKind.CLIENT,
          );

      expect(clientSpans).toHaveLength(
        1,
      );

      expect(
        clientSpans[0]?.attributes,
      ).toMatchObject({
        "http.request.method":
          "POST",
        "pulsegate.service.name":
          "product-service",
        "pulsegate.retry.attempt":
          0,
        "pulsegate.failover":
          false,
        "pulsegate.error.code":
          "DOWNSTREAM_SERVICE_UNAVAILABLE",
      });

      expect(
        clientSpans[0]?.status.code,
      ).toBe(SpanStatusCode.ERROR);

      expect(
        JSON.stringify(
          clientSpans[0]?.attributes,
        ),
      ).not.toContain(
        "connection refused secret",
      );
    });

    it("creates no client span when no eligible target reaches fetch", async () => {
      const route =
        createRoute({
          retryEnabled: true,
          serviceDiscovery: true,
        });

      const registry =
        createRouteRuntimeRegistry({
          initialRoutes: [route],
        });

      for (const baseUrl of [
        "http://product-a:3001",
        "http://product-b:3001",
      ]) {
        registry.recordServiceInstanceFailure(
          "product-service",
          baseUrl,
        );

        registry.recordServiceInstanceFailure(
          "product-service",
          baseUrl,
        );
      }

      const fetchMock = vi.fn();

      vi.stubGlobal(
        "fetch",
        fetchMock,
      );

      const tracing =
        await buildApp({
          route,
          routeRuntimeRegistry:
            registry,
          randomSource: () => 0,
        });

      const response =
        await app!.inject({
          method: "GET",
          url: "/api/products",
        });

      expect(response.statusCode).toBe(
        503,
      );

      expect(fetchMock).not.toHaveBeenCalled();

      expect(
        tracing.exporter
          .getFinishedSpans()
          .filter(
            (span) =>
              span.kind ===
              SpanKind.CLIENT,
          ),
      ).toHaveLength(0);
    });
  },
);

import {
  describe,
  expect,
  it,
} from "vitest";
import {
  createInMemoryTracingRuntime,
} from "../observability/tracing.js";
import {
  registerTracingMiddleware,
} from "./tracing.middleware.js";
import Fastify from "fastify";
import {
  buildAccessLogPayload,
  calculateDurationMs,
  formatDurationHeader,
  getRequestPath,
  getRouteLabel,
  registerAccessLogMiddleware,
} from "./access-log.middleware.js";

describe("access log middleware", () => {
  it("should calculate request duration in milliseconds", () => {
    const startedAt = 1_000_000_000n;
    const endedAt = 1_012_345_678n;

    expect(calculateDurationMs(startedAt, endedAt)).toBe(12.35);
  });

  it("should format duration header with two decimal places", () => {
    expect(formatDurationHeader(12)).toBe("12.00");
    expect(formatDurationHeader(12.3)).toBe("12.30");
    expect(formatDurationHeader(12.35)).toBe("12.35");
  });

  it("should extract request path without query string", async () => {
    const app = Fastify({ logger: false });

    app.get("/health", async (request) => {
      return {
        path: getRequestPath(request),
      };
    });

    const response = await app.inject({
      method: "GET",
      url: "/health?debug=true",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      path: "/health",
    });
  });

  it("should build a safe structured access log payload", async () => {
    const app = Fastify({ logger: false });

    app.get("/health", async (request, reply) => {
      reply.header("x-request-id", "test-request-id");
      reply.header("x-cache", "HIT");

      const payload = buildAccessLogPayload({
        request,
        reply,
        durationMs: 10.25,
      });

      return payload;
    });

    const response = await app.inject({
      method: "GET",
      url: "/health",
      headers: {
        "user-agent": "vitest",
        "x-api-key": "secret-api-key",
        authorization: "Bearer secret-jwt-token",
      },
    });

    expect(response.statusCode).toBe(200);

    const payload = response.json();

    expect(payload).toEqual({
      event: "http_request_completed",
      requestId: "test-request-id",
      method: "GET",
      route: "/health",
      statusCode: 200,
      durationMs: 10.25,
      cacheStatus: "HIT",
    });

    expect(JSON.stringify(payload)).not.toContain("secret-api-key");
    expect(JSON.stringify(payload)).not.toContain("secret-jwt-token");
  });

  it("should include bounded trace identifiers without copying sensitive headers", async () => {
    const {
      runtime,
    } =
      createInMemoryTracingRuntime(
        "api-gateway",
      );

    const app = Fastify({
      logger: false,
    });

    registerTracingMiddleware(
      app,
      runtime,
    );

    app.get(
      "/health",
      async (request, reply) => {
        reply.header(
          "x-request-id",
          "test-request-id",
        );

        return buildAccessLogPayload({
          request,
          reply,
          durationMs: 10.25,
        });
      },
    );

    const response =
      await app.inject({
        method: "GET",
        url: "/health",
        headers: {
          "x-api-key":
            "secret-api-key",
          authorization:
            "Bearer secret-jwt-token",
        },
      });

    expect(response.statusCode).toBe(200);

    const payload =
      response.json();

    expect(payload.traceId).toMatch(
      /^[0-9a-f]{32}$/,
    );
    expect(payload.spanId).toMatch(
      /^[0-9a-f]{16}$/,
    );
    expect(
      JSON.stringify(payload),
    ).not.toContain(
      "secret-api-key",
    );
    expect(
      JSON.stringify(payload),
    ).not.toContain(
      "secret-jwt-token",
    );

    await app.close();
    await runtime.shutdown();
  });

  it("should add response time header when registered", async () => {
    const app = Fastify({ logger: false });

    registerAccessLogMiddleware(app);

    app.get("/health", async () => {
      return {
        status: "ok",
      };
    });

    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    const responseTime = response.headers["x-response-time-ms"];

    expect(response.statusCode).toBe(200);
    expect(responseTime).toBeDefined();
    expect(Number(responseTime)).not.toBeNaN();
    expect(Number(responseTime)).toBeGreaterThanOrEqual(0);
  });

  it("should use a bounded unmatched route label", async () => {
    const app = Fastify({ logger: false });

    app.setNotFoundHandler(async (request, reply) => {
      return reply.status(404).send({
        route: getRouteLabel(request),
      });
    });

    const response = await app.inject({
      method: "GET",
      url: "/unknown/user-controlled-value?secret=value",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      route: "__unmatched__",
    });
  });
  it("should not break request handling when registered", async () => {
    const app = Fastify({ logger: false });

    registerAccessLogMiddleware(app);

    app.get("/health", async () => {
      return {
        status: "ok",
      };
    });

    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: "ok",
    });
  });
});

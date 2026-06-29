import { describe, expect, it } from "vitest";
import Fastify from "fastify";
import {
  buildAccessLogPayload,
  calculateDurationMs,
  getRequestPath,
  registerAccessLogMiddleware,
} from "./access-log.middleware.js";

describe("access log middleware", () => {
  it("should calculate request duration in milliseconds", () => {
    const startedAt = 1_000_000_000n;
    const endedAt = 1_012_345_678n;

    expect(calculateDurationMs(startedAt, endedAt)).toBe(12.35);
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
      path: "/health",
      route: "/health",
      statusCode: 200,
      durationMs: 10.25,
      cacheStatus: "HIT",
      userAgent: "vitest",
      remoteAddress: "127.0.0.1",
    });

    expect(JSON.stringify(payload)).not.toContain("secret-api-key");
    expect(JSON.stringify(payload)).not.toContain("secret-jwt-token");
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
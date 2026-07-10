import { describe, expect, it } from "vitest";
import Fastify from "fastify";
import { createHttpMetrics } from "../observability/metrics.js";
import {
  getReplyHeaderValue,
  getMetricsRouteLabel,
  registerMetricsMiddleware,
  UNMATCHED_ROUTE_LABEL,
} from "./metrics.middleware.js";

describe("metrics middleware", () => {
  it("should extract the bounded route template from route options", async () => {
    const app = Fastify({ logger: false });

    app.get("/items/:itemId", async (request) => {
      return {
        route: getMetricsRouteLabel(request),
      };
    });

    const response = await app.inject({
      method: "GET",
      url: "/items/item-123?debug=true",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      route: "/items/:itemId",
    });
  });

  it("should collapse unmatched request paths into one bounded route label", async () => {
    const app = Fastify({ logger: false });
    const metrics = createHttpMetrics();

    registerMetricsMiddleware(app, metrics);

    const firstResponse = await app.inject({
      method: "GET",
      url: "/missing/resources/123?debug=true",
    });

    const secondResponse = await app.inject({
      method: "GET",
      url: "/missing/resources/456",
    });

    expect(firstResponse.statusCode).toBe(404);
    expect(secondResponse.statusCode).toBe(404);

    const output = await metrics.getMetricsText();

    expect(output).toContain(
      `http_requests_total{method="GET",route="${UNMATCHED_ROUTE_LABEL}",status_code="404"} 2`,
    );
    expect(output).not.toContain("/missing/resources/123");
    expect(output).not.toContain("/missing/resources/456");
  });

  it("should read reply header values", async () => {
    const app = Fastify({ logger: false });

    app.get("/health", async (_request, reply) => {
      reply.header("x-cache", "HIT");

      return {
        cacheStatus: getReplyHeaderValue(reply, "x-cache"),
      };
    });

    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      cacheStatus: "HIT",
    });
  });

  it("should record request metrics after response", async () => {
    const app = Fastify({ logger: false });
    const metrics = createHttpMetrics();

    registerMetricsMiddleware(app, metrics);

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

    const output = await metrics.getMetricsText();

    expect(output).toContain(
      'http_requests_total{method="GET",route="/health",status_code="200"} 1',
    );
    expect(output).toContain(
      'http_request_duration_seconds_count{method="GET",route="/health",status_code="200"} 1',
    );
  });

  it("should record cache metrics when x-cache header exists", async () => {
    const app = Fastify({ logger: false });
    const metrics = createHttpMetrics();

    registerMetricsMiddleware(app, metrics);

    app.get("/api/products", async (_request, reply) => {
      reply.header("x-cache", "MISS");

      return {
        data: [],
      };
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/products",
    });

    expect(response.statusCode).toBe(200);

    const output = await metrics.getMetricsText();

    expect(output).toContain(
      'http_response_cache_total{route="/api/products",cache_status="MISS"} 1',
    );
  });
});
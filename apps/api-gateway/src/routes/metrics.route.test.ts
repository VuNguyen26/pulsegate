import { describe, expect, it } from "vitest";
import Fastify from "fastify";

import { createHttpMetrics } from "../observability/metrics.js";
import { metricsRoute } from "./metrics.route.js";

describe("metrics route", () => {
  it("should expose metrics in Prometheus text format", async () => {
    const app = Fastify({ logger: false });
    const metrics = createHttpMetrics();

    metrics.observeHttpRequest({
      method: "GET",
      route: "/health",
      statusCode: 200,
      durationMs: 25,
    });

    await app.register(metricsRoute, {
      metrics,
    });

    const response = await app.inject({
      method: "GET",
      url: "/metrics",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain(
      "text/plain; version=0.0.4",
    );
    expect(response.body).toContain("http_requests_total");
    expect(response.body).toContain(
      'http_requests_total{method="GET",route="/health",status_code="200"} 1',
    );
    expect(response.body).toContain("http_request_duration_seconds");
  });

  it("should expose cache metrics when cache metrics exist", async () => {
    const app = Fastify({ logger: false });
    const metrics = createHttpMetrics();

    metrics.observeResponseCache({
      route: "/api/products",
      cacheStatus: "HIT",
    });

    await app.register(metricsRoute, {
      metrics,
    });

    const response = await app.inject({
      method: "GET",
      url: "/metrics",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain("http_response_cache_total");
    expect(response.body).toContain(
      'http_response_cache_total{route="/api/products",cache_status="HIT"} 1',
    );
  });
});
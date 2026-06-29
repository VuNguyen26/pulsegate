import { describe, expect, it } from "vitest";
import { createHttpMetrics, normalizeCacheStatus } from "./metrics.js";

describe("http metrics", () => {
  it("should normalize supported cache statuses", () => {
    expect(normalizeCacheStatus("HIT")).toBe("HIT");
    expect(normalizeCacheStatus("miss")).toBe("MISS");
    expect(normalizeCacheStatus(" Bypass ")).toBe("BYPASS");
  });

  it("should ignore unsupported cache statuses", () => {
    expect(normalizeCacheStatus()).toBeUndefined();
    expect(normalizeCacheStatus("")).toBeUndefined();
    expect(normalizeCacheStatus("UNKNOWN")).toBeUndefined();
  });

  it("should record HTTP request metrics", async () => {
    const metrics = createHttpMetrics();

    metrics.observeHttpRequest({
      method: "GET",
      route: "/health",
      statusCode: 200,
      durationMs: 25,
    });

    const output = await metrics.getMetricsText();

    expect(output).toContain("http_requests_total");
    expect(output).toContain(
      'http_requests_total{method="GET",route="/health",status_code="200"} 1',
    );
    expect(output).toContain("http_request_duration_seconds");
    expect(output).toContain(
      'http_request_duration_seconds_count{method="GET",route="/health",status_code="200"} 1',
    );
    expect(output).toContain(
      'http_request_duration_seconds_sum{method="GET",route="/health",status_code="200"} 0.025',
    );
  });

  it("should record response cache metrics for supported cache statuses", async () => {
    const metrics = createHttpMetrics();

    metrics.observeResponseCache({
      route: "/api/products",
      cacheStatus: "HIT",
    });

    metrics.observeResponseCache({
      route: "/api/products",
      cacheStatus: "MISS",
    });

    metrics.observeResponseCache({
      route: "/api/products",
      cacheStatus: "UNKNOWN",
    });

    const output = await metrics.getMetricsText();

    expect(output).toContain("http_response_cache_total");
    expect(output).toContain(
      'http_response_cache_total{route="/api/products",cache_status="HIT"} 1',
    );
    expect(output).toContain(
      'http_response_cache_total{route="/api/products",cache_status="MISS"} 1',
    );
    expect(output).not.toContain("UNKNOWN");
  });
});
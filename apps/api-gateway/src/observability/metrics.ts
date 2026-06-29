import { Counter, Histogram, Registry } from "prom-client";

const HTTP_REQUEST_DURATION_BUCKETS_SECONDS = [
  0.005,
  0.01,
  0.025,
  0.05,
  0.1,
  0.25,
  0.5,
  1,
  2.5,
  5,
];

const ALLOWED_CACHE_STATUSES = new Set(["HIT", "MISS", "BYPASS"]);

type HttpRequestMetricLabels = "method" | "route" | "status_code";
type CacheMetricLabels = "route" | "cache_status";

export type ObserveHttpRequestParams = {
  method: string;
  route: string;
  statusCode: number;
  durationMs: number;
};

export type ObserveResponseCacheParams = {
  route: string;
  cacheStatus?: string;
};

export type HttpMetrics = {
  registry: Registry;
  contentType: string;
  observeHttpRequest: (params: ObserveHttpRequestParams) => void;
  observeResponseCache: (params: ObserveResponseCacheParams) => void;
  getMetricsText: () => Promise<string>;
};

export function normalizeCacheStatus(
  cacheStatus?: string,
): "HIT" | "MISS" | "BYPASS" | undefined {
  if (cacheStatus === undefined) {
    return undefined;
  }

  const normalized = cacheStatus.trim().toUpperCase();

  if (!ALLOWED_CACHE_STATUSES.has(normalized)) {
    return undefined;
  }

  return normalized as "HIT" | "MISS" | "BYPASS";
}

export function createHttpMetrics(): HttpMetrics {
  const registry = new Registry();

  const httpRequestsTotal = new Counter<HttpRequestMetricLabels>({
    name: "http_requests_total",
    help: "Total number of HTTP requests handled by the API Gateway.",
    labelNames: ["method", "route", "status_code"],
    registers: [registry],
  });

  const httpRequestDurationSeconds = new Histogram<HttpRequestMetricLabels>({
    name: "http_request_duration_seconds",
    help: "HTTP request duration in seconds for the API Gateway.",
    labelNames: ["method", "route", "status_code"],
    buckets: HTTP_REQUEST_DURATION_BUCKETS_SECONDS,
    registers: [registry],
  });

  const httpResponseCacheTotal = new Counter<CacheMetricLabels>({
    name: "http_response_cache_total",
    help: "Total number of cache outcomes for cacheable API Gateway responses.",
    labelNames: ["route", "cache_status"],
    registers: [registry],
  });

  return {
    registry,
    contentType: registry.contentType,

    observeHttpRequest(params) {
      const labels = {
        method: params.method,
        route: params.route,
        status_code: String(params.statusCode),
      };

      httpRequestsTotal.inc(labels);
      httpRequestDurationSeconds.observe(labels, params.durationMs / 1000);
    },

    observeResponseCache(params) {
      const cacheStatus = normalizeCacheStatus(params.cacheStatus);

      if (cacheStatus === undefined) {
        return;
      }

      httpResponseCacheTotal.inc({
        route: params.route,
        cache_status: cacheStatus,
      });
    },

    getMetricsText() {
      return registry.metrics();
    },
  };
}
import { describe, expect, it } from "vitest";
import {
  buildAnalyticsUsageRollupAggregates,
  getAnalyticsUsageRollupStatusClass,
} from "./analytics-usage-rollup-aggregate.js";

describe("analytics usage rollup aggregate", () => {
  it("should aggregate usage events into the same hourly dimension bucket", () => {
    const aggregates = buildAnalyticsUsageRollupAggregates(
      [
        {
          occurredAt: new Date("2026-07-05T10:15:00.000Z"),
          routePath: "/api/products",
          routeMethod: "GET",
          statusCode: 200,
          durationMs: 100,
          cacheStatus: "HIT",
          apiKeyAuthSource: "db",
          apiKeyId: "key-1",
          consumerId: "consumer-1",
        },
        {
          occurredAt: new Date("2026-07-05T10:45:00.000Z"),
          routePath: "/api/products",
          routeMethod: "GET",
          statusCode: 201,
          durationMs: 200,
          cacheStatus: "HIT",
          apiKeyAuthSource: "db",
          apiKeyId: "key-1",
          consumerId: "consumer-1",
        },
      ],
      "hour",
    );

    expect(aggregates).toHaveLength(1);
    expect(aggregates[0]).toMatchObject({
      granularity: "hour",
      consumerId: "consumer-1",
      apiKeyId: "key-1",
      routePath: "/api/products",
      routeMethod: "GET",
      statusClass: "2xx",
      cacheStatus: "HIT",
      apiKeyAuthSource: "db",
      totalRequests: 2,
      successfulRequests: 2,
      errorRequests: 0,
      totalDurationMs: 300,
      averageDurationMs: 150,
      cacheHits: 2,
      cacheMisses: 0,
      cacheBypasses: 0,
    });
    expect(aggregates[0].bucketStart.toISOString()).toBe(
      "2026-07-05T10:00:00.000Z",
    );
    expect(aggregates[0].bucketEnd.toISOString()).toBe(
      "2026-07-05T11:00:00.000Z",
    );
    expect(aggregates[0].lastRequestAt.toISOString()).toBe(
      "2026-07-05T10:45:00.000Z",
    );
  });

  it("should split aggregates by status class and cache status", () => {
    const aggregates = buildAnalyticsUsageRollupAggregates(
      [
        {
          occurredAt: new Date("2026-07-05T10:15:00.000Z"),
          routePath: "/api/products",
          routeMethod: "GET",
          statusCode: 200,
          durationMs: 100,
          cacheStatus: "HIT",
        },
        {
          occurredAt: new Date("2026-07-05T10:20:00.000Z"),
          routePath: "/api/products",
          routeMethod: "GET",
          statusCode: 500,
          durationMs: 300,
          cacheStatus: "BYPASS",
        },
      ],
      "hour",
    );

    expect(aggregates).toHaveLength(2);
    expect(aggregates.map((aggregate) => aggregate.statusClass)).toEqual([
      "2xx",
      "5xx",
    ]);
    expect(aggregates.map((aggregate) => aggregate.cacheStatus)).toEqual([
      "HIT",
      "BYPASS",
    ]);
    expect(aggregates[1]).toMatchObject({
      totalRequests: 1,
      successfulRequests: 0,
      errorRequests: 1,
      cacheBypasses: 1,
    });
  });

  it("should aggregate usage events into daily buckets", () => {
    const aggregates = buildAnalyticsUsageRollupAggregates(
      [
        {
          occurredAt: new Date("2026-07-05T23:30:00.000Z"),
          routePath: "/api/products",
          routeMethod: "GET",
          statusCode: 200,
          durationMs: 100,
          cacheStatus: "MISS",
        },
        {
          occurredAt: new Date("2026-07-06T00:15:00.000Z"),
          routePath: "/api/products",
          routeMethod: "GET",
          statusCode: 200,
          durationMs: 100,
          cacheStatus: "MISS",
        },
      ],
      "day",
    );

    expect(aggregates).toHaveLength(2);
    expect(aggregates.map((aggregate) => aggregate.bucketStart.toISOString())).toEqual([
      "2026-07-05T00:00:00.000Z",
      "2026-07-06T00:00:00.000Z",
    ]);
  });

  it("should preserve null dimensions when optional fields are missing", () => {
    const aggregates = buildAnalyticsUsageRollupAggregates(
      [
        {
          occurredAt: new Date("2026-07-05T10:15:00.000Z"),
          routePath: "/api/products",
          routeMethod: "GET",
          statusCode: 204,
          durationMs: 0,
        },
      ],
      "hour",
    );

    expect(aggregates[0]).toMatchObject({
      consumerId: null,
      apiKeyId: null,
      cacheStatus: null,
      apiKeyAuthSource: null,
      totalRequests: 1,
      successfulRequests: 1,
      errorRequests: 0,
      totalDurationMs: 0,
      averageDurationMs: 0,
    });
  });

  it("should map status codes to status classes", () => {
    expect(getAnalyticsUsageRollupStatusClass(100)).toBe("1xx");
    expect(getAnalyticsUsageRollupStatusClass(204)).toBe("2xx");
    expect(getAnalyticsUsageRollupStatusClass(302)).toBe("3xx");
    expect(getAnalyticsUsageRollupStatusClass(404)).toBe("4xx");
    expect(getAnalyticsUsageRollupStatusClass(500)).toBe("5xx");
  });

  it("should reject invalid usage event input", () => {
    expect(() =>
      buildAnalyticsUsageRollupAggregates(
        [
          {
            occurredAt: new Date("invalid-date"),
            routePath: "/api/products",
            routeMethod: "GET",
            statusCode: 200,
            durationMs: 100,
          },
        ],
        "hour",
      ),
    ).toThrow(RangeError);

    expect(() =>
      buildAnalyticsUsageRollupAggregates(
        [
          {
            occurredAt: new Date("2026-07-05T10:15:00.000Z"),
            routePath: "",
            routeMethod: "GET",
            statusCode: 200,
            durationMs: 100,
          },
        ],
        "hour",
      ),
    ).toThrow(RangeError);

    expect(() =>
      buildAnalyticsUsageRollupAggregates(
        [
          {
            occurredAt: new Date("2026-07-05T10:15:00.000Z"),
            routePath: "/api/products",
            routeMethod: "GET",
            statusCode: 99,
            durationMs: 100,
          },
        ],
        "hour",
      ),
    ).toThrow(RangeError);

    expect(() =>
      buildAnalyticsUsageRollupAggregates(
        [
          {
            occurredAt: new Date("2026-07-05T10:15:00.000Z"),
            routePath: "/api/products",
            routeMethod: "GET",
            statusCode: 200,
            durationMs: -1,
          },
        ],
        "hour",
      ),
    ).toThrow(RangeError);
  });
});

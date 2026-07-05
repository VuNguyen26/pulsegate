import { describe, expect, it } from "vitest";
import { buildAnalyticsRejectedRollupAggregates } from "./analytics-rejected-rollup-aggregate.js";

describe("analytics rejected rollup aggregate", () => {
  it("should aggregate rejected events into the same hourly dimension bucket", () => {
    const aggregates = buildAnalyticsRejectedRollupAggregates(
      [
        {
          occurredAt: new Date("2026-07-05T10:15:00.000Z"),
          routePath: "/api/products",
          routeMethod: "GET",
          statusCode: 401,
          rejectionReason: "JWT_TOKEN_MISSING",
          apiKeyAuthSource: "env",
          apiKeyId: "key-1",
          consumerId: "consumer-1",
        },
        {
          occurredAt: new Date("2026-07-05T10:45:00.000Z"),
          routePath: "/api/products",
          routeMethod: "GET",
          statusCode: 401,
          rejectionReason: "JWT_TOKEN_MISSING",
          apiKeyAuthSource: "env",
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
      rejectionReason: "JWT_TOKEN_MISSING",
      statusCode: 401,
      apiKeyAuthSource: "env",
      totalRejectedRequests: 2,
    });
    expect(aggregates[0].bucketStart.toISOString()).toBe(
      "2026-07-05T10:00:00.000Z",
    );
    expect(aggregates[0].bucketEnd.toISOString()).toBe(
      "2026-07-05T11:00:00.000Z",
    );
    expect(aggregates[0].lastRejectedAt.toISOString()).toBe(
      "2026-07-05T10:45:00.000Z",
    );
  });

  it("should split aggregates by rejection reason and status code", () => {
    const aggregates = buildAnalyticsRejectedRollupAggregates(
      [
        {
          occurredAt: new Date("2026-07-05T10:15:00.000Z"),
          routePath: "/api/products",
          routeMethod: "GET",
          statusCode: 401,
          rejectionReason: "API_KEY_MISSING",
        },
        {
          occurredAt: new Date("2026-07-05T10:20:00.000Z"),
          routePath: "/api/products",
          routeMethod: "GET",
          statusCode: 403,
          rejectionReason: "API_KEY_INVALID",
        },
      ],
      "hour",
    );

    expect(aggregates).toHaveLength(2);
    expect(aggregates.map((aggregate) => aggregate.rejectionReason)).toEqual([
      "API_KEY_INVALID",
      "API_KEY_MISSING",
    ]);
    expect(aggregates.map((aggregate) => aggregate.statusCode)).toEqual([
      403,
      401,
    ]);
  });

  it("should aggregate rejected events into daily buckets", () => {
    const aggregates = buildAnalyticsRejectedRollupAggregates(
      [
        {
          occurredAt: new Date("2026-07-05T23:30:00.000Z"),
          routePath: "/api/products",
          routeMethod: "GET",
          statusCode: 429,
          rejectionReason: "RATE_LIMIT_EXCEEDED",
        },
        {
          occurredAt: new Date("2026-07-06T00:15:00.000Z"),
          routePath: "/api/products",
          routeMethod: "GET",
          statusCode: 429,
          rejectionReason: "RATE_LIMIT_EXCEEDED",
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
    const aggregates = buildAnalyticsRejectedRollupAggregates(
      [
        {
          occurredAt: new Date("2026-07-05T10:15:00.000Z"),
          statusCode: 401,
          rejectionReason: "API_KEY_MISSING",
        },
      ],
      "hour",
    );

    expect(aggregates[0]).toMatchObject({
      consumerId: null,
      apiKeyId: null,
      routePath: null,
      routeMethod: null,
      apiKeyAuthSource: null,
      totalRejectedRequests: 1,
    });
  });

  it("should split aggregates by route dimensions", () => {
    const aggregates = buildAnalyticsRejectedRollupAggregates(
      [
        {
          occurredAt: new Date("2026-07-05T10:15:00.000Z"),
          routePath: "/api/products",
          routeMethod: "GET",
          statusCode: 401,
          rejectionReason: "JWT_TOKEN_MISSING",
        },
        {
          occurredAt: new Date("2026-07-05T10:20:00.000Z"),
          routePath: "/api/orders",
          routeMethod: "POST",
          statusCode: 401,
          rejectionReason: "JWT_TOKEN_MISSING",
        },
      ],
      "hour",
    );

    expect(aggregates).toHaveLength(2);
    expect(aggregates.map((aggregate) => aggregate.routePath)).toEqual([
      "/api/products",
      "/api/orders",
    ]);
  });

  it("should reject invalid rejected event input", () => {
    expect(() =>
      buildAnalyticsRejectedRollupAggregates(
        [
          {
            occurredAt: new Date("invalid-date"),
            statusCode: 401,
            rejectionReason: "API_KEY_MISSING",
          },
        ],
        "hour",
      ),
    ).toThrow(RangeError);

    expect(() =>
      buildAnalyticsRejectedRollupAggregates(
        [
          {
            occurredAt: new Date("2026-07-05T10:15:00.000Z"),
            routePath: "",
            statusCode: 401,
            rejectionReason: "API_KEY_MISSING",
          },
        ],
        "hour",
      ),
    ).toThrow(RangeError);

    expect(() =>
      buildAnalyticsRejectedRollupAggregates(
        [
          {
            occurredAt: new Date("2026-07-05T10:15:00.000Z"),
            statusCode: 99,
            rejectionReason: "API_KEY_MISSING",
          },
        ],
        "hour",
      ),
    ).toThrow(RangeError);
  });
});

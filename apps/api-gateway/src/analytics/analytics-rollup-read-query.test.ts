import { describe, expect, it } from "vitest";
import {
  createAnalyticsRollupReadQuery,
  DEFAULT_ANALYTICS_ROLLUP_READ_LIMIT,
  DEFAULT_ANALYTICS_ROLLUP_READ_MAX_BUCKETS,
  MAX_ANALYTICS_ROLLUP_READ_LIMIT,
} from "./analytics-rollup-read-query.js";

describe("analytics rollup read query", () => {
  it("should create a usage rollup read query with normalized filters", () => {
    const query = createAnalyticsRollupReadQuery({
      from: "2026-07-05T10:15:00.000Z",
      to: "2026-07-05T13:00:00.000Z",
      granularity: "hour",
      source: "usage",
      routePath: "/api/products",
      routeMethod: "get",
      statusCode: "200",
      cacheStatus: "HIT",
      apiKeyAuthSource: "db",
      apiKeyId: "api-key-1",
      consumerId: "consumer-1",
      limit: "50",
    });

    expect(query.source).toBe("usage");
    expect(query.granularity).toBe("hour");
    expect(query.limit).toBe(50);
    expect(query.windowPlan.requestedFrom.toISOString()).toBe(
      "2026-07-05T10:15:00.000Z",
    );
    expect(query.windowPlan.requestedTo.toISOString()).toBe(
      "2026-07-05T13:00:00.000Z",
    );
    expect(query.windowPlan.rebuildFrom?.toISOString()).toBe(
      "2026-07-05T10:00:00.000Z",
    );
    expect(query.windowPlan.rebuildTo?.toISOString()).toBe(
      "2026-07-05T13:00:00.000Z",
    );
    expect(query.windowPlan.bucketCount).toBe(3);
    expect(query.filters).toEqual({
      routePath: "/api/products",
      routeMethod: "GET",
      statusCode: 200,
      cacheStatus: "HIT",
      apiKeyAuthSource: "db",
      apiKeyId: "api-key-1",
      consumerId: "consumer-1",
    });
  });

  it("should create a rejected rollup read query with rejected filters", () => {
    const query = createAnalyticsRollupReadQuery({
      from: "2026-07-05T00:00:00.000Z",
      to: "2026-07-07T03:30:00.000Z",
      granularity: "day",
      source: "rejected",
      routePath: "/api/orders",
      routeMethod: "post",
      statusCode: 401,
      rejectionReason: "API_KEY_MISSING",
      apiKeyAuthSource: "missing",
      limit: 25,
      maxBuckets: 3,
    });

    expect(query.source).toBe("rejected");
    expect(query.granularity).toBe("day");
    expect(query.limit).toBe(25);
    expect(query.windowPlan.rebuildFrom?.toISOString()).toBe(
      "2026-07-05T00:00:00.000Z",
    );
    expect(query.windowPlan.rebuildTo?.toISOString()).toBe(
      "2026-07-08T00:00:00.000Z",
    );
    expect(query.windowPlan.bucketCount).toBe(3);
    expect(query.filters).toEqual({
      routePath: "/api/orders",
      routeMethod: "POST",
      statusCode: 401,
      rejectionReason: "API_KEY_MISSING",
      apiKeyAuthSource: "missing",
    });
  });

  it("should apply default guardrails", () => {
    const query = createAnalyticsRollupReadQuery({
      from: "2026-07-05T10:15:00.000Z",
      to: "2026-07-05T13:00:00.000Z",
      granularity: "hour",
      source: "usage",
    });

    expect(DEFAULT_ANALYTICS_ROLLUP_READ_MAX_BUCKETS).toBe(744);
    expect(DEFAULT_ANALYTICS_ROLLUP_READ_LIMIT).toBe(100);
    expect(MAX_ANALYTICS_ROLLUP_READ_LIMIT).toBe(1_000);
    expect(query.limit).toBe(DEFAULT_ANALYTICS_ROLLUP_READ_LIMIT);
    expect(query.filters).toEqual({});
  });

  it("should reject invalid date strings", () => {
    expect(() =>
      createAnalyticsRollupReadQuery({
        from: "invalid-date",
        to: "2026-07-05T13:00:00.000Z",
        granularity: "hour",
        source: "usage",
      }),
    ).toThrow(RangeError);

    expect(() =>
      createAnalyticsRollupReadQuery({
        from: "2026-07-05T10:15:00.000Z",
        to: "",
        granularity: "hour",
        source: "usage",
      }),
    ).toThrow(RangeError);
  });

  it("should reject non-forward time ranges", () => {
    expect(() =>
      createAnalyticsRollupReadQuery({
        from: "2026-07-06T00:00:00.000Z",
        to: "2026-07-05T00:00:00.000Z",
        granularity: "day",
        source: "usage",
      }),
    ).toThrow(RangeError);

    expect(() =>
      createAnalyticsRollupReadQuery({
        from: "2026-07-05T00:00:00.000Z",
        to: "2026-07-05T00:00:00.000Z",
        granularity: "day",
        source: "usage",
      }),
    ).toThrow(RangeError);
  });

  it("should reject invalid source and granularity", () => {
    expect(() =>
      createAnalyticsRollupReadQuery({
        from: "2026-07-05T10:15:00.000Z",
        to: "2026-07-05T13:00:00.000Z",
        granularity: "minute",
        source: "usage",
      }),
    ).toThrow(RangeError);

    expect(() =>
      createAnalyticsRollupReadQuery({
        from: "2026-07-05T10:15:00.000Z",
        to: "2026-07-05T13:00:00.000Z",
        granularity: "hour",
        source: "both",
      }),
    ).toThrow(RangeError);
  });

  it("should reject source-specific filters on the wrong rollup source", () => {
    expect(() =>
      createAnalyticsRollupReadQuery({
        from: "2026-07-05T10:15:00.000Z",
        to: "2026-07-05T13:00:00.000Z",
        granularity: "hour",
        source: "usage",
        rejectionReason: "API_KEY_MISSING",
      }),
    ).toThrow(RangeError);

    expect(() =>
      createAnalyticsRollupReadQuery({
        from: "2026-07-05T10:15:00.000Z",
        to: "2026-07-05T13:00:00.000Z",
        granularity: "hour",
        source: "rejected",
        cacheStatus: "HIT",
      }),
    ).toThrow(RangeError);
  });

  it("should reject invalid limit values", () => {
    for (const limit of ["", "0", "10.5", "abc", 0, 1_001]) {
      expect(() =>
        createAnalyticsRollupReadQuery({
          from: "2026-07-05T10:15:00.000Z",
          to: "2026-07-05T13:00:00.000Z",
          granularity: "hour",
          source: "usage",
          limit,
        }),
      ).toThrow(RangeError);
    }
  });

  it("should reject invalid status code values", () => {
    for (const statusCode of ["abc", "99", "600", 99, 600]) {
      expect(() =>
        createAnalyticsRollupReadQuery({
          from: "2026-07-05T10:15:00.000Z",
          to: "2026-07-05T13:00:00.000Z",
          granularity: "hour",
          source: "usage",
          statusCode,
        }),
      ).toThrow(RangeError);
    }
  });

  it("should reject empty optional text filters", () => {
    expect(() =>
      createAnalyticsRollupReadQuery({
        from: "2026-07-05T10:15:00.000Z",
        to: "2026-07-05T13:00:00.000Z",
        granularity: "hour",
        source: "usage",
        routePath: "   ",
      }),
    ).toThrow(RangeError);
  });

  it("should pass custom maxBuckets to the window planner", () => {
    expect(() =>
      createAnalyticsRollupReadQuery({
        from: "2026-07-05T10:15:00.000Z",
        to: "2026-07-05T13:00:00.000Z",
        granularity: "hour",
        source: "usage",
        maxBuckets: 2,
      }),
    ).toThrow(RangeError);
  });
});

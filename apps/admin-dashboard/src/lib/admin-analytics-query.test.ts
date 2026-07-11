import { describe, expect, it } from "vitest";

import {
  DASHBOARD_ANALYTICS_DEFAULT_LIMIT,
  parseDashboardAnalyticsSearchParams,
  serializeDashboardAnalyticsQuery,
} from "./admin-analytics-query";

describe("parseDashboardAnalyticsSearchParams", () => {
  it("applies bounded default pagination for usage events", () => {
    const result =
      parseDashboardAnalyticsSearchParams(
        "usage-events",
        new URLSearchParams(),
      );

    expect(result).toEqual({
      ok: true,
      value: {
        limit: DASHBOARD_ANALYTICS_DEFAULT_LIMIT,
      },
    });
  });

  it("normalizes supported usage event filters", () => {
    const result =
      parseDashboardAnalyticsSearchParams(
        "usage-events",
        new URLSearchParams({
          from: "2026-07-01T00:00:00Z",
          to: "2026-07-11T00:00:00Z",
          routePath: "/api/products/:id",
          routeMethod: "get",
          statusCode: "200",
          cacheStatus: "hit",
          consumerId: "consumer_1",
          apiKeyId: "api-key-1",
          limit: "50",
          cursor: "eyJpZCI6ImV2ZW50XzEifQ",
        }),
      );

    expect(result).toEqual({
      ok: true,
      value: {
        from: "2026-07-01T00:00:00.000Z",
        to: "2026-07-11T00:00:00.000Z",
        routePath: "/api/products/:id",
        routeMethod: "GET",
        statusCode: 200,
        cacheStatus: "HIT",
        consumerId: "consumer_1",
        apiKeyId: "api-key-1",
        limit: 50,
        cursor: "eyJpZCI6ImV2ZW50XzEifQ",
      },
    });
  });

  it("normalizes rejected event filters", () => {
    const result =
      parseDashboardAnalyticsSearchParams(
        "rejected-events",
        new URLSearchParams({
          rejectionReason: "quota_exceeded",
          routeMethod: "post",
        }),
      );

    expect(result).toEqual({
      ok: true,
      value: {
        routeMethod: "POST",
        rejectionReason: "QUOTA_EXCEEDED",
        limit: 20,
      },
    });
  });

  it("rejects unknown and explicitly unsupported query keys", () => {
    const unknown =
      parseDashboardAnalyticsSearchParams(
        "usage-events",
        new URLSearchParams({
          arbitraryPath: "/internal/admin/routes",
        }),
      );
    const offset =
      parseDashboardAnalyticsSearchParams(
        "usage-events",
        new URLSearchParams({
          offset: "20",
        }),
      );

    expect(unknown).toMatchObject({
      ok: false,
      error: {
        field: "arbitraryPath",
      },
    });
    expect(offset).toMatchObject({
      ok: false,
      error: {
        field: "offset",
      },
    });
  });

  it("rejects duplicate parameters", () => {
    const params = new URLSearchParams();
    params.append("consumerId", "consumer_1");
    params.append("consumerId", "consumer_2");

    const result =
      parseDashboardAnalyticsSearchParams(
        "usage-events",
        params,
      );

    expect(result).toMatchObject({
      ok: false,
      error: {
        field: "consumerId",
      },
    });
  });

  it("rejects date ranges over 31 days", () => {
    const result =
      parseDashboardAnalyticsSearchParams(
        "rejected-summary",
        new URLSearchParams({
          from: "2026-01-01T00:00:00Z",
          to: "2026-02-02T00:00:00Z",
        }),
      );

    expect(result).toMatchObject({
      ok: false,
      error: {
        field: "to",
      },
    });
  });

  it("rejects cursor and pagination on summary queries", () => {
    const result =
      parseDashboardAnalyticsSearchParams(
        "rejected-summary",
        new URLSearchParams({
          cursor: "opaque-cursor",
        }),
      );

    expect(result).toMatchObject({
      ok: false,
      error: {
        field: "cursor",
      },
    });
  });

  it("rejects unsafe paths, identifiers, and cursors", () => {
    const unsafePath =
      parseDashboardAnalyticsSearchParams(
        "usage-events",
        new URLSearchParams({
          routePath: "https://example.com/admin",
        }),
      );
    const unsafeIdentifier =
      parseDashboardAnalyticsSearchParams(
        "usage-events",
        new URLSearchParams({
          consumerId: "../consumer",
        }),
      );
    const unsafeCursor =
      parseDashboardAnalyticsSearchParams(
        "usage-events",

        new URLSearchParams({
          cursor: "not valid base64url!",
        }),
      );

    expect(unsafePath).toMatchObject({
      ok: false,
      error: {
        field: "routePath",
      },
    });
    expect(unsafeIdentifier).toMatchObject({
      ok: false,
      error: {
        field: "consumerId",
      },
    });
    expect(unsafeCursor).toMatchObject({
      ok: false,
      error: {
        field: "cursor",
      },
    });
  });
});

describe("serializeDashboardAnalyticsQuery", () => {
  it("serializes normalized parameters in a stable order", () => {
    const result = serializeDashboardAnalyticsQuery(
      "usage-events",
      {
        routeMethod: "GET",
        consumerId: "consumer_1",
        limit: 25,
      },
    );

    expect(result).toEqual({
      ok: true,
      value:
        "routeMethod=GET&consumerId=consumer_1&limit=25",
      query: {
        routeMethod: "GET",
        consumerId: "consumer_1",
        limit: 25,
      },
    });
  });

  it("adds the bounded default event limit", () => {
    const result = serializeDashboardAnalyticsQuery(
      "rejected-events",
      {},
    );

    expect(result).toEqual({
      ok: true,
      value: "limit=20",
      query: {
        limit: 20,
      },
    });
  });
});

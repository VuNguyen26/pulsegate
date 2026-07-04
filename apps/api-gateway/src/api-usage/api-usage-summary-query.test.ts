import { describe, expect, it } from "vitest";

import { parseApiUsageSummaryQuery } from "./api-usage-summary-query.js";

describe("parseApiUsageSummaryQuery", () => {
  it("should parse empty filters", () => {
    expect(parseApiUsageSummaryQuery({})).toEqual({
      ok: true,
      value: {
        filters: {},
      },
    });
  });

  it("should parse and normalize all supported filters", () => {
    const result = parseApiUsageSummaryQuery({
      from: "2026-07-04T00:00:00.000Z",
      to: "2026-07-05T00:00:00.000Z",
      routePath: " /api/products ",
      routeMethod: "get",
      statusCode: "200",
      cacheStatus: "hit",
      apiKeyAuthSource: " database ",
    });

    expect(result).toEqual({
      ok: true,
      value: {
        filters: {
          from: new Date("2026-07-04T00:00:00.000Z"),
          to: new Date("2026-07-05T00:00:00.000Z"),
          routePath: "/api/products",
          routeMethod: "GET",
          statusCode: 200,
          cacheStatus: "HIT",
          apiKeyAuthSource: "database",
        },
      },
    });
  });

  it("should omit blank string filters", () => {
    expect(
      parseApiUsageSummaryQuery({
        routePath: "   ",
        apiKeyAuthSource: "   ",
      }),
    ).toEqual({
      ok: true,
      value: {
        filters: {},
      },
    });
  });

  it("should reject an invalid status code", () => {
    expect(
      parseApiUsageSummaryQuery({
        statusCode: "99",
      }),
    ).toEqual({
      ok: false,
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: "statusCode must be an integer between 100 and 599",
      },
    });
  });

  it("should reject a non-integer status code", () => {
    expect(
      parseApiUsageSummaryQuery({
        statusCode: "200.5",
      }),
    ).toEqual({
      ok: false,
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: "statusCode must be an integer between 100 and 599",
      },
    });
  });

  it("should reject an invalid date", () => {
    expect(
      parseApiUsageSummaryQuery({
        from: "not-a-date",
      }),
    ).toEqual({
      ok: false,
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: "from must be a valid ISO date-time string",
      },
    });
  });

  it("should reject a time range where from is later than to", () => {
    expect(
      parseApiUsageSummaryQuery({
        from: "2026-07-05T00:00:00.000Z",
        to: "2026-07-04T00:00:00.000Z",
      }),
    ).toEqual({
      ok: false,
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: "from must be earlier than or equal to to",
      },
    });
  });

  it("should reject an unsupported route method", () => {
    expect(
      parseApiUsageSummaryQuery({
        routeMethod: "OPTIONS",
      }),
    ).toEqual({
      ok: false,
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: "routeMethod must be one of: GET, POST, PUT, PATCH, DELETE",
      },
    });
  });

  it("should reject an unsupported cache status", () => {
    expect(
      parseApiUsageSummaryQuery({
        cacheStatus: "STALE",
      }),
    ).toEqual({
      ok: false,
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: "cacheStatus must be one of: HIT, MISS, BYPASS",
      },
    });
  });
});

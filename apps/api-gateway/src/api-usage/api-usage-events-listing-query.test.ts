import { describe, expect, it } from "vitest";

import { parseApiUsageEventsListingQuery } from "./api-usage-events-listing-query.js";

describe("parseApiUsageEventsListingQuery", () => {
  it("should parse default pagination with empty filters", () => {
    expect(parseApiUsageEventsListingQuery({})).toEqual({
      ok: true,
      value: {
        limit: 20,
        offset: 0,
        filters: {},
      },
    });
  });

  it("should allow the maximum listing limit", () => {
    expect(
      parseApiUsageEventsListingQuery({
        limit: "100",
      }),
    ).toEqual({
      ok: true,
      value: {
        limit: 100,
        offset: 0,
        filters: {},
      },
    });
  });

  it("should parse and normalize all supported filters", () => {
    const result = parseApiUsageEventsListingQuery({
      limit: "50",
      offset: "10",
      from: "2026-07-04T00:00:00.000Z",
      to: "2026-07-05T00:00:00.000Z",
      routePath: " /api/products ",
      routeMethod: "get",
      statusCode: "200",
      cacheStatus: "hit",
      apiKeyAuthSource: " database ",
      apiKeyId: " api_key_1 ",
      consumerId: " consumer_1 ",
    });

    expect(result).toEqual({
      ok: true,
      value: {
        limit: 50,
        offset: 10,
        filters: {
          from: new Date("2026-07-04T00:00:00.000Z"),
          to: new Date("2026-07-05T00:00:00.000Z"),
          routePath: "/api/products",
          routeMethod: "GET",
          statusCode: 200,
          cacheStatus: "HIT",
          apiKeyAuthSource: "database",
          apiKeyId: "api_key_1",
          consumerId: "consumer_1",
        },
      },
    });
  });

  it("should omit blank string filters", () => {
    expect(
      parseApiUsageEventsListingQuery({
        routePath: "   ",
        apiKeyAuthSource: "   ",
        apiKeyId: "   ",
        consumerId: "   ",
      }),
    ).toEqual({
      ok: true,
      value: {
        limit: 20,
        offset: 0,
        filters: {},
      },
    });
  });

  it("should reject a limit above the maximum", () => {
    expect(
      parseApiUsageEventsListingQuery({
        limit: "101",
      }),
    ).toEqual({
      ok: false,
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: "limit must be an integer between 1 and 100",
      },
    });
  });

  it("should reject a negative offset", () => {
    expect(
      parseApiUsageEventsListingQuery({
        offset: "-1",
      }),
    ).toEqual({
      ok: false,
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: `offset must be an integer between 0 and ${Number.MAX_SAFE_INTEGER}`,
      },
    });
  });

  it("should reject an invalid status code", () => {
    expect(
      parseApiUsageEventsListingQuery({
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
      parseApiUsageEventsListingQuery({
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
      parseApiUsageEventsListingQuery({
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
      parseApiUsageEventsListingQuery({
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
      parseApiUsageEventsListingQuery({
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
      parseApiUsageEventsListingQuery({
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

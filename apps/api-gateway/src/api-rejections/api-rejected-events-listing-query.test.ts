import { Buffer } from "node:buffer";

import { describe, expect, it } from "vitest";

import { parseRejectedEventsListingQuery } from "./api-rejected-events-listing-query.js";

function encodeCursor(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

describe("parseRejectedEventsListingQuery", () => {
  it("should parse default pagination with empty filters", () => {
    expect(parseRejectedEventsListingQuery({})).toEqual({
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
      parseRejectedEventsListingQuery({
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

  it("should parse a valid cursor", () => {
    const cursor = encodeCursor({
      occurredAt: "2026-07-05T00:00:00.000Z",
      id: " rejected_event_1 ",
    });

    expect(
      parseRejectedEventsListingQuery({
        limit: "25",
        cursor,
      }),
    ).toEqual({
      ok: true,
      value: {
        limit: 25,
        offset: 0,
        cursor: {
          occurredAt: new Date("2026-07-05T00:00:00.000Z"),
          id: "rejected_event_1",
        },
        filters: {},
      },
    });
  });

  it("should parse and normalize all supported filters", () => {
    const result = parseRejectedEventsListingQuery({
      limit: "50",
      offset: "10",
      from: "2026-07-04T00:00:00.000Z",
      to: "2026-07-05T00:00:00.000Z",
      rejectionReason: "quota_exceeded",
      statusCode: "429",
      routePath: " /api/products ",
      routeMethod: "get",
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
          rejectionReason: "QUOTA_EXCEEDED",
          statusCode: 429,
          routePath: "/api/products",
          routeMethod: "GET",
          apiKeyAuthSource: "database",
          apiKeyId: "api_key_1",
          consumerId: "consumer_1",
        },
      },
    });
  });

  it("should reject a limit above the maximum", () => {
    expect(
      parseRejectedEventsListingQuery({
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

  it("should reject offset when cursor is provided", () => {
    expect(
      parseRejectedEventsListingQuery({
        cursor: encodeCursor({
          occurredAt: "2026-07-05T00:00:00.000Z",
          id: "rejected_event_1",
        }),
        offset: "10",
      }),
    ).toEqual({
      ok: false,
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: "offset cannot be used with cursor",
      },
    });
  });

  it("should reject cursor when cursor is not allowed", () => {
    expect(
      parseRejectedEventsListingQuery(
        {
          cursor: encodeCursor({
            occurredAt: "2026-07-05T00:00:00.000Z",
            id: "rejected_event_1",
          }),
        },
        {
          allowCursor: false,
        },
      ),
    ).toEqual({
      ok: false,
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: "cursor is only supported for rejected events listing",
      },
    });
  });

  it("should reject an invalid cursor payload", () => {
    expect(
      parseRejectedEventsListingQuery({
        cursor: "not-a-valid-cursor",
      }),
    ).toEqual({
      ok: false,
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: "cursor must be a valid base64url encoded JSON object",
      },
    });
  });

  it("should reject a cursor with invalid occurredAt", () => {
    expect(
      parseRejectedEventsListingQuery({
        cursor: encodeCursor({
          occurredAt: "not-a-date",
          id: "rejected_event_1",
        }),
      }),
    ).toEqual({
      ok: false,
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: "cursor.occurredAt must be a valid ISO date-time string",
      },
    });
  });

  it("should reject a cursor with blank id", () => {
    expect(
      parseRejectedEventsListingQuery({
        cursor: encodeCursor({
          occurredAt: "2026-07-05T00:00:00.000Z",
          id: "   ",
        }),
      }),
    ).toEqual({
      ok: false,
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: "cursor.id must be a non-empty string",
      },
    });
  });

  it("should reject an invalid status code", () => {
    expect(
      parseRejectedEventsListingQuery({
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

  it("should reject an invalid date", () => {
    expect(
      parseRejectedEventsListingQuery({
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
      parseRejectedEventsListingQuery({
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

  it("should reject an unsupported rejection reason", () => {
    expect(
      parseRejectedEventsListingQuery({
        rejectionReason: "UNKNOWN_REASON",
      }),
    ).toEqual({
      ok: false,
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message:
          "rejectionReason must be one of: API_KEY_MISSING, API_KEY_INVALID, JWT_TOKEN_MISSING, JWT_TOKEN_INVALID, RATE_LIMIT_EXCEEDED, QUOTA_EXCEEDED",
      },
    });
  });

  it("should reject an unsupported route method", () => {
    expect(
      parseRejectedEventsListingQuery({
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
});

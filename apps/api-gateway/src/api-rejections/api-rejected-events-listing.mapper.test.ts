import { Buffer } from "node:buffer";

import { describe, expect, it } from "vitest";

import { mapApiRejectedEventsListingReadModelToResponse } from "./api-rejected-events-listing.mapper.js";
import type { ApiRejectedEventsListingReadModel } from "./api-rejected-events-listing.types.js";

function encodeCursor(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

describe("mapApiRejectedEventsListingReadModelToResponse", () => {
  it("should map rejected events listing read model to response", () => {
    const listing: ApiRejectedEventsListingReadModel = {
      items: [
        {
          id: "rejected_event_1",
          requestId: "request_1",
          routePath: "/api/products",
          routeMethod: "GET",
          statusCode: 429,
          rejectionReason: "QUOTA_EXCEEDED",
          apiKeyAuthSource: "database",
          apiKeyId: "api_key_1",
          consumerId: "consumer_1",
          metadata: {
            quotaLimit: 1,
            quotaWindow: "DAILY",
          },
          occurredAt: new Date("2026-07-04T11:00:00.000Z"),
        },
      ],
      pagination: {
        limit: 10,
        offset: 20,
        total: 31,
        hasNextPage: true,
      },
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
    };

    expect(mapApiRejectedEventsListingReadModelToResponse(listing)).toEqual({
      items: [
        {
          id: "rejected_event_1",
          requestId: "request_1",
          routePath: "/api/products",
          routeMethod: "GET",
          statusCode: 429,
          rejectionReason: "QUOTA_EXCEEDED",
          apiKeyAuthSource: "database",
          apiKeyId: "api_key_1",
          consumerId: "consumer_1",
          metadata: {
            quotaLimit: 1,
            quotaWindow: "DAILY",
          },
          occurredAt: "2026-07-04T11:00:00.000Z",
        },
      ],
      pagination: {
        limit: 10,
        offset: 20,
        total: 31,
        hasNextPage: true,
        nextCursor: encodeCursor({
          occurredAt: "2026-07-04T11:00:00.000Z",
          id: "rejected_event_1",
        }),
      },
      filters: {
        from: "2026-07-04T00:00:00.000Z",
        to: "2026-07-05T00:00:00.000Z",
        rejectionReason: "QUOTA_EXCEEDED",
        statusCode: 429,
        routePath: "/api/products",
        routeMethod: "GET",
        apiKeyAuthSource: "database",
        apiKeyId: "api_key_1",
        consumerId: "consumer_1",
      },
    });
  });

  it("should map empty filters to null response filter values", () => {
    const listing: ApiRejectedEventsListingReadModel = {
      items: [
        {
          id: "rejected_event_1",
          requestId: "request_1",
          routePath: null,
          routeMethod: null,
          statusCode: 401,
          rejectionReason: "API_KEY_MISSING",
          apiKeyAuthSource: null,
          apiKeyId: null,
          consumerId: null,
          metadata: null,
          occurredAt: new Date("2026-07-04T10:00:00.000Z"),
        },
      ],
      pagination: {
        limit: 20,
        offset: 0,
        total: 1,
        hasNextPage: false,
      },
      filters: {},
    };

    expect(mapApiRejectedEventsListingReadModelToResponse(listing)).toEqual({
      items: [
        {
          id: "rejected_event_1",
          requestId: "request_1",
          routePath: null,
          routeMethod: null,
          statusCode: 401,
          rejectionReason: "API_KEY_MISSING",
          apiKeyAuthSource: null,
          apiKeyId: null,
          consumerId: null,
          metadata: null,
          occurredAt: "2026-07-04T10:00:00.000Z",
        },
      ],
      pagination: {
        limit: 20,
        offset: 0,
        total: 1,
        hasNextPage: false,
        nextCursor: null,
      },
      filters: {
        from: null,
        to: null,
        rejectionReason: null,
        statusCode: null,
        routePath: null,
        routeMethod: null,
        apiKeyAuthSource: null,
        apiKeyId: null,
        consumerId: null,
      },
    });
  });

  it("should return null nextCursor when the page is empty", () => {
    const listing: ApiRejectedEventsListingReadModel = {
      items: [],
      pagination: {
        limit: 20,
        offset: 0,
        total: 1,
        hasNextPage: true,
      },
      filters: {},
    };

    expect(
      mapApiRejectedEventsListingReadModelToResponse(listing).pagination
        .nextCursor,
    ).toBeNull();
  });
});

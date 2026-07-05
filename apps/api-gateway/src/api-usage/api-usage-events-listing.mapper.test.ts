import { Buffer } from "node:buffer";

import { describe, expect, it } from "vitest";

import { mapApiUsageEventsListingReadModelToResponse } from "./api-usage-events-listing.mapper.js";
import type { ApiUsageEventsListingReadModel } from "./api-usage-events-listing.types.js";

function encodeCursor(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

describe("mapApiUsageEventsListingReadModelToResponse", () => {
  it("should map usage events listing read model to response", () => {
    const listing: ApiUsageEventsListingReadModel = {
      items: [
        {
          id: "usage_event_1",
          requestId: "request_1",
          routePath: "/api/products",
          routeMethod: "GET",
          statusCode: 200,
          durationMs: 42,
          cacheStatus: "HIT",
          apiKeyAuthSource: "database",
          apiKeyId: "api_key_1",
          consumerId: "consumer_1",
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
        routePath: "/api/products",
        routeMethod: "GET",
        statusCode: 200,
        cacheStatus: "HIT",
        apiKeyAuthSource: "database",
        apiKeyId: "api_key_1",
        consumerId: "consumer_1",
      },
    };

    expect(mapApiUsageEventsListingReadModelToResponse(listing)).toEqual({
      items: [
        {
          id: "usage_event_1",
          requestId: "request_1",
          routePath: "/api/products",
          routeMethod: "GET",
          statusCode: 200,
          durationMs: 42,
          cacheStatus: "HIT",
          apiKeyAuthSource: "database",
          apiKeyId: "api_key_1",
          consumerId: "consumer_1",
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
          id: "usage_event_1",
        }),
      },
      filters: {
        from: "2026-07-04T00:00:00.000Z",
        to: "2026-07-05T00:00:00.000Z",
        routePath: "/api/products",
        routeMethod: "GET",
        statusCode: 200,
        cacheStatus: "HIT",
        apiKeyAuthSource: "database",
        apiKeyId: "api_key_1",
        consumerId: "consumer_1",
      },
    });
  });

  it("should map empty filters to null response filter values", () => {
    const listing: ApiUsageEventsListingReadModel = {
      items: [
        {
          id: "usage_event_1",
          requestId: "request_1",
          routePath: "/api/product-service/health",
          routeMethod: "GET",
          statusCode: 200,
          durationMs: 12,
          cacheStatus: null,
          apiKeyAuthSource: null,
          apiKeyId: null,
          consumerId: null,
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

    expect(mapApiUsageEventsListingReadModelToResponse(listing)).toEqual({
      items: [
        {
          id: "usage_event_1",
          requestId: "request_1",
          routePath: "/api/product-service/health",
          routeMethod: "GET",
          statusCode: 200,
          durationMs: 12,
          cacheStatus: null,
          apiKeyAuthSource: null,
          apiKeyId: null,
          consumerId: null,
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
        routePath: null,
        routeMethod: null,
        statusCode: null,
        cacheStatus: null,
        apiKeyAuthSource: null,
        apiKeyId: null,
        consumerId: null,
      },
    });
  });

  it("should return null nextCursor when the page is empty", () => {
    const listing: ApiUsageEventsListingReadModel = {
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
      mapApiUsageEventsListingReadModelToResponse(listing).pagination
        .nextCursor,
    ).toBeNull();
  });
});

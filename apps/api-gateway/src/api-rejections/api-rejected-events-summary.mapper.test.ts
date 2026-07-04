import { describe, expect, it } from "vitest";

import { mapApiRejectedEventsSummaryReadModelToResponse } from "./api-rejected-events-summary.mapper.js";

describe("mapApiRejectedEventsSummaryReadModelToResponse", () => {
  it("should map rejected events summary read model to response", () => {
    const response = mapApiRejectedEventsSummaryReadModelToResponse({
      totalRejectedRequests: 4,
      byReason: [
        {
          rejectionReason: "API_KEY_MISSING",
          count: 2,
        },
        {
          rejectionReason: "RATE_LIMIT_EXCEEDED",
          count: 2,
        },
      ],
      byStatusCode: [
        {
          statusCode: 401,
          count: 2,
        },
        {
          statusCode: 429,
          count: 2,
        },
      ],
      lastRejectedAt: new Date("2026-07-04T10:00:00.000Z"),
      filters: {
        from: new Date("2026-07-04T00:00:00.000Z"),
        to: new Date("2026-07-05T00:00:00.000Z"),
        rejectionReason: "RATE_LIMIT_EXCEEDED",
        statusCode: 429,
        routePath: "/api/products",
        routeMethod: "GET",
        apiKeyAuthSource: "env",
        apiKeyId: "api_key_1",
        consumerId: "consumer_1",
      },
    });

    expect(response).toEqual({
      totalRejectedRequests: 4,
      byReason: [
        {
          rejectionReason: "API_KEY_MISSING",
          count: 2,
        },
        {
          rejectionReason: "RATE_LIMIT_EXCEEDED",
          count: 2,
        },
      ],
      byStatusCode: [
        {
          statusCode: 401,
          count: 2,
        },
        {
          statusCode: 429,
          count: 2,
        },
      ],
      lastRejectedAt: "2026-07-04T10:00:00.000Z",
      filters: {
        from: "2026-07-04T00:00:00.000Z",
        to: "2026-07-05T00:00:00.000Z",
        rejectionReason: "RATE_LIMIT_EXCEEDED",
        statusCode: 429,
        routePath: "/api/products",
        routeMethod: "GET",
        apiKeyAuthSource: "env",
        apiKeyId: "api_key_1",
        consumerId: "consumer_1",
      },
    });
  });

  it("should map null lastRejectedAt and empty filters", () => {
    const response = mapApiRejectedEventsSummaryReadModelToResponse({
      totalRejectedRequests: 0,
      byReason: [],
      byStatusCode: [],
      lastRejectedAt: null,
      filters: {},
    });

    expect(response).toEqual({
      totalRejectedRequests: 0,
      byReason: [],
      byStatusCode: [],
      lastRejectedAt: null,
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
});

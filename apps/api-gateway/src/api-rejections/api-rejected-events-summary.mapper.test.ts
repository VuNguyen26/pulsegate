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
    });
  });

  it("should map null lastRejectedAt", () => {
    const response = mapApiRejectedEventsSummaryReadModelToResponse({
      totalRejectedRequests: 0,
      byReason: [],
      byStatusCode: [],
      lastRejectedAt: null,
    });

    expect(response.lastRejectedAt).toBeNull();
  });
});

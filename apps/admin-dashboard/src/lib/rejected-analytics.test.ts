import { describe, expect, it } from "vitest";

import {
  isDashboardRejectedEventsListing,
  isDashboardRejectedEventsSummary,
  sanitizeDashboardRejectedEventsListing,
  type DashboardRejectedEventsSummary,
} from "./rejected-analytics";

const emptyFilters = {
  from: null,
  to: null,
  rejectionReason: null,
  statusCode: null,
  routePath: null,
  routeMethod: null,
  apiKeyAuthSource: null,
  apiKeyId: null,
  consumerId: null,
} as const;

const summary: DashboardRejectedEventsSummary = {
  totalRejectedRequests: 6,
  byReason: [
    {
      rejectionReason: "API_KEY_MISSING",
      count: 2,
    },
    {
      rejectionReason: "JWT_TOKEN_INVALID",
      count: 1,
    },
    {
      rejectionReason: "RATE_LIMIT_EXCEEDED",
      count: 3,
    },
  ],
  byStatusCode: [
    {
      statusCode: 401,
      count: 2,
    },
    {
      statusCode: 403,
      count: 1,
    },
    {
      statusCode: 429,
      count: 3,
    },
  ],
  lastRejectedAt:
    "2026-07-11T01:00:00.000Z",
  filters: {
    ...emptyFilters,
  },
};

const listing = {
  items: [
    {
      id: "rejected_event_2",
      requestId: "request-2",
      routePath: "/api/products",
      routeMethod: "GET",
      statusCode: 429,
      rejectionReason: "QUOTA_EXCEEDED",
      apiKeyAuthSource: "database",
      apiKeyId: "api_key_1",
      consumerId: "consumer_1",
      metadata: {
        quotaLimit: 100,
        quotaWindow: "DAILY",
      },
      occurredAt:
        "2026-07-11T02:00:00.000Z",
    },
    {
      id: "rejected_event_1",
      requestId: "request-1",
      routePath: null,
      routeMethod: null,
      statusCode: 401,
      rejectionReason: "API_KEY_MISSING",
      apiKeyAuthSource: null,
      apiKeyId: null,
      consumerId: null,
      metadata: null,
      occurredAt:
        "2026-07-11T01:00:00.000Z",
    },
  ],
  pagination: {
    limit: 20,
    offset: 0,
    total: 3,
    hasNextPage: true,
    nextCursor: "opaque_cursor_2",
  },
  filters: {
    ...emptyFilters,
  },
};

describe("rejected analytics summary contract", () => {
  it("accepts a consistent rejected summary", () => {
    expect(
      isDashboardRejectedEventsSummary(summary),
    ).toBe(true);
  });

  it("rejects inconsistent aggregate totals", () => {
    expect(
      isDashboardRejectedEventsSummary({
        ...summary,
        byReason: [
          {
            rejectionReason:
              "RATE_LIMIT_EXCEEDED",
            count: 5,
          },
        ],
      }),
    ).toBe(false);
  });

  it("requires an empty summary to have no last event", () => {
    expect(
      isDashboardRejectedEventsSummary({
        ...summary,
        totalRejectedRequests: 0,
        byReason: [],
        byStatusCode: [],
        lastRejectedAt: null,
      }),
    ).toBe(true);

    expect(
      isDashboardRejectedEventsSummary({
        ...summary,
        totalRejectedRequests: 0,
        byReason: [],
        byStatusCode: [],
      }),
    ).toBe(false);
  });
});

describe("rejected analytics listing contract", () => {
  it("removes raw metadata from the Dashboard DTO", () => {
    const sanitized =
      sanitizeDashboardRejectedEventsListing(
        listing,
      );

    expect(sanitized).not.toBeNull();
    expect(sanitized?.items).toHaveLength(2);
    expect(sanitized?.items[0]).not.toHaveProperty(
      "metadata",
    );
    expect(
      isDashboardRejectedEventsListing(sanitized),
    ).toBe(true);
  });

  it("rejects sensitive fields nested in metadata", () => {
    expect(
      sanitizeDashboardRejectedEventsListing({
        ...listing,
        items: [
          {
            ...listing.items[0],
            metadata: {
              rawKey: "must-not-pass",
            },
          },
        ],
        pagination: {
          ...listing.pagination,
          total: 1,
          hasNextPage: false,
          nextCursor: null,
        },
      }),
    ).toBeNull();
  });

  it("rejects invalid cursor and ordering states", () => {
    expect(
      sanitizeDashboardRejectedEventsListing({
        ...listing,
        pagination: {
          ...listing.pagination,
          hasNextPage: true,
          nextCursor: null,
        },
      }),
    ).toBeNull();

    expect(
      sanitizeDashboardRejectedEventsListing({
        ...listing,
        items: [...listing.items].reverse(),
      }),
    ).toBeNull();
  });

  it("rejects metadata on the sanitized browser DTO", () => {
    const sanitized =
      sanitizeDashboardRejectedEventsListing(
        listing,
      );

    expect(
      isDashboardRejectedEventsListing({
        ...sanitized,
        items: [
          {
            ...sanitized?.items[0],
            metadata: {
              quotaLimit: 100,
            },
          },
        ],
      }),
    ).toBe(false);
  });
});

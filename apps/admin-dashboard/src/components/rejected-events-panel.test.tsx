import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  RejectedEventsContent,
  RejectedEventsPanel,
} from "./rejected-events-panel";
import type {
  DashboardRejectedEventsListing,
  DashboardRejectedEventsSummary,
} from "../lib/rejected-analytics";

const filters = {
  from: null,
  to: null,
  rejectionReason: null,
  statusCode: null,
  routePath: null,
  routeMethod: null,
  apiKeyAuthSource: null,
  apiKeyId: null,
  consumerId: null,
};

const summary: DashboardRejectedEventsSummary = {
  totalRejectedRequests: 3,
  byReason: [
    {
      rejectionReason: "QUOTA_EXCEEDED",
      count: 2,
    },
    {
      rejectionReason: "API_KEY_MISSING",
      count: 1,
    },
  ],
  byStatusCode: [
    {
      statusCode: 401,
      count: 1,
    },
    {
      statusCode: 429,
      count: 2,
    },
  ],
  lastRejectedAt:
    "2026-07-11T02:00:00.000Z",
  filters,
};

const listing: DashboardRejectedEventsListing = {
  items: [
    {
      id: "rejected_event_1",
      requestId: "request-1",
      routePath: "/api/products",
      routeMethod: "GET",
      statusCode: 429,
      rejectionReason: "QUOTA_EXCEEDED",
      apiKeyAuthSource: "database",
      apiKeyId: "api_key_1",
      consumerId: "consumer_1",
      occurredAt:
        "2026-07-11T02:00:00.000Z",
    },
  ],
  pagination: {
    limit: 20,
    offset: 0,
    total: 2,
    hasNextPage: true,
    nextCursor: "opaque_cursor_2",
  },
  filters,
};

describe("RejectedEventsContent", () => {
  it("renders summary breakdowns and sanitized events", () => {
    const html = renderToStaticMarkup(
      <RejectedEventsContent
        summary={summary}
        listing={listing}
        hasPreviousPage
        busy={false}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(html).toContain(
      "Total rejected requests",
    );
    expect(html).toContain(
      "QUOTA_EXCEEDED",
    );
    expect(html).toContain(
      "API_KEY_MISSING",
    );
    expect(html).toContain(
      "Rejected Gateway request events",
    );
    expect(html).toContain(
      "/api/products",
    );
    expect(html).toContain(
      "request-1",
    );
    expect(html).toContain(
      "Previous page",
    );
    expect(html).toContain(
      "Next page",
    );
    expect(html).not.toContain("metadata");
    expect(html).not.toContain("rawKey");
  });

  it("keeps the summary visible for an empty event page", () => {
    const html = renderToStaticMarkup(
      <RejectedEventsContent
        summary={{
          totalRejectedRequests: 0,
          byReason: [],
          byStatusCode: [],
          lastRejectedAt: null,
          filters,
        }}
        listing={{
          ...listing,
          items: [],
          pagination: {
            limit: 20,
            offset: 0,
            total: 0,
            hasNextPage: false,
            nextCursor: null,
          },
        }}
        hasPreviousPage={false}
        busy={false}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(html).toContain(
      "No rejected events",
    );
    expect(html).toContain(
      "No rejected event recorded",
    );
    expect(html).not.toContain("<table");
  });
});

describe("RejectedEventsPanel", () => {
  it("starts with bounded rejected filters and loading state", () => {
    const html = renderToStaticMarkup(
      <RejectedEventsPanel />,
    );

    expect(html).toContain(
      'aria-label="Rejected request analytics"',
    );
    expect(html).toContain(
      'aria-label="Analytics filters"',
    );
    expect(html).toContain(
      "Loading rejected-request summary and events",
    );
    expect(html).toContain('value="20"');
    expect(html).not.toContain("metadata");
  });
});

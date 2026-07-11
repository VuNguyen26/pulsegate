import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  UsageEventsContent,
  UsageEventsPanel,
} from "./usage-events-panel";
import type {
  DashboardUsageEventsListing,
} from "../lib/usage-analytics";

const listing: DashboardUsageEventsListing = {
  items: [
    {
      id: "usage_event_1",
      requestId: "request-1",
      routePath: "/api/products/:id",
      routeMethod: "GET",
      statusCode: 200,
      durationMs: 18.5,
      cacheStatus: "HIT",
      apiKeyAuthSource: "header",
      apiKeyId: "api_key_1",
      consumerId: "consumer_mobile",
      occurredAt: "2026-07-11T01:00:00.000Z",
    },
  ],
  pagination: {
    limit: 20,
    offset: 0,
    total: 41,
    hasNextPage: true,
    nextCursor: "opaque_cursor_2",
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
};

describe("UsageEventsContent", () => {
  it("renders successful events and cursor controls", () => {
    const html = renderToStaticMarkup(
      <UsageEventsContent
        listing={listing}
        hasPreviousPage
        busy={false}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(html).toContain(
      "Successful Gateway usage events",
    );
    expect(html).toContain("/api/products/:id");
    expect(html).toContain("request-1");
    expect(html).toContain("18.5 ms");
    expect(html).toContain("consumer_mobile");
    expect(html).toContain("api_key_1");
    expect(html).toContain("Next page");
    expect(html).toContain("Previous page");
  });

  it("renders the truthful empty state", () => {
    const html = renderToStaticMarkup(
      <UsageEventsContent
        listing={{
          ...listing,
          items: [],
          pagination: {
            ...listing.pagination,
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
      "No successful usage events",
    );
    expect(html).not.toContain("<table");
  });
});

describe("UsageEventsPanel", () => {
  it("starts with bounded filters and a loading state", () => {
    const html = renderToStaticMarkup(
      <UsageEventsPanel />,
    );

    expect(html).toContain(
      'aria-label="Successful usage events"',
    );
    expect(html).toContain(
      'aria-label="Analytics filters"',
    );
    expect(html).toContain(
      "Loading successful Gateway usage events",
    );
    expect(html).toContain('value="20"');
  });
});

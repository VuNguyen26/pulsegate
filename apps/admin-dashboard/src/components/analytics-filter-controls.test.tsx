import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  AnalyticsFilterControls,
  parseAnalyticsFilterSubmission,
} from "./analytics-filter-controls";

describe("parseAnalyticsFilterSubmission", () => {
  it("normalizes bounded usage event filters", () => {
    const result = parseAnalyticsFilterSubmission(
      "usage-events",
      {
        from: "2026-07-01T00:00",
        to: "2026-07-11T00:00",
        routeMethod: "get",
        cacheStatus: "hit",
        limit: "25",
      },
    );

    expect(result).toEqual({
      ok: true,
      value: {
        from: "2026-07-01T00:00:00.000Z",
        to: "2026-07-11T00:00:00.000Z",
        routeMethod: "GET",
        cacheStatus: "HIT",
        limit: 25,
      },
    });
  });

  it("rejects filters outside the bounded contract", () => {
    const result = parseAnalyticsFilterSubmission(
      "rejected-events",
      {
        routePath: "https://example.com/internal",
      },
    );

    expect(result).toMatchObject({
      ok: false,
      error: {
        field: "routePath",
      },
    });
  });
});

describe("AnalyticsFilterControls", () => {
  it("renders successful usage event filters", () => {
    const html = renderToStaticMarkup(
      <AnalyticsFilterControls
        mode="usage-events"
        onApply={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(html).toContain('name="cacheStatus"');
    expect(html).toContain('name="consumerId"');
    expect(html).toContain('name="apiKeyId"');
    expect(html).toContain('name="limit"');
    expect(html).not.toContain(
      'name="rejectionReason"',
    );
  });

  it("renders rejected summary filters without pagination", () => {
    const html = renderToStaticMarkup(
      <AnalyticsFilterControls
        mode="rejected-summary"
        onApply={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(html).toContain(
      'name="rejectionReason"',
    );
    expect(html).toContain('name="consumerId"');
    expect(html).not.toContain(
      'name="cacheStatus"',
    );
    expect(html).not.toContain('name="limit"');
  });
});

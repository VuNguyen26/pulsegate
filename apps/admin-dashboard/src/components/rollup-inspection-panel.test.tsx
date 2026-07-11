import {
  renderToStaticMarkup,
} from "react-dom/server";
import {
  describe,
  expect,
  it,
} from "vitest";

import {
  RollupInspectionContent,
  RollupInspectionPanel,
} from "./rollup-inspection-panel";

const window = {
  requestedFrom:
    "2026-07-10T00:00:00.000Z",
  requestedTo:
    "2026-07-11T00:00:00.000Z",
  rebuildFrom:
    "2026-07-10T00:00:00.000Z",
  rebuildTo:
    "2026-07-11T00:00:00.000Z",
  bucketCount: 24,
};

describe("RollupInspectionContent", () => {
  it("renders usage rollup rows", () => {
    const html = renderToStaticMarkup(
      <RollupInspectionContent
        read={{
          source: "usage",
          granularity: "hour",
          window,
          limit: 50,
          filters: {
            routePath: null,
            routeMethod: null,
            statusCode: null,
            apiKeyAuthSource: null,
            apiKeyId: null,
            consumerId: null,
            cacheStatus: null,
          },
          items: [
            {
              id: "usage-rollup-1",
              granularity: "hour",
              bucketStart:
                "2026-07-10T10:00:00.000Z",
              bucketEnd:
                "2026-07-10T11:00:00.000Z",
              dimensionHash: "hash-1",
              consumerId:
                "consumer-mobile",
              apiKeyId: "api-key-1",
              routePath:
                "/api/products/:id",
              routeMethod: "GET",
              statusClass: "2xx",
              cacheStatus: "HIT",
              apiKeyAuthSource:
                "DATABASE",
              totalRequests: 10,
              totalErrors: 1,
              totalCacheHits: 7,
              totalDurationMs: 1200,
              lastOccurredAt:
                "2026-07-10T10:59:00.000Z",
            },
          ],
        }}
      />,
    );

    expect(html).toContain(
      "Persisted successful usage rollups",
    );
    expect(html).toContain(
      "/api/products/:id",
    );
    expect(html).toContain(
      "consumer-mobile",
    );
    expect(html).toContain(
      "Cache hits",
    );
  });

  it("renders truthful empty state", () => {
    const html = renderToStaticMarkup(
      <RollupInspectionContent
        read={{
          source: "rejected",
          granularity: "hour",
          window,
          limit: 50,
          filters: {
            routePath: null,
            routeMethod: null,
            statusCode: null,
            apiKeyAuthSource: null,
            apiKeyId: null,
            consumerId: null,
            rejectionReason: null,
          },
          items: [],
        }}
      />,
    );

    expect(html).toContain(
      "No persisted rollup buckets",
    );
    expect(html).not.toContain(
      "<table",
    );
  });
});

describe("RollupInspectionPanel", () => {
  it("starts with bounded usage loading state", () => {
    const html = renderToStaticMarkup(
      <RollupInspectionPanel
        initialFrom=
          "2026-07-10T00:00:00.000Z"
        initialTo=
          "2026-07-11T00:00:00.000Z"
      />,
    );

    expect(html).toContain(
      'aria-label="Persisted analytics rollups"',
    );
    expect(html).toContain(
      "Usage rollups",
    );
    expect(html).toContain(
      "Rejected rollups",
    );
    expect(html).toContain(
      "Loading persisted rollup rows",
    );
    expect(html).toContain(
      "never quota truth",
    );
  });
});
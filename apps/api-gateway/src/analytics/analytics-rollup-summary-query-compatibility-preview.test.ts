import { describe, expect, it } from "vitest";
import { buildRollupSummaryQueryCompatibilityPreview } from "./analytics-rollup-summary-query-compatibility-preview.js";

describe("analytics rollup summary query compatibility preview", () => {
  it("marks bounded usage summary filters as compatible for rollup preview", () => {
    const preview = buildRollupSummaryQueryCompatibilityPreview({
      target: "usage-consumer-summary",
      filters: {
        from: "2026-07-09T00:00:00.000Z",
        to: "2026-07-09T01:00:00.000Z",
        routePath: "/api/products",
        routeMethod: "GET",
        statusCode: 200,
        cacheStatus: "HIT",
        apiKeyAuthSource: "database",
      },
    });

    expect(preview.status).toBe("rollup-query-compatible-for-preview");
    expect(preview.queryShapeSupported).toBe(true);
    expect(preview.fallbackReason).toBeNull();
    expect(preview.unsupportedFilterKeys).toEqual([]);
    expect(preview.timeWindow).toEqual({
      requiresBoundedWindowForRollupPreview: true,
      fromProvided: true,
      toProvided: true,
      bounded: true,
      valid: true,
    });
    expect(preview.currentRawSummaryQuery).toEqual({
      remainsRuntimeDefault: true,
      supportsCurrentUnboundedQueryBehavior: true,
      sourceOfTruth: "gateway.api_usage_events",
    });
    expect(preview.rollupReadModelQuery).toEqual({
      previewOnly: true,
      queryShapeSupported: true,
      requiresBoundedTimeWindow: true,
      readModel: "gateway.api_usage_rollups",
    });
    expect(preview.runtimeSelection.runtimeSwitchApplied).toBe(false);
  });

  it("keeps raw summary fallback for current unbounded usage summary behavior", () => {
    const preview = buildRollupSummaryQueryCompatibilityPreview({
      target: "usage-api-key-summary",
      filters: {
        routePath: "/api/products",
      },
    });

    expect(preview.status).toBe("rollup-query-fallback-required");
    expect(preview.queryShapeSupported).toBe(false);
    expect(preview.fallbackReason).toBe("missing-bounded-time-window");
    expect(preview.timeWindow).toEqual({
      requiresBoundedWindowForRollupPreview: true,
      fromProvided: false,
      toProvided: false,
      bounded: false,
      valid: false,
    });
    expect(
      preview.currentRawSummaryQuery.supportsCurrentUnboundedQueryBehavior,
    ).toBe(true);
    expect(preview.runtimeSelection.selectedPath).toBe("raw-event-summary");
  });

  it("marks bounded rejected summary filters as compatible for rollup preview", () => {
    const preview = buildRollupSummaryQueryCompatibilityPreview({
      target: "rejected-summary",
      filters: {
        from: new Date("2026-07-09T00:00:00.000Z"),
        to: new Date("2026-07-09T01:00:00.000Z"),
        rejectionReason: "API_KEY_MISSING",
        statusCode: 401,
        routePath: "/api/products",
        routeMethod: "GET",
        apiKeyAuthSource: "missing",
        apiKeyId: "key-1",
        consumerId: "consumer-1",
      },
    });

    expect(preview.status).toBe("rollup-query-compatible-for-preview");
    expect(preview.supportedFilterKeys).toEqual([
      "from",
      "to",
      "rejectionReason",
      "statusCode",
      "routePath",
      "routeMethod",
      "apiKeyAuthSource",
      "apiKeyId",
      "consumerId",
    ]);
    expect(preview.currentRawSummaryQuery.sourceOfTruth).toBe(
      "gateway.api_rejected_events",
    );
    expect(preview.rollupReadModelQuery.readModel).toBe(
      "gateway.api_rejected_rollups",
    );
  });

  it("falls back before rollup preview when the query contains unsupported filters", () => {
    const preview = buildRollupSummaryQueryCompatibilityPreview({
      target: "usage-consumer-summary",
      filters: {
        from: "2026-07-09T00:00:00.000Z",
        to: "2026-07-09T01:00:00.000Z",
        unsupportedDimension: "value",
      },
    });

    expect(preview.status).toBe("rollup-query-fallback-required");
    expect(preview.queryShapeSupported).toBe(false);
    expect(preview.fallbackReason).toBe("unsupported-query-filter");
    expect(preview.unsupportedFilterKeys).toEqual(["unsupportedDimension"]);
    expect(preview.rollupReadModelQuery.queryShapeSupported).toBe(false);
  });

  it("falls back when the bounded time window is invalid", () => {
    const preview = buildRollupSummaryQueryCompatibilityPreview({
      target: "rejected-summary",
      filters: {
        from: "2026-07-09T02:00:00.000Z",
        to: "2026-07-09T01:00:00.000Z",
      },
    });

    expect(preview.status).toBe("rollup-query-fallback-required");
    expect(preview.queryShapeSupported).toBe(false);
    expect(preview.fallbackReason).toBe("invalid-time-window");
    expect(preview.timeWindow).toEqual({
      requiresBoundedWindowForRollupPreview: true,
      fromProvided: true,
      toProvided: true,
      bounded: true,
      valid: false,
    });
  });

  it("keeps compatibility preview DB-free and non-destructive", () => {
    const preview = buildRollupSummaryQueryCompatibilityPreview({
      target: "usage-consumer-summary",
      filters: {
        from: "2026-07-09T00:00:00.000Z",
        to: "2026-07-09T01:00:00.000Z",
      },
    });

    expect(preview.safety).toEqual({
      endpointRuntimeChanged: false,
      readsDatabaseInPreviewModel: false,
      invokesRepositoryInPreviewModel: false,
      persistsRollups: false,
      mutatesQuotaCounting: false,
      deletesRawEvents: false,
      wiresSchedulerOrBackgroundJob: false,
      wiresRetentionExecution: false,
    });
  });
});
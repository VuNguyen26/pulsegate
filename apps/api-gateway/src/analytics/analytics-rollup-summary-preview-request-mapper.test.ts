import { describe, expect, it } from "vitest";
import {
  mapApiKeyUsageSummaryPreviewRequest,
  mapConsumerUsageSummaryPreviewRequest,
  mapRejectedSummaryPreviewRequest,
} from "./analytics-rollup-summary-preview-request-mapper.js";

describe("analytics rollup summary preview request mapper", () => {
  it("maps consumer usage summary filters into the rollup switch preview output", () => {
    const mapped = mapConsumerUsageSummaryPreviewRequest({
      rollupPreviewEnabled: true,
      rollupDataState: "fresh",
      filters: {
        from: new Date("2026-07-09T00:00:00.000Z"),
        to: new Date("2026-07-09T01:00:00.000Z"),
        routePath: "/api/products",
        routeMethod: "GET",
        statusCode: 200,
        cacheStatus: "HIT",
        apiKeyAuthSource: "database",
      },
    });

    expect(mapped.source).toBe("usage-consumer-summary-route");
    expect(mapped.target).toBe("usage-consumer-summary");
    expect(mapped.mappedFilters).toEqual({
      from: new Date("2026-07-09T00:00:00.000Z"),
      to: new Date("2026-07-09T01:00:00.000Z"),
      routePath: "/api/products",
      routeMethod: "GET",
      statusCode: 200,
      cacheStatus: "HIT",
      apiKeyAuthSource: "database",
    });
    expect(mapped.output.status).toBe("summary-api-rollup-preview-ready");
    expect(mapped.output.queryCompatibility.queryShapeSupported).toBe(true);
    expect(mapped.output.operatorDecision.runtimeSwitchApplied).toBe(false);
  });

  it("maps API key usage summary filters to the API key summary target", () => {
    const mapped = mapApiKeyUsageSummaryPreviewRequest({
      rollupPreviewEnabled: true,
      rollupDataState: "fresh",
      filters: {
        from: new Date("2026-07-09T00:00:00.000Z"),
        to: new Date("2026-07-09T01:00:00.000Z"),
        routeMethod: "POST",
      },
    });

    expect(mapped.source).toBe("usage-api-key-summary-route");
    expect(mapped.target).toBe("usage-api-key-summary");
    expect(mapped.output.switchPreview.targetProfile.routeFamily).toBe(
      "/internal/admin/usage/api-keys/:apiKeyId/summary",
    );
    expect(mapped.output.status).toBe("summary-api-rollup-preview-ready");
  });

  it("maps rejected summary filters into the rejected rollup preview target", () => {
    const mapped = mapRejectedSummaryPreviewRequest({
      rollupPreviewEnabled: true,
      rollupDataState: "fresh",
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

    expect(mapped.source).toBe("rejected-summary-route");
    expect(mapped.target).toBe("rejected-summary");
    expect(mapped.mappedFilters).toEqual({
      from: new Date("2026-07-09T00:00:00.000Z"),
      to: new Date("2026-07-09T01:00:00.000Z"),
      rejectionReason: "API_KEY_MISSING",
      statusCode: 401,
      routePath: "/api/products",
      routeMethod: "GET",
      apiKeyAuthSource: "missing",
      apiKeyId: "key-1",
      consumerId: "consumer-1",
    });
    expect(mapped.output.switchPreview.targetProfile.routeFamily).toBe(
      "/internal/admin/api-rejections/summary",
    );
    expect(mapped.output.status).toBe("summary-api-rollup-preview-ready");
  });

  it("keeps current unbounded summary requests on raw-event fallback", () => {
    const mapped = mapConsumerUsageSummaryPreviewRequest({
      rollupPreviewEnabled: true,
      rollupDataState: "fresh",
      filters: {
        routePath: "/api/products",
      },
    });

    expect(mapped.output.status).toBe(
      "summary-api-rollup-preview-fallback-required",
    );
    expect(mapped.output.fallbackPlan.effectiveReason).toBe(
      "missing-bounded-time-window",
    );
    expect(mapped.output.operatorDecision.currentRuntimePath).toBe(
      "raw-event-summary",
    );
  });

  it("omits absent optional filters before compatibility preview evaluation", () => {
    const mapped = mapRejectedSummaryPreviewRequest({
      rollupPreviewEnabled: true,
      rollupDataState: "fresh",
      filters: {
        from: new Date("2026-07-09T00:00:00.000Z"),
        to: new Date("2026-07-09T01:00:00.000Z"),
        routePath: "",
      },
    });

    expect(mapped.mappedFilters).toEqual({
      from: new Date("2026-07-09T00:00:00.000Z"),
      to: new Date("2026-07-09T01:00:00.000Z"),
    });
    expect(mapped.output.queryCompatibility.providedFilterKeys).toEqual([
      "from",
      "to",
    ]);
    expect(mapped.output.status).toBe("summary-api-rollup-preview-ready");
  });

  it("keeps the request mapper DB-free and non-destructive", () => {
    const mapped = mapConsumerUsageSummaryPreviewRequest({
      filters: {
        from: new Date("2026-07-09T00:00:00.000Z"),
        to: new Date("2026-07-09T01:00:00.000Z"),
      },
    });

    expect(mapped.mapperSafety).toEqual({
      endpointRuntimeChanged: false,
      readsDatabaseInMapper: false,
      invokesRepositoryInMapper: false,
      persistsRollups: false,
      mutatesQuotaCounting: false,
      deletesRawEvents: false,
    });
    expect(mapped.output.safety).toEqual({
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
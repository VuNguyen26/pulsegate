import { describe, expect, it } from "vitest";
import { buildRollupSummaryApiSwitchPreviewOutput } from "./analytics-rollup-summary-api-switch-preview-output.js";

describe("analytics rollup summary API switch preview output", () => {
  it("retains raw summary runtime when rollup preview is disabled", () => {
    const output = buildRollupSummaryApiSwitchPreviewOutput({
      target: "usage-consumer-summary",
      filters: {
        from: "2026-07-09T00:00:00.000Z",
        to: "2026-07-09T01:00:00.000Z",
      },
    });

    expect(output.status).toBe("summary-api-runtime-retained");
    expect(output.queryCompatibility.queryShapeSupported).toBe(true);
    expect(output.switchPreview.status).toBe("current-raw-summary-retained");
    expect(output.operatorDecision).toEqual({
      currentRuntimePath: "raw-event-summary",
      rollupPreviewPath: "rollup-read-model-preview",
      runtimeSwitchApplied: false,
      rawSummaryRuntimeRetained: true,
      rollupReadModelConsidered: false,
      fallbackPath: "raw-event-summary",
    });
    expect(output.fallbackPlan).toEqual({
      required: true,
      selectedPath: "raw-event-summary",
      effectiveReason: "rollup-preview-disabled",
      queryFallbackReason: null,
      rollupFallbackReason: "rollup-preview-disabled",
    });
  });

  it("marks rollup preview ready only when query is compatible and rollup data is fresh", () => {
    const output = buildRollupSummaryApiSwitchPreviewOutput({
      target: "usage-api-key-summary",
      rollupPreviewEnabled: true,
      rollupDataState: "fresh",
      filters: {
        from: "2026-07-09T00:00:00.000Z",
        to: "2026-07-09T01:00:00.000Z",
        routeMethod: "GET",
        statusCode: 200,
      },
    });

    expect(output.status).toBe("summary-api-rollup-preview-ready");
    expect(output.queryCompatibility.status).toBe(
      "rollup-query-compatible-for-preview",
    );
    expect(output.switchPreview.status).toBe(
      "rollup-preview-ready-with-raw-fallback",
    );
    expect(output.fallbackPlan.effectiveReason).toBe("rollup-preview-only");
    expect(output.operatorDecision.runtimeSwitchApplied).toBe(false);
    expect(output.reviewerNotes).toEqual({
      summaryApiSwitchIsPreviewOnly: true,
      endpointRuntimeBehaviorChanged: false,
      currentRawSummaryRemainsAuthoritative: true,
      selectedReadsStillUseRawEvents: true,
      futureRollupReadRequiresCompatibleQueryAndFreshData: true,
    });
  });

  it("uses query fallback reason when the query is unbounded", () => {
    const output = buildRollupSummaryApiSwitchPreviewOutput({
      target: "rejected-summary",
      rollupPreviewEnabled: true,
      rollupDataState: "fresh",
      filters: {
        rejectionReason: "API_KEY_MISSING",
      },
    });

    expect(output.status).toBe("summary-api-rollup-preview-fallback-required");
    expect(output.queryCompatibility.fallbackReason).toBe(
      "missing-bounded-time-window",
    );
    expect(output.switchPreview.fallback.reason).toBe(
      "unsupported-query-shape",
    );
    expect(output.fallbackPlan).toEqual({
      required: true,
      selectedPath: "raw-event-summary",
      effectiveReason: "missing-bounded-time-window",
      queryFallbackReason: "missing-bounded-time-window",
      rollupFallbackReason: "unsupported-query-shape",
    });
  });

  it("uses rollup data fallback reason when query is compatible but data is stale", () => {
    const output = buildRollupSummaryApiSwitchPreviewOutput({
      target: "rejected-summary",
      rollupPreviewEnabled: true,
      rollupDataState: "stale",
      filters: {
        from: "2026-07-09T00:00:00.000Z",
        to: "2026-07-09T01:00:00.000Z",
      },
    });

    expect(output.status).toBe("summary-api-rollup-preview-fallback-required");
    expect(output.queryCompatibility.fallbackReason).toBeNull();
    expect(output.switchPreview.fallback.reason).toBe("rollup-data-stale");
    expect(output.fallbackPlan.effectiveReason).toBe("rollup-data-stale");
  });

  it("prefers unsupported query filter over rollup data state", () => {
    const output = buildRollupSummaryApiSwitchPreviewOutput({
      target: "usage-consumer-summary",
      rollupPreviewEnabled: true,
      rollupDataState: "fresh",
      filters: {
        from: "2026-07-09T00:00:00.000Z",
        to: "2026-07-09T01:00:00.000Z",
        unsupportedDimension: "value",
      },
    });

    expect(output.status).toBe("summary-api-rollup-preview-fallback-required");
    expect(output.queryCompatibility.fallbackReason).toBe(
      "unsupported-query-filter",
    );
    expect(output.switchPreview.fallback.reason).toBe(
      "unsupported-query-shape",
    );
    expect(output.fallbackPlan.effectiveReason).toBe(
      "unsupported-query-filter",
    );
  });

  it("keeps composed preview output DB-free and non-destructive", () => {
    const output = buildRollupSummaryApiSwitchPreviewOutput({
      target: "usage-consumer-summary",
      rollupPreviewEnabled: true,
      rollupDataState: "fresh",
      filters: {
        from: "2026-07-09T00:00:00.000Z",
        to: "2026-07-09T01:00:00.000Z",
      },
    });

    expect(output.safety).toEqual({
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
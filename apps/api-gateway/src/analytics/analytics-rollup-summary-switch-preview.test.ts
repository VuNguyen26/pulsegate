import { describe, expect, it } from "vitest";
import { buildRollupSummaryApiSwitchPreview } from "./analytics-rollup-summary-switch-preview.js";

describe("analytics rollup summary API switch preview", () => {
  it("keeps usage consumer summary on the current raw-event runtime path by default", () => {
    const preview = buildRollupSummaryApiSwitchPreview({
      target: "usage-consumer-summary",
    });

    expect(preview.status).toBe("current-raw-summary-retained");
    expect(preview.targetProfile.routeFamily).toBe(
      "/internal/admin/usage/consumers/:consumerId/summary",
    );
    expect(preview.currentRuntimePath).toEqual({
      path: "raw-event-summary",
      remainsDefault: true,
      readsRawEvents: true,
      readsRollupTables: false,
    });
    expect(preview.rollupPreviewPath.enabled).toBe(false);
    expect(preview.fallback).toEqual({
      path: "raw-event-summary",
      required: true,
      reason: "rollup-preview-disabled",
    });
    expect(preview.runtimeSelection).toEqual({
      selectedPath: "raw-event-summary",
      runtimeSwitchApplied: false,
      reason: "sprint-52-preview-only",
    });
  });

  it("describes a fresh rollup read-model preview without switching endpoint runtime", () => {
    const preview = buildRollupSummaryApiSwitchPreview({
      target: "usage-api-key-summary",
      rollupPreviewEnabled: true,
      queryShapeSupported: true,
      rollupDataState: "fresh",
    });

    expect(preview.status).toBe("rollup-preview-ready-with-raw-fallback");
    expect(preview.targetProfile.routeFamily).toBe(
      "/internal/admin/usage/api-keys/:apiKeyId/summary",
    );
    expect(preview.comparison.currentRawSummary).toEqual({
      sourceOfTruth: "gateway.api_usage_events",
      remainsAuthoritativeForRuntime: true,
      quotaCountingImpacted: false,
    });
    expect(preview.comparison.futureRollupSummary).toEqual({
      readModel: "gateway.api_usage_rollups",
      fallbackSourceOfTruth: "gateway.api_usage_events",
      quotaCountingImpacted: false,
    });
    expect(preview.rollupPreviewPath).toEqual({
      path: "rollup-read-model-preview",
      enabled: true,
      queryShapeSupported: true,
      dataState: "fresh",
      wouldReadRollupTables: true,
      wouldPersistRollups: false,
    });
    expect(preview.fallback.reason).toBe("rollup-preview-only");
    expect(preview.runtimeSelection.runtimeSwitchApplied).toBe(false);
  });

  it("requires raw-event fallback when rejected rollup data is missing or stale", () => {
    const missingPreview = buildRollupSummaryApiSwitchPreview({
      target: "rejected-summary",
      rollupPreviewEnabled: true,
      rollupDataState: "missing",
    });
    const stalePreview = buildRollupSummaryApiSwitchPreview({
      target: "rejected-summary",
      rollupPreviewEnabled: true,
      rollupDataState: "stale",
    });

    expect(missingPreview.targetProfile.routeFamily).toBe(
      "/internal/admin/api-rejections/summary",
    );
    expect(missingPreview.comparison.currentRawSummary.sourceOfTruth).toBe(
      "gateway.api_rejected_events",
    );
    expect(missingPreview.comparison.futureRollupSummary.readModel).toBe(
      "gateway.api_rejected_rollups",
    );
    expect(missingPreview.status).toBe("rollup-preview-fallback-required");
    expect(missingPreview.rollupPreviewPath.wouldReadRollupTables).toBe(false);
    expect(missingPreview.fallback.reason).toBe("rollup-data-missing");

    expect(stalePreview.status).toBe("rollup-preview-fallback-required");
    expect(stalePreview.rollupPreviewPath.wouldReadRollupTables).toBe(false);
    expect(stalePreview.fallback.reason).toBe("rollup-data-stale");
  });

  it("falls back for unsupported query shapes before considering rollup data state", () => {
    const preview = buildRollupSummaryApiSwitchPreview({
      target: "usage-consumer-summary",
      rollupPreviewEnabled: true,
      queryShapeSupported: false,
      rollupDataState: "fresh",
    });

    expect(preview.status).toBe("rollup-preview-fallback-required");
    expect(preview.rollupPreviewPath).toMatchObject({
      enabled: true,
      queryShapeSupported: false,
      dataState: "fresh",
      wouldReadRollupTables: false,
    });
    expect(preview.fallback.reason).toBe("unsupported-query-shape");
  });

  it("keeps Sprint 52 preview side effects DB-free and non-destructive", () => {
    const preview = buildRollupSummaryApiSwitchPreview({
      target: "rejected-summary",
      rollupPreviewEnabled: true,
      rollupDataState: "fresh",
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
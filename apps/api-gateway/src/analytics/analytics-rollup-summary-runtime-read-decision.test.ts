import { describe, expect, it } from "vitest";

import { buildRollupSummaryRuntimeReadDecision } from "./analytics-rollup-summary-runtime-read-decision.js";

describe("analytics rollup summary runtime read decision", () => {
  it("selects the rollup read model only when runtime switch, query, and data state are ready", () => {
    const decision = buildRollupSummaryRuntimeReadDecision({
      target: "usage-consumer-summary",
      rollupRuntimeReadEnabled: true,
      rollupDataState: "fresh",
      filters: {
        from: "2026-07-09T00:00:00.000Z",
        to: "2026-07-09T01:00:00.000Z",
        routePath: "/api/products",
        routeMethod: "GET",
        statusCode: 200,
      },
    });

    expect(decision.status).toBe("rollup-read-model-selected");
    expect(decision.selectedReadPath).toEqual({
      path: "rollup-read-model",
      readsRawEvents: false,
      readsRollupTables: true,
      affectsQuotaCounting: false,
      deletesRawEvents: false,
    });
    expect(decision.fallback).toEqual({
      path: "raw-event-summary",
      available: true,
      required: false,
      reason: null,
      rawSummaryRemainsSourceOfTruth: false,
    });
    expect(decision.runtimeSwitch).toEqual({
      requested: true,
      applied: true,
      reason: "rollup-runtime-read-selected",
    });
  });

  it("falls back to raw summary when the runtime switch is disabled", () => {
    const decision = buildRollupSummaryRuntimeReadDecision({
      target: "usage-api-key-summary",
      rollupRuntimeReadEnabled: false,
      rollupDataState: "fresh",
      filters: {
        from: "2026-07-09T00:00:00.000Z",
        to: "2026-07-09T01:00:00.000Z",
      },
    });

    expect(decision.status).toBe("raw-summary-fallback-selected");
    expect(decision.selectedReadPath.path).toBe("raw-event-summary");
    expect(decision.fallback.reason).toBe("rollup-runtime-switch-disabled");
    expect(decision.runtimeSwitch).toEqual({
      requested: false,
      applied: false,
      reason: "rollup-runtime-switch-disabled",
    });
  });

  it("falls back before rollup repository usage when the query is unbounded", () => {
    const decision = buildRollupSummaryRuntimeReadDecision({
      target: "rejected-summary",
      rollupRuntimeReadEnabled: true,
      rollupDataState: "fresh",
      filters: {
        rejectionReason: "API_KEY_MISSING",
      },
    });

    expect(decision.status).toBe("raw-summary-fallback-selected");
    expect(decision.queryCompatibility.fallbackReason).toBe(
      "missing-bounded-time-window",
    );
    expect(decision.fallback.reason).toBe("missing-bounded-time-window");
    expect(
      decision.reviewerNotes
        .fallbackBeforeRollupRepositoryForUnsupportedQuery,
    ).toBe(true);
    expect(decision.selectedReadPath.readsRollupTables).toBe(false);
  });

  it("falls back before rollup repository usage when the query has unsupported filters", () => {
    const decision = buildRollupSummaryRuntimeReadDecision({
      target: "usage-consumer-summary",
      rollupRuntimeReadEnabled: true,
      rollupDataState: "fresh",
      filters: {
        from: "2026-07-09T00:00:00.000Z",
        to: "2026-07-09T01:00:00.000Z",
        unsupportedDimension: "value",
      },
    });

    expect(decision.status).toBe("raw-summary-fallback-selected");
    expect(decision.queryCompatibility.fallbackReason).toBe(
      "unsupported-query-filter",
    );
    expect(decision.fallback.reason).toBe("unsupported-query-filter");
    expect(
      decision.reviewerNotes
        .fallbackBeforeRollupRepositoryForUnsupportedQuery,
    ).toBe(true);
    expect(decision.runtimeSwitch.applied).toBe(false);
  });

  it("falls back when the query is compatible but rollup data is stale", () => {
    const decision = buildRollupSummaryRuntimeReadDecision({
      target: "rejected-summary",
      rollupRuntimeReadEnabled: true,
      rollupDataState: "stale",
      filters: {
        from: "2026-07-09T00:00:00.000Z",
        to: "2026-07-09T01:00:00.000Z",
      },
    });

    expect(decision.status).toBe("raw-summary-fallback-selected");
    expect(decision.queryCompatibility.fallbackReason).toBeNull();
    expect(decision.fallback.reason).toBe("rollup-data-stale");
    expect(decision.selectedReadPath).toEqual({
      path: "raw-event-summary",
      readsRawEvents: true,
      readsRollupTables: false,
      affectsQuotaCounting: false,
      deletesRawEvents: false,
    });
  });

  it("keeps the runtime read decision model DB-free and non-destructive", () => {
    const decision = buildRollupSummaryRuntimeReadDecision({
      target: "usage-consumer-summary",
      rollupRuntimeReadEnabled: true,
      rollupDataState: "fresh",
      filters: {
        from: "2026-07-09T00:00:00.000Z",
        to: "2026-07-09T01:00:00.000Z",
      },
    });

    expect(decision.safety).toEqual({
      endpointRuntimeChangedByDecisionModel: false,
      readsDatabaseInDecisionModel: false,
      invokesRepositoryInDecisionModel: false,
      persistsRollups: false,
      mutatesQuotaCounting: false,
      deletesRawEvents: false,
      wiresSchedulerOrBackgroundJob: false,
      wiresRetentionExecution: false,
    });
    expect(decision.reviewerNotes).toEqual({
      selectedSummaryReadsOnly: true,
      preserveCurrentSummaryResponseShape: true,
      fallbackBeforeRollupRepositoryForUnsupportedQuery: false,
      rollupDataMustBeFresh: true,
      rawEventSummaryRemainsFallback: true,
    });
  });
});
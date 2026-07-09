import { describe, expect, it } from "vitest";

import {
  mapApiKeyUsageSummaryRuntimeReadDecisionRequest,
  mapConsumerUsageSummaryRuntimeReadDecisionRequest,
  mapRejectedSummaryRuntimeReadDecisionRequest,
} from "./analytics-rollup-summary-runtime-read-decision-request-mapper.js";

describe("analytics rollup summary runtime read decision request mapper", () => {
  it("maps consumer usage summary filters into a rollup read model decision", () => {
    const mapped = mapConsumerUsageSummaryRuntimeReadDecisionRequest({
      rollupRuntimeReadEnabled: true,
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
    expect(mapped.decision.status).toBe("rollup-read-model-selected");
    expect(mapped.decision.selectedReadPath).toEqual({
      path: "rollup-read-model",
      readsRawEvents: false,
      readsRollupTables: true,
      affectsQuotaCounting: false,
      deletesRawEvents: false,
    });
  });

  it("maps API key usage summary filters to the API key summary target", () => {
    const mapped = mapApiKeyUsageSummaryRuntimeReadDecisionRequest({
      rollupRuntimeReadEnabled: true,
      rollupDataState: "fresh",
      filters: {
        from: new Date("2026-07-09T00:00:00.000Z"),
        to: new Date("2026-07-09T01:00:00.000Z"),
        routeMethod: "POST",
      },
    });

    expect(mapped.source).toBe("usage-api-key-summary-route");
    expect(mapped.target).toBe("usage-api-key-summary");
    expect(mapped.decision.target).toBe("usage-api-key-summary");
    expect(mapped.decision.status).toBe("rollup-read-model-selected");
  });

  it("maps rejected summary filters into the rejected summary target", () => {
    const mapped = mapRejectedSummaryRuntimeReadDecisionRequest({
      rollupRuntimeReadEnabled: true,
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
    expect(mapped.decision.status).toBe("rollup-read-model-selected");
    expect(mapped.decision.queryCompatibility.currentRawSummaryQuery).toEqual({
      remainsRuntimeDefault: true,
      supportsCurrentUnboundedQueryBehavior: true,
      sourceOfTruth: "gateway.api_rejected_events",
    });
  });

  it("keeps unbounded route requests on raw summary fallback before rollup repository usage", () => {
    const mapped = mapConsumerUsageSummaryRuntimeReadDecisionRequest({
      rollupRuntimeReadEnabled: true,
      rollupDataState: "fresh",
      filters: {
        routePath: "/api/products",
      },
    });

    expect(mapped.decision.status).toBe("raw-summary-fallback-selected");
    expect(mapped.decision.fallback.reason).toBe(
      "missing-bounded-time-window",
    );
    expect(mapped.decision.selectedReadPath).toEqual({
      path: "raw-event-summary",
      readsRawEvents: true,
      readsRollupTables: false,
      affectsQuotaCounting: false,
      deletesRawEvents: false,
    });
    expect(
      mapped.decision.reviewerNotes
        .fallbackBeforeRollupRepositoryForUnsupportedQuery,
    ).toBe(true);
  });

  it("omits absent optional route filters before runtime decision evaluation", () => {
    const mapped = mapRejectedSummaryRuntimeReadDecisionRequest({
      rollupRuntimeReadEnabled: true,
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
    expect(mapped.decision.queryCompatibility.providedFilterKeys).toEqual([
      "from",
      "to",
    ]);
    expect(mapped.decision.status).toBe("rollup-read-model-selected");
  });

  it("keeps the runtime decision request mapper DB-free and non-destructive", () => {
    const mapped = mapApiKeyUsageSummaryRuntimeReadDecisionRequest({
      rollupRuntimeReadEnabled: true,
      rollupDataState: "fresh",
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
      wiresSchedulerOrBackgroundJob: false,
      wiresRetentionExecution: false,
    });
    expect(mapped.decision.safety).toEqual({
      endpointRuntimeChangedByDecisionModel: false,
      readsDatabaseInDecisionModel: false,
      invokesRepositoryInDecisionModel: false,
      persistsRollups: false,
      mutatesQuotaCounting: false,
      deletesRawEvents: false,
      wiresSchedulerOrBackgroundJob: false,
      wiresRetentionExecution: false,
    });
  });
});
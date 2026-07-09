import { describe, expect, it } from "vitest";

import {
  mapApiKeyUsageSummaryRuntimeReadDecisionRequest,
  mapConsumerUsageSummaryRuntimeReadDecisionRequest,
  mapRejectedSummaryRuntimeReadDecisionRequest,
} from "./analytics-rollup-summary-runtime-read-decision-request-mapper.js";
import { mapRollupSummaryRuntimeReadDecisionToRollupReadQuery } from "./analytics-rollup-summary-runtime-read-query-mapper.js";

describe("analytics rollup summary runtime read query mapper", () => {
  it("maps a consumer usage summary decision into a usage rollup read query", () => {
    const decisionRequest = mapConsumerUsageSummaryRuntimeReadDecisionRequest({
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

    const result = mapRollupSummaryRuntimeReadDecisionToRollupReadQuery({
      decisionRequest,
      subjectId: "consumer-1",
      granularity: "hour",
      limit: 500,
      maxBuckets: 24,
    });

    expect(result.status).toBe("rollup-read-query-mapped");
    expect(result.fallback).toEqual({
      path: "raw-event-summary",
      required: false,
      reason: null,
    });
    expect(result.query).toMatchObject({
      source: "usage",
      granularity: "hour",
      filters: {
        consumerId: "consumer-1",
        routePath: "/api/products",
        routeMethod: "GET",
        statusCode: 200,
        cacheStatus: "HIT",
        apiKeyAuthSource: "database",
      },
      limit: 500,
    });
    expect(result.query?.windowPlan.rebuildFrom).toEqual(
      new Date("2026-07-09T00:00:00.000Z"),
    );
    expect(result.query?.windowPlan.rebuildTo).toEqual(
      new Date("2026-07-09T01:00:00.000Z"),
    );
  });

  it("maps an API key usage summary decision into a usage rollup read query", () => {
    const decisionRequest = mapApiKeyUsageSummaryRuntimeReadDecisionRequest({
      rollupRuntimeReadEnabled: true,
      rollupDataState: "fresh",
      filters: {
        from: new Date("2026-07-09T00:00:00.000Z"),
        to: new Date("2026-07-09T01:00:00.000Z"),
        routeMethod: "POST",
      },
    });

    const result = mapRollupSummaryRuntimeReadDecisionToRollupReadQuery({
      decisionRequest,
      subjectId: "api-key-1",
    });

    expect(result.status).toBe("rollup-read-query-mapped");
    expect(result.query).toMatchObject({
      source: "usage",
      granularity: "hour",
      filters: {
        apiKeyId: "api-key-1",
        routeMethod: "POST",
      },
    });
  });

  it("maps a rejected summary decision into a rejected rollup read query", () => {
    const decisionRequest = mapRejectedSummaryRuntimeReadDecisionRequest({
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
        apiKeyId: "api-key-1",
        consumerId: "consumer-1",
      },
    });

    const result = mapRollupSummaryRuntimeReadDecisionToRollupReadQuery({
      decisionRequest,
      granularity: "day",
      limit: 250,
      maxBuckets: 31,
    });

    expect(result.status).toBe("rollup-read-query-mapped");
    expect(result.query).toMatchObject({
      source: "rejected",
      granularity: "day",
      filters: {
        rejectionReason: "API_KEY_MISSING",
        statusCode: 401,
        routePath: "/api/products",
        routeMethod: "GET",
        apiKeyAuthSource: "missing",
        apiKeyId: "api-key-1",
        consumerId: "consumer-1",
      },
      limit: 250,
    });
  });

  it("skips rollup query mapping when decision selects raw fallback", () => {
    const decisionRequest = mapConsumerUsageSummaryRuntimeReadDecisionRequest({
      rollupRuntimeReadEnabled: true,
      rollupDataState: "fresh",
      filters: {
        routePath: "/api/products",
      },
    });

    const result = mapRollupSummaryRuntimeReadDecisionToRollupReadQuery({
      decisionRequest,
      subjectId: "consumer-1",
    });

    expect(result).toEqual({
      status: "rollup-read-query-skipped",
      query: null,
      selectedReadPath: "raw-event-summary",
      fallback: {
        path: "raw-event-summary",
        required: true,
        reason: "missing-bounded-time-window",
      },
      mapperSafety: expectedMapperSafety(),
    });
  });

  it("fails fast when a selected consumer usage query is missing subjectId", () => {
    const decisionRequest = mapConsumerUsageSummaryRuntimeReadDecisionRequest({
      rollupRuntimeReadEnabled: true,
      rollupDataState: "fresh",
      filters: {
        from: new Date("2026-07-09T00:00:00.000Z"),
        to: new Date("2026-07-09T01:00:00.000Z"),
      },
    });

    expect(() =>
      mapRollupSummaryRuntimeReadDecisionToRollupReadQuery({
        decisionRequest,
      }),
    ).toThrow("consumer usage summary rollup query requires subjectId");
  });

  it("keeps query mapper DB-free, repository-free, and non-destructive", () => {
    const decisionRequest = mapRejectedSummaryRuntimeReadDecisionRequest({
      rollupRuntimeReadEnabled: true,
      rollupDataState: "fresh",
      filters: {
        from: new Date("2026-07-09T00:00:00.000Z"),
        to: new Date("2026-07-09T01:00:00.000Z"),
      },
    });

    const result = mapRollupSummaryRuntimeReadDecisionToRollupReadQuery({
      decisionRequest,
    });

    expect(result.mapperSafety).toEqual(expectedMapperSafety());
    expect(result.query?.source).toBe("rejected");
  });
});

function expectedMapperSafety() {
  return {
    endpointRuntimeChangedByMapper: false,
    readsDatabaseInMapper: false,
    invokesRepositoryInMapper: false,
    persistsRollups: false,
    mutatesQuotaCounting: false,
    deletesRawEvents: false,
    wiresSchedulerOrBackgroundJob: false,
    wiresRetentionExecution: false,
  };
}
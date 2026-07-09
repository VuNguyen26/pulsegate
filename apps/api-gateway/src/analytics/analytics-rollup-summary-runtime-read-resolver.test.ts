import { describe, expect, it } from "vitest";

import type { ApiRejectedEventsSummaryReadModel } from "../api-rejections/api-rejected-events-summary.types.js";
import type { ApiUsageSummaryReadModel } from "../api-usage/api-usage-summary.types.js";
import type { AnalyticsRejectedRollupReadRecord } from "./analytics-rejected-rollup-read.repository.js";
import {
  mapConsumerUsageSummaryRuntimeReadDecisionRequest,
  mapRejectedSummaryRuntimeReadDecisionRequest,
} from "./analytics-rollup-summary-runtime-read-decision-request-mapper.js";
import {
  resolveRejectedSummaryRuntimeReadModel,
  resolveUsageSummaryRuntimeReadModel,
} from "./analytics-rollup-summary-runtime-read-resolver.js";
import type { AnalyticsUsageRollupReadRecord } from "./analytics-usage-rollup-read.repository.js";

describe("analytics rollup summary runtime read resolver", () => {
  it("returns raw usage summary when decision falls back before rollup adapter usage", () => {
    const decisionRequest = mapConsumerUsageSummaryRuntimeReadDecisionRequest({
      rollupRuntimeReadEnabled: false,
      rollupDataState: "fresh",
      filters: {
        from: new Date("2026-07-09T00:00:00.000Z"),
        to: new Date("2026-07-09T01:00:00.000Z"),
      },
    });
    const rawSummary = usageRawSummary();

    const resolved = resolveUsageSummaryRuntimeReadModel({
      decisionRequest,
      rawSummary,
      subjectType: "consumer",
      subjectId: "consumer-1",
      rollupRecords: [
        usageRollupRecord({
          totalRequests: 99,
          successfulRequests: 99,
          totalDurationMs: 990,
        }),
      ],
    });

    expect(resolved.status).toBe("raw-summary-fallback-returned");
    expect(resolved.summary).toBe(rawSummary);
    expect(resolved.selectedReadPath).toEqual({
      path: "raw-event-summary",
      readsRawEvents: true,
      readsRollupTables: false,
      affectsQuotaCounting: false,
      deletesRawEvents: false,
    });
    expect(resolved.rollupAdapterStatus).toBeNull();
    expect(resolved.fallback).toEqual({
      path: "raw-event-summary",
      used: true,
      available: true,
      reason: "rollup-runtime-switch-disabled",
    });
  });

  it("returns mapped usage rollup summary when decision selects rollup read model and records exist", () => {
    const decisionRequest = mapConsumerUsageSummaryRuntimeReadDecisionRequest({
      rollupRuntimeReadEnabled: true,
      rollupDataState: "fresh",
      filters: {
        from: new Date("2026-07-09T00:00:00.000Z"),
        to: new Date("2026-07-09T01:00:00.000Z"),
      },
    });

    const resolved = resolveUsageSummaryRuntimeReadModel({
      decisionRequest,
      rawSummary: usageRawSummary({
        totalRequests: 1,
      }),
      subjectType: "consumer",
      subjectId: "consumer-1",
      rollupRecords: [
        usageRollupRecord({
          totalRequests: 2,
          successfulRequests: 1,
          errorRequests: 1,
          totalDurationMs: 50,
          cacheHits: 1,
          cacheMisses: 1,
          cacheBypasses: 0,
          lastRequestAt: new Date("2026-07-09T00:30:00.000Z"),
        }),
      ],
    });

    expect(resolved.status).toBe("rollup-summary-read-model-returned");
    expect(resolved.summary).toEqual({
      subjectType: "consumer",
      subjectId: "consumer-1",
      totalRequests: 2,
      successfulRequests: 1,
      errorRequests: 1,
      averageDurationMs: 25,
      cacheHits: 1,
      cacheMisses: 1,
      cacheBypasses: 0,
      lastRequestAt: new Date("2026-07-09T00:30:00.000Z"),
    });
    expect(resolved.selectedReadPath).toEqual({
      path: "rollup-read-model",
      readsRawEvents: false,
      readsRollupTables: true,
      affectsQuotaCounting: false,
      deletesRawEvents: false,
    });
    expect(resolved.rollupAdapterStatus).toBe(
      "rollup-summary-read-model-mapped",
    );
    expect(resolved.fallback).toEqual({
      path: "raw-event-summary",
      used: false,
      available: true,
      reason: null,
    });
  });

  it("returns raw usage summary when rollup records are empty after a rollup decision", () => {
    const decisionRequest = mapConsumerUsageSummaryRuntimeReadDecisionRequest({
      rollupRuntimeReadEnabled: true,
      rollupDataState: "fresh",
      filters: {
        from: new Date("2026-07-09T00:00:00.000Z"),
        to: new Date("2026-07-09T01:00:00.000Z"),
      },
    });
    const rawSummary = usageRawSummary({
      totalRequests: 7,
      successfulRequests: 7,
    });

    const resolved = resolveUsageSummaryRuntimeReadModel({
      decisionRequest,
      rawSummary,
      subjectType: "consumer",
      subjectId: "consumer-1",
      rollupRecords: [],
    });

    expect(resolved.status).toBe("raw-summary-fallback-returned");
    expect(resolved.summary).toBe(rawSummary);
    expect(resolved.rollupAdapterStatus).toBe(
      "rollup-summary-read-model-empty",
    );
    expect(resolved.fallback.reason).toBe("rollup-data-empty");
    expect(resolved.selectedReadPath.readsRollupTables).toBe(false);
  });

  it("returns mapped rejected rollup summary when decision selects rollup read model and records exist", () => {
    const filters = {
      from: new Date("2026-07-09T00:00:00.000Z"),
      to: new Date("2026-07-09T01:00:00.000Z"),
    };
    const decisionRequest = mapRejectedSummaryRuntimeReadDecisionRequest({
      rollupRuntimeReadEnabled: true,
      rollupDataState: "fresh",
      filters,
    });

    const resolved = resolveRejectedSummaryRuntimeReadModel({
      decisionRequest,
      rawSummary: rejectedRawSummary({
        totalRejectedRequests: 1,
      }),
      filters,
      rollupRecords: [
        rejectedRollupRecord({
          rejectionReason: "API_KEY_MISSING",
          statusCode: 401,
          totalRejectedRequests: 2,
          lastRejectedAt: new Date("2026-07-09T00:10:00.000Z"),
        }),
        rejectedRollupRecord({
          rejectionReason: "RATE_LIMIT_EXCEEDED",
          statusCode: 429,
          totalRejectedRequests: 3,
          lastRejectedAt: new Date("2026-07-09T00:40:00.000Z"),
        }),
      ],
    });

    expect(resolved.status).toBe("rollup-summary-read-model-returned");
    expect(resolved.summary).toEqual({
      totalRejectedRequests: 5,
      byReason: [
        {
          rejectionReason: "API_KEY_MISSING",
          count: 2,
        },
        {
          rejectionReason: "RATE_LIMIT_EXCEEDED",
          count: 3,
        },
      ],
      byStatusCode: [
        {
          statusCode: 401,
          count: 2,
        },
        {
          statusCode: 429,
          count: 3,
        },
      ],
      lastRejectedAt: new Date("2026-07-09T00:40:00.000Z"),
      filters,
    });
    expect(resolved.fallback.used).toBe(false);
    expect(resolved.selectedReadPath.path).toBe("rollup-read-model");
  });

  it("returns raw rejected summary when rejected query is unbounded", () => {
    const decisionRequest = mapRejectedSummaryRuntimeReadDecisionRequest({
      rollupRuntimeReadEnabled: true,
      rollupDataState: "fresh",
      filters: {
        rejectionReason: "API_KEY_MISSING",
      },
    });
    const rawSummary = rejectedRawSummary();

    const resolved = resolveRejectedSummaryRuntimeReadModel({
      decisionRequest,
      rawSummary,
      filters: {
        rejectionReason: "API_KEY_MISSING",
      },
      rollupRecords: [
        rejectedRollupRecord({
          totalRejectedRequests: 99,
        }),
      ],
    });

    expect(resolved.status).toBe("raw-summary-fallback-returned");
    expect(resolved.summary).toBe(rawSummary);
    expect(resolved.rollupAdapterStatus).toBeNull();
    expect(resolved.fallback.reason).toBe("missing-bounded-time-window");
  });

  it("keeps resolver DB-free, repository-free, and non-destructive", () => {
    const decisionRequest = mapConsumerUsageSummaryRuntimeReadDecisionRequest({
      rollupRuntimeReadEnabled: true,
      rollupDataState: "fresh",
      filters: {
        from: new Date("2026-07-09T00:00:00.000Z"),
        to: new Date("2026-07-09T01:00:00.000Z"),
      },
    });

    const resolved = resolveUsageSummaryRuntimeReadModel({
      decisionRequest,
      rawSummary: usageRawSummary(),
      subjectType: "consumer",
      subjectId: "consumer-1",
      rollupRecords: [
        usageRollupRecord({
          totalRequests: 1,
        }),
      ],
    });

    expect(resolved.resolverSafety).toEqual({
      endpointRuntimeChangedByResolver: false,
      readsDatabaseInResolver: false,
      invokesRepositoryInResolver: false,
      usesProvidedRollupRecordsOnly: true,
      persistsRollups: false,
      mutatesQuotaCounting: false,
      deletesRawEvents: false,
      wiresSchedulerOrBackgroundJob: false,
      wiresRetentionExecution: false,
      preservesCurrentSummaryResponseShape: true,
    });
  });

  it("fails fast when a usage resolver receives a rejected summary decision", () => {
    const decisionRequest = mapRejectedSummaryRuntimeReadDecisionRequest({
      rollupRuntimeReadEnabled: true,
      rollupDataState: "fresh",
      filters: {
        from: new Date("2026-07-09T00:00:00.000Z"),
        to: new Date("2026-07-09T01:00:00.000Z"),
      },
    });

    expect(() =>
      resolveUsageSummaryRuntimeReadModel({
        decisionRequest,
        rawSummary: usageRawSummary(),
        subjectType: "consumer",
        subjectId: "consumer-1",
        rollupRecords: [],
      }),
    ).toThrow("usage summary runtime resolver requires a usage summary target");
  });
});

function usageRawSummary(
  overrides: Partial<ApiUsageSummaryReadModel> = {},
): ApiUsageSummaryReadModel {
  return {
    subjectType: "consumer",
    subjectId: "consumer-1",
    totalRequests: 10,
    successfulRequests: 9,
    errorRequests: 1,
    averageDurationMs: 20,
    cacheHits: 2,
    cacheMisses: 7,
    cacheBypasses: 1,
    lastRequestAt: new Date("2026-07-09T00:55:00.000Z"),
    ...overrides,
  };
}

function rejectedRawSummary(
  overrides: Partial<ApiRejectedEventsSummaryReadModel> = {},
): ApiRejectedEventsSummaryReadModel {
  return {
    totalRejectedRequests: 4,
    byReason: [
      {
        rejectionReason: "API_KEY_MISSING",
        count: 4,
      },
    ],
    byStatusCode: [
      {
        statusCode: 401,
        count: 4,
      },
    ],
    lastRejectedAt: new Date("2026-07-09T00:45:00.000Z"),
    filters: {},
    ...overrides,
  };
}

function usageRollupRecord(
  overrides: Partial<AnalyticsUsageRollupReadRecord>,
): AnalyticsUsageRollupReadRecord {
  const bucketStart = new Date("2026-07-09T00:00:00.000Z");
  const bucketEnd = new Date("2026-07-09T01:00:00.000Z");

  return {
    id: "usage-rollup",
    granularity: "hour",
    bucketStart,
    bucketEnd,
    dimensionHash: "dimension-hash",
    consumerId: "consumer-1",
    apiKeyId: "api-key-1",
    routePath: "/api/products",
    routeMethod: "GET",
    statusClass: "2xx",
    cacheStatus: "HIT",
    apiKeyAuthSource: "database",
    totalRequests: 1,
    successfulRequests: 1,
    errorRequests: 0,
    totalDurationMs: 10,
    averageDurationMs: 10,
    cacheHits: 1,
    cacheMisses: 0,
    cacheBypasses: 0,
    lastRequestAt: bucketStart,
    rolledUpAt: bucketEnd,
    updatedAt: bucketEnd,
    ...overrides,
  };
}

function rejectedRollupRecord(
  overrides: Partial<AnalyticsRejectedRollupReadRecord>,
): AnalyticsRejectedRollupReadRecord {
  const bucketStart = new Date("2026-07-09T00:00:00.000Z");
  const bucketEnd = new Date("2026-07-09T01:00:00.000Z");

  return {
    id: "rejected-rollup",
    granularity: "hour",
    bucketStart,
    bucketEnd,
    dimensionHash: "dimension-hash",
    consumerId: "consumer-1",
    apiKeyId: "api-key-1",
    routePath: "/api/products",
    routeMethod: "GET",
    rejectionReason: "API_KEY_MISSING",
    statusCode: 401,
    apiKeyAuthSource: "missing",
    totalRejectedRequests: 1,
    lastRejectedAt: bucketStart,
    rolledUpAt: bucketEnd,
    updatedAt: bucketEnd,
    ...overrides,
  };
}
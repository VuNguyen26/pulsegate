import { describe, expect, it, vi } from "vitest";

import type { ApiRejectedEventsSummaryReadModel } from "../api-rejections/api-rejected-events-summary.types.js";
import type { ApiUsageSummaryReadModel } from "../api-usage/api-usage-summary.types.js";
import type { AnalyticsRollupReadService } from "./analytics-rollup-read-service.js";
import type { AnalyticsRejectedRollupReadRecord } from "./analytics-rejected-rollup-read.repository.js";
import {
  mapConsumerUsageSummaryRuntimeReadDecisionRequest,
  mapRejectedSummaryRuntimeReadDecisionRequest,
} from "./analytics-rollup-summary-runtime-read-decision-request-mapper.js";
import {
  resolveRejectedSummaryWithRollupRuntimeReadService,
  resolveUsageSummaryWithRollupRuntimeReadService,
} from "./analytics-rollup-summary-runtime-read-service.js";
import type { AnalyticsUsageRollupReadRecord } from "./analytics-usage-rollup-read.repository.js";

describe("analytics rollup summary runtime read service", () => {
  it("returns mapped usage rollup summary when injected rollup read service succeeds", async () => {
    const decisionRequest = mapConsumerUsageSummaryRuntimeReadDecisionRequest({
      rollupRuntimeReadEnabled: true,
      rollupDataState: "fresh",
      filters: {
        from: new Date("2026-07-09T00:00:00.000Z"),
        to: new Date("2026-07-09T01:00:00.000Z"),
      },
    });
    const rollupReadService = fakeRollupReadService({
      source: "usage",
      records: [
        usageRollupRecord({
          totalRequests: 2,
          successfulRequests: 1,
          errorRequests: 1,
          totalDurationMs: 50,
          cacheHits: 1,
          cacheMisses: 1,
          lastRequestAt: new Date("2026-07-09T00:30:00.000Z"),
        }),
      ],
      count: 1,
    });

    const result = await resolveUsageSummaryWithRollupRuntimeReadService({
      decisionRequest,
      rawSummary: usageRawSummary({
        totalRequests: 99,
      }),
      subjectType: "consumer",
      subjectId: "consumer-1",
      rollupReadService,
      granularity: "hour",
      limit: 100,
    });

    expect(result.status).toBe("rollup-summary-runtime-read-returned");
    expect(result.summary).toEqual({
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
    expect(result.rollupReadServiceInvocation).toEqual({
      attempted: true,
      succeeded: true,
      source: "usage",
      recordCount: 1,
      error: null,
    });
    expect(result.fallback).toEqual({
      path: "raw-event-summary",
      used: false,
      reason: null,
    });
    expect(rollupReadService.readRollups).toHaveBeenCalledOnce();
  });

  it("does not invoke rollup read service when query mapping is skipped", async () => {
    const decisionRequest = mapConsumerUsageSummaryRuntimeReadDecisionRequest({
      rollupRuntimeReadEnabled: true,
      rollupDataState: "fresh",
      filters: {
        routePath: "/api/products",
      },
    });
    const rollupReadService = fakeRollupReadService({
      source: "usage",
      records: [],
      count: 0,
    });
    const rawSummary = usageRawSummary({
      totalRequests: 7,
    });

    const result = await resolveUsageSummaryWithRollupRuntimeReadService({
      decisionRequest,
      rawSummary,
      subjectType: "consumer",
      subjectId: "consumer-1",
      rollupReadService,
    });

    expect(result.status).toBe("raw-summary-runtime-fallback-returned");
    expect(result.summary).toBe(rawSummary);
    expect(result.rollupReadServiceInvocation).toEqual({
      attempted: false,
      succeeded: false,
      source: null,
      recordCount: null,
      error: null,
    });
    expect(result.fallback.reason).toBe("missing-bounded-time-window");
    expect(rollupReadService.readRollups).not.toHaveBeenCalled();
  });

  it("falls back to raw usage summary when injected rollup read service fails", async () => {
    const decisionRequest = mapConsumerUsageSummaryRuntimeReadDecisionRequest({
      rollupRuntimeReadEnabled: true,
      rollupDataState: "fresh",
      filters: {
        from: new Date("2026-07-09T00:00:00.000Z"),
        to: new Date("2026-07-09T01:00:00.000Z"),
      },
    });
    const rollupReadService: AnalyticsRollupReadService = {
      readRollups: vi.fn(async () => {
        throw new Error("rollup repository unavailable");
      }),
    };
    const rawSummary = usageRawSummary({
      totalRequests: 5,
    });

    const result = await resolveUsageSummaryWithRollupRuntimeReadService({
      decisionRequest,
      rawSummary,
      subjectType: "consumer",
      subjectId: "consumer-1",
      rollupReadService,
    });

    expect(result.status).toBe("raw-summary-runtime-fallback-returned");
    expect(result.summary).toBe(rawSummary);
    expect(result.rollupReadServiceInvocation).toEqual({
      attempted: true,
      succeeded: false,
      source: null,
      recordCount: null,
      error: {
        name: "Error",
        message: "rollup repository unavailable",
      },
    });
    expect(result.fallback.reason).toBe("rollup-read-service-error");
  });

  it("falls back to raw usage summary when rollup service returns no records", async () => {
    const decisionRequest = mapConsumerUsageSummaryRuntimeReadDecisionRequest({
      rollupRuntimeReadEnabled: true,
      rollupDataState: "fresh",
      filters: {
        from: new Date("2026-07-09T00:00:00.000Z"),
        to: new Date("2026-07-09T01:00:00.000Z"),
      },
    });
    const rawSummary = usageRawSummary({
      totalRequests: 3,
    });

    const result = await resolveUsageSummaryWithRollupRuntimeReadService({
      decisionRequest,
      rawSummary,
      subjectType: "consumer",
      subjectId: "consumer-1",
      rollupReadService: fakeRollupReadService({
        source: "usage",
        records: [],
        count: 0,
      }),
    });

    expect(result.status).toBe("raw-summary-runtime-fallback-returned");
    expect(result.summary).toBe(rawSummary);
    expect(result.resolver.rollupAdapterStatus).toBe(
      "rollup-summary-read-model-empty",
    );
    expect(result.fallback.reason).toBe("rollup-data-empty");
  });

  it("falls back to raw usage summary when rollup service returns the wrong source", async () => {
    const decisionRequest = mapConsumerUsageSummaryRuntimeReadDecisionRequest({
      rollupRuntimeReadEnabled: true,
      rollupDataState: "fresh",
      filters: {
        from: new Date("2026-07-09T00:00:00.000Z"),
        to: new Date("2026-07-09T01:00:00.000Z"),
      },
    });
    const rawSummary = usageRawSummary();

    const result = await resolveUsageSummaryWithRollupRuntimeReadService({
      decisionRequest,
      rawSummary,
      subjectType: "consumer",
      subjectId: "consumer-1",
      rollupReadService: fakeRollupReadService({
        source: "rejected",
        records: [
          rejectedRollupRecord({
            totalRejectedRequests: 1,
          }),
        ],
        count: 1,
      }),
    });

    expect(result.status).toBe("raw-summary-runtime-fallback-returned");
    expect(result.summary).toBe(rawSummary);
    expect(result.rollupReadServiceInvocation).toEqual({
      attempted: true,
      succeeded: true,
      source: "rejected",
      recordCount: 1,
      error: null,
    });
    expect(result.fallback.reason).toBe("rollup-read-service-source-mismatch");
  });

  it("returns mapped rejected rollup summary when injected rollup read service succeeds", async () => {
    const filters = {
      from: new Date("2026-07-09T00:00:00.000Z"),
      to: new Date("2026-07-09T01:00:00.000Z"),
    };
    const decisionRequest = mapRejectedSummaryRuntimeReadDecisionRequest({
      rollupRuntimeReadEnabled: true,
      rollupDataState: "fresh",
      filters,
    });

    const result = await resolveRejectedSummaryWithRollupRuntimeReadService({
      decisionRequest,
      rawSummary: rejectedRawSummary({
        totalRejectedRequests: 1,
      }),
      filters,
      rollupReadService: fakeRollupReadService({
        source: "rejected",
        records: [
          rejectedRollupRecord({
            rejectionReason: "API_KEY_MISSING",
            statusCode: 401,
            totalRejectedRequests: 2,
            lastRejectedAt: new Date("2026-07-09T00:30:00.000Z"),
          }),
        ],
        count: 1,
      }),
    });

    expect(result.status).toBe("rollup-summary-runtime-read-returned");
    expect(result.summary).toEqual({
      totalRejectedRequests: 2,
      byReason: [
        {
          rejectionReason: "API_KEY_MISSING",
          count: 2,
        },
      ],
      byStatusCode: [
        {
          statusCode: 401,
          count: 2,
        },
      ],
      lastRejectedAt: new Date("2026-07-09T00:30:00.000Z"),
      filters,
    });
    expect(result.rollupReadServiceInvocation.source).toBe("rejected");
    expect(result.fallback.used).toBe(false);
  });

  it("keeps service seam route-free and non-destructive", async () => {
    const decisionRequest = mapRejectedSummaryRuntimeReadDecisionRequest({
      rollupRuntimeReadEnabled: true,
      rollupDataState: "fresh",
      filters: {
        from: new Date("2026-07-09T00:00:00.000Z"),
        to: new Date("2026-07-09T01:00:00.000Z"),
      },
    });

    const result = await resolveRejectedSummaryWithRollupRuntimeReadService({
      decisionRequest,
      rawSummary: rejectedRawSummary(),
      rollupReadService: fakeRollupReadService({
        source: "rejected",
        records: [
          rejectedRollupRecord({
            totalRejectedRequests: 1,
          }),
        ],
        count: 1,
      }),
    });

    expect(result.serviceSafety).toEqual({
      endpointRuntimeChangedByService: false,
      routeRuntimeWiredByService: false,
      usesInjectedRollupReadServiceOnly: true,
      readsDatabaseDirectlyInService: false,
      repositoryInvocationDependsOnInjectedService: true,
      persistsRollups: false,
      mutatesQuotaCounting: false,
      deletesRawEvents: false,
      wiresSchedulerOrBackgroundJob: false,
      wiresRetentionExecution: false,
      preservesCurrentSummaryResponseShape: true,
    });
  });
});

function fakeRollupReadService(
  result:
    | {
        readonly source: "usage";
        readonly records: readonly AnalyticsUsageRollupReadRecord[];
        readonly count: number;
      }
    | {
        readonly source: "rejected";
        readonly records: readonly AnalyticsRejectedRollupReadRecord[];
        readonly count: number;
      },
): AnalyticsRollupReadService {
  if (result.source === "usage") {
    const usageResult = result;

    return {
      readRollups: vi.fn(async () => ({
        source: "usage" as const,
        records: [...usageResult.records],
        count: usageResult.count,
      })),
    };
  }

  const rejectedResult = result;

  return {
    readRollups: vi.fn(async () => ({
      source: "rejected" as const,
      records: [...rejectedResult.records],
      count: rejectedResult.count,
    })),
  };
}

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
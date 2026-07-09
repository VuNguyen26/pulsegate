import { describe, expect, it } from "vitest";

import type { AnalyticsRejectedRollupReadRecord } from "./analytics-rejected-rollup-read.repository.js";
import {
  mapRejectedRollupRecordsToRejectedSummaryReadModel,
  mapUsageRollupRecordsToUsageSummaryReadModel,
} from "./analytics-rollup-summary-read-model-adapter.js";
import type { AnalyticsUsageRollupReadRecord } from "./analytics-usage-rollup-read.repository.js";

describe("analytics rollup summary read model adapter", () => {
  it("maps usage rollup records into the current consumer usage summary read model shape", () => {
    const result = mapUsageRollupRecordsToUsageSummaryReadModel({
      subjectType: "consumer",
      subjectId: "consumer-1",
      records: [
        usageRollupRecord({
          id: "usage-rollup-1",
          totalRequests: 3,
          successfulRequests: 2,
          errorRequests: 1,
          totalDurationMs: 90,
          cacheHits: 1,
          cacheMisses: 1,
          cacheBypasses: 1,
          lastRequestAt: new Date("2026-07-09T00:20:00.000Z"),
        }),
        usageRollupRecord({
          id: "usage-rollup-2",
          totalRequests: 2,
          successfulRequests: 2,
          errorRequests: 0,
          totalDurationMs: 60,
          cacheHits: 2,
          cacheMisses: 0,
          cacheBypasses: 0,
          lastRequestAt: new Date("2026-07-09T00:50:00.000Z"),
        }),
      ],
    });

    expect(result).toEqual({
      status: "rollup-summary-read-model-mapped",
      summary: {
        subjectType: "consumer",
        subjectId: "consumer-1",
        totalRequests: 5,
        successfulRequests: 4,
        errorRequests: 1,
        averageDurationMs: 30,
        cacheHits: 3,
        cacheMisses: 1,
        cacheBypasses: 1,
        lastRequestAt: new Date("2026-07-09T00:50:00.000Z"),
      },
      fallback: {
        path: "raw-event-summary",
        available: true,
        required: false,
        reason: null,
      },
      adapterSafety: expectedAdapterSafety(),
    });
  });

  it("maps usage rollup records into the current API key usage summary read model shape", () => {
    const result = mapUsageRollupRecordsToUsageSummaryReadModel({
      subjectType: "apiKey",
      subjectId: "api-key-1",
      records: [
        usageRollupRecord({
          id: "usage-rollup-1",
          totalRequests: 1,
          successfulRequests: 0,
          errorRequests: 1,
          totalDurationMs: 25,
          cacheHits: 0,
          cacheMisses: 1,
          cacheBypasses: 0,
          lastRequestAt: new Date("2026-07-09T00:10:00.000Z"),
        }),
      ],
    });

    expect(result.summary).toEqual({
      subjectType: "apiKey",
      subjectId: "api-key-1",
      totalRequests: 1,
      successfulRequests: 0,
      errorRequests: 1,
      averageDurationMs: 25,
      cacheHits: 0,
      cacheMisses: 1,
      cacheBypasses: 0,
      lastRequestAt: new Date("2026-07-09T00:10:00.000Z"),
    });
  });

  it("falls back when usage rollup records are empty", () => {
    const result = mapUsageRollupRecordsToUsageSummaryReadModel({
      subjectType: "consumer",
      subjectId: "consumer-1",
      records: [],
    });

    expect(result).toEqual({
      status: "rollup-summary-read-model-empty",
      summary: null,
      fallback: {
        path: "raw-event-summary",
        available: true,
        required: true,
        reason: "rollup-data-empty",
      },
      adapterSafety: expectedAdapterSafety(),
    });
  });

  it("maps rejected rollup records into the current rejected summary read model shape", () => {
    const filters = {
      from: new Date("2026-07-09T00:00:00.000Z"),
      to: new Date("2026-07-09T01:00:00.000Z"),
      routePath: "/api/products",
    };

    const result = mapRejectedRollupRecordsToRejectedSummaryReadModel({
      filters,
      records: [
        rejectedRollupRecord({
          id: "rejected-rollup-1",
          rejectionReason: "API_KEY_MISSING",
          statusCode: 401,
          totalRejectedRequests: 2,
          lastRejectedAt: new Date("2026-07-09T00:15:00.000Z"),
        }),
        rejectedRollupRecord({
          id: "rejected-rollup-2",
          rejectionReason: "RATE_LIMIT_EXCEEDED",
          statusCode: 429,
          totalRejectedRequests: 3,
          lastRejectedAt: new Date("2026-07-09T00:45:00.000Z"),
        }),
        rejectedRollupRecord({
          id: "rejected-rollup-3",
          rejectionReason: "API_KEY_MISSING",
          statusCode: 401,
          totalRejectedRequests: 1,
          lastRejectedAt: new Date("2026-07-09T00:30:00.000Z"),
        }),
      ],
    });

    expect(result).toEqual({
      status: "rollup-summary-read-model-mapped",
      summary: {
        totalRejectedRequests: 6,
        byReason: [
          {
            rejectionReason: "API_KEY_MISSING",
            count: 3,
          },
          {
            rejectionReason: "RATE_LIMIT_EXCEEDED",
            count: 3,
          },
        ],
        byStatusCode: [
          {
            statusCode: 401,
            count: 3,
          },
          {
            statusCode: 429,
            count: 3,
          },
        ],
        lastRejectedAt: new Date("2026-07-09T00:45:00.000Z"),
        filters,
      },
      fallback: {
        path: "raw-event-summary",
        available: true,
        required: false,
        reason: null,
      },
      adapterSafety: expectedAdapterSafety(),
    });
  });

  it("falls back when rejected rollup records are empty", () => {
    const result = mapRejectedRollupRecordsToRejectedSummaryReadModel({
      filters: {
        from: new Date("2026-07-09T00:00:00.000Z"),
        to: new Date("2026-07-09T01:00:00.000Z"),
      },
      records: [],
    });

    expect(result.status).toBe("rollup-summary-read-model-empty");
    expect(result.summary).toBeNull();
    expect(result.fallback).toEqual({
      path: "raw-event-summary",
      available: true,
      required: true,
      reason: "rollup-data-empty",
    });
    expect(result.adapterSafety).toEqual(expectedAdapterSafety());
  });

  it("keeps the adapter DB-free, repository-free, and non-destructive", () => {
    const result = mapUsageRollupRecordsToUsageSummaryReadModel({
      subjectType: "consumer",
      subjectId: "consumer-1",
      records: [
        usageRollupRecord({
          id: "usage-rollup-1",
          totalRequests: 1,
          successfulRequests: 1,
          errorRequests: 0,
          totalDurationMs: 10,
          cacheHits: 1,
          cacheMisses: 0,
          cacheBypasses: 0,
          lastRequestAt: new Date("2026-07-09T00:10:00.000Z"),
        }),
      ],
    });

    expect(result.adapterSafety).toEqual(expectedAdapterSafety());
  });
});

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

function expectedAdapterSafety() {
  return {
    readsDatabaseInAdapter: false,
    invokesRepositoryInAdapter: false,
    persistsRollups: false,
    mutatesQuotaCounting: false,
    deletesRawEvents: false,
    wiresSchedulerOrBackgroundJob: false,
    wiresRetentionExecution: false,
    preservesCurrentSummaryResponseShape: true,
  };
}
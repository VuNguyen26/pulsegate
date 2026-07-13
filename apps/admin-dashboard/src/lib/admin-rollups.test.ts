import { describe, expect, it } from "vitest";

import {
  isDashboardRollupRead,
} from "./admin-rollups";

const window = {
  requestedFrom: "2026-07-05T10:15:00.000Z",
  requestedTo: "2026-07-05T13:00:00.000Z",
  rebuildFrom: "2026-07-05T10:00:00.000Z",
  rebuildTo: "2026-07-05T13:00:00.000Z",
  bucketCount: 3,
};

const commonFilters = {
  routePath: null,
  routeMethod: "GET",
  statusCode: 200,
  apiKeyAuthSource: "DATABASE",
  apiKeyId: "api_key_1",
  consumerId: "consumer_mobile",
};

describe("isDashboardRollupRead", () => {
  it("accepts a usage rollup response", () => {
    expect(
      isDashboardRollupRead({
        source: "usage",
        granularity: "hour",
        window,
        limit: 25,
        filters: {
          ...commonFilters,
          cacheStatus: "HIT",
        },
        count: 1,
        items: [
          {
            id: "usage-rollup-1",
            granularity: "hour",
            bucketStart:
              "2026-07-05T10:00:00.000Z",
            bucketEnd:
              "2026-07-05T11:00:00.000Z",
            dimensionHash:
              "usage-dimension-hash-1",
            consumerId: "consumer_mobile",
            apiKeyId: "api_key_1",
            routePath: "/api/products/:id",
            routeMethod: "GET",
            statusClass: "2xx",
            cacheStatus: "HIT",
            apiKeyAuthSource: "DATABASE",
            totalRequests: 10,
            successfulRequests: 10,
            errorRequests: 0,
            totalDurationMs: 1200,
            averageDurationMs: 120,
            cacheHits: 7,
            cacheMisses: 2,
            cacheBypasses: 1,
            lastRequestAt:
              "2026-07-05T10:59:00.000Z",
            rolledUpAt:
              "2026-07-05T11:01:00.000Z",
            updatedAt:
              "2026-07-05T11:01:00.000Z",
          },
        ],
      }),
    ).toBe(true);
  });

  it("accepts a rejected rollup response", () => {
    expect(
      isDashboardRollupRead({
        source: "rejected",
        granularity: "hour",
        window,
        limit: 25,
        filters: {
          routePath: null,
          routeMethod: "GET",
          statusCode: 401,
          apiKeyAuthSource: "MISSING",
          apiKeyId: null,
          consumerId: null,
          rejectionReason: "API_KEY_MISSING",
        },
        count: 1,
        items: [
          {
            id: "rejected-rollup-1",
            granularity: "hour",
            bucketStart:
              "2026-07-05T10:00:00.000Z",
            bucketEnd:
              "2026-07-05T11:00:00.000Z",
            dimensionHash:
              "rejected-dimension-hash-1",
            consumerId: null,
            apiKeyId: null,
            routePath: "/api/products/:id",
            routeMethod: "GET",
            rejectionReason:
              "API_KEY_MISSING",
            statusCode: 401,
            apiKeyAuthSource: "MISSING",
            totalRejectedRequests: 5,
            lastRejectedAt:
              "2026-07-05T10:59:00.000Z",
            rolledUpAt:
              "2026-07-05T11:01:00.000Z",
            updatedAt:
              "2026-07-05T11:01:00.000Z",
          },
        ],
      }),
    ).toBe(true);
  });

  it("rejects mixed-source fields", () => {
    expect(
      isDashboardRollupRead({
        source: "rejected",
        granularity: "hour",
        window,
        limit: 25,
        filters: {
          ...commonFilters,
          cacheStatus: "HIT",
        },
        count: 0,
        items: [],
      }),
    ).toBe(false);
  });

  it("rejects extra fields and oversized arrays", () => {
    expect(
      isDashboardRollupRead({
        source: "usage",
        granularity: "hour",
        window,
        limit: 25,
        filters: {
          ...commonFilters,
          cacheStatus: "HIT",
        },
        count: 0,
        items: [],
        readOnlyApiKey: "must-not-cross-bff",
      }),
    ).toBe(false);

    expect(
      isDashboardRollupRead({
        source: "usage",
        granularity: "hour",
        window,
        limit: 1,
        filters: {
          ...commonFilters,
          cacheStatus: "HIT",
        },
        count: 2,
        items: [{}, {}],
      }),
    ).toBe(false);
  });
});
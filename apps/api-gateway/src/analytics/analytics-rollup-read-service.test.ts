import { describe, expect, it, vi } from "vitest";
import {
  ApiRejectionReason,
  GatewayRouteMethod,
} from "../generated/prisma/index.js";
import type {
  AnalyticsRejectedRollupReadRepository,
} from "./analytics-rejected-rollup-read.repository.js";
import { createAnalyticsRollupReadQuery } from "./analytics-rollup-read-query.js";
import { createAnalyticsRollupReadService } from "./analytics-rollup-read-service.js";
import type {
  AnalyticsUsageRollupReadRepository,
} from "./analytics-usage-rollup-read.repository.js";

function createMockDependencies() {
  const usageRecord = {
    id: "usage-rollup-1",
    granularity: "hour",
    bucketStart: new Date("2026-07-05T10:00:00.000Z"),
    bucketEnd: new Date("2026-07-05T11:00:00.000Z"),
    dimensionHash: "usage-dimension-hash-1",
    consumerId: "consumer-1",
    apiKeyId: "api-key-1",
    routePath: "/api/products",
    routeMethod: GatewayRouteMethod.GET,
    statusClass: "2xx",
    cacheStatus: "HIT",
    apiKeyAuthSource: "DATABASE",
    totalRequests: 10,
    successfulRequests: 10,
    errorRequests: 0,
    totalDurationMs: 1200,
    averageDurationMs: 120,
    cacheHits: 10,
    cacheMisses: 0,
    cacheBypasses: 0,
    lastRequestAt: new Date("2026-07-05T10:59:00.000Z"),
    rolledUpAt: new Date("2026-07-05T11:01:00.000Z"),
    updatedAt: new Date("2026-07-05T11:01:00.000Z"),
  };

  const rejectedRecord = {
    id: "rejected-rollup-1",
    granularity: "hour",
    bucketStart: new Date("2026-07-05T10:00:00.000Z"),
    bucketEnd: new Date("2026-07-05T11:00:00.000Z"),
    dimensionHash: "rejected-dimension-hash-1",
    consumerId: "consumer-1",
    apiKeyId: "api-key-1",
    routePath: "/api/products",
    routeMethod: GatewayRouteMethod.GET,
    rejectionReason: ApiRejectionReason.API_KEY_MISSING,
    statusCode: 401,
    apiKeyAuthSource: "MISSING",
    totalRejectedRequests: 5,
    lastRejectedAt: new Date("2026-07-05T10:59:00.000Z"),
    rolledUpAt: new Date("2026-07-05T11:01:00.000Z"),
    updatedAt: new Date("2026-07-05T11:01:00.000Z"),
  };

  const listUsageRollups = vi.fn().mockResolvedValue({
    records: [usageRecord],
    count: 1,
  });
  const listRejectedRollups = vi.fn().mockResolvedValue({
    records: [rejectedRecord],
    count: 1,
  });

  return {
    usageRollupReadRepository: {
      listUsageRollups,
    } satisfies AnalyticsUsageRollupReadRepository,
    rejectedRollupReadRepository: {
      listRejectedRollups,
    } satisfies AnalyticsRejectedRollupReadRepository,
    listUsageRollups,
    listRejectedRollups,
    usageRecord,
    rejectedRecord,
  };
}

describe("createAnalyticsRollupReadService", () => {
  it("should read usage rollups through the usage repository", async () => {
    const dependencies = createMockDependencies();
    const service = createAnalyticsRollupReadService(dependencies);

    const query = createAnalyticsRollupReadQuery({
      from: "2026-07-05T10:15:00.000Z",
      to: "2026-07-05T13:00:00.000Z",
      granularity: "hour",
      source: "usage",
      routePath: "/api/products",
      routeMethod: "get",
      statusCode: "200",
      cacheStatus: "HIT",
      apiKeyAuthSource: "DATABASE",
      apiKeyId: "api-key-1",
      consumerId: "consumer-1",
      limit: "50",
    });

    await expect(service.readRollups(query)).resolves.toEqual({
      source: "usage",
      records: [dependencies.usageRecord],
      count: 1,
    });

    expect(dependencies.listUsageRollups).toHaveBeenCalledTimes(1);
    expect(dependencies.listUsageRollups).toHaveBeenCalledWith(query);
    expect(dependencies.listRejectedRollups).not.toHaveBeenCalled();
  });

  it("should read rejected rollups through the rejected repository", async () => {
    const dependencies = createMockDependencies();
    const service = createAnalyticsRollupReadService(dependencies);

    const query = createAnalyticsRollupReadQuery({
      from: "2026-07-05T10:15:00.000Z",
      to: "2026-07-05T13:00:00.000Z",
      granularity: "hour",
      source: "rejected",
      routePath: "/api/products",
      routeMethod: "get",
      statusCode: "401",
      rejectionReason: "API_KEY_MISSING",
      apiKeyAuthSource: "MISSING",
      apiKeyId: "api-key-1",
      consumerId: "consumer-1",
      limit: "50",
    });

    await expect(service.readRollups(query)).resolves.toEqual({
      source: "rejected",
      records: [dependencies.rejectedRecord],
      count: 1,
    });

    expect(dependencies.listRejectedRollups).toHaveBeenCalledTimes(1);
    expect(dependencies.listRejectedRollups).toHaveBeenCalledWith(query);
    expect(dependencies.listUsageRollups).not.toHaveBeenCalled();
  });

  it("should return empty usage read results", async () => {
    const dependencies = createMockDependencies();
    dependencies.listUsageRollups.mockResolvedValueOnce({
      records: [],
      count: 0,
    });
    const service = createAnalyticsRollupReadService(dependencies);

    const query = createAnalyticsRollupReadQuery({
      from: "2026-07-05T10:15:00.000Z",
      to: "2026-07-05T13:00:00.000Z",
      granularity: "hour",
      source: "usage",
    });

    await expect(service.readRollups(query)).resolves.toEqual({
      source: "usage",
      records: [],
      count: 0,
    });
  });

  it("should return empty rejected read results", async () => {
    const dependencies = createMockDependencies();
    dependencies.listRejectedRollups.mockResolvedValueOnce({
      records: [],
      count: 0,
    });
    const service = createAnalyticsRollupReadService(dependencies);

    const query = createAnalyticsRollupReadQuery({
      from: "2026-07-05T10:15:00.000Z",
      to: "2026-07-05T13:00:00.000Z",
      granularity: "hour",
      source: "rejected",
    });

    await expect(service.readRollups(query)).resolves.toEqual({
      source: "rejected",
      records: [],
      count: 0,
    });
  });
});

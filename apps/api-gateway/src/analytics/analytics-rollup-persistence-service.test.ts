import { describe, expect, it, vi } from "vitest";

import {
  ApiRejectionReason,
  GatewayRouteMethod,
} from "../generated/prisma/index.js";
import type { AnalyticsRejectedRollupRepository } from "./analytics-rejected-rollup.repository.js";
import { createAnalyticsRollupPersistenceService } from "./analytics-rollup-persistence-service.js";
import type { AnalyticsUsageRollupRepository } from "./analytics-usage-rollup.repository.js";

function createMockRepositories() {
  const usageUpsertAggregates = vi.fn().mockImplementation((aggregates) =>
    Promise.resolve({
      upsertedCount: aggregates.length,
    }),
  );

  const rejectedUpsertAggregates = vi.fn().mockImplementation((aggregates) =>
    Promise.resolve({
      upsertedCount: aggregates.length,
    }),
  );

  return {
    usageRollupRepository: {
      upsertAggregates: usageUpsertAggregates,
    } satisfies AnalyticsUsageRollupRepository,
    rejectedRollupRepository: {
      upsertAggregates: rejectedUpsertAggregates,
    } satisfies AnalyticsRejectedRollupRepository,
    usageUpsertAggregates,
    rejectedUpsertAggregates,
  };
}

describe("createAnalyticsRollupPersistenceService", () => {
  it("should aggregate and persist usage events", async () => {
    const repositories = createMockRepositories();
    const service = createAnalyticsRollupPersistenceService(repositories);

    await expect(
      service.persistUsageEvents(
        [
          {
            occurredAt: new Date("2026-07-05T14:10:00.000Z"),
            routePath: "/api/products",
            routeMethod: GatewayRouteMethod.GET,
            statusCode: 200,
            durationMs: 100,
            cacheStatus: "HIT",
            apiKeyAuthSource: "DATABASE",
            apiKeyId: "api-key-1",
            consumerId: "consumer-1",
          },
          {
            occurredAt: new Date("2026-07-05T14:20:00.000Z"),
            routePath: "/api/products",
            routeMethod: GatewayRouteMethod.GET,
            statusCode: 201,
            durationMs: 200,
            cacheStatus: "HIT",
            apiKeyAuthSource: "DATABASE",
            apiKeyId: "api-key-1",
            consumerId: "consumer-1",
          },
        ],
        "hour",
      ),
    ).resolves.toEqual({
      inputEventCount: 2,
      aggregateCount: 1,
      upsertedCount: 1,
    });

    expect(repositories.usageUpsertAggregates).toHaveBeenCalledTimes(1);
    expect(repositories.usageUpsertAggregates).toHaveBeenCalledWith([
      expect.objectContaining({
        granularity: "hour",
        bucketStart: new Date("2026-07-05T14:00:00.000Z"),
        bucketEnd: new Date("2026-07-05T15:00:00.000Z"),
        routePath: "/api/products",
        routeMethod: GatewayRouteMethod.GET,
        statusClass: "2xx",
        totalRequests: 2,
        successfulRequests: 2,
        totalDurationMs: 300,
        averageDurationMs: 150,
        cacheHits: 2,
      }),
    ]);
    expect(repositories.rejectedUpsertAggregates).not.toHaveBeenCalled();
  });

  it("should aggregate and persist rejected events", async () => {
    const repositories = createMockRepositories();
    const service = createAnalyticsRollupPersistenceService(repositories);

    await expect(
      service.persistRejectedEvents(
        [
          {
            occurredAt: new Date("2026-07-05T14:10:00.000Z"),
            routePath: "/api/products",
            routeMethod: GatewayRouteMethod.GET,
            statusCode: 401,
            rejectionReason: ApiRejectionReason.API_KEY_INVALID,
            apiKeyAuthSource: "DATABASE",
            apiKeyId: "api-key-1",
            consumerId: "consumer-1",
          },
          {
            occurredAt: new Date("2026-07-05T14:20:00.000Z"),
            routePath: "/api/products",
            routeMethod: GatewayRouteMethod.GET,
            statusCode: 401,
            rejectionReason: ApiRejectionReason.API_KEY_INVALID,
            apiKeyAuthSource: "DATABASE",
            apiKeyId: "api-key-1",
            consumerId: "consumer-1",
          },
        ],
        "hour",
      ),
    ).resolves.toEqual({
      inputEventCount: 2,
      aggregateCount: 1,
      upsertedCount: 1,
    });

    expect(repositories.rejectedUpsertAggregates).toHaveBeenCalledTimes(1);
    expect(repositories.rejectedUpsertAggregates).toHaveBeenCalledWith([
      expect.objectContaining({
        granularity: "hour",
        bucketStart: new Date("2026-07-05T14:00:00.000Z"),
        bucketEnd: new Date("2026-07-05T15:00:00.000Z"),
        routePath: "/api/products",
        routeMethod: GatewayRouteMethod.GET,
        rejectionReason: ApiRejectionReason.API_KEY_INVALID,
        statusCode: 401,
        totalRejectedRequests: 2,
      }),
    ]);
    expect(repositories.usageUpsertAggregates).not.toHaveBeenCalled();
  });

  it("should handle empty usage and rejected event batches", async () => {
    const repositories = createMockRepositories();
    const service = createAnalyticsRollupPersistenceService(repositories);

    await expect(service.persistUsageEvents([], "hour")).resolves.toEqual({
      inputEventCount: 0,
      aggregateCount: 0,
      upsertedCount: 0,
    });

    await expect(service.persistRejectedEvents([], "day")).resolves.toEqual({
      inputEventCount: 0,
      aggregateCount: 0,
      upsertedCount: 0,
    });

    expect(repositories.usageUpsertAggregates).toHaveBeenCalledWith([]);
    expect(repositories.rejectedUpsertAggregates).toHaveBeenCalledWith([]);
  });
});

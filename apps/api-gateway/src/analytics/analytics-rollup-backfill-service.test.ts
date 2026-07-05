import { describe, expect, it, vi } from "vitest";

import {
  ApiRejectionReason,
  GatewayRouteMethod,
} from "../generated/prisma/index.js";
import type { AnalyticsRejectedRollupEvent } from "./analytics-rejected-rollup-aggregate.js";
import {
  DEFAULT_ANALYTICS_ROLLUP_BACKFILL_EVENT_LIMIT,
  type AnalyticsRollupBackfillEventReader,
} from "./analytics-rollup-backfill-event-reader.js";
import { createAnalyticsRollupBackfillPlan } from "./analytics-rollup-backfill-plan.js";
import { createAnalyticsRollupBackfillService } from "./analytics-rollup-backfill-service.js";
import type { AnalyticsRollupPersistenceService } from "./analytics-rollup-persistence-service.js";
import type { AnalyticsUsageRollupEvent } from "./analytics-usage-rollup-aggregate.js";

function createMockDependencies(options?: {
  usageEvents?: AnalyticsUsageRollupEvent[];
  rejectedEvents?: AnalyticsRejectedRollupEvent[];
}) {
  const usageEvents = options?.usageEvents ?? [];
  const rejectedEvents = options?.rejectedEvents ?? [];

  const listUsageEvents = vi.fn().mockResolvedValue(usageEvents);
  const listRejectedEvents = vi.fn().mockResolvedValue(rejectedEvents);
  const persistUsageEvents = vi.fn().mockImplementation((events) =>
    Promise.resolve({
      inputEventCount: events.length,
      aggregateCount: events.length === 0 ? 0 : 1,
      upsertedCount: events.length === 0 ? 0 : 1,
    }),
  );
  const persistRejectedEvents = vi.fn().mockImplementation((events) =>
    Promise.resolve({
      inputEventCount: events.length,
      aggregateCount: events.length === 0 ? 0 : 1,
      upsertedCount: events.length === 0 ? 0 : 1,
    }),
  );

  return {
    eventReader: {
      listUsageEvents,
      listRejectedEvents,
    } satisfies AnalyticsRollupBackfillEventReader,
    persistenceService: {
      persistUsageEvents,
      persistRejectedEvents,
    } satisfies AnalyticsRollupPersistenceService,
    listUsageEvents,
    listRejectedEvents,
    persistUsageEvents,
    persistRejectedEvents,
  };
}

describe("createAnalyticsRollupBackfillService", () => {
  it("should return a dry-run summary without reading or persisting events", async () => {
    const dependencies = createMockDependencies();
    const service = createAnalyticsRollupBackfillService(dependencies);

    const plan = createAnalyticsRollupBackfillPlan({
      from: "2026-07-05T10:15:00.000Z",
      to: "2026-07-05T13:00:00.000Z",
      granularity: "hour",
    });

    await expect(service.runBackfill({ plan })).resolves.toEqual({
      mode: "dry-run",
      source: "both",
      sources: ["usage", "rejected"],
      granularity: "hour",
      requestedFrom: new Date("2026-07-05T10:15:00.000Z"),
      requestedTo: new Date("2026-07-05T13:00:00.000Z"),
      rebuildFrom: new Date("2026-07-05T10:00:00.000Z"),
      rebuildTo: new Date("2026-07-05T13:00:00.000Z"),
      bucketCount: 3,
      sourceResults: [
        {
          source: "usage",
          status: "planned",
          inputEventCount: 0,
          aggregateCount: 0,
          upsertedCount: 0,
        },
        {
          source: "rejected",
          status: "planned",
          inputEventCount: 0,
          aggregateCount: 0,
          upsertedCount: 0,
        },
      ],
      totalInputEventCount: 0,
      totalAggregateCount: 0,
      totalUpsertedCount: 0,
    });

    expect(dependencies.listUsageEvents).not.toHaveBeenCalled();
    expect(dependencies.listRejectedEvents).not.toHaveBeenCalled();
    expect(dependencies.persistUsageEvents).not.toHaveBeenCalled();
    expect(dependencies.persistRejectedEvents).not.toHaveBeenCalled();
  });

  it("should execute usage backfill by reading and persisting usage events", async () => {
    const usageEvents: AnalyticsUsageRollupEvent[] = [
      {
        occurredAt: new Date("2026-07-05T10:15:00.000Z"),
        routePath: "/api/products",
        routeMethod: GatewayRouteMethod.GET,
        statusCode: 200,
        durationMs: 42,
        cacheStatus: "HIT",
        apiKeyAuthSource: "DATABASE",
        apiKeyId: "api_key_1",
        consumerId: "consumer_1",
      },
    ];

    const dependencies = createMockDependencies({ usageEvents });
    const service = createAnalyticsRollupBackfillService(dependencies);

    const plan = createAnalyticsRollupBackfillPlan({
      from: "2026-07-05T10:15:00.000Z",
      to: "2026-07-05T13:00:00.000Z",
      granularity: "hour",
      source: "usage",
      mode: "execute",
    });

    await expect(
      service.runBackfill({
        plan,
        eventLimit: 500,
      }),
    ).resolves.toMatchObject({
      mode: "execute",
      source: "usage",
      sources: ["usage"],
      granularity: "hour",
      bucketCount: 3,
      sourceResults: [
        {
          source: "usage",
          status: "executed",
          inputEventCount: 1,
          aggregateCount: 1,
          upsertedCount: 1,
        },
      ],
      totalInputEventCount: 1,
      totalAggregateCount: 1,
      totalUpsertedCount: 1,
    });

    expect(dependencies.listUsageEvents).toHaveBeenCalledWith({
      rebuildFrom: new Date("2026-07-05T10:00:00.000Z"),
      rebuildTo: new Date("2026-07-05T13:00:00.000Z"),
      limit: 501,
    });
    expect(dependencies.persistUsageEvents).toHaveBeenCalledWith(
      usageEvents,
      "hour",
    );
    expect(dependencies.listRejectedEvents).not.toHaveBeenCalled();
    expect(dependencies.persistRejectedEvents).not.toHaveBeenCalled();
  });

  it("should execute rejected backfill by reading and persisting rejected events", async () => {
    const rejectedEvents: AnalyticsRejectedRollupEvent[] = [
      {
        occurredAt: new Date("2026-07-05T10:15:00.000Z"),
        routePath: "/api/products",
        routeMethod: GatewayRouteMethod.GET,
        statusCode: 401,
        rejectionReason: ApiRejectionReason.API_KEY_INVALID,
        apiKeyAuthSource: "DATABASE",
        apiKeyId: "api_key_1",
        consumerId: "consumer_1",
      },
    ];

    const dependencies = createMockDependencies({ rejectedEvents });
    const service = createAnalyticsRollupBackfillService(dependencies);

    const plan = createAnalyticsRollupBackfillPlan({
      from: "2026-07-05T10:15:00.000Z",
      to: "2026-07-05T13:00:00.000Z",
      granularity: "hour",
      source: "rejected",
      mode: "execute",
    });

    await expect(service.runBackfill({ plan })).resolves.toMatchObject({
      mode: "execute",
      source: "rejected",
      sources: ["rejected"],
      granularity: "hour",
      sourceResults: [
        {
          source: "rejected",
          status: "executed",
          inputEventCount: 1,
          aggregateCount: 1,
          upsertedCount: 1,
        },
      ],
      totalInputEventCount: 1,
      totalAggregateCount: 1,
      totalUpsertedCount: 1,
    });

    expect(dependencies.listRejectedEvents).toHaveBeenCalledWith({
      rebuildFrom: new Date("2026-07-05T10:00:00.000Z"),
      rebuildTo: new Date("2026-07-05T13:00:00.000Z"),
      limit: DEFAULT_ANALYTICS_ROLLUP_BACKFILL_EVENT_LIMIT + 1,
    });
    expect(dependencies.persistRejectedEvents).toHaveBeenCalledWith(
      rejectedEvents,
      "hour",
    );
    expect(dependencies.listUsageEvents).not.toHaveBeenCalled();
    expect(dependencies.persistUsageEvents).not.toHaveBeenCalled();
  });

  it("should execute both usage and rejected backfill sources", async () => {
    const usageEvents: AnalyticsUsageRollupEvent[] = [
      {
        occurredAt: new Date("2026-07-05T10:15:00.000Z"),
        routePath: "/api/products",
        routeMethod: GatewayRouteMethod.GET,
        statusCode: 200,
        durationMs: 42,
        cacheStatus: "MISS",
        apiKeyAuthSource: "DATABASE",
        apiKeyId: "api_key_1",
        consumerId: "consumer_1",
      },
    ];
    const rejectedEvents: AnalyticsRejectedRollupEvent[] = [
      {
        occurredAt: new Date("2026-07-05T10:20:00.000Z"),
        routePath: "/api/products",
        routeMethod: GatewayRouteMethod.GET,
        statusCode: 429,
        rejectionReason: ApiRejectionReason.QUOTA_EXCEEDED,
        apiKeyAuthSource: "DATABASE",
        apiKeyId: "api_key_1",
        consumerId: "consumer_1",
      },
    ];

    const dependencies = createMockDependencies({
      usageEvents,
      rejectedEvents,
    });
    const service = createAnalyticsRollupBackfillService(dependencies);

    const plan = createAnalyticsRollupBackfillPlan({
      from: "2026-07-05T10:15:00.000Z",
      to: "2026-07-05T13:00:00.000Z",
      granularity: "hour",
      source: "both",
      mode: "execute",
    });

    await expect(service.runBackfill({ plan })).resolves.toMatchObject({
      mode: "execute",
      source: "both",
      sources: ["usage", "rejected"],
      sourceResults: [
        {
          source: "usage",
          status: "executed",
          inputEventCount: 1,
          aggregateCount: 1,
          upsertedCount: 1,
        },
        {
          source: "rejected",
          status: "executed",
          inputEventCount: 1,
          aggregateCount: 1,
          upsertedCount: 1,
        },
      ],
      totalInputEventCount: 2,
      totalAggregateCount: 2,
      totalUpsertedCount: 2,
    });

    expect(dependencies.listUsageEvents).toHaveBeenCalledTimes(1);
    expect(dependencies.listRejectedEvents).toHaveBeenCalledTimes(1);
    expect(dependencies.persistUsageEvents).toHaveBeenCalledWith(
      usageEvents,
      "hour",
    );
    expect(dependencies.persistRejectedEvents).toHaveBeenCalledWith(
      rejectedEvents,
      "hour",
    );
  });

  it("should skip execute safely for an empty rebuild window", async () => {
    const dependencies = createMockDependencies();
    const service = createAnalyticsRollupBackfillService(dependencies);

    const timestamp = "2026-07-05T10:15:00.000Z";
    const plan = createAnalyticsRollupBackfillPlan({
      from: timestamp,
      to: timestamp,
      granularity: "hour",
      source: "both",
      mode: "execute",
    });

    await expect(service.runBackfill({ plan })).resolves.toEqual({
      mode: "execute",
      source: "both",
      sources: ["usage", "rejected"],
      granularity: "hour",
      requestedFrom: new Date(timestamp),
      requestedTo: new Date(timestamp),
      rebuildFrom: null,
      rebuildTo: null,
      bucketCount: 0,
      sourceResults: [
        {
          source: "usage",
          status: "skipped-empty-window",
          inputEventCount: 0,
          aggregateCount: 0,
          upsertedCount: 0,
        },
        {
          source: "rejected",
          status: "skipped-empty-window",
          inputEventCount: 0,
          aggregateCount: 0,
          upsertedCount: 0,
        },
      ],
      totalInputEventCount: 0,
      totalAggregateCount: 0,
      totalUpsertedCount: 0,
    });

    expect(dependencies.listUsageEvents).not.toHaveBeenCalled();
    expect(dependencies.listRejectedEvents).not.toHaveBeenCalled();
    expect(dependencies.persistUsageEvents).not.toHaveBeenCalled();
    expect(dependencies.persistRejectedEvents).not.toHaveBeenCalled();
  });

  it("should reject usage execute before persisting when usage event count exceeds eventLimit", async () => {
    const usageEvents: AnalyticsUsageRollupEvent[] = [
      {
        occurredAt: new Date("2026-07-05T10:15:00.000Z"),
        routePath: "/api/products",
        routeMethod: GatewayRouteMethod.GET,
        statusCode: 200,
        durationMs: 42,
        cacheStatus: "HIT",
        apiKeyAuthSource: "DATABASE",
        apiKeyId: "api_key_1",
        consumerId: "consumer_1",
      },
      {
        occurredAt: new Date("2026-07-05T10:20:00.000Z"),
        routePath: "/api/products",
        routeMethod: GatewayRouteMethod.GET,
        statusCode: 200,
        durationMs: 36,
        cacheStatus: "MISS",
        apiKeyAuthSource: "DATABASE",
        apiKeyId: "api_key_1",
        consumerId: "consumer_1",
      },
    ];

    const dependencies = createMockDependencies({ usageEvents });
    const service = createAnalyticsRollupBackfillService(dependencies);

    const plan = createAnalyticsRollupBackfillPlan({
      from: "2026-07-05T10:15:00.000Z",
      to: "2026-07-05T13:00:00.000Z",
      granularity: "hour",
      source: "usage",
      mode: "execute",
    });

    await expect(
      service.runBackfill({
        plan,
        eventLimit: 1,
      }),
    ).rejects.toThrow(RangeError);

    expect(dependencies.listUsageEvents).toHaveBeenCalledWith({
      rebuildFrom: new Date("2026-07-05T10:00:00.000Z"),
      rebuildTo: new Date("2026-07-05T13:00:00.000Z"),
      limit: 2,
    });
    expect(dependencies.persistUsageEvents).not.toHaveBeenCalled();
  });

  it("should reject rejected execute before persisting when rejected event count exceeds eventLimit", async () => {
    const rejectedEvents: AnalyticsRejectedRollupEvent[] = [
      {
        occurredAt: new Date("2026-07-05T10:15:00.000Z"),
        routePath: "/api/products",
        routeMethod: GatewayRouteMethod.GET,
        statusCode: 401,
        rejectionReason: ApiRejectionReason.API_KEY_INVALID,
        apiKeyAuthSource: "DATABASE",
        apiKeyId: "api_key_1",
        consumerId: "consumer_1",
      },
      {
        occurredAt: new Date("2026-07-05T10:20:00.000Z"),
        routePath: "/api/products",
        routeMethod: GatewayRouteMethod.GET,
        statusCode: 429,
        rejectionReason: ApiRejectionReason.RATE_LIMIT_EXCEEDED,
        apiKeyAuthSource: "DATABASE",
        apiKeyId: "api_key_1",
        consumerId: "consumer_1",
      },
    ];

    const dependencies = createMockDependencies({ rejectedEvents });
    const service = createAnalyticsRollupBackfillService(dependencies);

    const plan = createAnalyticsRollupBackfillPlan({
      from: "2026-07-05T10:15:00.000Z",
      to: "2026-07-05T13:00:00.000Z",
      granularity: "hour",
      source: "rejected",
      mode: "execute",
    });

    await expect(
      service.runBackfill({
        plan,
        eventLimit: 1,
      }),
    ).rejects.toThrow(RangeError);

    expect(dependencies.listRejectedEvents).toHaveBeenCalledWith({
      rebuildFrom: new Date("2026-07-05T10:00:00.000Z"),
      rebuildTo: new Date("2026-07-05T13:00:00.000Z"),
      limit: 2,
    });
    expect(dependencies.persistRejectedEvents).not.toHaveBeenCalled();
  });
});

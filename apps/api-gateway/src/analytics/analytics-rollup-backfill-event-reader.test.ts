import { describe, expect, it, vi } from "vitest";

import {
  ApiRejectionReason,
  GatewayRouteMethod,
  type PrismaClient,
} from "../generated/prisma/index.js";
import type {
  AnalyticsRejectedRollupEvent,
} from "./analytics-rejected-rollup-aggregate.js";
import {
  createPrismaAnalyticsRollupBackfillEventReader,
  DEFAULT_ANALYTICS_ROLLUP_BACKFILL_EVENT_LIMIT,
} from "./analytics-rollup-backfill-event-reader.js";
import type {
  AnalyticsUsageRollupEvent,
} from "./analytics-usage-rollup-aggregate.js";

function createMockPrisma(options: {
  usageEvents?: AnalyticsUsageRollupEvent[];
  rejectedEvents?: AnalyticsRejectedRollupEvent[];
}) {
  const usageFindMany = vi.fn().mockResolvedValue(options.usageEvents ?? []);
  const rejectedFindMany = vi.fn().mockResolvedValue(
    options.rejectedEvents ?? [],
  );

  return {
    prisma: {
      apiUsageEvent: {
        findMany: usageFindMany,
      },
      apiRejectedEvent: {
        findMany: rejectedFindMany,
      },
    } as unknown as PrismaClient,
    usageFindMany,
    rejectedFindMany,
  };
}

describe("createPrismaAnalyticsRollupBackfillEventReader", () => {
  it("should read usage events for a half-open rebuild window", async () => {
    const rebuildFrom = new Date("2026-07-05T10:00:00.000Z");
    const rebuildTo = new Date("2026-07-05T13:00:00.000Z");

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

    const { prisma, usageFindMany, rejectedFindMany } = createMockPrisma({
      usageEvents,
    });

    const reader = createPrismaAnalyticsRollupBackfillEventReader(prisma);

    await expect(
      reader.listUsageEvents({
        rebuildFrom,
        rebuildTo,
        limit: 50,
      }),
    ).resolves.toEqual(usageEvents);

    expect(usageFindMany).toHaveBeenCalledTimes(1);
    expect(usageFindMany).toHaveBeenCalledWith({
      where: {
        occurredAt: {
          gte: rebuildFrom,
          lt: rebuildTo,
        },
      },
      orderBy: [
        {
          occurredAt: "asc",
        },
        {
          id: "asc",
        },
      ],
      take: 50,
      select: {
        occurredAt: true,
        routePath: true,
        routeMethod: true,
        statusCode: true,
        durationMs: true,
        cacheStatus: true,
        apiKeyAuthSource: true,
        apiKeyId: true,
        consumerId: true,
      },
    });
    expect(rejectedFindMany).not.toHaveBeenCalled();
  });

  it("should read rejected events for a half-open rebuild window", async () => {
    const rebuildFrom = new Date("2026-07-05T10:00:00.000Z");
    const rebuildTo = new Date("2026-07-05T13:00:00.000Z");

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

    const { prisma, usageFindMany, rejectedFindMany } = createMockPrisma({
      rejectedEvents,
    });

    const reader = createPrismaAnalyticsRollupBackfillEventReader(prisma);

    await expect(
      reader.listRejectedEvents({
        rebuildFrom,
        rebuildTo,
        limit: 25,
      }),
    ).resolves.toEqual(rejectedEvents);

    expect(rejectedFindMany).toHaveBeenCalledTimes(1);
    expect(rejectedFindMany).toHaveBeenCalledWith({
      where: {
        occurredAt: {
          gte: rebuildFrom,
          lt: rebuildTo,
        },
      },
      orderBy: [
        {
          occurredAt: "asc",
        },
        {
          id: "asc",
        },
      ],
      take: 25,
      select: {
        occurredAt: true,
        routePath: true,
        routeMethod: true,
        statusCode: true,
        rejectionReason: true,
        apiKeyAuthSource: true,
        apiKeyId: true,
        consumerId: true,
      },
    });
    expect(usageFindMany).not.toHaveBeenCalled();
  });

  it("should use the default event limit when limit is omitted", async () => {
    const rebuildFrom = new Date("2026-07-05T10:00:00.000Z");
    const rebuildTo = new Date("2026-07-05T13:00:00.000Z");

    const { prisma, usageFindMany } = createMockPrisma({});

    const reader = createPrismaAnalyticsRollupBackfillEventReader(prisma);

    await expect(
      reader.listUsageEvents({
        rebuildFrom,
        rebuildTo,
      }),
    ).resolves.toEqual([]);

    expect(DEFAULT_ANALYTICS_ROLLUP_BACKFILL_EVENT_LIMIT).toBe(10_000);
    expect(usageFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: DEFAULT_ANALYTICS_ROLLUP_BACKFILL_EVENT_LIMIT,
      }),
    );
  });

  it("should return empty arrays for an empty rebuild window without calling Prisma", async () => {
    const { prisma, usageFindMany, rejectedFindMany } = createMockPrisma({});

    const reader = createPrismaAnalyticsRollupBackfillEventReader(prisma);

    await expect(
      reader.listUsageEvents({
        rebuildFrom: null,
        rebuildTo: null,
      }),
    ).resolves.toEqual([]);

    await expect(
      reader.listRejectedEvents({
        rebuildFrom: null,
        rebuildTo: null,
      }),
    ).resolves.toEqual([]);

    expect(usageFindMany).not.toHaveBeenCalled();
    expect(rejectedFindMany).not.toHaveBeenCalled();
  });

  it("should reject an invalid partial null rebuild window", async () => {
    const { prisma } = createMockPrisma({});

    const reader = createPrismaAnalyticsRollupBackfillEventReader(prisma);

    await expect(
      reader.listUsageEvents({
        rebuildFrom: new Date("2026-07-05T10:00:00.000Z"),
        rebuildTo: null,
      }),
    ).rejects.toThrow(RangeError);

    await expect(
      reader.listRejectedEvents({
        rebuildFrom: null,
        rebuildTo: new Date("2026-07-05T13:00:00.000Z"),
      }),
    ).rejects.toThrow(RangeError);
  });

  it("should reject invalid dates", async () => {
    const { prisma } = createMockPrisma({});

    const reader = createPrismaAnalyticsRollupBackfillEventReader(prisma);

    await expect(
      reader.listUsageEvents({
        rebuildFrom: new Date("invalid-date"),
        rebuildTo: new Date("2026-07-05T13:00:00.000Z"),
      }),
    ).rejects.toThrow(RangeError);

    await expect(
      reader.listRejectedEvents({
        rebuildFrom: new Date("2026-07-05T10:00:00.000Z"),
        rebuildTo: new Date("invalid-date"),
      }),
    ).rejects.toThrow(RangeError);
  });

  it("should reject non-positive and non-integer limits", async () => {
    const { prisma } = createMockPrisma({});

    const reader = createPrismaAnalyticsRollupBackfillEventReader(prisma);

    await expect(
      reader.listUsageEvents({
        rebuildFrom: new Date("2026-07-05T10:00:00.000Z"),
        rebuildTo: new Date("2026-07-05T13:00:00.000Z"),
        limit: 0,
      }),
    ).rejects.toThrow(RangeError);

    await expect(
      reader.listRejectedEvents({
        rebuildFrom: new Date("2026-07-05T10:00:00.000Z"),
        rebuildTo: new Date("2026-07-05T13:00:00.000Z"),
        limit: 1.5,
      }),
    ).rejects.toThrow(RangeError);
  });

  it("should reject an inverted or zero-length rebuild window", async () => {
    const { prisma } = createMockPrisma({});

    const reader = createPrismaAnalyticsRollupBackfillEventReader(prisma);

    await expect(
      reader.listUsageEvents({
        rebuildFrom: new Date("2026-07-05T13:00:00.000Z"),
        rebuildTo: new Date("2026-07-05T10:00:00.000Z"),
      }),
    ).rejects.toThrow(RangeError);

    await expect(
      reader.listRejectedEvents({
        rebuildFrom: new Date("2026-07-05T10:00:00.000Z"),
        rebuildTo: new Date("2026-07-05T10:00:00.000Z"),
      }),
    ).rejects.toThrow(RangeError);
  });
});

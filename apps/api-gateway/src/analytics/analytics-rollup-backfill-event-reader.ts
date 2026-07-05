import type { PrismaClient } from "../generated/prisma/index.js";
import type {
  AnalyticsRejectedRollupEvent,
} from "./analytics-rejected-rollup-aggregate.js";
import type {
  AnalyticsUsageRollupCacheStatus,
  AnalyticsUsageRollupEvent,
} from "./analytics-usage-rollup-aggregate.js";

export const DEFAULT_ANALYTICS_ROLLUP_BACKFILL_EVENT_LIMIT = 10_000;

export type AnalyticsRollupBackfillReadWindow = {
  rebuildFrom: Date | null;
  rebuildTo: Date | null;
  limit?: number;
};

export type AnalyticsRollupBackfillEventReader = {
  listUsageEvents: (
    window: AnalyticsRollupBackfillReadWindow,
  ) => Promise<AnalyticsUsageRollupEvent[]>;

  listRejectedEvents: (
    window: AnalyticsRollupBackfillReadWindow,
  ) => Promise<AnalyticsRejectedRollupEvent[]>;
};

type ResolvedBackfillReadWindow = {
  rebuildFrom: Date;
  rebuildTo: Date;
  limit: number;
};

function assertValidDate(value: Date, name: string): void {
  if (Number.isNaN(value.getTime())) {
    throw new RangeError(`${name} must be a valid Date`);
  }
}

function resolveLimit(limit: number | undefined): number {
  const resolvedLimit =
    limit ?? DEFAULT_ANALYTICS_ROLLUP_BACKFILL_EVENT_LIMIT;

  if (!Number.isInteger(resolvedLimit) || resolvedLimit < 1) {
    throw new RangeError("limit must be a positive integer");
  }

  return resolvedLimit;
}

function resolveReadWindow(
  window: AnalyticsRollupBackfillReadWindow,
): ResolvedBackfillReadWindow | null {
  const limit = resolveLimit(window.limit);

  if (window.rebuildFrom === null && window.rebuildTo === null) {
    return null;
  }

  if (window.rebuildFrom === null || window.rebuildTo === null) {
    throw new RangeError(
      "rebuildFrom and rebuildTo must both be null or valid Dates",
    );
  }

  assertValidDate(window.rebuildFrom, "rebuildFrom");
  assertValidDate(window.rebuildTo, "rebuildTo");

  if (window.rebuildFrom >= window.rebuildTo) {
    throw new RangeError("rebuildFrom must be earlier than rebuildTo");
  }

  return {
    rebuildFrom: window.rebuildFrom,
    rebuildTo: window.rebuildTo,
    limit,
  };
}

function mapCacheStatus(
  cacheStatus: string | null,
): AnalyticsUsageRollupCacheStatus | null {
  if (
    cacheStatus === null ||
    cacheStatus === "HIT" ||
    cacheStatus === "MISS" ||
    cacheStatus === "BYPASS"
  ) {
    return cacheStatus;
  }

  throw new RangeError("cacheStatus must be HIT, MISS, BYPASS, or null");
}

function mapUsageBackfillEvent(event: {
  occurredAt: Date;
  routePath: string;
  routeMethod: AnalyticsUsageRollupEvent["routeMethod"];
  statusCode: number;
  durationMs: number;
  cacheStatus: string | null;
  apiKeyAuthSource: string | null;
  apiKeyId: string | null;
  consumerId: string | null;
}): AnalyticsUsageRollupEvent {
  return {
    occurredAt: event.occurredAt,
    routePath: event.routePath,
    routeMethod: event.routeMethod,
    statusCode: event.statusCode,
    durationMs: event.durationMs,
    cacheStatus: mapCacheStatus(event.cacheStatus),
    apiKeyAuthSource: event.apiKeyAuthSource,
    apiKeyId: event.apiKeyId,
    consumerId: event.consumerId,
  };
}

export function createPrismaAnalyticsRollupBackfillEventReader(
  prisma: PrismaClient,
): AnalyticsRollupBackfillEventReader {
  return {
    async listUsageEvents(window) {
      const resolvedWindow = resolveReadWindow(window);

      if (resolvedWindow === null) {
        return [];
      }

      const events = await prisma.apiUsageEvent.findMany({
        where: {
          occurredAt: {
            gte: resolvedWindow.rebuildFrom,
            lt: resolvedWindow.rebuildTo,
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
        take: resolvedWindow.limit,
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

      return events.map(mapUsageBackfillEvent);
    },

    async listRejectedEvents(window) {
      const resolvedWindow = resolveReadWindow(window);

      if (resolvedWindow === null) {
        return [];
      }

      return prisma.apiRejectedEvent.findMany({
        where: {
          occurredAt: {
            gte: resolvedWindow.rebuildFrom,
            lt: resolvedWindow.rebuildTo,
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
        take: resolvedWindow.limit,
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
    },
  };
}

import type {
  ApiRejectionReason,
  GatewayRouteMethod,
} from "../generated/prisma/index.js";
import type { AnalyticsRollupGranularity } from "./analytics-rollup-time-bucket.js";
import { createAnalyticsRollupTimeBucket } from "./analytics-rollup-time-bucket.js";

export type AnalyticsRejectedRollupEvent = {
  occurredAt: Date;
  routePath?: string | null;
  routeMethod?: GatewayRouteMethod | null;
  statusCode: number;
  rejectionReason: ApiRejectionReason;
  apiKeyAuthSource?: string | null;
  apiKeyId?: string | null;
  consumerId?: string | null;
};

export type AnalyticsRejectedRollupAggregate = {
  granularity: AnalyticsRollupGranularity;
  bucketStart: Date;
  bucketEnd: Date;
  consumerId: string | null;
  apiKeyId: string | null;
  routePath: string | null;
  routeMethod: GatewayRouteMethod | null;
  rejectionReason: ApiRejectionReason;
  statusCode: number;
  apiKeyAuthSource: string | null;
  totalRejectedRequests: number;
  lastRejectedAt: Date;
};

function assertValidDate(value: Date, name: string): void {
  if (Number.isNaN(value.getTime())) {
    throw new RangeError(`${name} must be a valid Date`);
  }
}

function assertValidRejectedRollupEvent(
  event: AnalyticsRejectedRollupEvent,
  index: number,
): void {
  assertValidDate(event.occurredAt, `events[${index}].occurredAt`);

  if (event.routePath !== undefined && event.routePath !== null && !event.routePath.trim()) {
    throw new RangeError(`events[${index}].routePath must be non-empty when provided`);
  }

  if (
    !Number.isInteger(event.statusCode) ||
    event.statusCode < 100 ||
    event.statusCode > 599
  ) {
    throw new RangeError(
      `events[${index}].statusCode must be an integer between 100 and 599`,
    );
  }
}

function toKeyPart(value: string | null): string {
  return value ?? "";
}

function buildAggregateKey(
  aggregate: Pick<
    AnalyticsRejectedRollupAggregate,
    | "bucketStart"
    | "consumerId"
    | "apiKeyId"
    | "routePath"
    | "routeMethod"
    | "rejectionReason"
    | "statusCode"
    | "apiKeyAuthSource"
  >,
): string {
  return [
    aggregate.bucketStart.toISOString(),
    toKeyPart(aggregate.consumerId),
    toKeyPart(aggregate.apiKeyId),
    toKeyPart(aggregate.routeMethod),
    toKeyPart(aggregate.routePath),
    aggregate.rejectionReason,
    String(aggregate.statusCode),
    toKeyPart(aggregate.apiKeyAuthSource),
  ].join("\u001F");
}

function compareNullableString(left: string | null, right: string | null): number {
  return (left ?? "").localeCompare(right ?? "");
}

function sortAggregates(
  left: AnalyticsRejectedRollupAggregate,
  right: AnalyticsRejectedRollupAggregate,
): number {
  return (
    left.bucketStart.getTime() - right.bucketStart.getTime() ||
    compareNullableString(left.consumerId, right.consumerId) ||
    compareNullableString(left.apiKeyId, right.apiKeyId) ||
    compareNullableString(left.routeMethod, right.routeMethod) ||
    compareNullableString(left.routePath, right.routePath) ||
    left.rejectionReason.localeCompare(right.rejectionReason) ||
    left.statusCode - right.statusCode ||
    compareNullableString(left.apiKeyAuthSource, right.apiKeyAuthSource)
  );
}

export function buildAnalyticsRejectedRollupAggregates(
  events: AnalyticsRejectedRollupEvent[],
  granularity: AnalyticsRollupGranularity,
): AnalyticsRejectedRollupAggregate[] {
  const aggregatesByKey = new Map<string, AnalyticsRejectedRollupAggregate>();

  for (const [index, event] of events.entries()) {
    assertValidRejectedRollupEvent(event, index);

    const bucket = createAnalyticsRollupTimeBucket(
      event.occurredAt,
      granularity,
    );

    const baseAggregate = {
      granularity,
      bucketStart: bucket.bucketStart,
      bucketEnd: bucket.bucketEnd,
      consumerId: event.consumerId ?? null,
      apiKeyId: event.apiKeyId ?? null,
      routePath: event.routePath ?? null,
      routeMethod: event.routeMethod ?? null,
      rejectionReason: event.rejectionReason,
      statusCode: event.statusCode,
      apiKeyAuthSource: event.apiKeyAuthSource ?? null,
    };

    const key = buildAggregateKey(baseAggregate);
    const existingAggregate = aggregatesByKey.get(key);

    const aggregate =
      existingAggregate ??
      ({
        ...baseAggregate,
        totalRejectedRequests: 0,
        lastRejectedAt: event.occurredAt,
      } satisfies AnalyticsRejectedRollupAggregate);

    aggregate.totalRejectedRequests += 1;

    if (event.occurredAt > aggregate.lastRejectedAt) {
      aggregate.lastRejectedAt = event.occurredAt;
    }

    aggregatesByKey.set(key, aggregate);
  }

  return [...aggregatesByKey.values()].sort(sortAggregates);
}

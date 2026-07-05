import type { GatewayRouteMethod } from "../generated/prisma/index.js";
import type { AnalyticsRollupGranularity } from "./analytics-rollup-time-bucket.js";
import { createAnalyticsRollupTimeBucket } from "./analytics-rollup-time-bucket.js";

export type AnalyticsUsageRollupCacheStatus = "HIT" | "MISS" | "BYPASS";
export type AnalyticsUsageRollupStatusClass =
  | "1xx"
  | "2xx"
  | "3xx"
  | "4xx"
  | "5xx";

export type AnalyticsUsageRollupEvent = {
  occurredAt: Date;
  routePath: string;
  routeMethod: GatewayRouteMethod;
  statusCode: number;
  durationMs: number;
  cacheStatus?: AnalyticsUsageRollupCacheStatus | null;
  apiKeyAuthSource?: string | null;
  apiKeyId?: string | null;
  consumerId?: string | null;
};

export type AnalyticsUsageRollupAggregate = {
  granularity: AnalyticsRollupGranularity;
  bucketStart: Date;
  bucketEnd: Date;
  consumerId: string | null;
  apiKeyId: string | null;
  routePath: string;
  routeMethod: GatewayRouteMethod;
  statusClass: AnalyticsUsageRollupStatusClass;
  cacheStatus: AnalyticsUsageRollupCacheStatus | null;
  apiKeyAuthSource: string | null;
  totalRequests: number;
  successfulRequests: number;
  errorRequests: number;
  totalDurationMs: number;
  averageDurationMs: number;
  cacheHits: number;
  cacheMisses: number;
  cacheBypasses: number;
  lastRequestAt: Date;
};

function assertValidDate(value: Date, name: string): void {
  if (Number.isNaN(value.getTime())) {
    throw new RangeError(`${name} must be a valid Date`);
  }
}

function assertValidUsageRollupEvent(
  event: AnalyticsUsageRollupEvent,
  index: number,
): void {
  assertValidDate(event.occurredAt, `events[${index}].occurredAt`);

  if (!event.routePath.trim()) {
    throw new RangeError(`events[${index}].routePath must be non-empty`);
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

  if (!Number.isInteger(event.durationMs) || event.durationMs < 0) {
    throw new RangeError(
      `events[${index}].durationMs must be a non-negative integer`,
    );
  }
}

export function getAnalyticsUsageRollupStatusClass(
  statusCode: number,
): AnalyticsUsageRollupStatusClass {
  if (!Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599) {
    throw new RangeError("statusCode must be an integer between 100 and 599");
  }

  return `${Math.floor(statusCode / 100)}xx` as AnalyticsUsageRollupStatusClass;
}

function toKeyPart(value: string | null): string {
  return value ?? "";
}

function buildAggregateKey(
  aggregate: Pick<
    AnalyticsUsageRollupAggregate,
    | "bucketStart"
    | "consumerId"
    | "apiKeyId"
    | "routePath"
    | "routeMethod"
    | "statusClass"
    | "cacheStatus"
    | "apiKeyAuthSource"
  >,
): string {
  return [
    aggregate.bucketStart.toISOString(),
    toKeyPart(aggregate.consumerId),
    toKeyPart(aggregate.apiKeyId),
    aggregate.routeMethod,
    aggregate.routePath,
    aggregate.statusClass,
    toKeyPart(aggregate.cacheStatus),
    toKeyPart(aggregate.apiKeyAuthSource),
  ].join("\u001F");
}

function compareNullableString(left: string | null, right: string | null): number {
  return (left ?? "").localeCompare(right ?? "");
}

function sortAggregates(
  left: AnalyticsUsageRollupAggregate,
  right: AnalyticsUsageRollupAggregate,
): number {
  return (
    left.bucketStart.getTime() - right.bucketStart.getTime() ||
    compareNullableString(left.consumerId, right.consumerId) ||
    compareNullableString(left.apiKeyId, right.apiKeyId) ||
    left.routeMethod.localeCompare(right.routeMethod) ||
    left.routePath.localeCompare(right.routePath) ||
    left.statusClass.localeCompare(right.statusClass) ||
    compareNullableString(left.cacheStatus, right.cacheStatus) ||
    compareNullableString(left.apiKeyAuthSource, right.apiKeyAuthSource)
  );
}

export function buildAnalyticsUsageRollupAggregates(
  events: AnalyticsUsageRollupEvent[],
  granularity: AnalyticsRollupGranularity,
): AnalyticsUsageRollupAggregate[] {
  const aggregatesByKey = new Map<string, AnalyticsUsageRollupAggregate>();

  for (const [index, event] of events.entries()) {
    assertValidUsageRollupEvent(event, index);

    const bucket = createAnalyticsRollupTimeBucket(
      event.occurredAt,
      granularity,
    );
    const statusClass = getAnalyticsUsageRollupStatusClass(event.statusCode);

    const baseAggregate = {
      granularity,
      bucketStart: bucket.bucketStart,
      bucketEnd: bucket.bucketEnd,
      consumerId: event.consumerId ?? null,
      apiKeyId: event.apiKeyId ?? null,
      routePath: event.routePath,
      routeMethod: event.routeMethod,
      statusClass,
      cacheStatus: event.cacheStatus ?? null,
      apiKeyAuthSource: event.apiKeyAuthSource ?? null,
    };

    const key = buildAggregateKey(baseAggregate);
    const existingAggregate = aggregatesByKey.get(key);

    const aggregate =
      existingAggregate ??
      ({
        ...baseAggregate,
        totalRequests: 0,
        successfulRequests: 0,
        errorRequests: 0,
        totalDurationMs: 0,
        averageDurationMs: 0,
        cacheHits: 0,
        cacheMisses: 0,
        cacheBypasses: 0,
        lastRequestAt: event.occurredAt,
      } satisfies AnalyticsUsageRollupAggregate);

    aggregate.totalRequests += 1;

    if (event.statusCode >= 200 && event.statusCode < 400) {
      aggregate.successfulRequests += 1;
    }

    if (event.statusCode >= 400) {
      aggregate.errorRequests += 1;
    }

    aggregate.totalDurationMs += event.durationMs;
    aggregate.averageDurationMs = Math.round(
      aggregate.totalDurationMs / aggregate.totalRequests,
    );

    if (event.cacheStatus === "HIT") {
      aggregate.cacheHits += 1;
    }

    if (event.cacheStatus === "MISS") {
      aggregate.cacheMisses += 1;
    }

    if (event.cacheStatus === "BYPASS") {
      aggregate.cacheBypasses += 1;
    }

    if (event.occurredAt > aggregate.lastRequestAt) {
      aggregate.lastRequestAt = event.occurredAt;
    }

    aggregatesByKey.set(key, aggregate);
  }

  return [...aggregatesByKey.values()].sort(sortAggregates);
}

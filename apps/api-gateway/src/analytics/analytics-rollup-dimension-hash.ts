import { createHash } from "node:crypto";
import type { AnalyticsRejectedRollupAggregate } from "./analytics-rejected-rollup-aggregate.js";
import type { AnalyticsUsageRollupAggregate } from "./analytics-usage-rollup-aggregate.js";

export type AnalyticsUsageRollupDimensionHashInput = Pick<
  AnalyticsUsageRollupAggregate,
  | "granularity"
  | "bucketStart"
  | "consumerId"
  | "apiKeyId"
  | "routePath"
  | "routeMethod"
  | "statusClass"
  | "cacheStatus"
  | "apiKeyAuthSource"
>;

export type AnalyticsRejectedRollupDimensionHashInput = Pick<
  AnalyticsRejectedRollupAggregate,
  | "granularity"
  | "bucketStart"
  | "consumerId"
  | "apiKeyId"
  | "routePath"
  | "routeMethod"
  | "rejectionReason"
  | "statusCode"
  | "apiKeyAuthSource"
>;

type AnalyticsRollupDimensionHashPart = string | number | null;

function assertValidDate(value: Date, name: string): void {
  if (Number.isNaN(value.getTime())) {
    throw new RangeError(`${name} must be a valid Date`);
  }
}

function toIsoString(value: Date, name: string): string {
  assertValidDate(value, name);

  return value.toISOString();
}

function createAnalyticsRollupDimensionHash(
  parts: AnalyticsRollupDimensionHashPart[],
): string {
  return createHash("sha256").update(JSON.stringify(parts), "utf8").digest("hex");
}

export function buildAnalyticsUsageRollupDimensionHash(
  input: AnalyticsUsageRollupDimensionHashInput,
): string {
  return createAnalyticsRollupDimensionHash([
    "usage",
    input.granularity,
    toIsoString(input.bucketStart, "bucketStart"),
    input.consumerId,
    input.apiKeyId,
    input.routePath,
    input.routeMethod,
    input.statusClass,
    input.cacheStatus,
    input.apiKeyAuthSource,
  ]);
}

export function buildAnalyticsRejectedRollupDimensionHash(
  input: AnalyticsRejectedRollupDimensionHashInput,
): string {
  return createAnalyticsRollupDimensionHash([
    "rejected",
    input.granularity,
    toIsoString(input.bucketStart, "bucketStart"),
    input.consumerId,
    input.apiKeyId,
    input.routePath,
    input.routeMethod,
    input.rejectionReason,
    input.statusCode,
    input.apiKeyAuthSource,
  ]);
}

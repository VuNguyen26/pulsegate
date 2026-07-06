import type {
  AnalyticsRollupBackfillSource,
  AnalyticsRollupBackfillSourceInput,
} from "./analytics-rollup-backfill-plan.js";
import type { AnalyticsRollupGranularity } from "./analytics-rollup-time-bucket.js";
import {
  createAnalyticsRollupWindowPlan,
  type AnalyticsRollupWindowPlan,
} from "./analytics-rollup-window-plan.js";

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export const DEFAULT_ANALYTICS_ROLLUP_SCHEDULE_LOOKBACK_BUCKETS = 1;
export const DEFAULT_ANALYTICS_ROLLUP_SCHEDULE_SAFETY_DELAY_MS = 5 * 60 * 1000;

export type AnalyticsRollupSchedulePlanStatus = "disabled" | "planned";

export type AnalyticsRollupSchedulePlanInput = {
  enabled?: boolean;
  runAt: Date;
  granularity: AnalyticsRollupGranularity;
  source?: string;
  lookbackBuckets?: number;
  safetyDelayMs?: number;
  maxBuckets?: number;
};

export type AnalyticsRollupSchedulePlan = {
  enabled: boolean;
  status: AnalyticsRollupSchedulePlanStatus;
  source: AnalyticsRollupBackfillSourceInput;
  sources: AnalyticsRollupBackfillSource[];
  granularity: AnalyticsRollupGranularity;
  runAt: Date;
  effectiveTo: Date | null;
  lookbackBuckets: number;
  safetyDelayMs: number;
  windowPlan: AnalyticsRollupWindowPlan | null;
};

function parseSource(
  value: string | undefined,
): AnalyticsRollupBackfillSourceInput {
  if (value === undefined) {
    return "both";
  }

  if (value === "usage" || value === "rejected" || value === "both") {
    return value;
  }

  throw new RangeError("source must be usage, rejected, or both");
}

function expandSources(
  source: AnalyticsRollupBackfillSourceInput,
): AnalyticsRollupBackfillSource[] {
  if (source === "both") {
    return ["usage", "rejected"];
  }

  return [source];
}

function resolveLookbackBuckets(value: number | undefined): number {
  const resolved =
    value ?? DEFAULT_ANALYTICS_ROLLUP_SCHEDULE_LOOKBACK_BUCKETS;

  if (!Number.isInteger(resolved) || resolved < 1) {
    throw new RangeError("lookbackBuckets must be a positive integer");
  }

  return resolved;
}

function resolveSafetyDelayMs(value: number | undefined): number {
  const resolved =
    value ?? DEFAULT_ANALYTICS_ROLLUP_SCHEDULE_SAFETY_DELAY_MS;

  if (!Number.isInteger(resolved) || resolved < 0) {
    throw new RangeError("safetyDelayMs must be a non-negative integer");
  }

  return resolved;
}

function assertValidRunAt(runAt: Date): void {
  if (Number.isNaN(runAt.getTime())) {
    throw new RangeError("runAt must be a valid Date");
  }
}

function getBucketDurationMs(granularity: AnalyticsRollupGranularity): number {
  if (granularity === "hour") {
    return MS_PER_HOUR;
  }

  return MS_PER_DAY;
}

function floorToGranularity(
  timestamp: Date,
  granularity: AnalyticsRollupGranularity,
): Date {
  const bucketDurationMs = getBucketDurationMs(granularity);

  return new Date(
    Math.floor(timestamp.getTime() / bucketDurationMs) * bucketDurationMs,
  );
}

export function createAnalyticsRollupSchedulePlan(
  input: AnalyticsRollupSchedulePlanInput,
): AnalyticsRollupSchedulePlan {
  assertValidRunAt(input.runAt);

  const enabled = input.enabled === true;
  const source = parseSource(input.source);
  const sources = expandSources(source);
  const lookbackBuckets = resolveLookbackBuckets(input.lookbackBuckets);
  const safetyDelayMs = resolveSafetyDelayMs(input.safetyDelayMs);
  const runAt = new Date(input.runAt.getTime());

  if (!enabled) {
    return {
      enabled,
      status: "disabled",
      source,
      sources,
      granularity: input.granularity,
      runAt,
      effectiveTo: null,
      lookbackBuckets,
      safetyDelayMs,
      windowPlan: null,
    };
  }

  const effectiveTimestamp = new Date(runAt.getTime() - safetyDelayMs);
  const effectiveTo = floorToGranularity(
    effectiveTimestamp,
    input.granularity,
  );
  const bucketDurationMs = getBucketDurationMs(input.granularity);
  const from = new Date(
    effectiveTo.getTime() - bucketDurationMs * lookbackBuckets,
  );

  return {
    enabled,
    status: "planned",
    source,
    sources,
    granularity: input.granularity,
    runAt,
    effectiveTo,
    lookbackBuckets,
    safetyDelayMs,
    windowPlan: createAnalyticsRollupWindowPlan({
      from,
      to: effectiveTo,
      granularity: input.granularity,
      maxBuckets: input.maxBuckets,
    }),
  };
}

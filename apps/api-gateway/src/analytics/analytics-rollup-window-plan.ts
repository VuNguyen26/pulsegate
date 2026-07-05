import type {
  AnalyticsRollupGranularity,
  AnalyticsRollupTimeBucket,
} from "./analytics-rollup-time-bucket.js";
import { listAnalyticsRollupTimeBuckets } from "./analytics-rollup-time-bucket.js";

export type AnalyticsRollupWindowPlanInput = {
  from: Date;
  to: Date;
  granularity: AnalyticsRollupGranularity;
  maxBuckets?: number;
};

export type AnalyticsRollupWindowPlan = {
  granularity: AnalyticsRollupGranularity;
  requestedFrom: Date;
  requestedTo: Date;
  rebuildFrom: Date | null;
  rebuildTo: Date | null;
  bucketCount: number;
  buckets: AnalyticsRollupTimeBucket[];
};

function assertValidMaxBuckets(maxBuckets: number | undefined): void {
  if (maxBuckets === undefined) {
    return;
  }

  if (!Number.isInteger(maxBuckets) || maxBuckets < 1) {
    throw new RangeError("maxBuckets must be a positive integer");
  }
}

export function createAnalyticsRollupWindowPlan(
  input: AnalyticsRollupWindowPlanInput,
): AnalyticsRollupWindowPlan {
  assertValidMaxBuckets(input.maxBuckets);

  const buckets = listAnalyticsRollupTimeBuckets(
    input.from,
    input.to,
    input.granularity,
  );

  if (
    input.maxBuckets !== undefined &&
    buckets.length > input.maxBuckets
  ) {
    throw new RangeError("rollup window exceeds maxBuckets");
  }

  if (buckets.length === 0) {
    return {
      granularity: input.granularity,
      requestedFrom: input.from,
      requestedTo: input.to,
      rebuildFrom: null,
      rebuildTo: null,
      bucketCount: 0,
      buckets,
    };
  }

  const firstBucket = buckets[0];
  const lastBucket = buckets[buckets.length - 1];

  return {
    granularity: input.granularity,
    requestedFrom: input.from,
    requestedTo: input.to,
    rebuildFrom: firstBucket.bucketStart,
    rebuildTo: lastBucket.bucketEnd,
    bucketCount: buckets.length,
    buckets,
  };
}

export type AnalyticsRollupGranularity = "hour" | "day";

export type AnalyticsRollupTimeBucket = {
  granularity: AnalyticsRollupGranularity;
  bucketStart: Date;
  bucketEnd: Date;
};

function assertValidDate(value: Date, name: string): void {
  if (Number.isNaN(value.getTime())) {
    throw new RangeError(`${name} must be a valid Date`);
  }
}

export function getAnalyticsRollupBucketStart(
  occurredAt: Date,
  granularity: AnalyticsRollupGranularity,
): Date {
  assertValidDate(occurredAt, "occurredAt");

  if (granularity === "hour") {
    return new Date(
      Date.UTC(
        occurredAt.getUTCFullYear(),
        occurredAt.getUTCMonth(),
        occurredAt.getUTCDate(),
        occurredAt.getUTCHours(),
        0,
        0,
        0,
      ),
    );
  }

  return new Date(
    Date.UTC(
      occurredAt.getUTCFullYear(),
      occurredAt.getUTCMonth(),
      occurredAt.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
}

export function getAnalyticsRollupBucketEnd(
  bucketStart: Date,
  granularity: AnalyticsRollupGranularity,
): Date {
  assertValidDate(bucketStart, "bucketStart");

  if (granularity === "hour") {
    return new Date(
      Date.UTC(
        bucketStart.getUTCFullYear(),
        bucketStart.getUTCMonth(),
        bucketStart.getUTCDate(),
        bucketStart.getUTCHours() + 1,
        0,
        0,
        0,
      ),
    );
  }

  return new Date(
    Date.UTC(
      bucketStart.getUTCFullYear(),
      bucketStart.getUTCMonth(),
      bucketStart.getUTCDate() + 1,
      0,
      0,
      0,
      0,
    ),
  );
}

export function createAnalyticsRollupTimeBucket(
  occurredAt: Date,
  granularity: AnalyticsRollupGranularity,
): AnalyticsRollupTimeBucket {
  const bucketStart = getAnalyticsRollupBucketStart(occurredAt, granularity);

  return {
    granularity,
    bucketStart,
    bucketEnd: getAnalyticsRollupBucketEnd(bucketStart, granularity),
  };
}

export function listAnalyticsRollupTimeBuckets(
  from: Date,
  to: Date,
  granularity: AnalyticsRollupGranularity,
): AnalyticsRollupTimeBucket[] {
  assertValidDate(from, "from");
  assertValidDate(to, "to");

  if (from > to) {
    throw new RangeError("from must be earlier than or equal to to");
  }

  if (from.getTime() === to.getTime()) {
    return [];
  }

  const buckets: AnalyticsRollupTimeBucket[] = [];
  let cursor = getAnalyticsRollupBucketStart(from, granularity);

  while (cursor < to) {
    const bucketEnd = getAnalyticsRollupBucketEnd(cursor, granularity);

    buckets.push({
      granularity,
      bucketStart: cursor,
      bucketEnd,
    });

    cursor = bucketEnd;
  }

  return buckets;
}

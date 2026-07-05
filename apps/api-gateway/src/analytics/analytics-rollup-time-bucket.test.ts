import { describe, expect, it } from "vitest";
import {
  createAnalyticsRollupTimeBucket,
  getAnalyticsRollupBucketEnd,
  getAnalyticsRollupBucketStart,
  listAnalyticsRollupTimeBuckets,
} from "./analytics-rollup-time-bucket.js";

describe("analytics rollup time bucket", () => {
  it("should floor a timestamp to the start of its UTC hour bucket", () => {
    const bucketStart = getAnalyticsRollupBucketStart(
      new Date("2026-07-05T10:35:45.123Z"),
      "hour",
    );

    expect(bucketStart.toISOString()).toBe("2026-07-05T10:00:00.000Z");
  });

  it("should floor a timestamp to the start of its UTC day bucket", () => {
    const bucketStart = getAnalyticsRollupBucketStart(
      new Date("2026-07-05T23:59:59.999Z"),
      "day",
    );

    expect(bucketStart.toISOString()).toBe("2026-07-05T00:00:00.000Z");
  });

  it("should calculate the exclusive end of an hourly bucket", () => {
    const bucketEnd = getAnalyticsRollupBucketEnd(
      new Date("2026-07-05T10:00:00.000Z"),
      "hour",
    );

    expect(bucketEnd.toISOString()).toBe("2026-07-05T11:00:00.000Z");
  });

  it("should calculate the exclusive end of a daily bucket", () => {
    const bucketEnd = getAnalyticsRollupBucketEnd(
      new Date("2026-07-05T00:00:00.000Z"),
      "day",
    );

    expect(bucketEnd.toISOString()).toBe("2026-07-06T00:00:00.000Z");
  });

  it("should create a rollup time bucket from a timestamp", () => {
    const bucket = createAnalyticsRollupTimeBucket(
      new Date("2026-07-05T10:35:45.123Z"),
      "hour",
    );

    expect(bucket).toEqual({
      granularity: "hour",
      bucketStart: new Date("2026-07-05T10:00:00.000Z"),
      bucketEnd: new Date("2026-07-05T11:00:00.000Z"),
    });
  });

  it("should list hourly buckets for a half-open time range", () => {
    const buckets = listAnalyticsRollupTimeBuckets(
      new Date("2026-07-05T10:15:00.000Z"),
      new Date("2026-07-05T13:00:00.000Z"),
      "hour",
    );

    expect(buckets.map((bucket) => bucket.bucketStart.toISOString())).toEqual([
      "2026-07-05T10:00:00.000Z",
      "2026-07-05T11:00:00.000Z",
      "2026-07-05T12:00:00.000Z",
    ]);
  });

  it("should list daily buckets for a half-open time range", () => {
    const buckets = listAnalyticsRollupTimeBuckets(
      new Date("2026-07-05T10:15:00.000Z"),
      new Date("2026-07-08T00:00:00.000Z"),
      "day",
    );

    expect(buckets.map((bucket) => bucket.bucketStart.toISOString())).toEqual([
      "2026-07-05T00:00:00.000Z",
      "2026-07-06T00:00:00.000Z",
      "2026-07-07T00:00:00.000Z",
    ]);
  });

  it("should return an empty bucket list when from equals to", () => {
    const buckets = listAnalyticsRollupTimeBuckets(
      new Date("2026-07-05T10:15:00.000Z"),
      new Date("2026-07-05T10:15:00.000Z"),
      "hour",
    );

    expect(buckets).toEqual([]);
  });

  it("should reject invalid dates", () => {
    expect(() =>
      getAnalyticsRollupBucketStart(new Date("invalid-date"), "hour"),
    ).toThrow(RangeError);
  });

  it("should reject an inverted range", () => {
    expect(() =>
      listAnalyticsRollupTimeBuckets(
        new Date("2026-07-06T00:00:00.000Z"),
        new Date("2026-07-05T00:00:00.000Z"),
        "day",
      ),
    ).toThrow(RangeError);
  });
});

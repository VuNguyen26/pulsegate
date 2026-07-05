import { describe, expect, it } from "vitest";
import { createAnalyticsRollupWindowPlan } from "./analytics-rollup-window-plan.js";

describe("analytics rollup window plan", () => {
  it("should create an hourly rebuild plan for a partial time range", () => {
    const plan = createAnalyticsRollupWindowPlan({
      from: new Date("2026-07-05T10:15:00.000Z"),
      to: new Date("2026-07-05T13:00:00.000Z"),
      granularity: "hour",
    });

    expect(plan.granularity).toBe("hour");
    expect(plan.requestedFrom.toISOString()).toBe("2026-07-05T10:15:00.000Z");
    expect(plan.requestedTo.toISOString()).toBe("2026-07-05T13:00:00.000Z");
    expect(plan.rebuildFrom?.toISOString()).toBe("2026-07-05T10:00:00.000Z");
    expect(plan.rebuildTo?.toISOString()).toBe("2026-07-05T13:00:00.000Z");
    expect(plan.bucketCount).toBe(3);
    expect(plan.buckets.map((bucket) => bucket.bucketStart.toISOString())).toEqual([
      "2026-07-05T10:00:00.000Z",
      "2026-07-05T11:00:00.000Z",
      "2026-07-05T12:00:00.000Z",
    ]);
  });

  it("should create a daily rebuild plan that includes partial boundary days", () => {
    const plan = createAnalyticsRollupWindowPlan({
      from: new Date("2026-07-05T10:15:00.000Z"),
      to: new Date("2026-07-07T03:30:00.000Z"),
      granularity: "day",
    });

    expect(plan.rebuildFrom?.toISOString()).toBe("2026-07-05T00:00:00.000Z");
    expect(plan.rebuildTo?.toISOString()).toBe("2026-07-08T00:00:00.000Z");
    expect(plan.bucketCount).toBe(3);
    expect(plan.buckets.map((bucket) => bucket.bucketStart.toISOString())).toEqual([
      "2026-07-05T00:00:00.000Z",
      "2026-07-06T00:00:00.000Z",
      "2026-07-07T00:00:00.000Z",
    ]);
  });

  it("should create an empty plan when from equals to", () => {
    const timestamp = new Date("2026-07-05T10:15:00.000Z");

    const plan = createAnalyticsRollupWindowPlan({
      from: timestamp,
      to: timestamp,
      granularity: "hour",
    });

    expect(plan.rebuildFrom).toBeNull();
    expect(plan.rebuildTo).toBeNull();
    expect(plan.bucketCount).toBe(0);
    expect(plan.buckets).toEqual([]);
  });

  it("should allow a plan when bucket count equals maxBuckets", () => {
    const plan = createAnalyticsRollupWindowPlan({
      from: new Date("2026-07-05T10:15:00.000Z"),
      to: new Date("2026-07-05T13:00:00.000Z"),
      granularity: "hour",
      maxBuckets: 3,
    });

    expect(plan.bucketCount).toBe(3);
  });

  it("should reject a plan that exceeds maxBuckets", () => {
    expect(() =>
      createAnalyticsRollupWindowPlan({
        from: new Date("2026-07-05T10:15:00.000Z"),
        to: new Date("2026-07-05T13:00:00.000Z"),
        granularity: "hour",
        maxBuckets: 2,
      }),
    ).toThrow(RangeError);
  });

  it("should reject an invalid maxBuckets value", () => {
    expect(() =>
      createAnalyticsRollupWindowPlan({
        from: new Date("2026-07-05T10:15:00.000Z"),
        to: new Date("2026-07-05T13:00:00.000Z"),
        granularity: "hour",
        maxBuckets: 0,
      }),
    ).toThrow(RangeError);

    expect(() =>
      createAnalyticsRollupWindowPlan({
        from: new Date("2026-07-05T10:15:00.000Z"),
        to: new Date("2026-07-05T13:00:00.000Z"),
        granularity: "hour",
        maxBuckets: 1.5,
      }),
    ).toThrow(RangeError);
  });

  it("should reject an inverted time range", () => {
    expect(() =>
      createAnalyticsRollupWindowPlan({
        from: new Date("2026-07-06T00:00:00.000Z"),
        to: new Date("2026-07-05T00:00:00.000Z"),
        granularity: "day",
      }),
    ).toThrow(RangeError);
  });
});

import { describe, expect, it } from "vitest";

import {
  createAnalyticsRollupSchedulePlan,
  DEFAULT_ANALYTICS_ROLLUP_SCHEDULE_LOOKBACK_BUCKETS,
  DEFAULT_ANALYTICS_ROLLUP_SCHEDULE_SAFETY_DELAY_MS,
} from "./analytics-rollup-schedule-plan.js";

describe("analytics rollup schedule plan", () => {
  it("should create a disabled plan by default without a window plan", () => {
    const plan = createAnalyticsRollupSchedulePlan({
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "usage",
    });

    expect(plan.enabled).toBe(false);
    expect(plan.status).toBe("disabled");
    expect(plan.source).toBe("usage");
    expect(plan.sources).toEqual(["usage"]);
    expect(plan.runAt.toISOString()).toBe("2026-07-06T13:07:00.000Z");
    expect(plan.effectiveTo).toBeNull();
    expect(plan.lookbackBuckets).toBe(
      DEFAULT_ANALYTICS_ROLLUP_SCHEDULE_LOOKBACK_BUCKETS,
    );
    expect(plan.safetyDelayMs).toBe(
      DEFAULT_ANALYTICS_ROLLUP_SCHEDULE_SAFETY_DELAY_MS,
    );
    expect(plan.windowPlan).toBeNull();
  });

  it("should create an hourly plan for the last complete bucket by default", () => {
    const plan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
    });

    expect(plan.enabled).toBe(true);
    expect(plan.status).toBe("planned");
    expect(plan.source).toBe("both");
    expect(plan.sources).toEqual(["usage", "rejected"]);
    expect(plan.effectiveTo?.toISOString()).toBe("2026-07-06T13:00:00.000Z");
    expect(plan.windowPlan?.requestedFrom.toISOString()).toBe(
      "2026-07-06T12:00:00.000Z",
    );
    expect(plan.windowPlan?.requestedTo.toISOString()).toBe(
      "2026-07-06T13:00:00.000Z",
    );
    expect(plan.windowPlan?.rebuildFrom?.toISOString()).toBe(
      "2026-07-06T12:00:00.000Z",
    );
    expect(plan.windowPlan?.rebuildTo?.toISOString()).toBe(
      "2026-07-06T13:00:00.000Z",
    );
    expect(plan.windowPlan?.bucketCount).toBe(1);
  });

  it("should apply safety delay before selecting the complete bucket", () => {
    const plan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:03:00.000Z"),
      granularity: "hour",
    });

    expect(plan.effectiveTo?.toISOString()).toBe("2026-07-06T12:00:00.000Z");
    expect(plan.windowPlan?.requestedFrom.toISOString()).toBe(
      "2026-07-06T11:00:00.000Z",
    );
    expect(plan.windowPlan?.requestedTo.toISOString()).toBe(
      "2026-07-06T12:00:00.000Z",
    );
  });

  it("should create a daily plan for multiple lookback buckets", () => {
    const plan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T01:00:00.000Z"),
      granularity: "day",
      source: "rejected",
      lookbackBuckets: 2,
      safetyDelayMs: 0,
    });

    expect(plan.source).toBe("rejected");
    expect(plan.sources).toEqual(["rejected"]);
    expect(plan.effectiveTo?.toISOString()).toBe("2026-07-06T00:00:00.000Z");
    expect(plan.windowPlan?.requestedFrom.toISOString()).toBe(
      "2026-07-04T00:00:00.000Z",
    );
    expect(plan.windowPlan?.requestedTo.toISOString()).toBe(
      "2026-07-06T00:00:00.000Z",
    );
    expect(plan.windowPlan?.bucketCount).toBe(2);
    expect(
      plan.windowPlan?.buckets.map((bucket) => bucket.bucketStart.toISOString()),
    ).toEqual(["2026-07-04T00:00:00.000Z", "2026-07-05T00:00:00.000Z"]);
  });

  it("should reject an invalid source", () => {
    expect(() =>
      createAnalyticsRollupSchedulePlan({
        enabled: true,
        runAt: new Date("2026-07-06T13:07:00.000Z"),
        granularity: "hour",
        source: "security",
      }),
    ).toThrow(RangeError);
  });

  it("should reject invalid scheduler guardrails", () => {
    expect(() =>
      createAnalyticsRollupSchedulePlan({
        enabled: true,
        runAt: new Date("2026-07-06T13:07:00.000Z"),
        granularity: "hour",
        lookbackBuckets: 0,
      }),
    ).toThrow(RangeError);

    expect(() =>
      createAnalyticsRollupSchedulePlan({
        enabled: true,
        runAt: new Date("2026-07-06T13:07:00.000Z"),
        granularity: "hour",
        safetyDelayMs: -1,
      }),
    ).toThrow(RangeError);
  });

  it("should reject an invalid run timestamp", () => {
    expect(() =>
      createAnalyticsRollupSchedulePlan({
        enabled: true,
        runAt: new Date("invalid-date"),
        granularity: "hour",
      }),
    ).toThrow(RangeError);
  });

  it("should pass maxBuckets to the underlying window planner", () => {
    expect(() =>
      createAnalyticsRollupSchedulePlan({
        enabled: true,
        runAt: new Date("2026-07-06T13:07:00.000Z"),
        granularity: "hour",
        lookbackBuckets: 2,
        maxBuckets: 1,
      }),
    ).toThrow(RangeError);
  });
});

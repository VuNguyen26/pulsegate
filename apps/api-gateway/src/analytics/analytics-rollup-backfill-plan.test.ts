import { describe, expect, it } from "vitest";
import {
  createAnalyticsRollupBackfillPlan,
  DEFAULT_ANALYTICS_ROLLUP_BACKFILL_MAX_BUCKETS,
} from "./analytics-rollup-backfill-plan.js";

describe("analytics rollup backfill plan", () => {
  it("should create a safe default dry-run plan for both sources", () => {
    const plan = createAnalyticsRollupBackfillPlan({
      from: "2026-07-05T10:15:00.000Z",
      to: "2026-07-05T13:00:00.000Z",
      granularity: "hour",
    });

    expect(plan.source).toBe("both");
    expect(plan.sources).toEqual(["usage", "rejected"]);
    expect(plan.mode).toBe("dry-run");
    expect(plan.windowPlan.granularity).toBe("hour");
    expect(plan.windowPlan.requestedFrom.toISOString()).toBe(
      "2026-07-05T10:15:00.000Z",
    );
    expect(plan.windowPlan.requestedTo.toISOString()).toBe(
      "2026-07-05T13:00:00.000Z",
    );
    expect(plan.windowPlan.rebuildFrom?.toISOString()).toBe(
      "2026-07-05T10:00:00.000Z",
    );
    expect(plan.windowPlan.rebuildTo?.toISOString()).toBe(
      "2026-07-05T13:00:00.000Z",
    );
    expect(plan.windowPlan.bucketCount).toBe(3);
  });

  it("should create an execute plan for usage rollups only", () => {
    const plan = createAnalyticsRollupBackfillPlan({
      from: "2026-07-05T10:15:00.000Z",
      to: "2026-07-07T03:30:00.000Z",
      granularity: "day",
      source: "usage",
      mode: "execute",
      maxBuckets: 3,
    });

    expect(plan.source).toBe("usage");
    expect(plan.sources).toEqual(["usage"]);
    expect(plan.mode).toBe("execute");
    expect(plan.windowPlan.granularity).toBe("day");
    expect(plan.windowPlan.rebuildFrom?.toISOString()).toBe(
      "2026-07-05T00:00:00.000Z",
    );
    expect(plan.windowPlan.rebuildTo?.toISOString()).toBe(
      "2026-07-08T00:00:00.000Z",
    );
    expect(plan.windowPlan.bucketCount).toBe(3);
  });

  it("should create a plan for rejected rollups only", () => {
    const plan = createAnalyticsRollupBackfillPlan({
      from: "2026-07-05T10:15:00.000Z",
      to: "2026-07-05T13:00:00.000Z",
      granularity: "hour",
      source: "rejected",
    });

    expect(plan.source).toBe("rejected");
    expect(plan.sources).toEqual(["rejected"]);
  });

  it("should reject an invalid granularity", () => {
    expect(() =>
      createAnalyticsRollupBackfillPlan({
        from: "2026-07-05T10:15:00.000Z",
        to: "2026-07-05T13:00:00.000Z",
        granularity: "minute",
      }),
    ).toThrow(RangeError);
  });

  it("should reject an invalid source", () => {
    expect(() =>
      createAnalyticsRollupBackfillPlan({
        from: "2026-07-05T10:15:00.000Z",
        to: "2026-07-05T13:00:00.000Z",
        granularity: "hour",
        source: "security",
      }),
    ).toThrow(RangeError);
  });

  it("should reject an invalid mode", () => {
    expect(() =>
      createAnalyticsRollupBackfillPlan({
        from: "2026-07-05T10:15:00.000Z",
        to: "2026-07-05T13:00:00.000Z",
        granularity: "hour",
        mode: "write",
      }),
    ).toThrow(RangeError);
  });

  it("should reject invalid date strings", () => {
    expect(() =>
      createAnalyticsRollupBackfillPlan({
        from: "invalid-date",
        to: "2026-07-05T13:00:00.000Z",
        granularity: "hour",
      }),
    ).toThrow(RangeError);

    expect(() =>
      createAnalyticsRollupBackfillPlan({
        from: "2026-07-05T10:15:00.000Z",
        to: "",
        granularity: "hour",
      }),
    ).toThrow(RangeError);
  });

  it("should reject an inverted time range", () => {
    expect(() =>
      createAnalyticsRollupBackfillPlan({
        from: "2026-07-06T00:00:00.000Z",
        to: "2026-07-05T00:00:00.000Z",
        granularity: "day",
      }),
    ).toThrow(RangeError);
  });

  it("should reject a backfill plan that exceeds the default max bucket guardrail", () => {
    expect(DEFAULT_ANALYTICS_ROLLUP_BACKFILL_MAX_BUCKETS).toBe(744);

    expect(() =>
      createAnalyticsRollupBackfillPlan({
        from: "2026-07-01T00:00:00.000Z",
        to: "2026-08-01T01:00:00.000Z",
        granularity: "hour",
      }),
    ).toThrow(RangeError);
  });

  it("should pass custom maxBuckets to the window planner", () => {
    expect(() =>
      createAnalyticsRollupBackfillPlan({
        from: "2026-07-05T10:15:00.000Z",
        to: "2026-07-05T13:00:00.000Z",
        granularity: "hour",
        maxBuckets: 2,
      }),
    ).toThrow(RangeError);
  });
});

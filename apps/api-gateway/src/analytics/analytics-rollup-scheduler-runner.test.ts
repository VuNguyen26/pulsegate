import { describe, expect, it } from "vitest";

import { createAnalyticsRollupSchedulePlan } from "./analytics-rollup-schedule-plan.js";
import { createAnalyticsRollupSchedulerRunnerPlan } from "./analytics-rollup-scheduler-runner.js";

describe("analytics rollup scheduler runner", () => {
  it("should skip a disabled schedule without creating backfill requests", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "usage",
    });

    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    expect(runnerPlan).toEqual({
      kind: "analytics-rollup-scheduler-runner",
      mode: "preview",
      enabled: false,
      status: "skipped",
      scheduleStatus: "disabled",
      skipReason: "schedule-disabled",
      source: "usage",
      sources: ["usage"],
      granularity: "hour",
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      effectiveTo: null,
      bucketCount: 0,
      backfillRequests: [],
      safety: {
        previewOnly: true,
        createsScheduledJob: false,
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });

  it("should create dry-run backfill request contracts for both scheduled sources", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
    });

    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    expect(runnerPlan.status).toBe("ready");
    expect(runnerPlan.scheduleStatus).toBe("planned");
    expect(runnerPlan.skipReason).toBeNull();
    expect(runnerPlan.source).toBe("both");
    expect(runnerPlan.sources).toEqual(["usage", "rejected"]);
    expect(runnerPlan.effectiveTo?.toISOString()).toBe(
      "2026-07-06T13:00:00.000Z",
    );
    expect(runnerPlan.bucketCount).toBe(1);
    expect(runnerPlan.backfillRequests).toEqual([
      {
        source: "usage",
        mode: "dry-run",
        from: new Date("2026-07-06T12:00:00.000Z"),
        to: new Date("2026-07-06T13:00:00.000Z"),
        granularity: "hour",
        bucketCount: 1,
        willInvokeBackfillService: false,
        willReadEvents: false,
        willPersistRollups: false,
      },
      {
        source: "rejected",
        mode: "dry-run",
        from: new Date("2026-07-06T12:00:00.000Z"),
        to: new Date("2026-07-06T13:00:00.000Z"),
        granularity: "hour",
        bucketCount: 1,
        willInvokeBackfillService: false,
        willReadEvents: false,
        willPersistRollups: false,
      },
    ]);
  });

  it("should preserve rejected-only source separation", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T01:00:00.000Z"),
      granularity: "day",
      source: "rejected",
      lookbackBuckets: 2,
      safetyDelayMs: 0,
    });

    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    expect(runnerPlan.status).toBe("ready");
    expect(runnerPlan.source).toBe("rejected");
    expect(runnerPlan.sources).toEqual(["rejected"]);
    expect(runnerPlan.bucketCount).toBe(2);
    expect(runnerPlan.backfillRequests).toEqual([
      {
        source: "rejected",
        mode: "dry-run",
        from: new Date("2026-07-04T00:00:00.000Z"),
        to: new Date("2026-07-06T00:00:00.000Z"),
        granularity: "day",
        bucketCount: 2,
        willInvokeBackfillService: false,
        willReadEvents: false,
        willPersistRollups: false,
      },
    ]);
  });

  it("should keep the scheduler runner contract non-destructive and quota-independent", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "usage",
    });

    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    expect(runnerPlan.safety).toEqual({
      previewOnly: true,
      createsScheduledJob: false,
      invokesBackfillService: false,
      executesBackfill: false,
      readsEvents: false,
      persistsRollups: false,
      affectsQuotaCounting: false,
      deletesRawEvents: false,
    });
    expect(runnerPlan.backfillRequests).toEqual([
      {
        source: "usage",
        mode: "dry-run",
        from: new Date("2026-07-06T12:00:00.000Z"),
        to: new Date("2026-07-06T13:00:00.000Z"),
        granularity: "hour",
        bucketCount: 1,
        willInvokeBackfillService: false,
        willReadEvents: false,
        willPersistRollups: false,
      },
    ]);
  });
});
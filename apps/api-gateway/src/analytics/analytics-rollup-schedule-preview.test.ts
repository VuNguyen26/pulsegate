import { describe, expect, it } from "vitest";

import { createAnalyticsRollupSchedulePlan } from "./analytics-rollup-schedule-plan.js";
import { createAnalyticsRollupSchedulePreview } from "./analytics-rollup-schedule-preview.js";

describe("analytics rollup schedule preview", () => {
  it("should create a disabled preview without a planned window", () => {
    const plan = createAnalyticsRollupSchedulePlan({
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "usage",
    });

    const preview = createAnalyticsRollupSchedulePreview(plan);

    expect(preview).toEqual({
      kind: "analytics-rollup-schedule-preview",
      mode: "preview",
      enabled: false,
      status: "disabled",
      source: "usage",
      sources: ["usage"],
      granularity: "hour",
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      effectiveTo: null,
      lookbackBuckets: 1,
      safetyDelayMs: 5 * 60 * 1000,
      requestedFrom: null,
      requestedTo: null,
      rebuildFrom: null,
      rebuildTo: null,
      bucketCount: 0,
      sourceResults: [
        {
          source: "usage",
          status: "disabled",
          plannedBucketCount: 0,
          willReadEvents: false,
          willPersistRollups: false,
        },
      ],
      safety: {
        previewOnly: true,
        commandCreatesScheduledJob: false,
        commandExecutesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });

  it("should create a non-executing preview for both scheduled sources", () => {
    const plan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
    });

    const preview = createAnalyticsRollupSchedulePreview(plan);

    expect(preview.kind).toBe("analytics-rollup-schedule-preview");
    expect(preview.mode).toBe("preview");
    expect(preview.enabled).toBe(true);
    expect(preview.status).toBe("planned");
    expect(preview.source).toBe("both");
    expect(preview.sources).toEqual(["usage", "rejected"]);
    expect(preview.granularity).toBe("hour");
    expect(preview.effectiveTo?.toISOString()).toBe("2026-07-06T13:00:00.000Z");
    expect(preview.requestedFrom?.toISOString()).toBe(
      "2026-07-06T12:00:00.000Z",
    );
    expect(preview.requestedTo?.toISOString()).toBe(
      "2026-07-06T13:00:00.000Z",
    );
    expect(preview.rebuildFrom?.toISOString()).toBe(
      "2026-07-06T12:00:00.000Z",
    );
    expect(preview.rebuildTo?.toISOString()).toBe(
      "2026-07-06T13:00:00.000Z",
    );
    expect(preview.bucketCount).toBe(1);
    expect(preview.sourceResults).toEqual([
      {
        source: "usage",
        status: "planned",
        plannedBucketCount: 1,
        willReadEvents: false,
        willPersistRollups: false,
      },
      {
        source: "rejected",
        status: "planned",
        plannedBucketCount: 1,
        willReadEvents: false,
        willPersistRollups: false,
      },
    ]);
  });

  it("should preserve rejected-only source separation in preview output", () => {
    const plan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T01:00:00.000Z"),
      granularity: "day",
      source: "rejected",
      lookbackBuckets: 2,
      safetyDelayMs: 0,
    });

    const preview = createAnalyticsRollupSchedulePreview(plan);

    expect(preview.source).toBe("rejected");
    expect(preview.sources).toEqual(["rejected"]);
    expect(preview.bucketCount).toBe(2);
    expect(preview.sourceResults).toEqual([
      {
        source: "rejected",
        status: "planned",
        plannedBucketCount: 2,
        willReadEvents: false,
        willPersistRollups: false,
      },
    ]);
  });

  it("should keep scheduled preview non-destructive and quota-independent", () => {
    const plan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "usage",
    });

    const preview = createAnalyticsRollupSchedulePreview(plan);

    expect(preview.safety).toEqual({
      previewOnly: true,
      commandCreatesScheduledJob: false,
      commandExecutesBackfill: false,
      readsEvents: false,
      persistsRollups: false,
      affectsQuotaCounting: false,
      deletesRawEvents: false,
    });
    expect(preview.sourceResults).toEqual([
      {
        source: "usage",
        status: "planned",
        plannedBucketCount: 1,
        willReadEvents: false,
        willPersistRollups: false,
      },
    ]);
  });
});

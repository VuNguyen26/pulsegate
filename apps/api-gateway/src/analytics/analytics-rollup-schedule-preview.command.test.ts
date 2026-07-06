import { afterEach, describe, expect, it, vi } from "vitest";

import { runAnalyticsRollupSchedulePreviewCommand } from "./analytics-rollup-schedule-preview.command.js";

describe("analytics rollup schedule preview command", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should print a schedule preview JSON without executing rollup work", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulePreviewCommand([
      "--enabled",
      "true",
      "--source",
      "both",
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
      "--lookback-buckets",
      "1",
      "--safety-delay-ms",
      "300000",
      "--max-buckets",
      "1",
    ]);

    expect(consoleLog).toHaveBeenCalledOnce();

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output).toMatchObject({
      kind: "analytics-rollup-schedule-preview",
      mode: "preview",
      enabled: true,
      status: "planned",
      source: "both",
      sources: ["usage", "rejected"],
      granularity: "hour",
      runAt: "2026-07-06T13:07:00.000Z",
      effectiveTo: "2026-07-06T13:00:00.000Z",
      requestedFrom: "2026-07-06T12:00:00.000Z",
      requestedTo: "2026-07-06T13:00:00.000Z",
      rebuildFrom: "2026-07-06T12:00:00.000Z",
      rebuildTo: "2026-07-06T13:00:00.000Z",
      bucketCount: 1,
      sourceResults: [
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

  it("should print a disabled preview without creating a scheduled job", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulePreviewCommand([
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
      "--source",
      "usage",
    ]);

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output).toMatchObject({
      enabled: false,
      status: "disabled",
      source: "usage",
      sources: ["usage"],
      effectiveTo: null,
      requestedFrom: null,
      requestedTo: null,
      rebuildFrom: null,
      rebuildTo: null,
      bucketCount: 0,
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

  it("should reject invalid args before printing output", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await expect(
      runAnalyticsRollupSchedulePreviewCommand([
        "--run-at",
        "invalid-date",
        "--granularity",
        "hour",
      ]),
    ).rejects.toThrow(RangeError);

    expect(consoleLog).not.toHaveBeenCalled();
  });
});

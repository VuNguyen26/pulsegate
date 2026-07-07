import { afterEach, describe, expect, it, vi } from "vitest";

import { runAnalyticsRollupSchedulerPreviewCommand } from "./analytics-rollup-scheduler-preview.command.js";

describe("analytics rollup scheduler preview command", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should print a scheduler runner preview JSON without executing rollup work", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
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
      kind: "analytics-rollup-scheduler-runner",
      mode: "preview",
      enabled: true,
      status: "ready",
      scheduleStatus: "planned",
      skipReason: null,
      source: "both",
      sources: ["usage", "rejected"],
      granularity: "hour",
      runAt: "2026-07-06T13:07:00.000Z",
      effectiveTo: "2026-07-06T13:00:00.000Z",
      bucketCount: 1,
      backfillRequests: [
        {
          source: "usage",
          mode: "dry-run",
          from: "2026-07-06T12:00:00.000Z",
          to: "2026-07-06T13:00:00.000Z",
          granularity: "hour",
          bucketCount: 1,
          willInvokeBackfillService: false,
          willReadEvents: false,
          willPersistRollups: false,
        },
        {
          source: "rejected",
          mode: "dry-run",
          from: "2026-07-06T12:00:00.000Z",
          to: "2026-07-06T13:00:00.000Z",
          granularity: "hour",
          bucketCount: 1,
          willInvokeBackfillService: false,
          willReadEvents: false,
          willPersistRollups: false,
        },
      ],
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

  it("should print a skipped scheduler preview for a disabled schedule", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
      "--source",
      "usage",
    ]);

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output).toMatchObject({
      kind: "analytics-rollup-scheduler-runner",
      mode: "preview",
      enabled: false,
      status: "skipped",
      scheduleStatus: "disabled",
      skipReason: "schedule-disabled",
      source: "usage",
      sources: ["usage"],
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

  it("should reject invalid args before printing output", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await expect(
      runAnalyticsRollupSchedulerPreviewCommand([
        "--run-at",
        "invalid-date",
        "--granularity",
        "hour",
      ]),
    ).rejects.toThrow(RangeError);

    expect(consoleLog).not.toHaveBeenCalled();
  });
});
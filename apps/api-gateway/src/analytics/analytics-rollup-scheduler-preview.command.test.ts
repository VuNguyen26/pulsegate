import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE,
  runAnalyticsRollupSchedulerPreviewCommand,
} from "./analytics-rollup-scheduler-preview.command.js";

describe("analytics rollup scheduler preview command", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should print a scheduler runner preview JSON without executing rollup work", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

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
    expect(output.executionDecision).toMatchObject({
      kind: "analytics-rollup-scheduler-execution-decision",
      status: "preview-ready",
      allowed: true,
      blockedReason: null,
      runnerStatus: "ready",
      scheduleStatus: "planned",
      source: "both",
      sources: ["usage", "rejected"],
      granularity: "hour",
      runAt: "2026-07-06T13:07:00.000Z",
      effectiveTo: "2026-07-06T13:00:00.000Z",
      bucketCount: 1,
      backfillRequestCount: 2,
      boundary: {
        trigger: "command",
        requestedMode: "preview",
        allowedMode: "preview",
        commandTriggeredOnly: true,
        processLocalExecutionWired: false,
        externalSchedulerExecutionWired: false,
        backfillServiceInvocationWired: false,
        backfillExecutionWired: false,
      },
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
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

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
    expect(output.executionDecision).toMatchObject({
      kind: "analytics-rollup-scheduler-execution-decision",
      status: "blocked",
      allowed: false,
      blockedReason: "scheduler-runner-not-ready",
      runnerStatus: "skipped",
      scheduleStatus: "disabled",
      backfillRequestCount: 0,
      boundary: {
        trigger: "command",
        requestedMode: "preview",
        allowedMode: "preview",
        backfillServiceInvocationWired: false,
        backfillExecutionWired: false,
      },
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
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

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

  it("should document scheduler preview safety boundaries in usage text", () => {
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "analytics:rollup:scheduler-preview",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "Preview only",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "execution boundary decision",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "Does not create scheduled jobs",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "invoke backfill service",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "execute backfill",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "read events",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "persist rollups",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "affect quota counting",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "delete raw events",
    );
  });

  it("should expose only non-executing dry-run backfill request contracts", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      "--enabled",
      "true",
      "--source",
      "usage",
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
    ]);

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.backfillRequests).toHaveLength(1);
    expect(output.backfillRequests[0]).toMatchObject({
      source: "usage",
      mode: "dry-run",
      willInvokeBackfillService: false,
      willReadEvents: false,
      willPersistRollups: false,
    });
    expect(output.executionDecision).toMatchObject({
      status: "preview-ready",
      allowed: true,
      boundary: {
        trigger: "command",
        requestedMode: "preview",
        allowedMode: "preview",
        backfillServiceInvocationWired: false,
        backfillExecutionWired: false,
      },
    });
    expect(output.safety).toEqual({
      previewOnly: true,
      createsScheduledJob: false,
      invokesBackfillService: false,
      executesBackfill: false,
      readsEvents: false,
      persistsRollups: false,
      affectsQuotaCounting: false,
      deletesRawEvents: false,
    });
    expect(output.executionDecision.safety).toEqual({
      previewOnly: true,
      createsScheduledJob: false,
      invokesBackfillService: false,
      executesBackfill: false,
      readsEvents: false,
      persistsRollups: false,
      affectsQuotaCounting: false,
      deletesRawEvents: false,
    });
  });
});
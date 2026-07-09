import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE,
  runAnalyticsRollupSchedulerPreviewCommand,
} from "./analytics-rollup-scheduler-preview.command.js";

const baseArgs = [
  "--enabled",
  "true",
  "--source",
  "both",
  "--run-at",
  "2026-07-09T10:00:00.000Z",
  "--granularity",
  "hour",
  "--lookback-buckets",
  "1",
  "--max-buckets",
  "1",
  "--safety-delay-ms",
  "300000",
];

const nonDestructiveBackgroundSafety = {
  createsScheduledJob: false,
  invokesBackfillService: false,
  executesBackfill: false,
  readsEvents: false,
  persistsRollups: false,
  affectsQuotaCounting: false,
  deletesRawEvents: false,
  runsRetentionExecution: false,
};

function readPrintedOutput(consoleLog: ReturnType<typeof vi.spyOn>) {
  return JSON.parse(consoleLog.mock.calls[0]?.[0] as string);
}

describe("analytics rollup scheduler preview background runtime gate command output", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exposes process-local dry-run runtimeGate as blocked and does not resolve runtime factory", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    const createRuntimeBackfillService = vi.fn(() => {
      throw new Error("runtime service must not be resolved for process-local dry-run");
    });

    await runAnalyticsRollupSchedulerPreviewCommand(
      [
        ...baseArgs,
        "--execution-trigger",
        "process-local",
        "--execution-mode",
        "dry-run",
        "--event-limit",
        "500",
      ],
      { createRuntimeBackfillService },
    );

    const output = readPrintedOutput(consoleLog);

    expect(createRuntimeBackfillService).not.toHaveBeenCalled();
    expect(output.backgroundScheduler.runtimeGate.summary).toMatchObject({
      status: "background-runtime-blocked",
      runnerStatus: "background-runtime-invocation-blocked",
      blockedReason: "background-runtime-execution-not-wired",
      trigger: "process-local",
      requestedMode: "dry-run",
      ready: false,
      runtimeInvocationAllowed: false,
      runtimeFactoryResolutionAllowed: false,
      backfillServiceInvocationAllowed: false,
      executeBackfillAllowed: false,
      directCommandRuntimePreserved: false,
    });
    expect(output.backgroundScheduler.runtimeGate.safety).toEqual(
      nonDestructiveBackgroundSafety,
    );
    expect(output.dryRunServiceInvocationResults).toBeUndefined();
    expect(output.dryRunRuntimeFactoryError).toBeUndefined();
    expect(output.executeServiceInvocationResults).toBeUndefined();
  });

  it("exposes external scheduler execute runtimeGate as blocked and does not resolve runtime factory", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    const createRuntimeBackfillService = vi.fn(() => {
      throw new Error("runtime service must not be resolved for external scheduler execute");
    });

    await runAnalyticsRollupSchedulerPreviewCommand(
      [
        ...baseArgs,
        "--execution-trigger",
        "external-scheduler",
        "--execution-mode",
        "execute",
        "--event-limit",
        "500",
        "--confirm-execute",
        "true",
      ],
      { createRuntimeBackfillService },
    );

    const output = readPrintedOutput(consoleLog);

    expect(createRuntimeBackfillService).not.toHaveBeenCalled();
    expect(output.backgroundScheduler.runtimeGate.summary).toMatchObject({
      status: "background-runtime-blocked",
      runnerStatus: "background-runtime-invocation-blocked",
      blockedReason: "background-runtime-execution-not-wired",
      trigger: "external-scheduler",
      requestedMode: "execute",
      ready: false,
      runtimeInvocationAllowed: false,
      runtimeFactoryResolutionAllowed: false,
      backfillServiceInvocationAllowed: false,
      executeBackfillAllowed: false,
      directCommandRuntimePreserved: false,
    });
    expect(output.backgroundScheduler.runtimeGate.review).toMatchObject({
      externalSchedulerRuntimeStillClosed: true,
      serviceInvocationStillBlocked: true,
      quotaCountingUnaffected: true,
      rawEventDeletionBlocked: true,
      retentionExecutionBlocked: true,
    });
    expect(output.backgroundScheduler.runtimeGate.safety).toEqual(
      nonDestructiveBackgroundSafety,
    );
    expect(output.executeServiceInvocationResults).toBeUndefined();
    expect(output.dryRunServiceInvocationResults).toBeUndefined();
  });

  it("documents backgroundScheduler runtimeGate in CLI usage text", () => {
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "backgroundScheduler.runtimeGate",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "blocked-by-default",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "does not resolve a runtime service factory",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "does not open process-local/external scheduler runtime execution",
    );
  });
});
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

  it("invokes process-local dry-run service only after explicit opt-in and keeps command dry-run fields hidden", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    const backfillService = {
      runBackfill: vi.fn(async (runInput) => {
        const sourceResults = runInput.plan.sources.map((source: "usage" | "rejected") => ({
          source,
          status: "planned" as const,
          inputEventCount: 0,
          aggregateCount: 0,
          upsertedCount: 0,
        }));

        return {
          mode: "dry-run" as const,
          source: runInput.plan.source,
          sources: runInput.plan.sources,
          granularity: runInput.plan.windowPlan.granularity,
          requestedFrom: runInput.plan.windowPlan.requestedFrom,
          requestedTo: runInput.plan.windowPlan.requestedTo,
          rebuildFrom: runInput.plan.windowPlan.rebuildFrom,
          rebuildTo: runInput.plan.windowPlan.rebuildTo,
          bucketCount: runInput.plan.windowPlan.bucketCount,
          sourceResults,
          totalInputEventCount: 0,
          totalAggregateCount: 0,
          totalUpsertedCount: 0,
        };
      }),
    };
    const createRuntimeBackfillService = vi.fn(() => {
      throw new Error("runtime factory should not be used when service is injected");
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
      {
        backfillService,
        createRuntimeBackfillService,
        allowProcessLocalDryRunRuntimeInvocation: true,
      },
    );

    const output = readPrintedOutput(consoleLog);

    expect(createRuntimeBackfillService).not.toHaveBeenCalled();
    expect(backfillService.runBackfill).toHaveBeenCalledTimes(2);
    expect(output.backgroundScheduler.summary).toMatchObject({
      status: "background-runtime-ready",
      runnerStatus: "background-process-local-dry-run-runtime-ready",
      blockedReason: null,
      ready: true,
      backgroundRuntimeInvocationAllowed: true,
      directCommandRuntimePreserved: false,
    });
    expect(output.backgroundScheduler.runtimeGate.summary).toMatchObject({
      status: "process-local-dry-run-runtime-ready",
      runnerStatus: "background-process-local-dry-run-runtime-ready",
      blockedReason: null,
      trigger: "process-local",
      requestedMode: "dry-run",
      runtimeInvocationAllowed: true,
      runtimeFactoryResolutionAllowed: true,
      backfillServiceInvocationAllowed: true,
      executeBackfillAllowed: false,
    });
    expect(
      output.backgroundScheduler.processLocalDryRunServiceInvocationResults,
    ).toHaveLength(2);
    expect(
      output.backgroundScheduler.processLocalDryRunServiceInvocationResults.map(
        (result: { source: string }) => result.source,
      ),
    ).toEqual(["usage", "rejected"]);
    expect(
      output.backgroundScheduler.processLocalDryRunServiceInvocationResults.map(
        (result: { status: string }) => result.status,
      ),
    ).toEqual(["service-dry-run-invoked", "service-dry-run-invoked"]);
    expect(output.dryRunServiceInvocationResults).toBeUndefined();
    expect(output.dryRunRuntimeFactoryError).toBeUndefined();
    expect(output.executeServiceInvocationResults).toBeUndefined();
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
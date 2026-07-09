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

describe("analytics rollup scheduler preview background output", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exposes process-local preview as background preview-ready without runtime invocation", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      ...baseArgs,
      "--execution-trigger",
      "process-local",
      "--execution-mode",
      "preview",
    ]);

    const output = readPrintedOutput(consoleLog);

    expect(output.backgroundScheduler.summary).toMatchObject({
      status: "background-preview-ready",
      runnerStatus: "background-preview-plan-ready",
      blockedReason: null,
      ready: true,
      backgroundRunnerSelected: true,
      backgroundRunnerPlanAllowed: true,
      backgroundRuntimeInvocationAllowed: false,
      directCommandRuntimePreserved: false,
    });
    expect(output.backgroundScheduler.previewPlan).toMatchObject({
      trigger: "process-local",
      requestedMode: "preview",
      granularity: "hour",
      source: "both",
      lookbackBuckets: 1,
      maxBuckets: 1,
      safetyDelayMs: 300000,
      runtimeInvocationAllowed: false,
    });
    expect(output.backgroundScheduler.runtimeGate.summary).toMatchObject({
      status: "background-preview-runtime-closed",
      runnerStatus: "background-preview-plan-ready",
      blockedReason: "background-preview-only-runtime-closed",
      ready: true,
      runtimeInvocationAllowed: false,
      runtimeFactoryResolutionAllowed: false,
      backfillServiceInvocationAllowed: false,
      executeBackfillAllowed: false,
    });
    expect(output.backgroundScheduler.runtimeGate.safety).toEqual(
      nonDestructiveBackgroundSafety,
    );
    expect(output.backgroundScheduler.safety).toEqual(
      nonDestructiveBackgroundSafety,
    );
    expect(output.backgroundScheduler.review).toMatchObject({
      separatesCommandFromBackgroundSemantics: true,
      preservesDirectCommandDryRunAndExecute: true,
      backgroundRuntimeStillClosed: true,
      processLocalExecutionStillClosed: true,
      previewOnlyWhenReady: true,
    });
    expect(output.dryRunServiceInvocationResults).toBeUndefined();
    expect(output.executeServiceInvocationResults).toBeUndefined();
  });

  it("exposes external scheduler execute as runtime-blocked and does not resolve runtime service", async () => {
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
      ],
      { createRuntimeBackfillService },
    );

    const output = readPrintedOutput(consoleLog);

    expect(createRuntimeBackfillService).not.toHaveBeenCalled();
    expect(output.backgroundScheduler.summary).toMatchObject({
      status: "background-runtime-blocked",
      runnerStatus: "background-runtime-invocation-blocked",
      blockedReason: "background-runtime-execution-not-wired",
      ready: false,
      backgroundRunnerSelected: true,
      backgroundRunnerPlanAllowed: false,
      backgroundRuntimeInvocationAllowed: false,
    });
    expect(output.backgroundScheduler.previewPlan).toBeNull();
    expect(output.backgroundScheduler.safety).toEqual(
      nonDestructiveBackgroundSafety,
    );
    expect(output.executeServiceInvocationResults).toBeUndefined();
  });

  it("exposes command trigger as direct CLI runtime preserved", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      ...baseArgs,
      "--execution-trigger",
      "command",
      "--execution-mode",
      "preview",
    ]);

    const output = readPrintedOutput(consoleLog);

    expect(output.backgroundScheduler.summary).toMatchObject({
      status: "command-runtime-preserved",
      runnerStatus: "command-trigger-skipped",
      blockedReason: "command-trigger-owned-by-direct-cli",
      ready: false,
      backgroundRunnerSelected: false,
      backgroundRunnerPlanAllowed: false,
      backgroundRuntimeInvocationAllowed: false,
      directCommandRuntimePreserved: true,
    });
    expect(output.backgroundScheduler.previewPlan).toBeNull();
    expect(output.backgroundScheduler.runtimeGate.summary).toMatchObject({
      status: "command-runtime-preserved",
      runnerStatus: "command-trigger-skipped",
      blockedReason: "command-trigger-owned-by-direct-cli",
      ready: false,
      runtimeInvocationAllowed: false,
      runtimeFactoryResolutionAllowed: false,
      backfillServiceInvocationAllowed: false,
      executeBackfillAllowed: false,
      directCommandRuntimePreserved: true,
    });
    expect(output.backgroundScheduler.runtimeGate.safety).toEqual(
      nonDestructiveBackgroundSafety,
    );
    expect(output.backgroundScheduler.safety).toEqual(
      nonDestructiveBackgroundSafety,
    );
    expect(output.backgroundScheduler.review).toMatchObject({
      separatesCommandFromBackgroundSemantics: true,
      preservesDirectCommandDryRunAndExecute: true,
      backgroundRuntimeStillClosed: true,
      previewOnlyWhenReady: true,
    });
  });

  it("keeps process-local dry-run runtime fields hidden and runtime factory unresolved", async () => {
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
    expect(output.backgroundScheduler.summary).toMatchObject({
      status: "background-runtime-blocked",
      runnerStatus: "background-runtime-invocation-blocked",
      blockedReason: "background-runtime-execution-not-wired",
      ready: false,
      backgroundRuntimeInvocationAllowed: false,
    });
    expect(output.backgroundScheduler.previewPlan).toBeNull();
    expect(output.backgroundScheduler.safety).toEqual(
      nonDestructiveBackgroundSafety,
    );
    expect(output.dryRunServiceInvocationResults).toBeUndefined();
    expect(output.dryRunRuntimeCleanupError).toBeUndefined();
    expect(output.dryRunRuntimeFactoryError).toBeUndefined();
    expect(output.executeServiceInvocationResults).toBeUndefined();
  });

  it("keeps disabled background preview blocked without preview plan", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      "--enabled",
      "false",
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
      "--execution-trigger",
      "process-local",
      "--execution-mode",
      "preview",
    ]);

    const output = readPrintedOutput(consoleLog);

    expect(output.backgroundScheduler.summary).toMatchObject({
      status: "background-runner-blocked",
      runnerStatus: "background-runner-disabled",
      blockedReason: "background-runner-disabled",
      ready: false,
      backgroundRunnerSelected: true,
      backgroundRunnerPlanAllowed: true,
      backgroundRuntimeInvocationAllowed: false,
    });
    expect(output.backgroundScheduler.previewPlan).toBeNull();
    expect(output.backgroundScheduler.safety).toEqual(
      nonDestructiveBackgroundSafety,
    );
    expect(output.backgroundScheduler.review.previewOnlyWhenReady).toBe(true);
    expect(output.dryRunServiceInvocationResults).toBeUndefined();
    expect(output.executeServiceInvocationResults).toBeUndefined();
  });

  it("keeps command dry-run without event limit non-invoking while preserving command ownership", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    const createRuntimeBackfillService = vi.fn(() => {
      throw new Error("runtime service must not be resolved without event limit");
    });

    await runAnalyticsRollupSchedulerPreviewCommand(
      [
        ...baseArgs,
        "--execution-trigger",
        "command",
        "--execution-mode",
        "dry-run",
      ],
      { createRuntimeBackfillService },
    );

    const output = readPrintedOutput(consoleLog);

    expect(createRuntimeBackfillService).not.toHaveBeenCalled();
    expect(output.backgroundScheduler.summary).toMatchObject({
      status: "command-runtime-preserved",
      runnerStatus: "command-trigger-skipped",
      blockedReason: "command-trigger-owned-by-direct-cli",
      ready: false,
      directCommandRuntimePreserved: true,
      backgroundRuntimeInvocationAllowed: false,
    });
    expect(output.backgroundScheduler.previewPlan).toBeNull();
    expect(output.backgroundScheduler.safety).toEqual(
      nonDestructiveBackgroundSafety,
    );
    expect(output.dryRunServiceInvocationResults).toBeUndefined();
    expect(output.dryRunRuntimeFactoryError).toBeUndefined();
    expect(output.executeServiceInvocationResults).toBeUndefined();
  });
  it("documents backgroundScheduler output in CLI usage text", () => {
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "backgroundScheduler",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "backgroundScheduler.runtimeGate",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "operator-visible guardrail data",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "blocked-by-default",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "unless direct CLI process-local dry-run guardrails opt in",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "does not start scheduled jobs",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "does not open external scheduler runtime execution",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "never opens background execute",
    );
  });
});

import { describe, expect, it } from "vitest";

import { buildAnalyticsRollupBackgroundSchedulerOutput } from "./analytics-rollup-background-scheduler-output.js";

const baseRequest = {
  backgroundRunnerContractEnabled: true,
  schedulerEnabled: true,
  runAtIso: "2026-07-09T10:00:00.000Z",
  granularity: "hour" as const,
  source: "both" as const,
  lookbackBuckets: 1,
  maxBuckets: 1,
  safetyDelayMs: 300000,
};

const nonDestructiveSafety = {
  createsScheduledJob: false,
  invokesBackfillService: false,
  executesBackfill: false,
  readsEvents: false,
  persistsRollups: false,
  affectsQuotaCounting: false,
  deletesRawEvents: false,
  runsRetentionExecution: false,
};

describe("analytics rollup background scheduler output runtime gate", () => {
  it("exposes command runtime gate as direct CLI preserved", () => {
    const output = buildAnalyticsRollupBackgroundSchedulerOutput({
      ...baseRequest,
      trigger: "command",
      requestedMode: "execute",
    });

    expect(output.summary).toMatchObject({
      status: "command-runtime-preserved",
      directCommandRuntimePreserved: true,
      backgroundRuntimeInvocationAllowed: false,
    });
    expect(output.runtimeGate.summary).toMatchObject({
      status: "command-runtime-preserved",
      runnerStatus: "command-trigger-skipped",
      blockedReason: "command-trigger-owned-by-direct-cli",
      runtimeInvocationAllowed: false,
      runtimeFactoryResolutionAllowed: false,
      backfillServiceInvocationAllowed: false,
      executeBackfillAllowed: false,
      directCommandRuntimePreserved: true,
    });
    expect(output.runtimeGate.safety).toEqual(nonDestructiveSafety);
  });

  it("exposes process-local preview gate as preview-only runtime closed", () => {
    const output = buildAnalyticsRollupBackgroundSchedulerOutput({
      ...baseRequest,
      trigger: "process-local",
      requestedMode: "preview",
    });

    expect(output.summary).toMatchObject({
      status: "background-preview-ready",
      ready: true,
      backgroundRuntimeInvocationAllowed: false,
    });
    expect(output.previewPlan).toMatchObject({
      trigger: "process-local",
      requestedMode: "preview",
      runtimeInvocationAllowed: false,
    });
    expect(output.runtimeGate.summary).toMatchObject({
      status: "background-preview-runtime-closed",
      runnerStatus: "background-preview-plan-ready",
      blockedReason: "background-preview-only-runtime-closed",
      ready: true,
      runtimeInvocationAllowed: false,
      runtimeFactoryResolutionAllowed: false,
      backfillServiceInvocationAllowed: false,
      executeBackfillAllowed: false,
    });
    expect(output.runtimeGate.review).toMatchObject({
      backgroundRuntimeStillClosed: true,
      processLocalRuntimeStillClosed: true,
      serviceInvocationStillBlocked: true,
      quotaCountingUnaffected: true,
      rawEventDeletionBlocked: true,
      retentionExecutionBlocked: true,
    });
  });

  it("exposes external scheduler execute gate as runtime blocked", () => {
    const output = buildAnalyticsRollupBackgroundSchedulerOutput({
      ...baseRequest,
      trigger: "external-scheduler",
      requestedMode: "execute",
    });

    expect(output.summary).toMatchObject({
      status: "background-runtime-blocked",
      ready: false,
      backgroundRuntimeInvocationAllowed: false,
    });
    expect(output.previewPlan).toBeNull();
    expect(output.runtimeGate.summary).toMatchObject({
      status: "background-runtime-blocked",
      runnerStatus: "background-runtime-invocation-blocked",
      blockedReason: "background-runtime-execution-not-wired",
      ready: false,
      runtimeInvocationAllowed: false,
      runtimeFactoryResolutionAllowed: false,
      backfillServiceInvocationAllowed: false,
      executeBackfillAllowed: false,
    });
    expect(output.runtimeGate.safety).toEqual(nonDestructiveSafety);
  });
});
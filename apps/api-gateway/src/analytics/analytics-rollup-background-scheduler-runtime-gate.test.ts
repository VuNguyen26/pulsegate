import { describe, expect, it } from "vitest";

import { buildAnalyticsRollupBackgroundSchedulerRuntimeGate } from "./analytics-rollup-background-scheduler-runtime-gate.js";

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

describe("analytics rollup background scheduler runtime gate", () => {
  it("preserves command runtime ownership and keeps background runtime closed", () => {
    const gate = buildAnalyticsRollupBackgroundSchedulerRuntimeGate({
      ...baseRequest,
      trigger: "command",
      requestedMode: "execute",
    });

    expect(gate.summary).toMatchObject({
      status: "command-runtime-preserved",
      runnerStatus: "command-trigger-skipped",
      blockedReason: "command-trigger-owned-by-direct-cli",
      trigger: "command",
      requestedMode: "execute",
      ready: false,
      runtimeInvocationAllowed: false,
      runtimeFactoryResolutionAllowed: false,
      backfillServiceInvocationAllowed: false,
      executeBackfillAllowed: false,
      directCommandRuntimePreserved: true,
    });
    expect(gate.safety).toEqual(nonDestructiveSafety);
    expect(gate.review).toMatchObject({
      separatesCommandFromBackgroundSemantics: true,
      preservesDirectCommandDryRunAndExecute: true,
      backgroundRuntimeStillClosed: true,
      serviceInvocationStillBlocked: true,
      quotaCountingUnaffected: true,
      rawEventDeletionBlocked: true,
      retentionExecutionBlocked: true,
    });
  });

  it("allows process-local preview planning but keeps runtime invocation closed", () => {
    const gate = buildAnalyticsRollupBackgroundSchedulerRuntimeGate({
      ...baseRequest,
      trigger: "process-local",
      requestedMode: "preview",
    });

    expect(gate.summary).toMatchObject({
      status: "background-preview-runtime-closed",
      runnerStatus: "background-preview-plan-ready",
      blockedReason: "background-preview-only-runtime-closed",
      trigger: "process-local",
      requestedMode: "preview",
      ready: true,
      runtimeInvocationAllowed: false,
      runtimeFactoryResolutionAllowed: false,
      backfillServiceInvocationAllowed: false,
      executeBackfillAllowed: false,
      directCommandRuntimePreserved: false,
    });
    expect(gate.safety).toEqual(nonDestructiveSafety);
    expect(gate.review).toMatchObject({
      backgroundRuntimeStillClosed: true,
      processLocalRuntimeStillClosed: true,
      serviceInvocationStillBlocked: true,
      quotaCountingUnaffected: true,
      rawEventDeletionBlocked: true,
    });
  });

  it("blocks process-local dry-run before resolving any runtime service", () => {
    const gate = buildAnalyticsRollupBackgroundSchedulerRuntimeGate({
      ...baseRequest,
      trigger: "process-local",
      requestedMode: "dry-run",
    });

    expect(gate.summary).toMatchObject({
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
    });
    expect(gate.safety).toEqual(nonDestructiveSafety);
  });

  it("blocks external scheduler execute before resolving any runtime service", () => {
    const gate = buildAnalyticsRollupBackgroundSchedulerRuntimeGate({
      ...baseRequest,
      trigger: "external-scheduler",
      requestedMode: "execute",
    });

    expect(gate.summary).toMatchObject({
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
    });
    expect(gate.review).toMatchObject({
      externalSchedulerRuntimeStillClosed: true,
      serviceInvocationStillBlocked: true,
      quotaCountingUnaffected: true,
      rawEventDeletionBlocked: true,
      retentionExecutionBlocked: true,
    });
    expect(gate.safety).toEqual(nonDestructiveSafety);
  });

  it("blocks disabled background preview before runtime selection", () => {
    const gate = buildAnalyticsRollupBackgroundSchedulerRuntimeGate({
      ...baseRequest,
      schedulerEnabled: false,
      trigger: "process-local",
      requestedMode: "preview",
    });

    expect(gate.summary).toMatchObject({
      status: "background-runner-blocked",
      runnerStatus: "background-runner-disabled",
      blockedReason: "background-runner-disabled",
      ready: false,
      runtimeInvocationAllowed: false,
      runtimeFactoryResolutionAllowed: false,
      backfillServiceInvocationAllowed: false,
      executeBackfillAllowed: false,
    });
    expect(gate.safety).toEqual(nonDestructiveSafety);
  });

  it("blocks invalid background preview before runtime selection", () => {
    const gate = buildAnalyticsRollupBackgroundSchedulerRuntimeGate({
      ...baseRequest,
      trigger: "external-scheduler",
      requestedMode: "preview",
      lookbackBuckets: 2,
      maxBuckets: 1,
    });

    expect(gate.summary).toMatchObject({
      status: "background-runner-blocked",
      runnerStatus: "background-runner-plan-invalid",
      blockedReason: "lookback-exceeds-max-buckets",
      ready: false,
      runtimeInvocationAllowed: false,
      runtimeFactoryResolutionAllowed: false,
      backfillServiceInvocationAllowed: false,
      executeBackfillAllowed: false,
    });
    expect(gate.safety).toEqual(nonDestructiveSafety);
  });
});
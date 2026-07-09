import type {
  AnalyticsRollupBackgroundSchedulerRequestedMode,
  AnalyticsRollupBackgroundSchedulerSafetyFlags,
  AnalyticsRollupBackgroundSchedulerTrigger,
} from "./analytics-rollup-background-scheduler-contract.js";
import {
  buildAnalyticsRollupBackgroundSchedulerRunnerPlan,
  type AnalyticsRollupBackgroundSchedulerRunnerPlanBlockedReason,
  type AnalyticsRollupBackgroundSchedulerRunnerPlanRequest,
  type AnalyticsRollupBackgroundSchedulerRunnerPlanStatus,
} from "./analytics-rollup-background-scheduler-runner-plan.js";

export type AnalyticsRollupBackgroundSchedulerRuntimeGateStatus =
  | "command-runtime-preserved"
  | "background-preview-runtime-closed"
  | "background-runner-blocked"
  | "background-runtime-blocked";

export type AnalyticsRollupBackgroundSchedulerRuntimeGateBlockedReason =
  | AnalyticsRollupBackgroundSchedulerRunnerPlanBlockedReason
  | "background-preview-only-runtime-closed";

export interface AnalyticsRollupBackgroundSchedulerRuntimeGateSummary {
  readonly status: AnalyticsRollupBackgroundSchedulerRuntimeGateStatus;
  readonly runnerStatus: AnalyticsRollupBackgroundSchedulerRunnerPlanStatus;
  readonly blockedReason:
    | AnalyticsRollupBackgroundSchedulerRuntimeGateBlockedReason
    | null;
  readonly trigger: AnalyticsRollupBackgroundSchedulerTrigger;
  readonly requestedMode: AnalyticsRollupBackgroundSchedulerRequestedMode;
  readonly ready: boolean;
  readonly runtimeInvocationAllowed: boolean;
  readonly runtimeFactoryResolutionAllowed: boolean;
  readonly backfillServiceInvocationAllowed: boolean;
  readonly executeBackfillAllowed: boolean;
  readonly directCommandRuntimePreserved: boolean;
}

export interface AnalyticsRollupBackgroundSchedulerRuntimeGateReview {
  readonly separatesCommandFromBackgroundSemantics: boolean;
  readonly preservesDirectCommandDryRunAndExecute: boolean;
  readonly backgroundRuntimeStillClosed: boolean;
  readonly processLocalRuntimeStillClosed: boolean;
  readonly externalSchedulerRuntimeStillClosed: boolean;
  readonly serviceInvocationStillBlocked: boolean;
  readonly quotaCountingUnaffected: boolean;
  readonly rawEventDeletionBlocked: boolean;
  readonly retentionExecutionBlocked: boolean;
}

export interface AnalyticsRollupBackgroundSchedulerRuntimeGate {
  readonly summary: AnalyticsRollupBackgroundSchedulerRuntimeGateSummary;
  readonly safety: AnalyticsRollupBackgroundSchedulerSafetyFlags;
  readonly review: AnalyticsRollupBackgroundSchedulerRuntimeGateReview;
  readonly operatorNotes: readonly string[];
}

function mapRuntimeGateStatus(
  request: AnalyticsRollupBackgroundSchedulerRunnerPlanRequest,
  runnerStatus: AnalyticsRollupBackgroundSchedulerRunnerPlanStatus,
): AnalyticsRollupBackgroundSchedulerRuntimeGateStatus {
  if (request.trigger === "command") {
    return "command-runtime-preserved";
  }

  if (request.requestedMode !== "preview") {
    return "background-runtime-blocked";
  }

  if (runnerStatus === "background-preview-plan-ready") {
    return "background-preview-runtime-closed";
  }

  return "background-runner-blocked";
}

function mapRuntimeGateBlockedReason(
  request: AnalyticsRollupBackgroundSchedulerRunnerPlanRequest,
  runnerStatus: AnalyticsRollupBackgroundSchedulerRunnerPlanStatus,
  runnerBlockedReason: AnalyticsRollupBackgroundSchedulerRunnerPlanBlockedReason | null,
): AnalyticsRollupBackgroundSchedulerRuntimeGateBlockedReason | null {
  if (request.trigger === "command") {
    return "command-trigger-owned-by-direct-cli";
  }

  if (
    request.requestedMode === "preview" &&
    runnerStatus === "background-preview-plan-ready"
  ) {
    return "background-preview-only-runtime-closed";
  }

  return runnerBlockedReason;
}

export function buildAnalyticsRollupBackgroundSchedulerRuntimeGate(
  request: AnalyticsRollupBackgroundSchedulerRunnerPlanRequest,
): AnalyticsRollupBackgroundSchedulerRuntimeGate {
  const runnerPlan = buildAnalyticsRollupBackgroundSchedulerRunnerPlan(request);
  const status = mapRuntimeGateStatus(request, runnerPlan.status);
  const blockedReason = mapRuntimeGateBlockedReason(
    request,
    runnerPlan.status,
    runnerPlan.blockedReason,
  );
  const runtimeInvocationAllowed = false;
  const runtimeFactoryResolutionAllowed = false;
  const backfillServiceInvocationAllowed = false;
  const executeBackfillAllowed = false;

  return {
    summary: {
      status,
      runnerStatus: runnerPlan.status,
      blockedReason,
      trigger: request.trigger,
      requestedMode: request.requestedMode,
      ready:
        runnerPlan.ready === true &&
        status === "background-preview-runtime-closed",
      runtimeInvocationAllowed,
      runtimeFactoryResolutionAllowed,
      backfillServiceInvocationAllowed,
      executeBackfillAllowed,
      directCommandRuntimePreserved:
        runnerPlan.contract.directCommandRuntimePreserved,
    },
    safety: {
      ...runnerPlan.safety,
      createsScheduledJob: false,
      invokesBackfillService: false,
      executesBackfill: false,
      readsEvents: false,
      persistsRollups: false,
      affectsQuotaCounting: false,
      deletesRawEvents: false,
      runsRetentionExecution: false,
    },
    review: {
      separatesCommandFromBackgroundSemantics: true,
      preservesDirectCommandDryRunAndExecute:
        request.trigger === "command"
          ? runnerPlan.contract.directCommandRuntimePreserved
          : true,
      backgroundRuntimeStillClosed: runtimeInvocationAllowed === false,
      processLocalRuntimeStillClosed:
        request.trigger !== "process-local" ||
        runtimeInvocationAllowed === false,
      externalSchedulerRuntimeStillClosed:
        request.trigger !== "external-scheduler" ||
        runtimeInvocationAllowed === false,
      serviceInvocationStillBlocked: backfillServiceInvocationAllowed === false,
      quotaCountingUnaffected: true,
      rawEventDeletionBlocked: true,
      retentionExecutionBlocked: true,
    },
    operatorNotes: [
      ...runnerPlan.operatorNotes,
      "Background runtime gate is blocked-by-default and does not resolve a runtime service factory.",
      "Background runtime gate must not invoke backfill service, execute backfill, read events, persist rollups, affect quota counting, delete raw events, or run retention execution.",
    ],
  };
}
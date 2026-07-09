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
  | "background-runtime-blocked"
  | "process-local-dry-run-runtime-ready";

export type AnalyticsRollupBackgroundSchedulerRuntimeGateRunnerStatus =
  | AnalyticsRollupBackgroundSchedulerRunnerPlanStatus
  | "background-process-local-dry-run-runtime-ready";

export type AnalyticsRollupBackgroundSchedulerRuntimeGateBlockedReason =
  | AnalyticsRollupBackgroundSchedulerRunnerPlanBlockedReason
  | "background-preview-only-runtime-closed";

export interface AnalyticsRollupBackgroundSchedulerRuntimeGateRequest
  extends AnalyticsRollupBackgroundSchedulerRunnerPlanRequest {
  readonly allowProcessLocalDryRunRuntimeInvocation?: boolean;
}

export interface AnalyticsRollupBackgroundSchedulerRuntimeGateSummary {
  readonly status: AnalyticsRollupBackgroundSchedulerRuntimeGateStatus;
  readonly runnerStatus: AnalyticsRollupBackgroundSchedulerRuntimeGateRunnerStatus;
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

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

function isProcessLocalDryRunRuntimeRequest(
  request: AnalyticsRollupBackgroundSchedulerRuntimeGateRequest,
): boolean {
  return request.trigger === "process-local" && request.requestedMode === "dry-run";
}

function resolveProcessLocalDryRunRuntimeBlockedReason(
  request: AnalyticsRollupBackgroundSchedulerRuntimeGateRequest,
): AnalyticsRollupBackgroundSchedulerRunnerPlanBlockedReason | null {
  if (!isProcessLocalDryRunRuntimeRequest(request)) {
    return null;
  }

  if (request.allowProcessLocalDryRunRuntimeInvocation !== true) {
    return "background-runtime-execution-not-wired";
  }

  if (request.backgroundRunnerContractEnabled !== true) {
    return "automatic-trigger-not-wired";
  }

  if (!request.schedulerEnabled) {
    return "background-runner-disabled";
  }

  if (Number.isNaN(Date.parse(request.runAtIso))) {
    return "invalid-run-at";
  }

  if (!isPositiveInteger(request.lookbackBuckets)) {
    return "invalid-lookback-buckets";
  }

  if (!isPositiveInteger(request.maxBuckets)) {
    return "invalid-max-buckets";
  }

  if (request.lookbackBuckets > request.maxBuckets) {
    return "lookback-exceeds-max-buckets";
  }

  if (!isNonNegativeInteger(request.safetyDelayMs)) {
    return "invalid-safety-delay-ms";
  }

  return null;
}

function mapRuntimeGateStatus(
  request: AnalyticsRollupBackgroundSchedulerRuntimeGateRequest,
  runnerStatus: AnalyticsRollupBackgroundSchedulerRunnerPlanStatus,
  processLocalDryRunBlockedReason:
    | AnalyticsRollupBackgroundSchedulerRunnerPlanBlockedReason
    | null,
): AnalyticsRollupBackgroundSchedulerRuntimeGateStatus {
  if (
    isProcessLocalDryRunRuntimeRequest(request) &&
    request.allowProcessLocalDryRunRuntimeInvocation === true &&
    processLocalDryRunBlockedReason === null
  ) {
    return "process-local-dry-run-runtime-ready";
  }

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

function mapRuntimeGateRunnerStatus(
  status: AnalyticsRollupBackgroundSchedulerRuntimeGateStatus,
  runnerStatus: AnalyticsRollupBackgroundSchedulerRunnerPlanStatus,
): AnalyticsRollupBackgroundSchedulerRuntimeGateRunnerStatus {
  if (status === "process-local-dry-run-runtime-ready") {
    return "background-process-local-dry-run-runtime-ready";
  }

  return runnerStatus;
}

function mapRuntimeGateBlockedReason(
  request: AnalyticsRollupBackgroundSchedulerRuntimeGateRequest,
  status: AnalyticsRollupBackgroundSchedulerRuntimeGateStatus,
  runnerStatus: AnalyticsRollupBackgroundSchedulerRunnerPlanStatus,
  runnerBlockedReason: AnalyticsRollupBackgroundSchedulerRunnerPlanBlockedReason | null,
  processLocalDryRunBlockedReason:
    | AnalyticsRollupBackgroundSchedulerRunnerPlanBlockedReason
    | null,
): AnalyticsRollupBackgroundSchedulerRuntimeGateBlockedReason | null {
  if (status === "process-local-dry-run-runtime-ready") {
    return null;
  }

  if (processLocalDryRunBlockedReason !== null) {
    return processLocalDryRunBlockedReason;
  }

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
  request: AnalyticsRollupBackgroundSchedulerRuntimeGateRequest,
): AnalyticsRollupBackgroundSchedulerRuntimeGate {
  const runnerPlan = buildAnalyticsRollupBackgroundSchedulerRunnerPlan(request);
  const processLocalDryRunBlockedReason =
    resolveProcessLocalDryRunRuntimeBlockedReason(request);
  const status = mapRuntimeGateStatus(
    request,
    runnerPlan.status,
    processLocalDryRunBlockedReason,
  );
  const runnerStatus = mapRuntimeGateRunnerStatus(status, runnerPlan.status);
  const blockedReason = mapRuntimeGateBlockedReason(
    request,
    status,
    runnerPlan.status,
    runnerPlan.blockedReason,
    processLocalDryRunBlockedReason,
  );
  const processLocalDryRunRuntimeReady =
    status === "process-local-dry-run-runtime-ready";
  const runtimeInvocationAllowed = processLocalDryRunRuntimeReady;
  const runtimeFactoryResolutionAllowed = processLocalDryRunRuntimeReady;
  const backfillServiceInvocationAllowed = processLocalDryRunRuntimeReady;
  const executeBackfillAllowed = false;

  return {
    summary: {
      status,
      runnerStatus,
      blockedReason,
      trigger: request.trigger,
      requestedMode: request.requestedMode,
      ready:
        processLocalDryRunRuntimeReady ||
        (runnerPlan.ready === true &&
          status === "background-preview-runtime-closed"),
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
      invokesBackfillService: backfillServiceInvocationAllowed,
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
    operatorNotes: processLocalDryRunRuntimeReady
      ? [
          ...runnerPlan.operatorNotes,
          "Process-local dry-run runtime gate is open only after explicit internal opt-in and bounded runner validation.",
          "Process-local dry-run may invoke the backfill service in dry-run mode only; it must not execute backfill, read events, persist rollups, affect quota counting, delete raw events, or run retention execution.",
        ]
      : [
          ...runnerPlan.operatorNotes,
          "Background runtime gate is blocked-by-default and does not resolve a runtime service factory.",
          "Background runtime gate must not invoke backfill service, execute backfill, read events, persist rollups, affect quota counting, delete raw events, or run retention execution.",
        ],
  };
}
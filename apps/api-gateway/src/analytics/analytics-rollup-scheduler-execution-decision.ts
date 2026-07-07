import type { AnalyticsRollupSchedulerRunnerPlan } from "./analytics-rollup-scheduler-runner.js";

export type AnalyticsRollupSchedulerExecutionDecisionKind =
  "analytics-rollup-scheduler-execution-decision";

export type AnalyticsRollupSchedulerExecutionTrigger =
  | "command"
  | "process-local"
  | "external-scheduler";

export type AnalyticsRollupSchedulerExecutionMode =
  | "preview"
  | "dry-run"
  | "execute";

export type AnalyticsRollupSchedulerExecutionDecisionStatus =
  | "blocked"
  | "preview-ready";

export type AnalyticsRollupSchedulerExecutionBlockedReason =
  | "scheduler-runner-not-ready"
  | "automatic-trigger-not-wired"
  | "backfill-service-invocation-not-wired"
  | "backfill-execution-not-wired";

export type AnalyticsRollupSchedulerExecutionDecisionInput = {
  trigger?: AnalyticsRollupSchedulerExecutionTrigger;
  mode?: AnalyticsRollupSchedulerExecutionMode;
};

export type AnalyticsRollupSchedulerExecutionBoundary = {
  trigger: AnalyticsRollupSchedulerExecutionTrigger;
  requestedMode: AnalyticsRollupSchedulerExecutionMode;
  allowedMode: Extract<AnalyticsRollupSchedulerExecutionMode, "preview">;
  commandTriggeredOnly: true;
  processLocalExecutionWired: false;
  externalSchedulerExecutionWired: false;
  backfillServiceInvocationWired: false;
  backfillExecutionWired: false;
};

export type AnalyticsRollupSchedulerExecutionDecisionSafety = {
  previewOnly: true;
  createsScheduledJob: false;
  invokesBackfillService: false;
  executesBackfill: false;
  readsEvents: false;
  persistsRollups: false;
  affectsQuotaCounting: false;
  deletesRawEvents: false;
};

export type AnalyticsRollupSchedulerExecutionRecommendedNextStep =
  | "keep-command-preview-only"
  | "design-command-dry-run-backfill-service-invocation"
  | "wire-command-dry-run-before-execute"
  | "keep-automatic-triggers-unwired";

export type AnalyticsRollupSchedulerCommandDryRunInvocationContract = {
  status: "contract-required-before-wiring";
  currentInvocationState: "not-wired";
  triggerBoundary: "command-only";
  requiredBackfillMode: "dry-run";
  backfillRequestSource: "scheduler-runner-plan";
  perSourceInvocationRequired: true;
  sourceSeparationRequired: true;
  eventLimitGuardrailRequired: true;
  maxBucketGuardrailRequired: true;
  dockerPostgresRuntimeValidationRequired: true;
  serviceInvocationCurrentlyAllowed: false;
  eventReadCurrentlyAllowed: false;
  rollupPersistenceCurrentlyAllowed: false;
  quotaCountingChangeAllowed: false;
  rawEventDeletionAllowed: false;
};

export type AnalyticsRollupSchedulerCommandDryRunInvocationReadiness = {
  status: "not-ready";
  reason:
    | "scheduler-runner-not-ready"
    | "backfill-service-invocation-not-wired";
  plannedBackfillRequestCount: number;
  plannedSources: AnalyticsRollupSchedulerRunnerPlan["sources"];
  plannedGranularity: AnalyticsRollupSchedulerRunnerPlan["granularity"];
  backfillRequestsDerivedFromRunnerPlan: true;
  allPlannedRequestsDryRunOnly: boolean;
  canInvokeBackfillService: false;
  canReadEvents: false;
  canPersistRollups: false;
};

export type AnalyticsRollupSchedulerCommandDryRunDesignReview =
  | {
      status: "design-required";
      requestedCapability: "command:dry-run";
      invocationBoundary: "backfill-service-dry-run-invocation";
      currentlyWired: false;
      mustRemainNonDestructive: true;
      requiresExplicitCommandInvocation: true;
      requiresBackfillServiceDryRunContract: true;
      requiresEventLimitGuardrail: true;
      requiresSourceSeparation: true;
      requiresDockerPostgresRuntimeValidation: true;
      quotaCountingMustRemainUnchanged: true;
      rawEventDeletionForbidden: true;
      dryRunInvocationReadiness: AnalyticsRollupSchedulerCommandDryRunInvocationReadiness;
      dryRunInvocationContract: AnalyticsRollupSchedulerCommandDryRunInvocationContract;
    }
  | null;

export type AnalyticsRollupSchedulerExecutionWiringReview = {
  currentCapability: "command-preview-only";
  requestedCapability: `${AnalyticsRollupSchedulerExecutionTrigger}:${AnalyticsRollupSchedulerExecutionMode}`;
  recommendedNextStep: AnalyticsRollupSchedulerExecutionRecommendedNextStep;
  requiresExplicitDesignBeforeWiring: boolean;
  requiresDockerPostgresValidationBeforeWiring: boolean;
  dryRunDesignReview: AnalyticsRollupSchedulerCommandDryRunDesignReview;
  automaticTriggersRemainUnwired: true;
  executeRemainsUnwired: true;
};

export type AnalyticsRollupSchedulerExecutionDecision = {
  kind: AnalyticsRollupSchedulerExecutionDecisionKind;
  status: AnalyticsRollupSchedulerExecutionDecisionStatus;
  allowed: boolean;
  blockedReason: AnalyticsRollupSchedulerExecutionBlockedReason | null;
  runnerStatus: AnalyticsRollupSchedulerRunnerPlan["status"];
  scheduleStatus: AnalyticsRollupSchedulerRunnerPlan["scheduleStatus"];
  source: AnalyticsRollupSchedulerRunnerPlan["source"];
  sources: AnalyticsRollupSchedulerRunnerPlan["sources"];
  granularity: AnalyticsRollupSchedulerRunnerPlan["granularity"];
  runAt: Date;
  effectiveTo: Date | null;
  bucketCount: number;
  backfillRequestCount: number;
  boundary: AnalyticsRollupSchedulerExecutionBoundary;
  wiringReview: AnalyticsRollupSchedulerExecutionWiringReview;
  safety: AnalyticsRollupSchedulerExecutionDecisionSafety;
};

const EXECUTION_DECISION_SAFETY: AnalyticsRollupSchedulerExecutionDecisionSafety =
  {
    previewOnly: true,
    createsScheduledJob: false,
    invokesBackfillService: false,
    executesBackfill: false,
    readsEvents: false,
    persistsRollups: false,
    affectsQuotaCounting: false,
    deletesRawEvents: false,
  };

const COMMAND_DRY_RUN_INVOCATION_CONTRACT: AnalyticsRollupSchedulerCommandDryRunInvocationContract =
  {
    status: "contract-required-before-wiring",
    currentInvocationState: "not-wired",
    triggerBoundary: "command-only",
    requiredBackfillMode: "dry-run",
    backfillRequestSource: "scheduler-runner-plan",
    perSourceInvocationRequired: true,
    sourceSeparationRequired: true,
    eventLimitGuardrailRequired: true,
    maxBucketGuardrailRequired: true,
    dockerPostgresRuntimeValidationRequired: true,
    serviceInvocationCurrentlyAllowed: false,
    eventReadCurrentlyAllowed: false,
    rollupPersistenceCurrentlyAllowed: false,
    quotaCountingChangeAllowed: false,
    rawEventDeletionAllowed: false,
  };

function createAnalyticsRollupSchedulerCommandDryRunInvocationReadiness(
  runnerPlan: AnalyticsRollupSchedulerRunnerPlan,
): AnalyticsRollupSchedulerCommandDryRunInvocationReadiness {
  return {
    status: "not-ready",
    reason:
      runnerPlan.status === "ready"
        ? "backfill-service-invocation-not-wired"
        : "scheduler-runner-not-ready",
    plannedBackfillRequestCount: runnerPlan.backfillRequests.length,
    plannedSources: runnerPlan.sources,
    plannedGranularity: runnerPlan.granularity,
    backfillRequestsDerivedFromRunnerPlan: true,
    allPlannedRequestsDryRunOnly: runnerPlan.backfillRequests.every(
      (request) =>
        request.mode === "dry-run" &&
        request.willInvokeBackfillService === false &&
        request.willReadEvents === false &&
        request.willPersistRollups === false,
    ),
    canInvokeBackfillService: false,
    canReadEvents: false,
    canPersistRollups: false,
  };
}

function resolveRecommendedNextStep(
  trigger: AnalyticsRollupSchedulerExecutionTrigger,
  requestedMode: AnalyticsRollupSchedulerExecutionMode,
): AnalyticsRollupSchedulerExecutionRecommendedNextStep {
  if (trigger !== "command") {
    return "keep-automatic-triggers-unwired";
  }

  if (requestedMode === "dry-run") {
    return "design-command-dry-run-backfill-service-invocation";
  }

  if (requestedMode === "execute") {
    return "wire-command-dry-run-before-execute";
  }

  return "keep-command-preview-only";
}

function createAnalyticsRollupSchedulerCommandDryRunDesignReview(
  runnerPlan: AnalyticsRollupSchedulerRunnerPlan,
  trigger: AnalyticsRollupSchedulerExecutionTrigger,
  requestedMode: AnalyticsRollupSchedulerExecutionMode,
): AnalyticsRollupSchedulerCommandDryRunDesignReview {
  if (trigger !== "command" || requestedMode !== "dry-run") {
    return null;
  }

  return {
    status: "design-required",
    requestedCapability: "command:dry-run",
    invocationBoundary: "backfill-service-dry-run-invocation",
    currentlyWired: false,
    mustRemainNonDestructive: true,
    requiresExplicitCommandInvocation: true,
    requiresBackfillServiceDryRunContract: true,
    requiresEventLimitGuardrail: true,
    requiresSourceSeparation: true,
    requiresDockerPostgresRuntimeValidation: true,
    quotaCountingMustRemainUnchanged: true,
    rawEventDeletionForbidden: true,
    dryRunInvocationReadiness:
      createAnalyticsRollupSchedulerCommandDryRunInvocationReadiness(runnerPlan),
    dryRunInvocationContract: COMMAND_DRY_RUN_INVOCATION_CONTRACT,
  };
}

function createAnalyticsRollupSchedulerExecutionWiringReview(
  runnerPlan: AnalyticsRollupSchedulerRunnerPlan,
  trigger: AnalyticsRollupSchedulerExecutionTrigger,
  requestedMode: AnalyticsRollupSchedulerExecutionMode,
): AnalyticsRollupSchedulerExecutionWiringReview {
  return {
    currentCapability: "command-preview-only",
    requestedCapability: `${trigger}:${requestedMode}`,
    recommendedNextStep: resolveRecommendedNextStep(trigger, requestedMode),
    requiresExplicitDesignBeforeWiring:
      trigger !== "command" || requestedMode !== "preview",
    requiresDockerPostgresValidationBeforeWiring: requestedMode !== "preview",
    dryRunDesignReview: createAnalyticsRollupSchedulerCommandDryRunDesignReview(
      runnerPlan,
      trigger,
      requestedMode,
    ),
    automaticTriggersRemainUnwired: true,
    executeRemainsUnwired: true,
  };
}
function resolveBlockedReason(
  runnerPlan: AnalyticsRollupSchedulerRunnerPlan,
  trigger: AnalyticsRollupSchedulerExecutionTrigger,
  requestedMode: AnalyticsRollupSchedulerExecutionMode,
): AnalyticsRollupSchedulerExecutionBlockedReason | null {
  if (runnerPlan.status !== "ready") {
    return "scheduler-runner-not-ready";
  }

  if (trigger !== "command") {
    return "automatic-trigger-not-wired";
  }

  if (requestedMode === "dry-run") {
    return "backfill-service-invocation-not-wired";
  }

  if (requestedMode === "execute") {
    return "backfill-execution-not-wired";
  }

  return null;
}

export function createAnalyticsRollupSchedulerExecutionDecision(
  runnerPlan: AnalyticsRollupSchedulerRunnerPlan,
  input: AnalyticsRollupSchedulerExecutionDecisionInput = {},
): AnalyticsRollupSchedulerExecutionDecision {
  const trigger = input.trigger ?? "command";
  const requestedMode = input.mode ?? "preview";
  const blockedReason = resolveBlockedReason(
    runnerPlan,
    trigger,
    requestedMode,
  );
  const allowed = blockedReason === null;

  return {
    kind: "analytics-rollup-scheduler-execution-decision",
    status: allowed ? "preview-ready" : "blocked",
    allowed,
    blockedReason,
    runnerStatus: runnerPlan.status,
    scheduleStatus: runnerPlan.scheduleStatus,
    source: runnerPlan.source,
    sources: runnerPlan.sources,
    granularity: runnerPlan.granularity,
    runAt: runnerPlan.runAt,
    effectiveTo: runnerPlan.effectiveTo,
    bucketCount: runnerPlan.bucketCount,
    backfillRequestCount: runnerPlan.backfillRequests.length,
    boundary: {
      trigger,
      requestedMode,
      allowedMode: "preview",
      commandTriggeredOnly: true,
      processLocalExecutionWired: false,
      externalSchedulerExecutionWired: false,
      backfillServiceInvocationWired: false,
      backfillExecutionWired: false,
    },
    wiringReview: createAnalyticsRollupSchedulerExecutionWiringReview(
      runnerPlan,
      trigger,
      requestedMode,
    ),
    safety: EXECUTION_DECISION_SAFETY,
  };
}
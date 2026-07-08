import type { AnalyticsRollupSchedulerBackfillServiceDryRunAdapterPreview } from "./analytics-rollup-scheduler-backfill-service-adapter.js";
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
  dryRunServiceAdapterPreviews?:
    | AnalyticsRollupSchedulerBackfillServiceDryRunAdapterPreview[]
    | null;
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

export type AnalyticsRollupSchedulerCommandDryRunInvocationDesignReview = {
  status: "review-required-before-wiring";
  proposedInvocationBoundary: "command-to-backfill-service-dry-run";
  proposedBackfillMode: "dry-run";
  invocationSource: "scheduler-runner-backfill-requests";
  commandTriggerRequired: true;
  automaticTriggerAllowed: false;
  executionModeAllowed: false;
  dryRunMayInvokeBackfillServiceAfterExplicitWiring: true;
  dryRunMayReadEvents: false;
  dryRunMayPersistRollups: false;
  dryRunMayAffectQuotaCounting: false;
  dryRunMayDeleteRawEvents: false;
  requiresPerSourceInvocation: true;
  requiresSourceSeparation: true;
  requiresEventLimitGuardrail: true;
  requiresMaxBucketGuardrail: true;
  requiresDockerPostgresRuntimeValidation: true;
};
export type AnalyticsRollupSchedulerCommandDryRunServiceInvocationContractReview = {
  status: "review-required-before-service-invocation";
  serviceBoundary: "scheduler-command-to-rollup-backfill-service";
  currentServiceInvocationState: "not-wired";
  allowedTrigger: "command";
  allowedBackfillMode: "dry-run";
  requestSource: "scheduler-runner-backfill-requests";
  invocationCardinality: "per-source-backfill-request";
  requiresReadyRunnerPlan: true;
  requiresDryRunRequestMode: true;
  requiresNonInvokingPreviewBeforeWiring: true;
  requiresEventLimitGuardrail: true;
  requiresMaxBucketGuardrail: true;
  requiresSourceSeparation: true;
  requiresDockerPostgresRuntimeValidation: true;
  serviceInvocationCurrentlyAllowed: false;
  dryRunServiceMayReadEvents: false;
  dryRunServiceMayPersistRollups: false;
  quotaCountingChangeAllowed: false;
  rawEventDeletionAllowed: false;
  failureBehavior: "fail-closed-before-service-invocation";
};
export type AnalyticsRollupSchedulerCommandDryRunServiceInvocationImplementationDesign = {
  status: "implementation-design-required-before-wiring";
  implementationBoundary: "scheduler-command-dry-run-to-rollup-backfill-service";
  currentImplementationState: "not-implemented";
  targetTrigger: "command";
  targetBackfillMode: "dry-run";
  requestSource: "scheduler-runner-backfill-requests";
  plannedInvocationCardinality: "per-source-backfill-request";
  targetDryRunBehavior: "service-dry-run-plan-only";
  serviceAdapterRequired: true;
  requestMapperRequired: true;
  requiresReadyRunnerPlan: true;
  requiresDryRunRequestMode: true;
  requiresNonInvokingPreviewBeforeInvocation: true;
  requiresPerSourceInvocation: true;
  requiresSourceSeparation: true;
  requiresEventLimitGuardrail: true;
  requiresMaxBucketGuardrail: true;
  requiresOperatorSafetyOutput: true;
  requiresFailClosedServiceErrors: true;
  requiresDockerPostgresRuntimeValidation: true;
  implementationCurrentlyAllowed: false;
  serviceInvocationCurrentlyAllowed: false;
  dryRunServiceMayReadEvents: false;
  dryRunServiceMayPersistRollups: false;
  quotaCountingChangeAllowed: false;
  rawEventDeletionAllowed: false;
};

export type AnalyticsRollupSchedulerCommandDryRunServiceInvocationWiringReadinessReview = {
  status: "wiring-readiness-review-required-before-service-invocation";
  readinessBoundary: "scheduler-command-dry-run-service-invocation-wiring";
  currentWiringState: "not-wired";
  targetTrigger: "command";
  targetBackfillMode: "dry-run";
  targetServiceMethod: "runBackfill";
  targetDryRunBehavior: "service-dry-run-plan-only";
  requestSource: "mapped-dry-run-service-inputs";
  requiresReadyRunnerPlan: true;
  requiresMappedDryRunServiceInputs: true;
  requiresAdapterPreviewsBeforeWiring: true;
  requiresPerSourceInvocation: true;
  requiresSourceSeparation: true;
  requiresEventLimitGuardrail: true;
  requiresMaxBucketGuardrail: true;
  requiresOperatorSafetyOutput: true;
  requiresFailClosedServiceErrors: true;
  requiresDockerPostgresRuntimeValidation: true;
  readyForServiceInvocationWiring: false;
  blockedReason: "backfill-service-invocation-not-wired";
  serviceInvocationCurrentlyAllowed: false;
  mayInvokeBackfillServiceAfterExplicitWiring: true;
  mayReadEventsThroughServiceDryRun: false;
  mayPersistRollupsThroughServiceDryRun: false;
  quotaCountingChangeAllowed: false;
  rawEventDeletionAllowed: false;
  runtimeValidationRequiredBeforeAllowed: true;
  failureBehavior: "fail-closed-before-service-invocation";
};

export type AnalyticsRollupSchedulerCommandDryRunServiceInvocationRequestMapperDesign = {
  status: "mapper-design-added-before-service-invocation";
  mapperBoundary: "scheduler-backfill-request-to-backfill-service-run-input";
  currentMapperState: "implemented-model-only";
  mapperSource: "analytics-rollup-scheduler-backfill-request-mapper";
  inputSource: "scheduler-runner-backfill-requests";
  outputTarget: "analytics-rollup-backfill-run-input";
  targetTrigger: "command";
  targetBackfillMode: "dry-run";
  plannedMappingCardinality: "per-source-backfill-request";
  requiresReadyRunnerPlan: true;
  requiresDryRunRequestMode: true;
  requiresNonInvokingRequestContract: true;
  requiresSourceSeparation: true;
  requiresEventLimitGuardrail: true;
  requiresMaxBucketGuardrail: true;
  mapsEventLimitFromExplicitOption: true;
  mapsMaxBucketsFromRequestBucketCount: true;
  mapperCurrentlyAllowed: true;
  serviceInvocationCurrentlyAllowed: false;
  mapperMayInvokeBackfillService: false;
  mapperMayReadEvents: false;
  mapperMayPersistRollups: false;
  quotaCountingChangeAllowed: false;
  rawEventDeletionAllowed: false;
  failureBehavior: "fail-closed-before-service-invocation";
};
export type AnalyticsRollupSchedulerCommandDryRunServiceAdapterBoundaryDesign = {
  status: "adapter-boundary-design-required-before-service-invocation";
  adapterBoundary: "mapped-backfill-run-input-to-rollup-backfill-service-dry-run";
  currentAdapterState: "not-implemented";
  adapterSource: "future-scheduler-rollup-backfill-service-dry-run-adapter";
  inputSource: "analytics-rollup-backfill-run-input";
  outputTarget: "rollup-backfill-service-dry-run-result";
  targetTrigger: "command";
  targetBackfillMode: "dry-run";
  targetDryRunBehavior: "service-dry-run-plan-only";
  plannedInvocationCardinality: "per-source-mapped-run-input";
  requiresReadyRunnerPlan: true;
  requiresMappedDryRunServiceInput: true;
  requiresDryRunBackfillPlan: true;
  requiresPerSourceInvocation: true;
  requiresSourceSeparation: true;
  requiresEventLimitGuardrail: true;
  requiresMaxBucketGuardrail: true;
  requiresOperatorSafetyOutput: true;
  requiresFailClosedServiceErrors: true;
  requiresDockerPostgresRuntimeValidation: true;
  adapterCurrentlyAllowed: false;
  serviceInvocationCurrentlyAllowed: false;
  adapterMayInvokeBackfillService: false;
  adapterMayReadEvents: false;
  adapterMayPersistRollups: false;
  quotaCountingChangeAllowed: false;
  rawEventDeletionAllowed: false;
  failureBehavior: "fail-closed-before-service-invocation";
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
      dryRunInvocationDesignReview: AnalyticsRollupSchedulerCommandDryRunInvocationDesignReview;
      dryRunServiceInvocationContractReview: AnalyticsRollupSchedulerCommandDryRunServiceInvocationContractReview;
      dryRunServiceInvocationImplementationDesign: AnalyticsRollupSchedulerCommandDryRunServiceInvocationImplementationDesign;
      dryRunServiceInvocationWiringReadinessReview: AnalyticsRollupSchedulerCommandDryRunServiceInvocationWiringReadinessReview;
      dryRunServiceInvocationRequestMapperDesign: AnalyticsRollupSchedulerCommandDryRunServiceInvocationRequestMapperDesign;
      dryRunServiceAdapterBoundaryDesign: AnalyticsRollupSchedulerCommandDryRunServiceAdapterBoundaryDesign;
      dryRunServiceAdapterPreviews:
        | AnalyticsRollupSchedulerBackfillServiceDryRunAdapterPreview[]
        | null;
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

const COMMAND_DRY_RUN_INVOCATION_DESIGN_REVIEW: AnalyticsRollupSchedulerCommandDryRunInvocationDesignReview =
  {
    status: "review-required-before-wiring",
    proposedInvocationBoundary: "command-to-backfill-service-dry-run",
    proposedBackfillMode: "dry-run",
    invocationSource: "scheduler-runner-backfill-requests",
    commandTriggerRequired: true,
    automaticTriggerAllowed: false,
    executionModeAllowed: false,
    dryRunMayInvokeBackfillServiceAfterExplicitWiring: true,
    dryRunMayReadEvents: false,
    dryRunMayPersistRollups: false,
    dryRunMayAffectQuotaCounting: false,
    dryRunMayDeleteRawEvents: false,
    requiresPerSourceInvocation: true,
    requiresSourceSeparation: true,
    requiresEventLimitGuardrail: true,
    requiresMaxBucketGuardrail: true,
    requiresDockerPostgresRuntimeValidation: true,
  };
const COMMAND_DRY_RUN_SERVICE_INVOCATION_CONTRACT_REVIEW: AnalyticsRollupSchedulerCommandDryRunServiceInvocationContractReview =
  {
    status: "review-required-before-service-invocation",
    serviceBoundary: "scheduler-command-to-rollup-backfill-service",
    currentServiceInvocationState: "not-wired",
    allowedTrigger: "command",
    allowedBackfillMode: "dry-run",
    requestSource: "scheduler-runner-backfill-requests",
    invocationCardinality: "per-source-backfill-request",
    requiresReadyRunnerPlan: true,
    requiresDryRunRequestMode: true,
    requiresNonInvokingPreviewBeforeWiring: true,
    requiresEventLimitGuardrail: true,
    requiresMaxBucketGuardrail: true,
    requiresSourceSeparation: true,
    requiresDockerPostgresRuntimeValidation: true,
    serviceInvocationCurrentlyAllowed: false,
    dryRunServiceMayReadEvents: false,
    dryRunServiceMayPersistRollups: false,
    quotaCountingChangeAllowed: false,
    rawEventDeletionAllowed: false,
    failureBehavior: "fail-closed-before-service-invocation",
  };

const COMMAND_DRY_RUN_SERVICE_INVOCATION_IMPLEMENTATION_DESIGN: AnalyticsRollupSchedulerCommandDryRunServiceInvocationImplementationDesign =
  {
    status: "implementation-design-required-before-wiring",
    implementationBoundary:
      "scheduler-command-dry-run-to-rollup-backfill-service",
    currentImplementationState: "not-implemented",
    targetTrigger: "command",
    targetBackfillMode: "dry-run",
    requestSource: "scheduler-runner-backfill-requests",
    plannedInvocationCardinality: "per-source-backfill-request",
    targetDryRunBehavior: "service-dry-run-plan-only",
    serviceAdapterRequired: true,
    requestMapperRequired: true,
    requiresReadyRunnerPlan: true,
    requiresDryRunRequestMode: true,
    requiresNonInvokingPreviewBeforeInvocation: true,
    requiresPerSourceInvocation: true,
    requiresSourceSeparation: true,
    requiresEventLimitGuardrail: true,
    requiresMaxBucketGuardrail: true,
    requiresOperatorSafetyOutput: true,
    requiresFailClosedServiceErrors: true,
    requiresDockerPostgresRuntimeValidation: true,
    implementationCurrentlyAllowed: false,
    serviceInvocationCurrentlyAllowed: false,
    dryRunServiceMayReadEvents: false,
    dryRunServiceMayPersistRollups: false,
    quotaCountingChangeAllowed: false,
    rawEventDeletionAllowed: false,
  };

const COMMAND_DRY_RUN_SERVICE_INVOCATION_WIRING_READINESS_REVIEW: AnalyticsRollupSchedulerCommandDryRunServiceInvocationWiringReadinessReview =
  {
    status: "wiring-readiness-review-required-before-service-invocation",
    readinessBoundary: "scheduler-command-dry-run-service-invocation-wiring",
    currentWiringState: "not-wired",
    targetTrigger: "command",
    targetBackfillMode: "dry-run",
    targetServiceMethod: "runBackfill",
    targetDryRunBehavior: "service-dry-run-plan-only",
    requestSource: "mapped-dry-run-service-inputs",
    requiresReadyRunnerPlan: true,
    requiresMappedDryRunServiceInputs: true,
    requiresAdapterPreviewsBeforeWiring: true,
    requiresPerSourceInvocation: true,
    requiresSourceSeparation: true,
    requiresEventLimitGuardrail: true,
    requiresMaxBucketGuardrail: true,
    requiresOperatorSafetyOutput: true,
    requiresFailClosedServiceErrors: true,
    requiresDockerPostgresRuntimeValidation: true,
    readyForServiceInvocationWiring: false,
    blockedReason: "backfill-service-invocation-not-wired",
    serviceInvocationCurrentlyAllowed: false,
    mayInvokeBackfillServiceAfterExplicitWiring: true,
    mayReadEventsThroughServiceDryRun: false,
    mayPersistRollupsThroughServiceDryRun: false,
    quotaCountingChangeAllowed: false,
    rawEventDeletionAllowed: false,
    runtimeValidationRequiredBeforeAllowed: true,
    failureBehavior: "fail-closed-before-service-invocation",
  };

const COMMAND_DRY_RUN_SERVICE_INVOCATION_REQUEST_MAPPER_DESIGN: AnalyticsRollupSchedulerCommandDryRunServiceInvocationRequestMapperDesign =
  {
    status: "mapper-design-added-before-service-invocation",
    mapperBoundary: "scheduler-backfill-request-to-backfill-service-run-input",
    currentMapperState: "implemented-model-only",
    mapperSource: "analytics-rollup-scheduler-backfill-request-mapper",
    inputSource: "scheduler-runner-backfill-requests",
    outputTarget: "analytics-rollup-backfill-run-input",
    targetTrigger: "command",
    targetBackfillMode: "dry-run",
    plannedMappingCardinality: "per-source-backfill-request",
    requiresReadyRunnerPlan: true,
    requiresDryRunRequestMode: true,
    requiresNonInvokingRequestContract: true,
    requiresSourceSeparation: true,
    requiresEventLimitGuardrail: true,
    requiresMaxBucketGuardrail: true,
    mapsEventLimitFromExplicitOption: true,
    mapsMaxBucketsFromRequestBucketCount: true,
    mapperCurrentlyAllowed: true,
    serviceInvocationCurrentlyAllowed: false,
    mapperMayInvokeBackfillService: false,
    mapperMayReadEvents: false,
    mapperMayPersistRollups: false,
    quotaCountingChangeAllowed: false,
    rawEventDeletionAllowed: false,
    failureBehavior: "fail-closed-before-service-invocation",
  };

const COMMAND_DRY_RUN_SERVICE_ADAPTER_BOUNDARY_DESIGN: AnalyticsRollupSchedulerCommandDryRunServiceAdapterBoundaryDesign =
  {
    status: "adapter-boundary-design-required-before-service-invocation",
    adapterBoundary:
      "mapped-backfill-run-input-to-rollup-backfill-service-dry-run",
    currentAdapterState: "not-implemented",
    adapterSource:
      "future-scheduler-rollup-backfill-service-dry-run-adapter",
    inputSource: "analytics-rollup-backfill-run-input",
    outputTarget: "rollup-backfill-service-dry-run-result",
    targetTrigger: "command",
    targetBackfillMode: "dry-run",
    targetDryRunBehavior: "service-dry-run-plan-only",
    plannedInvocationCardinality: "per-source-mapped-run-input",
    requiresReadyRunnerPlan: true,
    requiresMappedDryRunServiceInput: true,
    requiresDryRunBackfillPlan: true,
    requiresPerSourceInvocation: true,
    requiresSourceSeparation: true,
    requiresEventLimitGuardrail: true,
    requiresMaxBucketGuardrail: true,
    requiresOperatorSafetyOutput: true,
    requiresFailClosedServiceErrors: true,
    requiresDockerPostgresRuntimeValidation: true,
    adapterCurrentlyAllowed: false,
    serviceInvocationCurrentlyAllowed: false,
    adapterMayInvokeBackfillService: false,
    adapterMayReadEvents: false,
    adapterMayPersistRollups: false,
    quotaCountingChangeAllowed: false,
    rawEventDeletionAllowed: false,
    failureBehavior: "fail-closed-before-service-invocation",
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
  dryRunServiceAdapterPreviews:
    | AnalyticsRollupSchedulerBackfillServiceDryRunAdapterPreview[]
    | null = null,
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
    dryRunInvocationDesignReview: COMMAND_DRY_RUN_INVOCATION_DESIGN_REVIEW,
    dryRunServiceInvocationContractReview:
      COMMAND_DRY_RUN_SERVICE_INVOCATION_CONTRACT_REVIEW,
    dryRunServiceInvocationImplementationDesign:
      COMMAND_DRY_RUN_SERVICE_INVOCATION_IMPLEMENTATION_DESIGN,
    dryRunServiceInvocationWiringReadinessReview:
      COMMAND_DRY_RUN_SERVICE_INVOCATION_WIRING_READINESS_REVIEW,
    dryRunServiceInvocationRequestMapperDesign:
      COMMAND_DRY_RUN_SERVICE_INVOCATION_REQUEST_MAPPER_DESIGN,
    dryRunServiceAdapterBoundaryDesign:
      COMMAND_DRY_RUN_SERVICE_ADAPTER_BOUNDARY_DESIGN,
    dryRunServiceAdapterPreviews,
    dryRunInvocationContract: COMMAND_DRY_RUN_INVOCATION_CONTRACT,
  };
}

function createAnalyticsRollupSchedulerExecutionWiringReview(
  runnerPlan: AnalyticsRollupSchedulerRunnerPlan,
  trigger: AnalyticsRollupSchedulerExecutionTrigger,
  requestedMode: AnalyticsRollupSchedulerExecutionMode,
  dryRunServiceAdapterPreviews:
    | AnalyticsRollupSchedulerBackfillServiceDryRunAdapterPreview[]
    | null = null,
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
      dryRunServiceAdapterPreviews,
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
  const dryRunServiceAdapterPreviews =
    input.dryRunServiceAdapterPreviews ?? null;

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
      dryRunServiceAdapterPreviews,
    ),
    safety: EXECUTION_DECISION_SAFETY,
  };
}
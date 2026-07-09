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
  | "preview-ready"
  | "dry-run-ready";

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
  backfillServiceInvocationWired?: boolean;
  commandExecuteOperatorConfirmed?: boolean;
  commandExecuteEventLimit?: number;
};

export type AnalyticsRollupSchedulerExecutionBoundary = {
  trigger: AnalyticsRollupSchedulerExecutionTrigger;
  requestedMode: AnalyticsRollupSchedulerExecutionMode;
  allowedMode: Extract<AnalyticsRollupSchedulerExecutionMode, "preview" | "dry-run">;
  commandTriggeredOnly: true;
  processLocalExecutionWired: false;
  externalSchedulerExecutionWired: false;
  backfillServiceInvocationWired: boolean;
  backfillExecutionWired: false;
};

export type AnalyticsRollupSchedulerExecutionDecisionSafety = {
  previewOnly: boolean;
  createsScheduledJob: false;
  invokesBackfillService: boolean;
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

export type AnalyticsRollupSchedulerCommandDryRunServiceInvocationWiringContract = {
  status: "wiring-contract-required-before-service-invocation";
  contractBoundary: "scheduler-command-dry-run-to-rollup-backfill-service-run-backfill";
  currentWiringState: "not-wired";
  targetTrigger: "command";
  targetBackfillMode: "dry-run";
  targetServiceMethod: "runBackfill";
  requestContract: {
    inputSource: "mapped-dry-run-service-inputs";
    requestMode: "dry-run";
    cardinality: "per-source-mapped-run-input";
    requiresReadyRunnerPlan: true;
    requiresSourceSeparatedInputs: true;
    requiresExplicitEventLimit: true;
    requiresMaxBucketBound: true;
  };
  responseContract: {
    outputTarget: "operator-visible-command-dry-run-output";
    requiredResultMode: "dry-run";
    sourceScopedResultsRequired: true;
    perSourceSafetyFlagsRequired: true;
    serviceDryRunPlanRequired: true;
    partialFailureOutputRequired: true;
  };
  validationContract: {
    rejectMissingEventLimit: true;
    rejectUnboundedBucketCount: true;
    rejectNonCommandTrigger: true;
    rejectExecuteMode: true;
    requiresDockerPostgresRuntimeValidationBeforeWiring: true;
  };
  operatorOutputContract: {
    includeServiceInvocationState: true;
    includeBlockedReason: true;
    includeSourceScopedResultSummary: true;
    includeSafetyFlags: true;
    includeNoQuotaMutationStatement: true;
    includeNoRawEventDeletionStatement: true;
  };
  backfillServiceInvocationWired: false;
  serviceInvocationCurrentlyAllowed: false;
  mayInvokeBackfillServiceAfterExplicitWiring: true;
  mayReadEventsThroughServiceDryRun: false;
  mayPersistRollupsThroughServiceDryRun: false;
  partialPersistenceAllowed: false;
  quotaCountingChangeAllowed: false;
  rawEventDeletionAllowed: false;
  failureBehavior: "fail-closed-before-service-invocation";
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

export type AnalyticsRollupSchedulerCommandDryRunServiceInvocationFailClosedErrorModel = {
  status: "fail-closed-error-model-required-before-service-invocation";
  errorBoundary: "scheduler-command-dry-run-service-invocation";
  currentServiceInvocationState: "not-wired";
  targetTrigger: "command";
  targetBackfillMode: "dry-run";
  targetServiceMethod: "runBackfill";
  expectedFailureSource: "future-backfill-service-dry-run-invocation";
  expectedOperatorOutput: "operator-visible-fail-closed-service-error-review";
  operatorReviewRequired: true;
  sourceScopedErrorOutputRequired: true;
  safetyFlagsRequiredOnFailure: true;
  noPartialPersistenceRequired: true;
  noPartialQuotaMutationRequired: true;
  noRawEventDeletionRequired: true;
  failureState: "blocked";
  blockedReason: "backfill-service-invocation-not-wired";
  serviceInvocationCurrentlyAllowed: false;
  mayInvokeBackfillServiceAfterExplicitWiring: true;
  mayReadEventsThroughFailedServiceDryRun: false;
  mayPersistRollupsThroughFailedServiceDryRun: false;
  partialPersistenceAllowed: false;
  quotaCountingChangeAllowed: false;
  rawEventDeletionAllowed: false;
  failureBehavior: "fail-closed-without-partial-persistence";
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
      dryRunServiceInvocationFailClosedErrorModel: AnalyticsRollupSchedulerCommandDryRunServiceInvocationFailClosedErrorModel;
      dryRunServiceInvocationWiringContract: AnalyticsRollupSchedulerCommandDryRunServiceInvocationWiringContract;
    dryRunServiceInvocationRequestMapperDesign: AnalyticsRollupSchedulerCommandDryRunServiceInvocationRequestMapperDesign;
      dryRunServiceAdapterBoundaryDesign: AnalyticsRollupSchedulerCommandDryRunServiceAdapterBoundaryDesign;
      dryRunServiceAdapterPreviews:
        | AnalyticsRollupSchedulerBackfillServiceDryRunAdapterPreview[]
        | null;
      dryRunInvocationContract: AnalyticsRollupSchedulerCommandDryRunInvocationContract;
    }
  | null;

export type AnalyticsRollupSchedulerCommandExecuteReadinessReview = {
  status: "not-ready";
  reason:
    | "scheduler-runner-not-ready"
    | "backfill-execution-not-wired";
  executionBoundary: "scheduler-command-execute";
  plannedBackfillRequestCount: number;
  plannedSources: AnalyticsRollupSchedulerRunnerPlan["sources"];
  plannedGranularity: AnalyticsRollupSchedulerRunnerPlan["granularity"];
  backfillRequestsDerivedFromRunnerPlan: true;
  requiresExplicitConfirmation: true;
  requiresExplicitEventLimit: true;
  requiresMaxBucketBound: true;
  requiresBoundedBucketCount: true;
  requiresSourceSeparatedExecution: true;
  requiresPriorDryRunRuntimeValidation: true;
  canInvokeBackfillService: false;
  canExecuteBackfill: false;
  canReadEvents: false;
  canPersistRollups: false;
  canAffectQuotaCounting: false;
  canDeleteRawEvents: false;
};
export type AnalyticsRollupSchedulerCommandExecuteContractReview = {
  status: "review-required-before-execute-wiring";
  reviewBoundary: "scheduler-command-execute-contract";
  currentExecutionState: "blocked-not-wired";
  targetTrigger: "command";
  targetBackfillMode: "execute";
  targetServiceMethod: "runBackfill";
  requiredConfirmation: "explicit-operator-confirmation";
  requiresReadyRunnerPlan: true;
  requiresPriorDryRunRuntimeValidation: true;
  requiresExplicitEventLimit: true;
  requiresMaxBucketBound: true;
  requiresBoundedBucketCount: true;
  requiresSourceSeparatedExecution: true;
  persistenceScope: "rollup-tables-only";
  rollbackExpectation: "bounded-idempotent-rollup-upsert-or-fail-closed-before-execution";
  operatorOutputContract: {
    includeConfirmationRequirement: true;
    includeBlockedReason: true;
    includeExecutionState: true;
    includePersistenceScope: true;
    includeRollbackExpectation: true;
    includeSourceScopedSummary: true;
    includeSafetyFlags: true;
    includeNoQuotaMutationStatement: true;
    includeNoRawEventDeletionStatement: true;
  };
  executionCurrentlyAllowed: false;
  serviceInvocationCurrentlyAllowed: false;
  mayInvokeBackfillServiceAfterExplicitWiring: true;
  eventReadCurrentlyAllowed: false;
  rollupPersistenceCurrentlyAllowed: false;
  partialPersistenceAllowed: false;
  quotaCountingChangeAllowed: false;
  rawEventDeletionAllowed: false;
  processLocalExecutionAllowed: false;
  externalSchedulerExecutionAllowed: false;
  scheduledJobCreationAllowed: false;
  failureBehavior: "fail-closed-before-execute-invocation";
};
export type AnalyticsRollupSchedulerCommandExecuteOperatorOutputReview = {
  status: "operator-output-review-required-before-execute-wiring";
  outputBoundary: "scheduler-command-execute-operator-output";
  currentOutputState: "blocked-review-only";
  confirmationRequirement: "explicit-operator-confirmation";
  blockedReason:
    | "scheduler-runner-not-ready"
    | "backfill-execution-not-wired";
  readinessStatus: AnalyticsRollupSchedulerCommandExecuteReadinessReview["status"];
  contractReviewStatus: AnalyticsRollupSchedulerCommandExecuteContractReview["status"];
  persistenceScope: AnalyticsRollupSchedulerCommandExecuteContractReview["persistenceScope"];
  rollbackExpectation: AnalyticsRollupSchedulerCommandExecuteContractReview["rollbackExpectation"];
  plannedBackfillRequestCount: number;
  plannedSources: AnalyticsRollupSchedulerRunnerPlan["sources"];
  sourceScopedPlannedRequests: Array<{
    source: AnalyticsRollupSchedulerRunnerPlan["backfillRequests"][number]["source"];
    mode: AnalyticsRollupSchedulerRunnerPlan["backfillRequests"][number]["mode"];
    bucketCount: AnalyticsRollupSchedulerRunnerPlan["backfillRequests"][number]["bucketCount"];
    willInvokeBackfillService: false;
    willReadEvents: false;
    willPersistRollups: false;
  }>;
  includeConfirmationRequirement: true;
  includeBlockedReason: true;
  includeReadinessStatus: true;
  includeContractReviewStatus: true;
  includePersistenceScope: true;
  includeRollbackExpectation: true;
  includeSourceScopedPlannedRequests: true;
  includeSafetyFlags: true;
  includeNoQuotaMutationStatement: true;
  includeNoRawEventDeletionStatement: true;
  operatorOutputCurrentlyExposed: true;
  executeRuntimeCurrentlyAllowed: false;
  serviceInvocationCurrentlyAllowed: false;
  eventReadCurrentlyAllowed: false;
  rollupPersistenceCurrentlyAllowed: false;
  quotaCountingChangeAllowed: false;
  rawEventDeletionAllowed: false;
};
export type AnalyticsRollupSchedulerCommandExecutePreflightGuardrailReview = {
  status: "preflight-blocked";
  reviewBoundary: "scheduler-command-execute-preflight-guardrails";
  requestedCapability: "command:execute";
  blockedReason:
    | "scheduler-runner-not-ready"
    | "backfill-execution-not-wired";
  confirmationState: "not-confirmed" | "confirmed";
  eventLimitState: "missing" | "provided";
  guardrails: {
    readyRunnerPlan: {
      required: true;
      satisfied: boolean;
      status: "missing" | "satisfied";
    };
    explicitOperatorConfirmation: {
      required: true;
      satisfied: boolean;
      status: "missing" | "satisfied";
    };
    explicitEventLimit: {
      required: true;
      satisfied: boolean;
      status: "missing" | "satisfied";
      value: number | null;
    };
    maxBucketBound: {
      required: true;
      satisfied: boolean;
      status: "missing" | "satisfied";
    };
    boundedBucketCount: {
      required: true;
      satisfied: boolean;
      status: "missing" | "satisfied";
      bucketCount: number;
    };
    sourceSeparatedExecution: {
      required: true;
      satisfied: boolean;
      status: "missing" | "satisfied";
      plannedSources: AnalyticsRollupSchedulerRunnerPlan["sources"];
    };
    priorDryRunRuntimeValidation: {
      required: true;
      satisfied: false;
      status: "missing";
    };
  };
  executeRuntimeCurrentlyAllowed: false;
  serviceInvocationCurrentlyAllowed: false;
  eventReadCurrentlyAllowed: false;
  rollupPersistenceCurrentlyAllowed: false;
  quotaCountingChangeAllowed: false;
  rawEventDeletionAllowed: false;
};

export type AnalyticsRollupSchedulerCommandExecuteRuntimeInvocationBlockerReview = {
  status: "runtime-invocation-blocked";
  reviewBoundary: "scheduler-command-execute-runtime-invocation-blockers";
  requestedCapability: "command:execute";
  blockedReason:
    | "scheduler-runner-not-ready"
    | "backfill-execution-not-wired";
  blockers: {
    backfillExecutionWired: {
      required: true;
      satisfied: false;
      status: "missing";
    };
    executeRuntimeCurrentlyAllowed: {
      required: true;
      satisfied: false;
      status: "blocked";
    };
    priorDryRunRuntimeValidation: {
      required: true;
      satisfied: false;
      status: "missing";
    };
    rollupPersistenceScope: {
      required: "rollup-tables-only";
      satisfied: false;
      status: "not-wired";
    };
    dockerPostgresRuntimeValidation: {
      required: true;
      satisfied: false;
      status: "pending";
    };
  };
  plannedInvocation: {
    service: "AnalyticsRollupBackfillService.runBackfill";
    requestedMode: "execute";
    willInvokeBackfillService: false;
    willExecuteBackfill: false;
    willReadEvents: false;
    willPersistRollups: false;
    willAffectQuotaCounting: false;
    willDeleteRawEvents: false;
    eventLimit: number | null;
    plannedBackfillRequestCount: number;
    plannedSources: AnalyticsRollupSchedulerRunnerPlan["sources"];
  };
  nextRequiredAction: "wire-command-execute-runtime-with-strict-guardrails-and-docker-postgres-validation";
};

export type AnalyticsRollupSchedulerCommandExecutePersistenceBarrierReview = {
  status: "persistence-barrier-blocked";
  reviewBoundary: "scheduler-command-execute-persistence-barriers";
  requestedCapability: "command:execute";
  blockedReason:
    | "scheduler-runner-not-ready"
    | "backfill-execution-not-wired";
  persistenceScope: {
    required: "rollup-tables-only";
    currentState: "not-wired";
    allowedTables: [];
  };
  writeBarriers: {
    rollupPersistence: {
      required: true;
      satisfied: false;
      status: "blocked";
    };
    quotaCountingMutation: {
      required: false;
      satisfied: false;
      status: "not-allowed";
    };
    rawEventDeletion: {
      required: false;
      satisfied: false;
      status: "not-allowed";
    };
    summaryReadSwitch: {
      required: false;
      satisfied: false;
      status: "not-in-scope";
    };
    retentionDeleteExecution: {
      required: false;
      satisfied: false;
      status: "not-in-scope";
    };
    scheduledJobCreation: {
      required: false;
      satisfied: false;
      status: "not-in-scope";
    };
    processLocalExecute: {
      required: false;
      satisfied: false;
      status: "not-in-scope";
    };
    externalSchedulerExecute: {
      required: false;
      satisfied: false;
      status: "not-in-scope";
    };
  };
  plannedWriteIntent: {
    willPersistRollups: false;
    willMutateQuotaCounting: false;
    willDeleteRawEvents: false;
    willSwitchSummaryReads: false;
    willExecuteRetentionDelete: false;
    willCreateScheduledJob: false;
    willRunProcessLocalExecute: false;
    willRunExternalSchedulerExecute: false;
    plannedBackfillRequestCount: number;
    plannedSources: AnalyticsRollupSchedulerRunnerPlan["sources"];
  };
  rollbackExpectation: {
    requiredBeforeFutureExecuteWiring: true;
    currentState: "not-applicable-no-writes";
  };
};

export type AnalyticsRollupSchedulerCommandExecuteRuntimeWiringSeamReview = {
  status: "runtime-wiring-seam-not-ready";
  reviewBoundary: "scheduler-command-execute-runtime-wiring-seam";
  requestedCapability: "command:execute";
  serviceMethod: "AnalyticsRollupBackfillService.runBackfill";
  currentRuntimeState: "not-wired";
  blockedReason:
    | "scheduler-runner-not-ready"
    | "backfill-execution-not-wired";
  requiredRuntimeSeams: {
    executeServiceRequestMapper: {
      required: true;
      currentState: "not-wired";
      nextStep: "map-source-scoped-runner-requests-to-execute-backfill-run-inputs";
    };
    executeServiceAdapter: {
      required: true;
      currentState: "not-wired";
      nextStep: "invoke-runBackfill-only-after-all-execute-guardrails-pass";
    };
    explicitRuntimeGate: {
      required: true;
      currentState: "not-wired";
      nextStep: "add-command-execute-runtime-gate-separate-from-dry-run-gate";
    };
    runtimeBackfillServiceFactory: {
      required: true;
      currentState: "dry-run-factory-exists-execute-factory-not-wired";
      nextStep: "reuse-or-wrap-runtime-backfill-service-factory-with-execute-only-guardrails";
    };
    dockerPostgresRuntimeValidation: {
      required: true;
      currentState: "pending";
      nextStep: "validate-execute-runtime-with-docker-postgres-before-release";
    };
  };
  plannedExecuteInvocation: {
    eventLimit: number | null;
    plannedBackfillRequestCount: number;
    plannedSources: AnalyticsRollupSchedulerRunnerPlan["sources"];
    invocationCardinality: "source-scoped-run-inputs";
    willInvokeBackfillService: false;
    willExecuteBackfill: false;
    willReadEvents: false;
    willPersistRollups: false;
    willMutateQuotaCounting: false;
    willDeleteRawEvents: false;
  };
  nextRequiredAction: "add-command-execute-service-request-mapper-contract-before-runtime-wiring";
};

export type AnalyticsRollupSchedulerCommandExecuteWiringPreview = {
  status: "execute-wiring-preview-blocked";
  previewBoundary: "scheduler-command-execute-wiring-preview";
  currentWiringState: "blocked-not-wired";
  requestedCapability: "command:execute";
  blockedReason:
    | "scheduler-runner-not-ready"
    | "backfill-execution-not-wired";
  confirmationState: "not-confirmed" | "confirmed";
  requiredConfirmation: "explicit-operator-confirmation";
  readinessStatus: AnalyticsRollupSchedulerCommandExecuteReadinessReview["status"];
  contractReviewStatus: AnalyticsRollupSchedulerCommandExecuteContractReview["status"];
  operatorOutputReviewStatus: AnalyticsRollupSchedulerCommandExecuteOperatorOutputReview["status"];
  plannedBackfillRequestCount: number;
  plannedSources: AnalyticsRollupSchedulerRunnerPlan["sources"];
  plannedGranularity: AnalyticsRollupSchedulerRunnerPlan["granularity"];
  sourceScopedPlannedExecutions: Array<{
    source: AnalyticsRollupSchedulerRunnerPlan["backfillRequests"][number]["source"];
    requestedMode: "execute";
    bucketCount: AnalyticsRollupSchedulerRunnerPlan["backfillRequests"][number]["bucketCount"];
    willInvokeBackfillService: false;
    willExecuteBackfill: false;
    willReadEvents: false;
    willPersistRollups: false;
  }>;
  guardrails: {
    requiresReadyRunnerPlan: true;
    requiresPriorDryRunRuntimeValidation: true;
    requiresExplicitEventLimit: true;
    requiresMaxBucketBound: true;
    requiresBoundedBucketCount: true;
    requiresSourceSeparatedExecution: true;
    requiresExplicitOperatorConfirmation: true;
  };
  safetyFlags: {
    createsScheduledJob: false;
    invokesBackfillService: false;
    executesBackfill: false;
    readsEvents: false;
    persistsRollups: false;
    affectsQuotaCounting: false;
    deletesRawEvents: false;
  };
  executeRuntimeCurrentlyAllowed: false;
  backfillExecutionWired: false;
  serviceInvocationCurrentlyAllowed: false;
  eventReadCurrentlyAllowed: false;
  rollupPersistenceCurrentlyAllowed: false;
  quotaCountingChangeAllowed: false;
  rawEventDeletionAllowed: false;
  processLocalExecutionAllowed: false;
  externalSchedulerExecutionAllowed: false;
  scheduledJobCreationAllowed: false;
};
export type AnalyticsRollupSchedulerExecutionRuntimeConsistency = {
  status:
    | "preview-only"
    | "blocked-or-review-only"
    | "runtime-dry-run-service-invocation-wired";
  requestedCapability: `${AnalyticsRollupSchedulerExecutionTrigger}:${AnalyticsRollupSchedulerExecutionMode}`;
  backfillServiceInvocationWired: boolean;
  serviceInvocationCurrentlyAllowed: boolean;
  automaticTriggersRemainUnwired: true;
  executeRemainsUnwired: true;
  createsScheduledJob: false;
  invokesBackfillService: boolean;
  executesBackfill: false;
  readsEvents: false;
  persistsRollups: false;
  affectsQuotaCounting: false;
  deletesRawEvents: false;
  historicalReviewArtifactsMayRemainBlocked: true;
};

export type AnalyticsRollupSchedulerExecutionWiringReview = {
  currentCapability: "command-preview-only";
  requestedCapability: `${AnalyticsRollupSchedulerExecutionTrigger}:${AnalyticsRollupSchedulerExecutionMode}`;
  recommendedNextStep: AnalyticsRollupSchedulerExecutionRecommendedNextStep;
  requiresExplicitDesignBeforeWiring: boolean;
  requiresDockerPostgresValidationBeforeWiring: boolean;
  runtimeConsistency: AnalyticsRollupSchedulerExecutionRuntimeConsistency;
  commandExecuteReadinessReview: AnalyticsRollupSchedulerCommandExecuteReadinessReview | null;
  commandExecuteContractReview: AnalyticsRollupSchedulerCommandExecuteContractReview | null;
  commandExecuteOperatorOutputReview: AnalyticsRollupSchedulerCommandExecuteOperatorOutputReview | null;
  commandExecutePreflightGuardrailReview: AnalyticsRollupSchedulerCommandExecutePreflightGuardrailReview | null;
  commandExecuteRuntimeInvocationBlockerReview: AnalyticsRollupSchedulerCommandExecuteRuntimeInvocationBlockerReview | null;
  commandExecutePersistenceBarrierReview: AnalyticsRollupSchedulerCommandExecutePersistenceBarrierReview | null;
  commandExecuteRuntimeWiringSeamReview: AnalyticsRollupSchedulerCommandExecuteRuntimeWiringSeamReview | null;
  commandExecuteWiringPreview?: AnalyticsRollupSchedulerCommandExecuteWiringPreview | null;  dryRunDesignReview: AnalyticsRollupSchedulerCommandDryRunDesignReview;
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

const COMMAND_DRY_RUN_SERVICE_INVOCATION_WIRING_CONTRACT: AnalyticsRollupSchedulerCommandDryRunServiceInvocationWiringContract =
  {
    status: "wiring-contract-required-before-service-invocation",
    contractBoundary:
      "scheduler-command-dry-run-to-rollup-backfill-service-run-backfill",
    currentWiringState: "not-wired",
    targetTrigger: "command",
    targetBackfillMode: "dry-run",
    targetServiceMethod: "runBackfill",
    requestContract: {
      inputSource: "mapped-dry-run-service-inputs",
      requestMode: "dry-run",
      cardinality: "per-source-mapped-run-input",
      requiresReadyRunnerPlan: true,
      requiresSourceSeparatedInputs: true,
      requiresExplicitEventLimit: true,
      requiresMaxBucketBound: true,
    },
    responseContract: {
      outputTarget: "operator-visible-command-dry-run-output",
      requiredResultMode: "dry-run",
      sourceScopedResultsRequired: true,
      perSourceSafetyFlagsRequired: true,
      serviceDryRunPlanRequired: true,
      partialFailureOutputRequired: true,
    },
    validationContract: {
      rejectMissingEventLimit: true,
      rejectUnboundedBucketCount: true,
      rejectNonCommandTrigger: true,
      rejectExecuteMode: true,
      requiresDockerPostgresRuntimeValidationBeforeWiring: true,
    },
    operatorOutputContract: {
      includeServiceInvocationState: true,
      includeBlockedReason: true,
      includeSourceScopedResultSummary: true,
      includeSafetyFlags: true,
      includeNoQuotaMutationStatement: true,
      includeNoRawEventDeletionStatement: true,
    },
    backfillServiceInvocationWired: false,
    serviceInvocationCurrentlyAllowed: false,
    mayInvokeBackfillServiceAfterExplicitWiring: true,
    mayReadEventsThroughServiceDryRun: false,
    mayPersistRollupsThroughServiceDryRun: false,
    partialPersistenceAllowed: false,
    quotaCountingChangeAllowed: false,
    rawEventDeletionAllowed: false,
    failureBehavior: "fail-closed-before-service-invocation",
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

const COMMAND_DRY_RUN_SERVICE_INVOCATION_FAIL_CLOSED_ERROR_MODEL: AnalyticsRollupSchedulerCommandDryRunServiceInvocationFailClosedErrorModel =
  {
    status: "fail-closed-error-model-required-before-service-invocation",
    errorBoundary: "scheduler-command-dry-run-service-invocation",
    currentServiceInvocationState: "not-wired",
    targetTrigger: "command",
    targetBackfillMode: "dry-run",
    targetServiceMethod: "runBackfill",
    expectedFailureSource: "future-backfill-service-dry-run-invocation",
    expectedOperatorOutput:
      "operator-visible-fail-closed-service-error-review",
    operatorReviewRequired: true,
    sourceScopedErrorOutputRequired: true,
    safetyFlagsRequiredOnFailure: true,
    noPartialPersistenceRequired: true,
    noPartialQuotaMutationRequired: true,
    noRawEventDeletionRequired: true,
    failureState: "blocked",
    blockedReason: "backfill-service-invocation-not-wired",
    serviceInvocationCurrentlyAllowed: false,
    mayInvokeBackfillServiceAfterExplicitWiring: true,
    mayReadEventsThroughFailedServiceDryRun: false,
    mayPersistRollupsThroughFailedServiceDryRun: false,
    partialPersistenceAllowed: false,
    quotaCountingChangeAllowed: false,
    rawEventDeletionAllowed: false,
    failureBehavior: "fail-closed-without-partial-persistence",
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

const COMMAND_EXECUTE_CONTRACT_REVIEW: AnalyticsRollupSchedulerCommandExecuteContractReview =
  {
    status: "review-required-before-execute-wiring",
    reviewBoundary: "scheduler-command-execute-contract",
    currentExecutionState: "blocked-not-wired",
    targetTrigger: "command",
    targetBackfillMode: "execute",
    targetServiceMethod: "runBackfill",
    requiredConfirmation: "explicit-operator-confirmation",
    requiresReadyRunnerPlan: true,
    requiresPriorDryRunRuntimeValidation: true,
    requiresExplicitEventLimit: true,
    requiresMaxBucketBound: true,
    requiresBoundedBucketCount: true,
    requiresSourceSeparatedExecution: true,
    persistenceScope: "rollup-tables-only",
    rollbackExpectation:
      "bounded-idempotent-rollup-upsert-or-fail-closed-before-execution",
    operatorOutputContract: {
      includeConfirmationRequirement: true,
      includeBlockedReason: true,
      includeExecutionState: true,
      includePersistenceScope: true,
      includeRollbackExpectation: true,
      includeSourceScopedSummary: true,
      includeSafetyFlags: true,
      includeNoQuotaMutationStatement: true,
      includeNoRawEventDeletionStatement: true,
    },
    executionCurrentlyAllowed: false,
    serviceInvocationCurrentlyAllowed: false,
    mayInvokeBackfillServiceAfterExplicitWiring: true,
    eventReadCurrentlyAllowed: false,
    rollupPersistenceCurrentlyAllowed: false,
    partialPersistenceAllowed: false,
    quotaCountingChangeAllowed: false,
    rawEventDeletionAllowed: false,
    processLocalExecutionAllowed: false,
    externalSchedulerExecutionAllowed: false,
    scheduledJobCreationAllowed: false,
    failureBehavior: "fail-closed-before-execute-invocation",
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

function createAnalyticsRollupSchedulerCommandExecuteReadinessReview(
  runnerPlan: AnalyticsRollupSchedulerRunnerPlan,
  trigger: AnalyticsRollupSchedulerExecutionTrigger,
  requestedMode: AnalyticsRollupSchedulerExecutionMode,
): AnalyticsRollupSchedulerCommandExecuteReadinessReview | null {
  if (trigger !== "command" || requestedMode !== "execute") {
    return null;
  }

  return {
    status: "not-ready",
    reason:
      runnerPlan.status === "ready"
        ? "backfill-execution-not-wired"
        : "scheduler-runner-not-ready",
    executionBoundary: "scheduler-command-execute",
    plannedBackfillRequestCount: runnerPlan.backfillRequests.length,
    plannedSources: runnerPlan.sources,
    plannedGranularity: runnerPlan.granularity,
    backfillRequestsDerivedFromRunnerPlan: true,
    requiresExplicitConfirmation: true,
    requiresExplicitEventLimit: true,
    requiresMaxBucketBound: true,
    requiresBoundedBucketCount: true,
    requiresSourceSeparatedExecution: true,
    requiresPriorDryRunRuntimeValidation: true,
    canInvokeBackfillService: false,
    canExecuteBackfill: false,
    canReadEvents: false,
    canPersistRollups: false,
    canAffectQuotaCounting: false,
    canDeleteRawEvents: false,
  };
}
function createAnalyticsRollupSchedulerCommandExecuteContractReview(
  trigger: AnalyticsRollupSchedulerExecutionTrigger,
  requestedMode: AnalyticsRollupSchedulerExecutionMode,
): AnalyticsRollupSchedulerCommandExecuteContractReview | null {
  if (trigger !== "command" || requestedMode !== "execute") {
    return null;
  }

  return COMMAND_EXECUTE_CONTRACT_REVIEW;
}
function createAnalyticsRollupSchedulerCommandExecuteOperatorOutputReview(
  runnerPlan: AnalyticsRollupSchedulerRunnerPlan,
  trigger: AnalyticsRollupSchedulerExecutionTrigger,
  requestedMode: AnalyticsRollupSchedulerExecutionMode,
): AnalyticsRollupSchedulerCommandExecuteOperatorOutputReview | null {
  if (trigger !== "command" || requestedMode !== "execute") {
    return null;
  }

  return {
    status: "operator-output-review-required-before-execute-wiring",
    outputBoundary: "scheduler-command-execute-operator-output",
    currentOutputState: "blocked-review-only",
    confirmationRequirement: "explicit-operator-confirmation",
    blockedReason:
      runnerPlan.status === "ready"
        ? "backfill-execution-not-wired"
        : "scheduler-runner-not-ready",
    readinessStatus: "not-ready",
    contractReviewStatus: COMMAND_EXECUTE_CONTRACT_REVIEW.status,
    persistenceScope: COMMAND_EXECUTE_CONTRACT_REVIEW.persistenceScope,
    rollbackExpectation: COMMAND_EXECUTE_CONTRACT_REVIEW.rollbackExpectation,
    plannedBackfillRequestCount: runnerPlan.backfillRequests.length,
    plannedSources: runnerPlan.sources,
    sourceScopedPlannedRequests: runnerPlan.backfillRequests.map((request) => ({
      source: request.source,
      mode: request.mode,
      bucketCount: request.bucketCount,
      willInvokeBackfillService: false,
      willReadEvents: false,
      willPersistRollups: false,
    })),
    includeConfirmationRequirement: true,
    includeBlockedReason: true,
    includeReadinessStatus: true,
    includeContractReviewStatus: true,
    includePersistenceScope: true,
    includeRollbackExpectation: true,
    includeSourceScopedPlannedRequests: true,
    includeSafetyFlags: true,
    includeNoQuotaMutationStatement: true,
    includeNoRawEventDeletionStatement: true,
    operatorOutputCurrentlyExposed: true,
    executeRuntimeCurrentlyAllowed: false,
    serviceInvocationCurrentlyAllowed: false,
    eventReadCurrentlyAllowed: false,
    rollupPersistenceCurrentlyAllowed: false,
    quotaCountingChangeAllowed: false,
    rawEventDeletionAllowed: false,
  };
}
function createAnalyticsRollupSchedulerCommandExecutePreflightGuardrailReview(
  runnerPlan: AnalyticsRollupSchedulerRunnerPlan,
  trigger: AnalyticsRollupSchedulerExecutionTrigger,
  requestedMode: AnalyticsRollupSchedulerExecutionMode,
  commandExecuteOperatorConfirmed: boolean,
  commandExecuteEventLimit: number | null,
): AnalyticsRollupSchedulerCommandExecutePreflightGuardrailReview | null {
  if (trigger !== "command" || requestedMode !== "execute") {
    return null;
  }

  const readyRunnerPlan = runnerPlan.status === "ready";
  const explicitEventLimitProvided = commandExecuteEventLimit !== null;
  const boundedBucketCount = readyRunnerPlan && runnerPlan.bucketCount > 0;
  const maxBucketBound = boundedBucketCount;
  const sourceSeparatedExecution =
    readyRunnerPlan &&
    runnerPlan.backfillRequests.length === runnerPlan.sources.length &&
    runnerPlan.backfillRequests.every((request) =>
      runnerPlan.sources.includes(request.source),
    );

  return {
    status: "preflight-blocked",
    reviewBoundary: "scheduler-command-execute-preflight-guardrails",
    requestedCapability: "command:execute",
    blockedReason: readyRunnerPlan
      ? "backfill-execution-not-wired"
      : "scheduler-runner-not-ready",
    confirmationState: commandExecuteOperatorConfirmed
      ? "confirmed"
      : "not-confirmed",
    eventLimitState: explicitEventLimitProvided ? "provided" : "missing",
    guardrails: {
      readyRunnerPlan: {
        required: true,
        satisfied: readyRunnerPlan,
        status: readyRunnerPlan ? "satisfied" : "missing",
      },
      explicitOperatorConfirmation: {
        required: true,
        satisfied: commandExecuteOperatorConfirmed,
        status: commandExecuteOperatorConfirmed ? "satisfied" : "missing",
      },
      explicitEventLimit: {
        required: true,
        satisfied: explicitEventLimitProvided,
        status: explicitEventLimitProvided ? "satisfied" : "missing",
        value: commandExecuteEventLimit,
      },
      maxBucketBound: {
        required: true,
        satisfied: maxBucketBound,
        status: maxBucketBound ? "satisfied" : "missing",
      },
      boundedBucketCount: {
        required: true,
        satisfied: boundedBucketCount,
        status: boundedBucketCount ? "satisfied" : "missing",
        bucketCount: runnerPlan.bucketCount,
      },
      sourceSeparatedExecution: {
        required: true,
        satisfied: sourceSeparatedExecution,
        status: sourceSeparatedExecution ? "satisfied" : "missing",
        plannedSources: runnerPlan.sources,
      },
      priorDryRunRuntimeValidation: {
        required: true,
        satisfied: false,
        status: "missing",
      },
    },
    executeRuntimeCurrentlyAllowed: false,
    serviceInvocationCurrentlyAllowed: false,
    eventReadCurrentlyAllowed: false,
    rollupPersistenceCurrentlyAllowed: false,
    quotaCountingChangeAllowed: false,
    rawEventDeletionAllowed: false,
  };
}

function createAnalyticsRollupSchedulerCommandExecuteRuntimeInvocationBlockerReview(
  runnerPlan: AnalyticsRollupSchedulerRunnerPlan,
  trigger: AnalyticsRollupSchedulerExecutionTrigger,
  requestedMode: AnalyticsRollupSchedulerExecutionMode,
  commandExecuteEventLimit: number | null,
): AnalyticsRollupSchedulerCommandExecuteRuntimeInvocationBlockerReview | null {
  if (trigger !== "command" || requestedMode !== "execute") {
    return null;
  }

  return {
    status: "runtime-invocation-blocked",
    reviewBoundary: "scheduler-command-execute-runtime-invocation-blockers",
    requestedCapability: "command:execute",
    blockedReason:
      runnerPlan.status === "ready"
        ? "backfill-execution-not-wired"
        : "scheduler-runner-not-ready",
    blockers: {
      backfillExecutionWired: {
        required: true,
        satisfied: false,
        status: "missing",
      },
      executeRuntimeCurrentlyAllowed: {
        required: true,
        satisfied: false,
        status: "blocked",
      },
      priorDryRunRuntimeValidation: {
        required: true,
        satisfied: false,
        status: "missing",
      },
      rollupPersistenceScope: {
        required: "rollup-tables-only",
        satisfied: false,
        status: "not-wired",
      },
      dockerPostgresRuntimeValidation: {
        required: true,
        satisfied: false,
        status: "pending",
      },
    },
    plannedInvocation: {
      service: "AnalyticsRollupBackfillService.runBackfill",
      requestedMode: "execute",
      willInvokeBackfillService: false,
      willExecuteBackfill: false,
      willReadEvents: false,
      willPersistRollups: false,
      willAffectQuotaCounting: false,
      willDeleteRawEvents: false,
      eventLimit: commandExecuteEventLimit,
      plannedBackfillRequestCount: runnerPlan.backfillRequests.length,
      plannedSources: runnerPlan.sources,
    },
    nextRequiredAction:
      "wire-command-execute-runtime-with-strict-guardrails-and-docker-postgres-validation",
  };
}

function createAnalyticsRollupSchedulerCommandExecutePersistenceBarrierReview(
  runnerPlan: AnalyticsRollupSchedulerRunnerPlan,
  trigger: AnalyticsRollupSchedulerExecutionTrigger,
  requestedMode: AnalyticsRollupSchedulerExecutionMode,
): AnalyticsRollupSchedulerCommandExecutePersistenceBarrierReview | null {
  if (trigger !== "command" || requestedMode !== "execute") {
    return null;
  }

  return {
    status: "persistence-barrier-blocked",
    reviewBoundary: "scheduler-command-execute-persistence-barriers",
    requestedCapability: "command:execute",
    blockedReason:
      runnerPlan.status === "ready"
        ? "backfill-execution-not-wired"
        : "scheduler-runner-not-ready",
    persistenceScope: {
      required: "rollup-tables-only",
      currentState: "not-wired",
      allowedTables: [],
    },
    writeBarriers: {
      rollupPersistence: {
        required: true,
        satisfied: false,
        status: "blocked",
      },
      quotaCountingMutation: {
        required: false,
        satisfied: false,
        status: "not-allowed",
      },
      rawEventDeletion: {
        required: false,
        satisfied: false,
        status: "not-allowed",
      },
      summaryReadSwitch: {
        required: false,
        satisfied: false,
        status: "not-in-scope",
      },
      retentionDeleteExecution: {
        required: false,
        satisfied: false,
        status: "not-in-scope",
      },
      scheduledJobCreation: {
        required: false,
        satisfied: false,
        status: "not-in-scope",
      },
      processLocalExecute: {
        required: false,
        satisfied: false,
        status: "not-in-scope",
      },
      externalSchedulerExecute: {
        required: false,
        satisfied: false,
        status: "not-in-scope",
      },
    },
    plannedWriteIntent: {
      willPersistRollups: false,
      willMutateQuotaCounting: false,
      willDeleteRawEvents: false,
      willSwitchSummaryReads: false,
      willExecuteRetentionDelete: false,
      willCreateScheduledJob: false,
      willRunProcessLocalExecute: false,
      willRunExternalSchedulerExecute: false,
      plannedBackfillRequestCount: runnerPlan.backfillRequests.length,
      plannedSources: runnerPlan.sources,
    },
    rollbackExpectation: {
      requiredBeforeFutureExecuteWiring: true,
      currentState: "not-applicable-no-writes",
    },
  };
}

function createAnalyticsRollupSchedulerCommandExecuteRuntimeWiringSeamReview(
  runnerPlan: AnalyticsRollupSchedulerRunnerPlan,
  trigger: AnalyticsRollupSchedulerExecutionTrigger,
  requestedMode: AnalyticsRollupSchedulerExecutionMode,
  commandExecuteEventLimit: number | null,
): AnalyticsRollupSchedulerCommandExecuteRuntimeWiringSeamReview | null {
  if (trigger !== "command" || requestedMode !== "execute") {
    return null;
  }

  return {
    status: "runtime-wiring-seam-not-ready",
    reviewBoundary: "scheduler-command-execute-runtime-wiring-seam",
    requestedCapability: "command:execute",
    serviceMethod: "AnalyticsRollupBackfillService.runBackfill",
    currentRuntimeState: "not-wired",
    blockedReason:
      runnerPlan.status === "ready"
        ? "backfill-execution-not-wired"
        : "scheduler-runner-not-ready",
    requiredRuntimeSeams: {
      executeServiceRequestMapper: {
        required: true,
        currentState: "not-wired",
        nextStep: "map-source-scoped-runner-requests-to-execute-backfill-run-inputs",
      },
      executeServiceAdapter: {
        required: true,
        currentState: "not-wired",
        nextStep: "invoke-runBackfill-only-after-all-execute-guardrails-pass",
      },
      explicitRuntimeGate: {
        required: true,
        currentState: "not-wired",
        nextStep: "add-command-execute-runtime-gate-separate-from-dry-run-gate",
      },
      runtimeBackfillServiceFactory: {
        required: true,
        currentState: "dry-run-factory-exists-execute-factory-not-wired",
        nextStep:
          "reuse-or-wrap-runtime-backfill-service-factory-with-execute-only-guardrails",
      },
      dockerPostgresRuntimeValidation: {
        required: true,
        currentState: "pending",
        nextStep: "validate-execute-runtime-with-docker-postgres-before-release",
      },
    },
    plannedExecuteInvocation: {
      eventLimit: commandExecuteEventLimit,
      plannedBackfillRequestCount: runnerPlan.backfillRequests.length,
      plannedSources: runnerPlan.sources,
      invocationCardinality: "source-scoped-run-inputs",
      willInvokeBackfillService: false,
      willExecuteBackfill: false,
      willReadEvents: false,
      willPersistRollups: false,
      willMutateQuotaCounting: false,
      willDeleteRawEvents: false,
    },
    nextRequiredAction:
      "add-command-execute-service-request-mapper-contract-before-runtime-wiring",
  };
}

function createAnalyticsRollupSchedulerCommandExecuteWiringPreview(
  runnerPlan: AnalyticsRollupSchedulerRunnerPlan,
  trigger: AnalyticsRollupSchedulerExecutionTrigger,
  requestedMode: AnalyticsRollupSchedulerExecutionMode,
  commandExecuteOperatorConfirmed: boolean,
): AnalyticsRollupSchedulerCommandExecuteWiringPreview | null {
  if (trigger !== "command" || requestedMode !== "execute") {
    return null;
  }

  return {
    status: "execute-wiring-preview-blocked",
    previewBoundary: "scheduler-command-execute-wiring-preview",
    currentWiringState: "blocked-not-wired",
    requestedCapability: "command:execute",
    blockedReason:
      runnerPlan.status === "ready"
        ? "backfill-execution-not-wired"
        : "scheduler-runner-not-ready",
    confirmationState: commandExecuteOperatorConfirmed
      ? "confirmed"
      : "not-confirmed",
    requiredConfirmation: "explicit-operator-confirmation",
    readinessStatus: "not-ready",
    contractReviewStatus: COMMAND_EXECUTE_CONTRACT_REVIEW.status,
    operatorOutputReviewStatus:
      "operator-output-review-required-before-execute-wiring",
    plannedBackfillRequestCount: runnerPlan.backfillRequests.length,
    plannedSources: runnerPlan.sources,
    plannedGranularity: runnerPlan.granularity,
    sourceScopedPlannedExecutions: runnerPlan.backfillRequests.map(
      (request) => ({
        source: request.source,
        requestedMode: "execute",
        bucketCount: request.bucketCount,
        willInvokeBackfillService: false,
        willExecuteBackfill: false,
        willReadEvents: false,
        willPersistRollups: false,
      }),
    ),
    guardrails: {
      requiresReadyRunnerPlan: true,
      requiresPriorDryRunRuntimeValidation: true,
      requiresExplicitEventLimit: true,
      requiresMaxBucketBound: true,
      requiresBoundedBucketCount: true,
      requiresSourceSeparatedExecution: true,
      requiresExplicitOperatorConfirmation: true,
    },
    safetyFlags: {
      createsScheduledJob: false,
      invokesBackfillService: false,
      executesBackfill: false,
      readsEvents: false,
      persistsRollups: false,
      affectsQuotaCounting: false,
      deletesRawEvents: false,
    },
    executeRuntimeCurrentlyAllowed: false,
    backfillExecutionWired: false,
    serviceInvocationCurrentlyAllowed: false,
    eventReadCurrentlyAllowed: false,
    rollupPersistenceCurrentlyAllowed: false,
    quotaCountingChangeAllowed: false,
    rawEventDeletionAllowed: false,
    processLocalExecutionAllowed: false,
    externalSchedulerExecutionAllowed: false,
    scheduledJobCreationAllowed: false,
  };
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
    dryRunServiceInvocationFailClosedErrorModel:
      COMMAND_DRY_RUN_SERVICE_INVOCATION_FAIL_CLOSED_ERROR_MODEL,
    dryRunServiceInvocationWiringContract:
      COMMAND_DRY_RUN_SERVICE_INVOCATION_WIRING_CONTRACT,
    dryRunServiceInvocationRequestMapperDesign:
      COMMAND_DRY_RUN_SERVICE_INVOCATION_REQUEST_MAPPER_DESIGN,
    dryRunServiceAdapterBoundaryDesign:
      COMMAND_DRY_RUN_SERVICE_ADAPTER_BOUNDARY_DESIGN,
    dryRunServiceAdapterPreviews,
    dryRunInvocationContract: COMMAND_DRY_RUN_INVOCATION_CONTRACT,
  };
}

function createAnalyticsRollupSchedulerExecutionRuntimeConsistency(
  trigger: AnalyticsRollupSchedulerExecutionTrigger,
  requestedMode: AnalyticsRollupSchedulerExecutionMode,
  backfillServiceInvocationWired: boolean,
): AnalyticsRollupSchedulerExecutionRuntimeConsistency {
  const serviceInvocationCurrentlyAllowed =
    backfillServiceInvocationWired &&
    trigger === "command" &&
    requestedMode === "dry-run";
  const status: AnalyticsRollupSchedulerExecutionRuntimeConsistency["status"] =
    serviceInvocationCurrentlyAllowed
      ? "runtime-dry-run-service-invocation-wired"
      : requestedMode === "preview"
        ? "preview-only"
        : "blocked-or-review-only";

  return {
    status,
    requestedCapability: `${trigger}:${requestedMode}`,
    backfillServiceInvocationWired: serviceInvocationCurrentlyAllowed,
    serviceInvocationCurrentlyAllowed,
    automaticTriggersRemainUnwired: true,
    executeRemainsUnwired: true,
    createsScheduledJob: false,
    invokesBackfillService: serviceInvocationCurrentlyAllowed,
    executesBackfill: false,
    readsEvents: false,
    persistsRollups: false,
    affectsQuotaCounting: false,
    deletesRawEvents: false,
    historicalReviewArtifactsMayRemainBlocked: true,
  };
}

function createAnalyticsRollupSchedulerExecutionWiringReview(
  runnerPlan: AnalyticsRollupSchedulerRunnerPlan,
  trigger: AnalyticsRollupSchedulerExecutionTrigger,
  requestedMode: AnalyticsRollupSchedulerExecutionMode,
  commandExecuteOperatorConfirmed: boolean,
  commandExecuteEventLimit: number | null,
  dryRunServiceAdapterPreviews:
    | AnalyticsRollupSchedulerBackfillServiceDryRunAdapterPreview[]
    | null = null,
  backfillServiceInvocationWired = false,
): AnalyticsRollupSchedulerExecutionWiringReview {
  return {
    currentCapability: "command-preview-only",
    requestedCapability: `${trigger}:${requestedMode}`,
    recommendedNextStep: resolveRecommendedNextStep(trigger, requestedMode),
    requiresExplicitDesignBeforeWiring:
      trigger !== "command" || requestedMode !== "preview",
    requiresDockerPostgresValidationBeforeWiring: requestedMode !== "preview",
    runtimeConsistency: createAnalyticsRollupSchedulerExecutionRuntimeConsistency(
      trigger,
      requestedMode,
      backfillServiceInvocationWired,
    ),
    commandExecuteReadinessReview:
      createAnalyticsRollupSchedulerCommandExecuteReadinessReview(
        runnerPlan,
        trigger,
        requestedMode,
      ),
    commandExecuteContractReview:
      createAnalyticsRollupSchedulerCommandExecuteContractReview(
        trigger,
        requestedMode,
      ),
    commandExecuteOperatorOutputReview:
      createAnalyticsRollupSchedulerCommandExecuteOperatorOutputReview(
        runnerPlan,
        trigger,
        requestedMode,
      ),
    commandExecutePreflightGuardrailReview:
      createAnalyticsRollupSchedulerCommandExecutePreflightGuardrailReview(
        runnerPlan,
        trigger,
        requestedMode,
        commandExecuteOperatorConfirmed,
        commandExecuteEventLimit,
      ),
    commandExecuteRuntimeInvocationBlockerReview:
      createAnalyticsRollupSchedulerCommandExecuteRuntimeInvocationBlockerReview(
        runnerPlan,
        trigger,
        requestedMode,
        commandExecuteEventLimit,
      ),
    commandExecutePersistenceBarrierReview:
      createAnalyticsRollupSchedulerCommandExecutePersistenceBarrierReview(
        runnerPlan,
        trigger,
        requestedMode,
      ),
    commandExecuteRuntimeWiringSeamReview:
      createAnalyticsRollupSchedulerCommandExecuteRuntimeWiringSeamReview(
        runnerPlan,
        trigger,
        requestedMode,
        commandExecuteEventLimit,
      ),
    ...(trigger === "command" && requestedMode === "execute"
      ? {
          commandExecuteWiringPreview:
            createAnalyticsRollupSchedulerCommandExecuteWiringPreview(
              runnerPlan,
              trigger,
              requestedMode,
              commandExecuteOperatorConfirmed,
            ),
        }
      : {}),    dryRunDesignReview: createAnalyticsRollupSchedulerCommandDryRunDesignReview(
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
  backfillServiceInvocationWired: boolean,
): AnalyticsRollupSchedulerExecutionBlockedReason | null {
  if (runnerPlan.status !== "ready") {
    return "scheduler-runner-not-ready";
  }

  if (trigger !== "command") {
    return "automatic-trigger-not-wired";
  }

  if (requestedMode === "dry-run" && !backfillServiceInvocationWired) {
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
  const commandExecuteOperatorConfirmed =
    input.commandExecuteOperatorConfirmed === true &&
    trigger === "command" &&
    requestedMode === "execute";
  const commandExecuteEventLimit =
    trigger === "command" &&
    requestedMode === "execute" &&
    input.commandExecuteEventLimit !== undefined
      ? input.commandExecuteEventLimit
      : null;
  const backfillServiceInvocationWired =
    input.backfillServiceInvocationWired === true &&
    runnerPlan.status === "ready" &&
    trigger === "command" &&
    requestedMode === "dry-run";
  const blockedReason = resolveBlockedReason(
    runnerPlan,
    trigger,
    requestedMode,
    backfillServiceInvocationWired,
  );
  const allowed = blockedReason === null;
  const allowedMode =
    allowed && requestedMode === "dry-run" ? "dry-run" : "preview";
  const dryRunServiceAdapterPreviews =
    input.dryRunServiceAdapterPreviews ?? null;
  const safety: AnalyticsRollupSchedulerExecutionDecisionSafety =
    backfillServiceInvocationWired
      ? {
          ...EXECUTION_DECISION_SAFETY,
          previewOnly: false,
          invokesBackfillService: true,
        }
      : EXECUTION_DECISION_SAFETY;

  return {
    kind: "analytics-rollup-scheduler-execution-decision",
    status:
      allowedMode === "dry-run" && allowed ? "dry-run-ready" : allowed ? "preview-ready" : "blocked",
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
      allowedMode,
      commandTriggeredOnly: true,
      processLocalExecutionWired: false,
      externalSchedulerExecutionWired: false,
      backfillServiceInvocationWired,
      backfillExecutionWired: false,
    },
    wiringReview: createAnalyticsRollupSchedulerExecutionWiringReview(
      runnerPlan,
      trigger,
      requestedMode,
      commandExecuteOperatorConfirmed,
      commandExecuteEventLimit,
      dryRunServiceAdapterPreviews,
      backfillServiceInvocationWired,
    ),
    safety,
  };
}
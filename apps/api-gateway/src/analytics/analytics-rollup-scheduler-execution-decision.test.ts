import { describe, expect, it } from "vitest";

import { createAnalyticsRollupSchedulePlan } from "./analytics-rollup-schedule-plan.js";
import { createAnalyticsRollupSchedulerExecutionDecision } from "./analytics-rollup-scheduler-execution-decision.js";
import { createAnalyticsRollupSchedulerRunnerPlan } from "./analytics-rollup-scheduler-runner.js";

describe("analytics rollup scheduler execution decision", () => {
  it("should allow command-triggered preview decisions for ready scheduler runner plans", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "usage",
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(runnerPlan);

    expect(decision).toEqual({
      kind: "analytics-rollup-scheduler-execution-decision",
      status: "preview-ready",
      allowed: true,
      blockedReason: null,
      runnerStatus: "ready",
      scheduleStatus: "planned",
      source: "usage",
      sources: ["usage"],
      granularity: "hour",
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      effectiveTo: new Date("2026-07-06T13:00:00.000Z"),
      bucketCount: 1,
      backfillRequestCount: 1,
      boundary: {
        trigger: "command",
        requestedMode: "preview",
        allowedMode: "preview",
        commandTriggeredOnly: true,
        processLocalExecutionWired: false,
        externalSchedulerExecutionWired: false,
        backfillServiceInvocationWired: false,
        backfillExecutionWired: false,
      },
      wiringReview: {
        currentCapability: "command-preview-only",
        requestedCapability: "command:preview",
        recommendedNextStep: "keep-command-preview-only",
        requiresExplicitDesignBeforeWiring: false,
        requiresDockerPostgresValidationBeforeWiring: false,
        runtimeConsistency: {
          status: "preview-only",
          requestedCapability: "command:preview",
          backfillServiceInvocationWired: false,
          serviceInvocationCurrentlyAllowed: false,
          automaticTriggersRemainUnwired: true,
          executeRemainsUnwired: true,
          createsScheduledJob: false,
          invokesBackfillService: false,
          executesBackfill: false,
          readsEvents: false,
          persistsRollups: false,
          affectsQuotaCounting: false,
          deletesRawEvents: false,
          historicalReviewArtifactsMayRemainBlocked: true,
        },
        commandExecuteReadinessReview: null,
        commandExecuteContractReview: null,
        commandExecuteOperatorOutputReview: null,
        commandExecutePreflightGuardrailReview: null,
        commandExecuteRuntimeInvocationBlockerReview: null,
        commandExecutePersistenceBarrierReview: null,
        commandExecuteRuntimeWiringSeamReview: null,
        dryRunDesignReview: null,
        automaticTriggersRemainUnwired: true,
        executeRemainsUnwired: true,
      },
      safety: {
        previewOnly: true,
        createsScheduledJob: false,
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });

  it("should block execution decisions when the scheduler runner plan is not ready", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "usage",
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(runnerPlan);

    expect(decision.status).toBe("blocked");
    expect(decision.allowed).toBe(false);
    expect(decision.blockedReason).toBe("scheduler-runner-not-ready");
    expect(decision.runnerStatus).toBe("skipped");
    expect(decision.scheduleStatus).toBe("disabled");
    expect(decision.backfillRequestCount).toBe(0);
    expect(decision.safety.executesBackfill).toBe(false);
    expect(decision.safety.readsEvents).toBe(false);
    expect(decision.safety.persistsRollups).toBe(false);
  });

  it("should block process-local and external scheduler triggers until execution is explicitly wired", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "usage",
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const processLocalDecision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      { trigger: "process-local" },
    );
    const externalSchedulerDecision =
      createAnalyticsRollupSchedulerExecutionDecision(runnerPlan, {
        trigger: "external-scheduler",
      });

    expect(processLocalDecision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "automatic-trigger-not-wired",
      boundary: {
        trigger: "process-local",
        processLocalExecutionWired: false,
        externalSchedulerExecutionWired: false,
      },
      wiringReview: {
        currentCapability: "command-preview-only",
        requestedCapability: "process-local:preview",
        recommendedNextStep: "keep-automatic-triggers-unwired",
        requiresExplicitDesignBeforeWiring: true,
        requiresDockerPostgresValidationBeforeWiring: false,
        commandExecuteReadinessReview: null,
        commandExecuteContractReview: null,
        commandExecuteOperatorOutputReview: null,
        dryRunDesignReview: null,
        automaticTriggersRemainUnwired: true,
        executeRemainsUnwired: true,
      },
    });
    expect(externalSchedulerDecision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "automatic-trigger-not-wired",
      boundary: {
        trigger: "external-scheduler",
        processLocalExecutionWired: false,
        externalSchedulerExecutionWired: false,
      },
    });
  });

  it("should block dry-run mode until backfill service invocation is explicitly wired", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "usage",
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const dryRunDecision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      { mode: "dry-run" },
    );

    expect(dryRunDecision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "backfill-service-invocation-not-wired",
      boundary: {
        requestedMode: "dry-run",
        allowedMode: "preview",
        backfillServiceInvocationWired: false,
        backfillExecutionWired: false,
      },
      wiringReview: {
        currentCapability: "command-preview-only",
        requestedCapability: "command:dry-run",
        recommendedNextStep: "design-command-dry-run-backfill-service-invocation",
        requiresExplicitDesignBeforeWiring: true,
        requiresDockerPostgresValidationBeforeWiring: true,
        dryRunDesignReview: {
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
          dryRunInvocationReadiness: {
            status: "not-ready",
            reason: "backfill-service-invocation-not-wired",
            plannedBackfillRequestCount: 1,
            plannedSources: ["usage"],
            plannedGranularity: "hour",
            backfillRequestsDerivedFromRunnerPlan: true,
            allPlannedRequestsDryRunOnly: true,
            canInvokeBackfillService: false,
            canReadEvents: false,
            canPersistRollups: false,
          },
          dryRunInvocationContract: {
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
          },
        },
        automaticTriggersRemainUnwired: true,
        executeRemainsUnwired: true,
      },
      safety: {
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });

  it("should expose command dry-run invocation design review without wiring invocation", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "both",
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      { mode: "dry-run" },
    );

    expect(decision.wiringReview.dryRunDesignReview).toMatchObject({
      status: "design-required",
      requestedCapability: "command:dry-run",
      currentlyWired: false,
      dryRunInvocationDesignReview: {
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
      },
      dryRunInvocationReadiness: {
        status: "not-ready",
        reason: "backfill-service-invocation-not-wired",
        plannedBackfillRequestCount: 2,
        plannedSources: ["usage", "rejected"],
        allPlannedRequestsDryRunOnly: true,
        canInvokeBackfillService: false,
        canReadEvents: false,
        canPersistRollups: false,
      },
      dryRunInvocationContract: {
        currentInvocationState: "not-wired",
        serviceInvocationCurrentlyAllowed: false,
        eventReadCurrentlyAllowed: false,
        rollupPersistenceCurrentlyAllowed: false,
        quotaCountingChangeAllowed: false,
        rawEventDeletionAllowed: false,
      },
    });
    expect(decision.safety.invokesBackfillService).toBe(false);
    expect(decision.safety.readsEvents).toBe(false);
    expect(decision.safety.persistsRollups).toBe(false);
    expect(decision.safety.affectsQuotaCounting).toBe(false);
    expect(decision.safety.deletesRawEvents).toBe(false);
  });
  it("should expose command dry-run service invocation contract review without wiring service calls", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "both",
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      { mode: "dry-run" },
    );

    expect(decision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "backfill-service-invocation-not-wired",
      boundary: {
        trigger: "command",
        requestedMode: "dry-run",
        backfillServiceInvocationWired: false,
        backfillExecutionWired: false,
      },
      wiringReview: {
        requestedCapability: "command:dry-run",
        dryRunDesignReview: {
          currentlyWired: false,
          dryRunServiceInvocationContractReview: {
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
          },
        },
      },
      safety: {
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });
  it("should expose command dry-run service invocation implementation design without wiring service calls", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "both",
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      { mode: "dry-run" },
    );

    expect(decision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "backfill-service-invocation-not-wired",
      wiringReview: {
        requestedCapability: "command:dry-run",
        dryRunDesignReview: {
          currentlyWired: false,
          dryRunServiceInvocationImplementationDesign: {
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
          },
        },
      },
      safety: {
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });

  it("should expose command dry-run service invocation wiring readiness review without wiring service calls", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "both",
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      { mode: "dry-run" },
    );

    expect(decision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "backfill-service-invocation-not-wired",
      boundary: {
        trigger: "command",
        requestedMode: "dry-run",
        backfillServiceInvocationWired: false,
        backfillExecutionWired: false,
      },
      wiringReview: {
        requestedCapability: "command:dry-run",
        dryRunDesignReview: {
          currentlyWired: false,
          dryRunServiceInvocationWiringReadinessReview: {
            status:
              "wiring-readiness-review-required-before-service-invocation",
            readinessBoundary:
              "scheduler-command-dry-run-service-invocation-wiring",
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
          },
        },
      },
      safety: {
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });

  it("should expose command dry-run service invocation fail-closed error model without wiring service calls", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "both",
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      { mode: "dry-run" },
    );

    expect(decision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "backfill-service-invocation-not-wired",
      boundary: {
        trigger: "command",
        requestedMode: "dry-run",
        backfillServiceInvocationWired: false,
        backfillExecutionWired: false,
      },
      wiringReview: {
        requestedCapability: "command:dry-run",
        dryRunDesignReview: {
          currentlyWired: false,
          dryRunServiceInvocationFailClosedErrorModel: {
            status:
              "fail-closed-error-model-required-before-service-invocation",
            errorBoundary: "scheduler-command-dry-run-service-invocation",
            currentServiceInvocationState: "not-wired",
            targetTrigger: "command",
            targetBackfillMode: "dry-run",
            targetServiceMethod: "runBackfill",
            expectedFailureSource:
              "future-backfill-service-dry-run-invocation",
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
          },
        },
      },
      safety: {
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });
  it("should expose command dry-run service invocation wiring contract without wiring service calls", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "both",
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      { mode: "dry-run" },
    );

    expect(decision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "backfill-service-invocation-not-wired",
      boundary: {
        trigger: "command",
        requestedMode: "dry-run",
        backfillServiceInvocationWired: false,
        backfillExecutionWired: false,
      },
      wiringReview: {
        requestedCapability: "command:dry-run",
        dryRunDesignReview: {
          currentlyWired: false,
          dryRunServiceInvocationWiringContract: {
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
          },
        },
      },
      safety: {
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });
  it("should expose command dry-run service invocation request mapper design without wiring service calls", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "both",
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      { mode: "dry-run" },
    );

    expect(decision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "backfill-service-invocation-not-wired",
      wiringReview: {
        requestedCapability: "command:dry-run",
        dryRunDesignReview: {
          currentlyWired: false,
          dryRunServiceInvocationRequestMapperDesign: {
            status: "mapper-design-added-before-service-invocation",
            mapperBoundary:
              "scheduler-backfill-request-to-backfill-service-run-input",
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
          },
        },
      },
      safety: {
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });
  it("should expose command dry-run service adapter boundary design without wiring service calls", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "both",
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      { mode: "dry-run" },
    );

    expect(decision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "backfill-service-invocation-not-wired",
      wiringReview: {
        requestedCapability: "command:dry-run",
        dryRunDesignReview: {
          currentlyWired: false,
          dryRunServiceAdapterBoundaryDesign: {
            status:
              "adapter-boundary-design-required-before-service-invocation",
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
          },
        },
      },
      safety: {
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });

  it("should block execute mode until backfill execution is explicitly wired", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "usage",
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const executeDecision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      { mode: "execute" },
    );

    expect(executeDecision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "backfill-execution-not-wired",
      boundary: {
        requestedMode: "execute",
        allowedMode: "preview",
        backfillServiceInvocationWired: false,
        backfillExecutionWired: false,
      },
      wiringReview: {
        currentCapability: "command-preview-only",
        requestedCapability: "command:execute",
        recommendedNextStep: "wire-command-dry-run-before-execute",
        requiresExplicitDesignBeforeWiring: true,
        requiresDockerPostgresValidationBeforeWiring: true,
        commandExecuteReadinessReview: {
          status: "not-ready",
          reason: "backfill-execution-not-wired",
          executionBoundary: "scheduler-command-execute",
          plannedBackfillRequestCount: 1,
          plannedSources: ["usage"],
          plannedGranularity: "hour",
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
        },
        commandExecuteContractReview: {
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
        },
        automaticTriggersRemainUnwired: true,
        executeRemainsUnwired: true,
      },
      safety: {
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });


  it("should record command execute operator confirmation without enabling runtime execution", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "both",
      lookbackBuckets: 1,
      safetyDelayMs: 300000,
      maxBuckets: 1,
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      {
        mode: "execute",
        commandExecuteOperatorConfirmed: true,
      },
    );

    expect(decision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "backfill-execution-not-wired",
      boundary: {
        trigger: "command",
        requestedMode: "execute",
        allowedMode: "preview",
        backfillServiceInvocationWired: false,
        backfillExecutionWired: false,
      },
      wiringReview: {
        requestedCapability: "command:execute",
        commandExecuteWiringPreview: {
          confirmationState: "confirmed",
          requiredConfirmation: "explicit-operator-confirmation",
          blockedReason: "backfill-execution-not-wired",
          executeRuntimeCurrentlyAllowed: false,
          backfillExecutionWired: false,
          serviceInvocationCurrentlyAllowed: false,
          eventReadCurrentlyAllowed: false,
          rollupPersistenceCurrentlyAllowed: false,
          quotaCountingChangeAllowed: false,
          rawEventDeletionAllowed: false,
        },
        runtimeConsistency: {
          status: "blocked-or-review-only",
          requestedCapability: "command:execute",
          backfillServiceInvocationWired: false,
          serviceInvocationCurrentlyAllowed: false,
          executeRemainsUnwired: true,
          invokesBackfillService: false,
          executesBackfill: false,
          readsEvents: false,
          persistsRollups: false,
          affectsQuotaCounting: false,
          deletesRawEvents: false,
        },
      },
      safety: {
        previewOnly: true,
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });

  it("should expose command execute preflight guardrail review without enabling runtime execution", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "both",
      lookbackBuckets: 1,
      safetyDelayMs: 300000,
      maxBuckets: 1,
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      {
        mode: "execute",
        commandExecuteOperatorConfirmed: true,
        commandExecuteEventLimit: 500,
      },
    );

    expect(decision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "backfill-execution-not-wired",
      boundary: {
        requestedMode: "execute",
        allowedMode: "preview",
        backfillExecutionWired: false,
      },
      wiringReview: {
        requestedCapability: "command:execute",
        commandExecutePreflightGuardrailReview: {
          status: "preflight-blocked",
          reviewBoundary: "scheduler-command-execute-preflight-guardrails",
          requestedCapability: "command:execute",
          blockedReason: "backfill-execution-not-wired",
          confirmationState: "confirmed",
          eventLimitState: "provided",
          guardrails: {
            readyRunnerPlan: {
              required: true,
              satisfied: true,
              status: "satisfied",
            },
            explicitOperatorConfirmation: {
              required: true,
              satisfied: true,
              status: "satisfied",
            },
            explicitEventLimit: {
              required: true,
              satisfied: true,
              status: "satisfied",
              value: 500,
            },
            maxBucketBound: {
              required: true,
              satisfied: true,
              status: "satisfied",
            },
            boundedBucketCount: {
              required: true,
              satisfied: true,
              status: "satisfied",
              bucketCount: 1,
            },
            sourceSeparatedExecution: {
              required: true,
              satisfied: true,
              status: "satisfied",
              plannedSources: ["usage", "rejected"],
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
        },
        commandExecuteWiringPreview: {
          confirmationState: "confirmed",
          executeRuntimeCurrentlyAllowed: false,
          backfillExecutionWired: false,
        },
      },
      safety: {
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });

  it("should expose missing command execute preflight guardrails for skipped runner plans", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: false,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "usage",
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      { mode: "execute" },
    );

    expect(decision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "scheduler-runner-not-ready",
      wiringReview: {
        requestedCapability: "command:execute",
        commandExecutePreflightGuardrailReview: {
          status: "preflight-blocked",
          blockedReason: "scheduler-runner-not-ready",
          confirmationState: "not-confirmed",
          eventLimitState: "missing",
          guardrails: {
            readyRunnerPlan: {
              satisfied: false,
              status: "missing",
            },
            explicitOperatorConfirmation: {
              satisfied: false,
              status: "missing",
            },
            explicitEventLimit: {
              satisfied: false,
              status: "missing",
              value: null,
            },
            boundedBucketCount: {
              satisfied: false,
              status: "missing",
              bucketCount: 0,
            },
            priorDryRunRuntimeValidation: {
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
        },
      },
      safety: {
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });

  it("should expose command execute runtime invocation blocker review without wiring execution", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "both",
      lookbackBuckets: 1,
      safetyDelayMs: 300000,
      maxBuckets: 1,
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      {
        mode: "execute",
        commandExecuteOperatorConfirmed: true,
        commandExecuteEventLimit: 500,
      },
    );

    expect(decision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "backfill-execution-not-wired",
      wiringReview: {
        requestedCapability: "command:execute",
        commandExecuteRuntimeInvocationBlockerReview: {
          status: "runtime-invocation-blocked",
          reviewBoundary: "scheduler-command-execute-runtime-invocation-blockers",
          requestedCapability: "command:execute",
          blockedReason: "backfill-execution-not-wired",
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
            eventLimit: 500,
            plannedBackfillRequestCount: 2,
            plannedSources: ["usage", "rejected"],
          },
          nextRequiredAction:
            "wire-command-execute-runtime-with-strict-guardrails-and-docker-postgres-validation",
        },
        commandExecutePreflightGuardrailReview: {
          status: "preflight-blocked",
          eventLimitState: "provided",
          executeRuntimeCurrentlyAllowed: false,
        },
        commandExecuteWiringPreview: {
          confirmationState: "confirmed",
          executeRuntimeCurrentlyAllowed: false,
          backfillExecutionWired: false,
        },
      },
      safety: {
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });

  it("should expose not-ready command execute runtime invocation blocker review without wiring execution", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: false,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "usage",
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      { mode: "execute" },
    );

    expect(decision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "scheduler-runner-not-ready",
      wiringReview: {
        requestedCapability: "command:execute",
        commandExecuteRuntimeInvocationBlockerReview: {
          status: "runtime-invocation-blocked",
          blockedReason: "scheduler-runner-not-ready",
          plannedInvocation: {
            service: "AnalyticsRollupBackfillService.runBackfill",
            requestedMode: "execute",
            willInvokeBackfillService: false,
            willExecuteBackfill: false,
            willReadEvents: false,
            willPersistRollups: false,
            willAffectQuotaCounting: false,
            willDeleteRawEvents: false,
            eventLimit: null,
            plannedBackfillRequestCount: 0,
            plannedSources: ["usage"],
          },
        },
      },
      safety: {
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });

  it("should expose command execute persistence barrier review without wiring writes", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "both",
      lookbackBuckets: 1,
      safetyDelayMs: 300000,
      maxBuckets: 1,
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      {
        mode: "execute",
        commandExecuteOperatorConfirmed: true,
        commandExecuteEventLimit: 500,
      },
    );

    expect(decision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "backfill-execution-not-wired",
      wiringReview: {
        requestedCapability: "command:execute",
        commandExecutePersistenceBarrierReview: {
          status: "persistence-barrier-blocked",
          reviewBoundary: "scheduler-command-execute-persistence-barriers",
          requestedCapability: "command:execute",
          blockedReason: "backfill-execution-not-wired",
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
            plannedBackfillRequestCount: 2,
            plannedSources: ["usage", "rejected"],
          },
          rollbackExpectation: {
            requiredBeforeFutureExecuteWiring: true,
            currentState: "not-applicable-no-writes",
          },
        },
        commandExecuteRuntimeInvocationBlockerReview: {
          status: "runtime-invocation-blocked",
          plannedInvocation: {
            willInvokeBackfillService: false,
            willExecuteBackfill: false,
            willReadEvents: false,
            willPersistRollups: false,
          },
        },
        commandExecuteWiringPreview: {
          executeRuntimeCurrentlyAllowed: false,
          backfillExecutionWired: false,
          rollupPersistenceCurrentlyAllowed: false,
          quotaCountingChangeAllowed: false,
          rawEventDeletionAllowed: false,
        },
      },
      safety: {
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });

  it("should expose not-ready command execute persistence barrier review without wiring writes", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: false,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "usage",
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      { mode: "execute" },
    );

    expect(decision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "scheduler-runner-not-ready",
      wiringReview: {
        requestedCapability: "command:execute",
        commandExecutePersistenceBarrierReview: {
          status: "persistence-barrier-blocked",
          blockedReason: "scheduler-runner-not-ready",
          persistenceScope: {
            required: "rollup-tables-only",
            currentState: "not-wired",
            allowedTables: [],
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
            plannedBackfillRequestCount: 0,
            plannedSources: ["usage"],
          },
        },
      },
      safety: {
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });

  it("should expose command execute runtime wiring seam review without wiring runtime", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "both",
      lookbackBuckets: 1,
      safetyDelayMs: 300000,
      maxBuckets: 1,
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      {
        mode: "execute",
        commandExecuteOperatorConfirmed: true,
        commandExecuteEventLimit: 500,
      },
    );

    expect(decision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "backfill-execution-not-wired",
      wiringReview: {
        requestedCapability: "command:execute",
        commandExecuteRuntimeWiringSeamReview: {
          status: "runtime-wiring-seam-not-ready",
          reviewBoundary: "scheduler-command-execute-runtime-wiring-seam",
          requestedCapability: "command:execute",
          serviceMethod: "AnalyticsRollupBackfillService.runBackfill",
          currentRuntimeState: "not-wired",
          blockedReason: "backfill-execution-not-wired",
          requiredRuntimeSeams: {
            executeServiceRequestMapper: {
              required: true,
              currentState: "not-wired",
              nextStep:
                "map-source-scoped-runner-requests-to-execute-backfill-run-inputs",
            },
            executeServiceAdapter: {
              required: true,
              currentState: "not-wired",
              nextStep: "invoke-runBackfill-only-after-all-execute-guardrails-pass",
            },
            explicitRuntimeGate: {
              required: true,
              currentState: "not-wired",
              nextStep:
                "add-command-execute-runtime-gate-separate-from-dry-run-gate",
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
              nextStep:
                "validate-execute-runtime-with-docker-postgres-before-release",
            },
          },
          plannedExecuteInvocation: {
            eventLimit: 500,
            plannedBackfillRequestCount: 2,
            plannedSources: ["usage", "rejected"],
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
        },
        commandExecuteRuntimeInvocationBlockerReview: {
          status: "runtime-invocation-blocked",
          plannedInvocation: {
            willInvokeBackfillService: false,
            willExecuteBackfill: false,
            willReadEvents: false,
            willPersistRollups: false,
          },
        },
        commandExecutePersistenceBarrierReview: {
          status: "persistence-barrier-blocked",
          plannedWriteIntent: {
            willPersistRollups: false,
            willMutateQuotaCounting: false,
            willDeleteRawEvents: false,
          },
        },
        commandExecuteWiringPreview: {
          executeRuntimeCurrentlyAllowed: false,
          backfillExecutionWired: false,
        },
      },
      safety: {
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });

  it("should expose not-ready command execute runtime wiring seam review without wiring runtime", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: false,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "usage",
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      { mode: "execute" },
    );

    expect(decision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "scheduler-runner-not-ready",
      wiringReview: {
        requestedCapability: "command:execute",
        commandExecuteRuntimeWiringSeamReview: {
          status: "runtime-wiring-seam-not-ready",
          blockedReason: "scheduler-runner-not-ready",
          serviceMethod: "AnalyticsRollupBackfillService.runBackfill",
          currentRuntimeState: "not-wired",
          plannedExecuteInvocation: {
            eventLimit: null,
            plannedBackfillRequestCount: 0,
            plannedSources: ["usage"],
            invocationCardinality: "source-scoped-run-inputs",
            willInvokeBackfillService: false,
            willExecuteBackfill: false,
            willReadEvents: false,
            willPersistRollups: false,
            willMutateQuotaCounting: false,
            willDeleteRawEvents: false,
          },
        },
      },
      safety: {
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });

  it("should expose source-aware command execute readiness review without wiring execution", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "both",
      lookbackBuckets: 1,
      safetyDelayMs: 300000,
      maxBuckets: 1,
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      { mode: "execute" },
    );

    expect(decision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "backfill-execution-not-wired",
      source: "both",
      sources: ["usage", "rejected"],
      backfillRequestCount: 2,
      wiringReview: {
        requestedCapability: "command:execute",
        commandExecuteReadinessReview: {
          status: "not-ready",
          reason: "backfill-execution-not-wired",
          executionBoundary: "scheduler-command-execute",
          plannedBackfillRequestCount: 2,
          plannedSources: ["usage", "rejected"],
          plannedGranularity: "hour",
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
        },
        commandExecuteContractReview: {
          status: "review-required-before-execute-wiring",
        },
        dryRunDesignReview: null,
        automaticTriggersRemainUnwired: true,
        executeRemainsUnwired: true,
      },
      safety: {
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });

  it("should expose not-ready command execute readiness for skipped runner plans", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: false,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "usage",
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      { mode: "execute" },
    );

    expect(decision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "scheduler-runner-not-ready",
      backfillRequestCount: 0,
      wiringReview: {
        requestedCapability: "command:execute",
        commandExecuteReadinessReview: {
          status: "not-ready",
          reason: "scheduler-runner-not-ready",
          executionBoundary: "scheduler-command-execute",
          plannedBackfillRequestCount: 0,
          plannedSources: ["usage"],
          plannedGranularity: "hour",
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
        },
        commandExecuteContractReview: {
          status: "review-required-before-execute-wiring",
        },
      },
      safety: {
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });

  it("should expose command execute operator output review without enabling execution", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "both",
      lookbackBuckets: 1,
      safetyDelayMs: 300000,
      maxBuckets: 1,
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      { mode: "execute" },
    );

    expect(decision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "backfill-execution-not-wired",
      source: "both",
      sources: ["usage", "rejected"],
      backfillRequestCount: 2,
      wiringReview: {
        requestedCapability: "command:execute",
        commandExecuteOperatorOutputReview: {
          status: "operator-output-review-required-before-execute-wiring",
          outputBoundary: "scheduler-command-execute-operator-output",
          currentOutputState: "blocked-review-only",
          confirmationRequirement: "explicit-operator-confirmation",
          blockedReason: "backfill-execution-not-wired",
          readinessStatus: "not-ready",
          contractReviewStatus: "review-required-before-execute-wiring",
          persistenceScope: "rollup-tables-only",
          rollbackExpectation:
            "bounded-idempotent-rollup-upsert-or-fail-closed-before-execution",
          plannedBackfillRequestCount: 2,
          plannedSources: ["usage", "rejected"],
          sourceScopedPlannedRequests: [
            {
              source: "usage",
              mode: "dry-run",
              bucketCount: 1,
              willInvokeBackfillService: false,
              willReadEvents: false,
              willPersistRollups: false,
            },
            {
              source: "rejected",
              mode: "dry-run",
              bucketCount: 1,
              willInvokeBackfillService: false,
              willReadEvents: false,
              willPersistRollups: false,
            },
          ],
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
        },
        commandExecuteReadinessReview: {
          status: "not-ready",
        },
        commandExecuteContractReview: {
          status: "review-required-before-execute-wiring",
        },
      },
      safety: {
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });
  it("should expose blocked command execute wiring preview without enabling runtime execution", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "both",
      lookbackBuckets: 1,
      safetyDelayMs: 300000,
      maxBuckets: 1,
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      { mode: "execute" },
    );

    expect(decision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "backfill-execution-not-wired",
      boundary: {
        trigger: "command",
        requestedMode: "execute",
        allowedMode: "preview",
        backfillServiceInvocationWired: false,
        backfillExecutionWired: false,
      },
      wiringReview: {
        requestedCapability: "command:execute",
        commandExecuteWiringPreview: {
          status: "execute-wiring-preview-blocked",
          previewBoundary: "scheduler-command-execute-wiring-preview",
          currentWiringState: "blocked-not-wired",
          requestedCapability: "command:execute",
          blockedReason: "backfill-execution-not-wired",
          confirmationState: "not-confirmed",
          requiredConfirmation: "explicit-operator-confirmation",
          readinessStatus: "not-ready",
          contractReviewStatus: "review-required-before-execute-wiring",
          operatorOutputReviewStatus:
            "operator-output-review-required-before-execute-wiring",
          plannedBackfillRequestCount: 2,
          plannedSources: ["usage", "rejected"],
          plannedGranularity: "hour",
          sourceScopedPlannedExecutions: [
            {
              source: "usage",
              requestedMode: "execute",
              bucketCount: 1,
              willInvokeBackfillService: false,
              willExecuteBackfill: false,
              willReadEvents: false,
              willPersistRollups: false,
            },
            {
              source: "rejected",
              requestedMode: "execute",
              bucketCount: 1,
              willInvokeBackfillService: false,
              willExecuteBackfill: false,
              willReadEvents: false,
              willPersistRollups: false,
            },
          ],
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
        },
        commandExecuteReadinessReview: {
          status: "not-ready",
          reason: "backfill-execution-not-wired",
        },
        commandExecuteContractReview: {
          status: "review-required-before-execute-wiring",
        },
        commandExecuteOperatorOutputReview: {
          status: "operator-output-review-required-before-execute-wiring",
        },
      },
      safety: {
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });
  it("should expose not-ready command execute wiring preview for skipped runner plans", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: false,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "usage",
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      { mode: "execute" },
    );

    expect(decision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "scheduler-runner-not-ready",
      backfillRequestCount: 0,
      boundary: {
        trigger: "command",
        requestedMode: "execute",
        allowedMode: "preview",
        backfillServiceInvocationWired: false,
        backfillExecutionWired: false,
      },
      wiringReview: {
        requestedCapability: "command:execute",
        commandExecuteWiringPreview: {
          status: "execute-wiring-preview-blocked",
          currentWiringState: "blocked-not-wired",
          requestedCapability: "command:execute",
          blockedReason: "scheduler-runner-not-ready",
          confirmationState: "not-confirmed",
          plannedBackfillRequestCount: 0,
          plannedSources: ["usage"],
          plannedGranularity: "hour",
          sourceScopedPlannedExecutions: [],
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
        },
      },
      safety: {
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });

  it("should keep command execute wiring preview command-only for automatic execute triggers", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "usage",
      lookbackBuckets: 1,
      safetyDelayMs: 300000,
      maxBuckets: 1,
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      {
        trigger: "process-local",
        mode: "execute",
      },
    );

    expect(decision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "automatic-trigger-not-wired",
      boundary: {
        trigger: "process-local",
        requestedMode: "execute",
        allowedMode: "preview",
        processLocalExecutionWired: false,
        externalSchedulerExecutionWired: false,
        backfillServiceInvocationWired: false,
        backfillExecutionWired: false,
      },
      wiringReview: {
        requestedCapability: "process-local:execute",
        recommendedNextStep: "keep-automatic-triggers-unwired",
        commandExecuteReadinessReview: null,
        commandExecuteContractReview: null,
        commandExecuteOperatorOutputReview: null,
        dryRunDesignReview: null,
        automaticTriggersRemainUnwired: true,
        executeRemainsUnwired: true,
      },
      safety: {
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
    expect(decision.wiringReview.commandExecuteWiringPreview).toBeUndefined();
  });
  it("should keep automatic dry-run triggers blocked before command dry-run design review", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "usage",
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      { trigger: "process-local", mode: "dry-run" },
    );

    expect(decision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "automatic-trigger-not-wired",
      boundary: {
        trigger: "process-local",
        requestedMode: "dry-run",
        allowedMode: "preview",
        processLocalExecutionWired: false,
        externalSchedulerExecutionWired: false,
        backfillServiceInvocationWired: false,
        backfillExecutionWired: false,
      },
      wiringReview: {
        currentCapability: "command-preview-only",
        requestedCapability: "process-local:dry-run",
        recommendedNextStep: "keep-automatic-triggers-unwired",
        requiresExplicitDesignBeforeWiring: true,
        requiresDockerPostgresValidationBeforeWiring: true,
        commandExecuteReadinessReview: null,
        commandExecuteContractReview: null,
        commandExecuteOperatorOutputReview: null,
        dryRunDesignReview: null,
        automaticTriggersRemainUnwired: true,
        executeRemainsUnwired: true,
      },
      safety: {
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });

  it("should expose not-ready command dry-run invocation readiness for skipped runner plans", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: false,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "usage",
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      { mode: "dry-run" },
    );

    expect(decision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "scheduler-runner-not-ready",
      backfillRequestCount: 0,
      wiringReview: {
        requestedCapability: "command:dry-run",
        dryRunDesignReview: {
          currentlyWired: false,
          dryRunInvocationReadiness: {
            status: "not-ready",
            reason: "scheduler-runner-not-ready",
            plannedBackfillRequestCount: 0,
            plannedSources: ["usage"],
            plannedGranularity: "hour",
            backfillRequestsDerivedFromRunnerPlan: true,
            allPlannedRequestsDryRunOnly: true,
            canInvokeBackfillService: false,
            canReadEvents: false,
            canPersistRollups: false,
          },
        },
      },
      safety: {
        invokesBackfillService: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });

  it("should expose source-aware command dry-run invocation readiness without wiring invocation", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "both",
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      { mode: "dry-run" },
    );

    expect(decision.wiringReview.dryRunDesignReview).toMatchObject({
      requestedCapability: "command:dry-run",
      currentlyWired: false,
      dryRunInvocationReadiness: {
        status: "not-ready",
        reason: "backfill-service-invocation-not-wired",
        plannedBackfillRequestCount: 2,
        plannedSources: ["usage", "rejected"],
        plannedGranularity: "hour",
        backfillRequestsDerivedFromRunnerPlan: true,
        allPlannedRequestsDryRunOnly: true,
        canInvokeBackfillService: false,
        canReadEvents: false,
        canPersistRollups: false,
      },
    });
    expect(decision.safety.invokesBackfillService).toBe(false);
    expect(decision.safety.readsEvents).toBe(false);
    expect(decision.safety.persistsRollups).toBe(false);
    expect(decision.safety.affectsQuotaCounting).toBe(false);
    expect(decision.safety.deletesRawEvents).toBe(false);
  });

  it("should preserve usage and rejected source separation in the execution decision", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T01:00:00.000Z"),
      granularity: "day",
      source: "both",
      lookbackBuckets: 2,
      safetyDelayMs: 0,
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(runnerPlan);

    expect(decision.allowed).toBe(true);
    expect(decision.source).toBe("both");
    expect(decision.sources).toEqual(["usage", "rejected"]);
    expect(decision.backfillRequestCount).toBe(2);
    expect(decision.safety.affectsQuotaCounting).toBe(false);
    expect(decision.safety.deletesRawEvents).toBe(false);
  });

  it("should allow command dry-run when backfill service invocation is explicitly wired", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "both",
      lookbackBuckets: 1,
      safetyDelayMs: 300000,
      maxBuckets: 1,
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      {
        mode: "dry-run",
        backfillServiceInvocationWired: true,
      },
    );

    expect(decision).toMatchObject({
      status: "dry-run-ready",
      allowed: true,
      blockedReason: null,
      boundary: {
        trigger: "command",
        requestedMode: "dry-run",
        allowedMode: "dry-run",
        commandTriggeredOnly: true,
        processLocalExecutionWired: false,
        externalSchedulerExecutionWired: false,
        backfillServiceInvocationWired: true,
        backfillExecutionWired: false,
      },
      safety: {
        previewOnly: false,
        createsScheduledJob: false,
        invokesBackfillService: true,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });

  it("should keep non-command dry-run blocked even when backfill service invocation is requested as wired", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "usage",
      lookbackBuckets: 1,
      safetyDelayMs: 300000,
      maxBuckets: 1,
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const decision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      {
        trigger: "process-local",
        mode: "dry-run",
        backfillServiceInvocationWired: true,
      },
    );

    expect(decision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "automatic-trigger-not-wired",
      boundary: {
        trigger: "process-local",
        requestedMode: "dry-run",
        allowedMode: "preview",
        processLocalExecutionWired: false,
        externalSchedulerExecutionWired: false,
        backfillServiceInvocationWired: false,
        backfillExecutionWired: false,
      },
      safety: {
        previewOnly: true,
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });
});
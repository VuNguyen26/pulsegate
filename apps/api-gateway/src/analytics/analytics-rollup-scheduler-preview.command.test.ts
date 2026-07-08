import { afterEach, describe, expect, it, vi } from "vitest";

import type { AnalyticsRollupBackfillEventReader } from "./analytics-rollup-backfill-event-reader.js";
import {
  createAnalyticsRollupBackfillService,
  type AnalyticsRollupBackfillService,
} from "./analytics-rollup-backfill-service.js";
import type { AnalyticsRollupPersistenceService } from "./analytics-rollup-persistence-service.js";
import {
  ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE,
  runAnalyticsRollupSchedulerPreviewCommand,
} from "./analytics-rollup-scheduler-preview.command.js";

describe("analytics rollup scheduler preview command", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should print a scheduler runner preview JSON without executing rollup work", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      "--enabled",
      "true",
      "--source",
      "both",
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
      "--lookback-buckets",
      "1",
      "--safety-delay-ms",
      "300000",
      "--max-buckets",
      "1",
    ]);

    expect(consoleLog).toHaveBeenCalledOnce();

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output).toMatchObject({
      kind: "analytics-rollup-scheduler-runner",
      mode: "preview",
      enabled: true,
      status: "ready",
      scheduleStatus: "planned",
      skipReason: null,
      source: "both",
      sources: ["usage", "rejected"],
      granularity: "hour",
      runAt: "2026-07-06T13:07:00.000Z",
      effectiveTo: "2026-07-06T13:00:00.000Z",
      bucketCount: 1,
      backfillRequests: [
        {
          source: "usage",
          mode: "dry-run",
          from: "2026-07-06T12:00:00.000Z",
          to: "2026-07-06T13:00:00.000Z",
          granularity: "hour",
          bucketCount: 1,
          willInvokeBackfillService: false,
          willReadEvents: false,
          willPersistRollups: false,
        },
        {
          source: "rejected",
          mode: "dry-run",
          from: "2026-07-06T12:00:00.000Z",
          to: "2026-07-06T13:00:00.000Z",
          granularity: "hour",
          bucketCount: 1,
          willInvokeBackfillService: false,
          willReadEvents: false,
          willPersistRollups: false,
        },
      ],
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
    expect(output.executionDecision).toMatchObject({
      kind: "analytics-rollup-scheduler-execution-decision",
      status: "preview-ready",
      allowed: true,
      blockedReason: null,
      runnerStatus: "ready",
      scheduleStatus: "planned",
      source: "both",
      sources: ["usage", "rejected"],
      granularity: "hour",
      runAt: "2026-07-06T13:07:00.000Z",
      effectiveTo: "2026-07-06T13:00:00.000Z",
      bucketCount: 1,
      backfillRequestCount: 2,
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

  it("should print a skipped scheduler preview for a disabled schedule", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
      "--source",
      "usage",
    ]);

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output).toMatchObject({
      kind: "analytics-rollup-scheduler-runner",
      mode: "preview",
      enabled: false,
      status: "skipped",
      scheduleStatus: "disabled",
      skipReason: "schedule-disabled",
      source: "usage",
      sources: ["usage"],
      effectiveTo: null,
      bucketCount: 0,
      backfillRequests: [],
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
    expect(output.executionDecision).toMatchObject({
      kind: "analytics-rollup-scheduler-execution-decision",
      status: "blocked",
      allowed: false,
      blockedReason: "scheduler-runner-not-ready",
      runnerStatus: "skipped",
      scheduleStatus: "disabled",
      backfillRequestCount: 0,
      boundary: {
        trigger: "command",
        requestedMode: "preview",
        allowedMode: "preview",
        backfillServiceInvocationWired: false,
        backfillExecutionWired: false,
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

  it("should print a blocked execution decision for unwired automatic scheduler triggers", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      "--enabled",
      "true",
      "--source",
      "usage",
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
      "--execution-trigger",
      "process-local",
    ]);

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.status).toBe("ready");
    expect(output.executionDecision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "automatic-trigger-not-wired",
      boundary: {
        trigger: "process-local",
        requestedMode: "preview",
        allowedMode: "preview",
        commandTriggeredOnly: true,
        processLocalExecutionWired: false,
        externalSchedulerExecutionWired: false,
      },
      safety: {
        createsScheduledJob: false,
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
      },
    });
  });

  it("should keep automatic dry-run command requests blocked before command dry-run design review", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      "--enabled",
      "true",
      "--source",
      "usage",
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
      "--execution-trigger",
      "process-local",
      "--execution-mode",
      "dry-run",
    ]);

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.status).toBe("ready");
    expect(output.executionDecision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "automatic-trigger-not-wired",
      boundary: {
        trigger: "process-local",
        requestedMode: "dry-run",
        allowedMode: "preview",
        commandTriggeredOnly: true,
        processLocalExecutionWired: false,
        externalSchedulerExecutionWired: false,
        backfillServiceInvocationWired: false,
        backfillExecutionWired: false,
      },
      wiringReview: {
        requestedCapability: "process-local:dry-run",
        recommendedNextStep: "keep-automatic-triggers-unwired",
        dryRunDesignReview: null,
        automaticTriggersRemainUnwired: true,
      },
      safety: {
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

  it("should print a blocked execution decision for unwired backfill service dry-run mode", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      "--enabled",
      "true",
      "--source",
      "usage",
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
      "--execution-mode",
      "dry-run",
    ]);

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.status).toBe("ready");
    expect(output.executionDecision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "backfill-service-invocation-not-wired",
      boundary: {
        trigger: "command",
        requestedMode: "dry-run",
        allowedMode: "preview",
        backfillServiceInvocationWired: false,
        backfillExecutionWired: false,
      },
      safety: {
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

  it("should print a blocked execution decision for unwired backfill execution modes", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      "--enabled",
      "true",
      "--source",
      "usage",
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
      "--execution-mode",
      "execute",
    ]);

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.status).toBe("ready");
    expect(output.executionDecision).toMatchObject({
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
      safety: {
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

  it("should accept equals-style args while keeping scheduler execution preview-only", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      "--enabled=true",
      "--source=usage",
      "--run-at=2026-07-06T13:07:00.000Z",
      "--granularity=hour",
      "--execution-mode=execute",
    ]);

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output).toMatchObject({
      kind: "analytics-rollup-scheduler-runner",
      mode: "preview",
      status: "ready",
      source: "usage",
      sources: ["usage"],
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
    expect(output.executionDecision).toMatchObject({
      kind: "analytics-rollup-scheduler-execution-decision",
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

  it("should expose scheduler execution wiring review without wiring execution", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      "--enabled",
      "true",
      "--source",
      "usage",
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
      "--execution-mode",
      "dry-run",
    ]);

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.executionDecision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "backfill-service-invocation-not-wired",
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

  it("should expose command dry-run invocation design review in command output", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      "--enabled",
      "true",
      "--source",
      "both",
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
      "--execution-mode",
      "dry-run",
    ]);

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.executionDecision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "backfill-service-invocation-not-wired",
      wiringReview: {
        requestedCapability: "command:dry-run",
        dryRunDesignReview: {
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
            plannedBackfillRequestCount: 2,
            plannedSources: ["usage", "rejected"],
            allPlannedRequestsDryRunOnly: true,
            canInvokeBackfillService: false,
            canReadEvents: false,
            canPersistRollups: false,
          },
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
  it("should expose command dry-run service invocation wiring readiness review in command output", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      "--enabled",
      "true",
      "--source",
      "both",
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
      "--execution-mode",
      "dry-run",
      "--event-limit",
      "500",
    ]);

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.executionDecision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "backfill-service-invocation-not-wired",
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

  it("should expose command dry-run service invocation fail-closed error model in command output", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      "--enabled",
      "true",
      "--source",
      "both",
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
      "--execution-mode",
      "dry-run",
      "--event-limit",
      "500",
    ]);

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.executionDecision).toMatchObject({
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
  it("should expose command dry-run service invocation wiring contract in command output", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      "--enabled",
      "true",
      "--source",
      "both",
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
      "--execution-mode",
      "dry-run",
      "--event-limit",
      "500",
    ]);

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.executionDecision).toMatchObject({
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
  it("should expose command dry-run request mapper design in command output", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      "--enabled",
      "true",
      "--source",
      "both",
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
      "--execution-mode",
      "dry-run",
    ]);

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.executionDecision).toMatchObject({
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
  it("should expose command dry-run service adapter boundary design in command output", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      "--enabled",
      "true",
      "--source",
      "both",
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
      "--execution-mode",
      "dry-run",
    ]);

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.executionDecision).toMatchObject({
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

  it("should keep command dry-run adapter previews null when event limit is not provided", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      "--enabled",
      "true",
      "--source",
      "usage",
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
      "--execution-mode",
      "dry-run",
    ]);

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.executionDecision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "backfill-service-invocation-not-wired",
      wiringReview: {
        requestedCapability: "command:dry-run",
        dryRunDesignReview: {
          dryRunServiceAdapterPreviews: null,
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

  it("should expose command dry-run service adapter previews in command output without wiring service calls", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      "--enabled",
      "true",
      "--source",
      "both",
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
      "--lookback-buckets",
      "1",
      "--safety-delay-ms",
      "300000",
      "--max-buckets",
      "1",
      "--execution-mode",
      "dry-run",
      "--event-limit",
      "500",
    ]);

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);
    const adapterPreviews =
      output.executionDecision.wiringReview.dryRunDesignReview
        .dryRunServiceAdapterPreviews;

    expect(output.executionDecision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "backfill-service-invocation-not-wired",
      boundary: {
        trigger: "command",
        requestedMode: "dry-run",
        backfillServiceInvocationWired: false,
        backfillExecutionWired: false,
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
    expect(adapterPreviews).toHaveLength(2);
    expect(adapterPreviews).toEqual([
      expect.objectContaining({
        kind: "analytics-rollup-scheduler-backfill-service-dry-run-adapter-preview",
        status: "blocked-before-service-invocation",
        adapterBoundary:
          "mapped-backfill-run-input-to-rollup-backfill-service-dry-run",
        currentAdapterState: "contract-model-only",
        source: "usage",
        serviceMethod: "runBackfill",
        inputMode: "dry-run",
        outputMode: "dry-run",
        plannedInvocationCardinality: "single-mapped-run-input",
        eventLimit: 500,
        granularity: "hour",
        requestedFrom: "2026-07-06T12:00:00.000Z",
        requestedTo: "2026-07-06T13:00:00.000Z",
        rebuildFrom: "2026-07-06T12:00:00.000Z",
        rebuildTo: "2026-07-06T13:00:00.000Z",
        bucketCount: 1,
        plannedServiceResult: {
          mode: "dry-run",
          source: "usage",
          sources: ["usage"],
          granularity: "hour",
          requestedFrom: "2026-07-06T12:00:00.000Z",
          requestedTo: "2026-07-06T13:00:00.000Z",
          rebuildFrom: "2026-07-06T12:00:00.000Z",
          rebuildTo: "2026-07-06T13:00:00.000Z",
          bucketCount: 1,
          sourceResults: [
            {
              source: "usage",
              status: "planned",
              inputEventCount: 0,
              aggregateCount: 0,
              upsertedCount: 0,
            },
          ],
          totalInputEventCount: 0,
          totalAggregateCount: 0,
          totalUpsertedCount: 0,
        },
        safety: {
          adapterOnly: true,
          adapterCurrentlyAllowed: false,
          invokesBackfillService: false,
          readsEvents: false,
          persistsRollups: false,
          affectsQuotaCounting: false,
          deletesRawEvents: false,
          sourceSeparationPreserved: true,
          eventLimitGuardrailApplied: true,
          maxBucketGuardrailApplied: true,
          failClosedServiceErrorsRequired: true,
          serviceInvocationCurrentlyAllowed: false,
          dockerPostgresRuntimeValidationRequired: true,
        },
      }),
      expect.objectContaining({
        source: "rejected",
        eventLimit: 500,
        plannedServiceResult: expect.objectContaining({
          source: "rejected",
          sources: ["rejected"],
          sourceResults: [
            {
              source: "rejected",
              status: "planned",
              inputEventCount: 0,
              aggregateCount: 0,
              upsertedCount: 0,
            },
          ],
        }),
        safety: expect.objectContaining({
          invokesBackfillService: false,
          readsEvents: false,
          persistsRollups: false,
          affectsQuotaCounting: false,
          deletesRawEvents: false,
          serviceInvocationCurrentlyAllowed: false,
        }),
      }),
    ]);
  });

  it("should reject invalid adapter preview event limit before printing output", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await expect(
      runAnalyticsRollupSchedulerPreviewCommand([
        "--enabled",
        "true",
        "--source",
        "usage",
        "--run-at",
        "2026-07-06T13:07:00.000Z",
        "--granularity",
        "hour",
        "--execution-mode",
        "dry-run",
        "--event-limit",
        "0",
      ]),
    ).rejects.toThrow(RangeError);

    expect(consoleLog).not.toHaveBeenCalled();
  });

  it("should reject invalid args before printing output", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await expect(
      runAnalyticsRollupSchedulerPreviewCommand([
        "--run-at",
        "invalid-date",
        "--granularity",
        "hour",
      ]),
    ).rejects.toThrow(RangeError);

    expect(consoleLog).not.toHaveBeenCalled();
  });

  it("should document scheduler preview safety boundaries in usage text", () => {
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "analytics:rollup:scheduler-preview",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "--execution-trigger <command|process-local|external-scheduler>",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "--execution-mode <preview|dry-run|execute>",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "--event-limit <n>",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "Preview only",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "execution boundary decision",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "Does not create scheduled jobs",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "invoke backfill service",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "execute backfill",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "read events",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "persist rollups",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "affect quota counting",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "delete raw events",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "Command dry-run requests currently remain blocked",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "dryRunDesignReview",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "dryRunInvocationReadiness",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "dryRunInvocationDesignReview",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "dryRunServiceInvocationContractReview",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "dryRunServiceInvocationImplementationDesign",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "dryRunServiceInvocationWiringReadinessReview",
    );    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "dryRunServiceInvocationFailClosedErrorModel",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "dryRunServiceInvocationWiringContract",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "dryRunServiceInvocationRequestMapperDesign",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "dryRunServiceAdapterBoundaryDesign",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "dryRunServiceAdapterPreviews",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "dryRunInvocationContract only",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "review-only",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "max-bucket",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "source separation",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "event limit guardrails",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "explicit implementation design",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "wiring readiness review",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "request mapper design",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "service adapter boundary design",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "fail-closed service errors",
    );    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "source-scoped error output",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "no partial persistence",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "operator safety output",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "Docker/PostgreSQL runtime validation",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "DB-free command dry-run service adapter preview",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "dry-run request/response contract",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "source-scoped result summary",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "event-limit guardrail",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "max-bucket bound",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "no quota mutation",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "no raw event deletion",
    );
  });

  it("should expose only non-executing dry-run backfill request contracts", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      "--enabled",
      "true",
      "--source",
      "usage",
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
    ]);

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.backfillRequests).toHaveLength(1);
    expect(output.backfillRequests[0]).toMatchObject({
      source: "usage",
      mode: "dry-run",
      willInvokeBackfillService: false,
      willReadEvents: false,
      willPersistRollups: false,
    });
    expect(output.executionDecision).toMatchObject({
      status: "preview-ready",
      allowed: true,
      boundary: {
        trigger: "command",
        requestedMode: "preview",
        allowedMode: "preview",
        backfillServiceInvocationWired: false,
        backfillExecutionWired: false,
      },
    });
    expect(output.safety).toEqual({
      previewOnly: true,
      createsScheduledJob: false,
      invokesBackfillService: false,
      executesBackfill: false,
      readsEvents: false,
      persistsRollups: false,
      affectsQuotaCounting: false,
      deletesRawEvents: false,
    });
    expect(output.executionDecision.safety).toEqual({
      previewOnly: true,
      createsScheduledJob: false,
      invokesBackfillService: false,
      executesBackfill: false,
      readsEvents: false,
      persistsRollups: false,
      affectsQuotaCounting: false,
      deletesRawEvents: false,
    });
  });

  it("should expose command dry-run service invocation results when an injected service is explicitly enabled", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    const listUsageEvents = vi.fn(async () => []);
    const listRejectedEvents = vi.fn(async () => []);
    const persistUsageEvents = vi.fn(async () => ({
      inputEventCount: 0,
      aggregateCount: 0,
      upsertedCount: 0,
    }));
    const persistRejectedEvents = vi.fn(async () => ({
      inputEventCount: 0,
      aggregateCount: 0,
      upsertedCount: 0,
    }));

    const backfillService = createAnalyticsRollupBackfillService({
      eventReader: {
        listUsageEvents,
        listRejectedEvents,
      } satisfies AnalyticsRollupBackfillEventReader,
      persistenceService: {
        persistUsageEvents,
        persistRejectedEvents,
      } satisfies AnalyticsRollupPersistenceService,
    });
    const runBackfill = vi.spyOn(backfillService, "runBackfill");

    await runAnalyticsRollupSchedulerPreviewCommand(
      [
        "--enabled",
        "true",
        "--source",
        "both",
        "--run-at",
        "2026-07-06T13:07:00.000Z",
        "--granularity",
        "hour",
        "--lookback-buckets",
        "1",
        "--safety-delay-ms",
        "300000",
        "--max-buckets",
        "1",
        "--execution-mode",
        "dry-run",
        "--event-limit",
        "500",
      ],
      {
        backfillService,
        allowDryRunServiceInvocation: true,
      },
    );

    expect(consoleLog).toHaveBeenCalledOnce();
    expect(runBackfill).toHaveBeenCalledTimes(2);

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.dryRunServiceInvocationResults).toHaveLength(2);
    expect(output.dryRunServiceInvocationResults).toEqual([
      expect.objectContaining({
        kind: "analytics-rollup-scheduler-backfill-service-dry-run-adapter-invocation",
        status: "service-dry-run-invoked",
        currentAdapterState: "runtime-dry-run-invocation",
        source: "usage",
        serviceMethod: "runBackfill",
        inputMode: "dry-run",
        outputMode: "dry-run",
        invocationCardinality: "single-mapped-run-input",
        eventLimit: 500,
        serviceResult: expect.objectContaining({
          mode: "dry-run",
          source: "usage",
          sources: ["usage"],
          sourceResults: [
            {
              source: "usage",
              status: "planned",
              inputEventCount: 0,
              aggregateCount: 0,
              upsertedCount: 0,
            },
          ],
          totalInputEventCount: 0,
          totalAggregateCount: 0,
          totalUpsertedCount: 0,
        }),
        error: null,
        safety: expect.objectContaining({
          invokesBackfillService: true,
          readsEvents: false,
          persistsRollups: false,
          affectsQuotaCounting: false,
          deletesRawEvents: false,
          sourceSeparationPreserved: true,
          eventLimitGuardrailApplied: true,
          maxBucketGuardrailApplied: true,
          failClosedServiceErrorsApplied: true,
          serviceInvocationCurrentlyAllowed: true,
          dockerPostgresRuntimeValidationRequired: true,
        }),
      }),
      expect.objectContaining({
        status: "service-dry-run-invoked",
        source: "rejected",
        serviceResult: expect.objectContaining({
          mode: "dry-run",
          source: "rejected",
          sources: ["rejected"],
          sourceResults: [
            {
              source: "rejected",
              status: "planned",
              inputEventCount: 0,
              aggregateCount: 0,
              upsertedCount: 0,
            },
          ],
          totalInputEventCount: 0,
          totalAggregateCount: 0,
          totalUpsertedCount: 0,
        }),
        error: null,
        safety: expect.objectContaining({
          invokesBackfillService: true,
          readsEvents: false,
          persistsRollups: false,
          affectsQuotaCounting: false,
          deletesRawEvents: false,
        }),
      }),
    ]);
    expect(
      output.executionDecision.wiringReview.dryRunDesignReview
        .dryRunServiceAdapterPreviews,
    ).toHaveLength(2);
    expect(listUsageEvents).not.toHaveBeenCalled();
    expect(listRejectedEvents).not.toHaveBeenCalled();
    expect(persistUsageEvents).not.toHaveBeenCalled();
    expect(persistRejectedEvents).not.toHaveBeenCalled();
  });

  it("should expose failed-closed service error output when injected dry-run backfill service fails", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    const serviceFailure = Object.assign(
      new Error("simulated scheduler dry-run service failure"),
      { name: "SchedulerDryRunServiceError" },
    );
    const backfillService = {
      runBackfill: vi.fn(async () => {
        throw serviceFailure;
      }),
    };

    await runAnalyticsRollupSchedulerPreviewCommand(
      [
        "--enabled",
        "true",
        "--source",
        "usage",
        "--run-at",
        "2026-07-06T13:07:00.000Z",
        "--granularity",
        "hour",
        "--lookback-buckets",
        "1",
        "--safety-delay-ms",
        "300000",
        "--max-buckets",
        "1",
        "--execution-mode",
        "dry-run",
        "--event-limit",
        "500",
      ],
      {
        backfillService,
        allowDryRunServiceInvocation: true,
      },
    );

    expect(consoleLog).toHaveBeenCalledOnce();
    expect(backfillService.runBackfill).toHaveBeenCalledOnce();

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.executionDecision).toMatchObject({
      status: "dry-run-ready",
      allowed: true,
      blockedReason: null,
      boundary: {
        trigger: "command",
        requestedMode: "dry-run",
        allowedMode: "dry-run",
        backfillServiceInvocationWired: true,
        backfillExecutionWired: false,
      },
      safety: {
        previewOnly: false,
        invokesBackfillService: true,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
    expect(output.dryRunServiceInvocationResults).toEqual([
      expect.objectContaining({
        kind: "analytics-rollup-scheduler-backfill-service-dry-run-adapter-invocation",
        status: "failed-closed-service-error",
        currentAdapterState: "runtime-dry-run-invocation",
        source: "usage",
        serviceMethod: "runBackfill",
        inputMode: "dry-run",
        outputMode: "dry-run",
        invocationCardinality: "single-mapped-run-input",
        eventLimit: 500,
        serviceResult: null,
        error: {
          name: "SchedulerDryRunServiceError",
          message: "simulated scheduler dry-run service failure",
        },
        safety: expect.objectContaining({
          invokesBackfillService: true,
          readsEvents: false,
          persistsRollups: false,
          affectsQuotaCounting: false,
          deletesRawEvents: false,
          sourceSeparationPreserved: true,
          eventLimitGuardrailApplied: true,
          maxBucketGuardrailApplied: true,
          failClosedServiceErrorsApplied: true,
          serviceInvocationCurrentlyAllowed: true,
          dockerPostgresRuntimeValidationRequired: true,
        }),
      }),
    ]);
    expect(output.executionDecision.wiringReview.runtimeConsistency).toMatchObject({
      status: "runtime-dry-run-service-invocation-wired",
      requestedCapability: "command:dry-run",
      backfillServiceInvocationWired: true,
      serviceInvocationCurrentlyAllowed: true,
      automaticTriggersRemainUnwired: true,
      executeRemainsUnwired: true,
      createsScheduledJob: false,
      invokesBackfillService: true,
      executesBackfill: false,
      readsEvents: false,
      persistsRollups: false,
      affectsQuotaCounting: false,
      deletesRawEvents: false,
    });
  });

  it("should keep source-separated dry-run service results when one source fails", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    const usageFailure = Object.assign(
      new Error("simulated usage dry-run service failure"),
      { name: "UsageDryRunServiceError" },
    );
    const runBackfill = vi.fn<AnalyticsRollupBackfillService["runBackfill"]>(
      async (runInput) => {
        const { plan } = runInput;

        if (plan.source === "usage") {
          throw usageFailure;
        }

        return {
          mode: "dry-run",
          source: "rejected",
          sources: ["rejected"],
          granularity: plan.windowPlan.granularity,
          requestedFrom: plan.windowPlan.requestedFrom,
          requestedTo: plan.windowPlan.requestedTo,
          rebuildFrom: plan.windowPlan.rebuildFrom,
          rebuildTo: plan.windowPlan.rebuildTo,
          bucketCount: plan.windowPlan.bucketCount,
          sourceResults: [
            {
              source: "rejected",
              status: "planned",
              inputEventCount: 0,
              aggregateCount: 0,
              upsertedCount: 0,
            },
          ],
          totalInputEventCount: 0,
          totalAggregateCount: 0,
          totalUpsertedCount: 0,
        };
      },
    );
    const backfillService: AnalyticsRollupBackfillService = {
      runBackfill,
    };

    await runAnalyticsRollupSchedulerPreviewCommand(
      [
        "--enabled",
        "true",
        "--source",
        "both",
        "--run-at",
        "2026-07-06T13:07:00.000Z",
        "--granularity",
        "hour",
        "--lookback-buckets",
        "1",
        "--safety-delay-ms",
        "300000",
        "--max-buckets",
        "1",
        "--execution-mode",
        "dry-run",
        "--event-limit",
        "500",
      ],
      {
        backfillService,
        allowDryRunServiceInvocation: true,
      },
    );

    expect(consoleLog).toHaveBeenCalledOnce();
    expect(runBackfill).toHaveBeenCalledTimes(2);
    expect(runBackfill.mock.calls.map(([runInput]) => runInput.plan.source)).toEqual([
      "usage",
      "rejected",
    ]);

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.dryRunServiceInvocationResults).toHaveLength(2);
    expect(output.dryRunServiceInvocationResults).toEqual([
      expect.objectContaining({
        status: "failed-closed-service-error",
        source: "usage",
        serviceResult: null,
        error: {
          name: "UsageDryRunServiceError",
          message: "simulated usage dry-run service failure",
        },
        safety: expect.objectContaining({
          invokesBackfillService: true,
          readsEvents: false,
          persistsRollups: false,
          affectsQuotaCounting: false,
          deletesRawEvents: false,
          sourceSeparationPreserved: true,
          failClosedServiceErrorsApplied: true,
        }),
      }),
      expect.objectContaining({
        status: "service-dry-run-invoked",
        source: "rejected",
        serviceResult: expect.objectContaining({
          mode: "dry-run",
          source: "rejected",
          sources: ["rejected"],
          sourceResults: [
            {
              source: "rejected",
              status: "planned",
              inputEventCount: 0,
              aggregateCount: 0,
              upsertedCount: 0,
            },
          ],
          totalInputEventCount: 0,
          totalAggregateCount: 0,
          totalUpsertedCount: 0,
        }),
        error: null,
        safety: expect.objectContaining({
          invokesBackfillService: true,
          readsEvents: false,
          persistsRollups: false,
          affectsQuotaCounting: false,
          deletesRawEvents: false,
          sourceSeparationPreserved: true,
          failClosedServiceErrorsApplied: true,
        }),
      }),
    ]);
    expect(output.executionDecision).toMatchObject({
      status: "dry-run-ready",
      allowed: true,
      blockedReason: null,
      boundary: {
        trigger: "command",
        requestedMode: "dry-run",
        allowedMode: "dry-run",
        backfillServiceInvocationWired: true,
        backfillExecutionWired: false,
      },
      safety: {
        previewOnly: false,
        invokesBackfillService: true,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
    expect(output.executionDecision.wiringReview.runtimeConsistency).toMatchObject({
      status: "runtime-dry-run-service-invocation-wired",
      requestedCapability: "command:dry-run",
      serviceInvocationCurrentlyAllowed: true,
      automaticTriggersRemainUnwired: true,
      executeRemainsUnwired: true,
      createsScheduledJob: false,
      invokesBackfillService: true,
      executesBackfill: false,
      readsEvents: false,
      persistsRollups: false,
      affectsQuotaCounting: false,
      deletesRawEvents: false,
    });
  });

  it("should not invoke an injected dry-run backfill service unless invocation is explicitly enabled", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    const backfillService = {
      runBackfill: vi.fn(),
    };

    await runAnalyticsRollupSchedulerPreviewCommand(
      [
        "--enabled",
        "true",
        "--source",
        "usage",
        "--run-at",
        "2026-07-06T13:07:00.000Z",
        "--granularity",
        "hour",
        "--lookback-buckets",
        "1",
        "--safety-delay-ms",
        "300000",
        "--max-buckets",
        "1",
        "--execution-mode",
        "dry-run",
        "--event-limit",
        "500",
      ],
      {
        backfillService,
      },
    );

    expect(backfillService.runBackfill).not.toHaveBeenCalled();

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.dryRunServiceInvocationResults).toBeUndefined();
    expect(
      output.executionDecision.wiringReview.dryRunDesignReview
        .dryRunServiceAdapterPreviews,
    ).toHaveLength(1);
  });

  it("should resolve runtime dry-run backfill service factory for explicitly enabled command dry-run", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    const listUsageEvents = vi.fn(async () => []);
    const listRejectedEvents = vi.fn(async () => []);
    const persistUsageEvents = vi.fn(async () => ({
      inputEventCount: 0,
      aggregateCount: 0,
      upsertedCount: 0,
    }));
    const persistRejectedEvents = vi.fn(async () => ({
      inputEventCount: 0,
      aggregateCount: 0,
      upsertedCount: 0,
    }));
    const backfillService = createAnalyticsRollupBackfillService({
      eventReader: {
        listUsageEvents,
        listRejectedEvents,
      } satisfies AnalyticsRollupBackfillEventReader,
      persistenceService: {
        persistUsageEvents,
        persistRejectedEvents,
      } satisfies AnalyticsRollupPersistenceService,
    });
    const runBackfill = vi.spyOn(backfillService, "runBackfill");
    const dispose = vi.fn(async () => undefined);
    const createRuntimeBackfillService = vi.fn(async () => ({
      backfillService,
      dispose,
    }));

    await runAnalyticsRollupSchedulerPreviewCommand(
      [
        "--enabled",
        "true",
        "--source",
        "both",
        "--run-at",
        "2026-07-06T13:07:00.000Z",
        "--granularity",
        "hour",
        "--lookback-buckets",
        "1",
        "--safety-delay-ms",
        "300000",
        "--max-buckets",
        "1",
        "--execution-mode",
        "dry-run",
        "--event-limit",
        "500",
      ],
      {
        allowDryRunServiceInvocation: true,
        createRuntimeBackfillService,
      },
    );

    expect(createRuntimeBackfillService).toHaveBeenCalledOnce();
    expect(runBackfill).toHaveBeenCalledTimes(2);
    expect(dispose).toHaveBeenCalledOnce();

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.executionDecision).toMatchObject({
      status: "dry-run-ready",
      allowed: true,
      blockedReason: null,
      boundary: {
        trigger: "command",
        requestedMode: "dry-run",
        allowedMode: "dry-run",
        backfillServiceInvocationWired: true,
        backfillExecutionWired: false,
      },
      safety: {
        previewOnly: false,
        invokesBackfillService: true,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
    expect(output.dryRunServiceInvocationResults).toHaveLength(2);
    expect(output.executionDecision.wiringReview.runtimeConsistency).toMatchObject({
      status: "runtime-dry-run-service-invocation-wired",
      requestedCapability: "command:dry-run",
      backfillServiceInvocationWired: true,
      serviceInvocationCurrentlyAllowed: true,
      automaticTriggersRemainUnwired: true,
      executeRemainsUnwired: true,
      createsScheduledJob: false,
      invokesBackfillService: true,
      executesBackfill: false,
      readsEvents: false,
      persistsRollups: false,
      affectsQuotaCounting: false,
      deletesRawEvents: false,
      historicalReviewArtifactsMayRemainBlocked: true,
    });
    expect(listUsageEvents).not.toHaveBeenCalled();
    expect(listRejectedEvents).not.toHaveBeenCalled();
    expect(persistUsageEvents).not.toHaveBeenCalled();
    expect(persistRejectedEvents).not.toHaveBeenCalled();
  });

  it("should expose runtime cleanup failure without dropping dry-run service invocation output", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    const listUsageEvents = vi.fn(async () => []);
    const listRejectedEvents = vi.fn(async () => []);
    const persistUsageEvents = vi.fn(async () => ({
      inputEventCount: 0,
      aggregateCount: 0,
      upsertedCount: 0,
    }));
    const persistRejectedEvents = vi.fn(async () => ({
      inputEventCount: 0,
      aggregateCount: 0,
      upsertedCount: 0,
    }));
    const backfillService = createAnalyticsRollupBackfillService({
      eventReader: {
        listUsageEvents,
        listRejectedEvents,
      } satisfies AnalyticsRollupBackfillEventReader,
      persistenceService: {
        persistUsageEvents,
        persistRejectedEvents,
      } satisfies AnalyticsRollupPersistenceService,
    });
    const runBackfill = vi.spyOn(backfillService, "runBackfill");
    const cleanupFailure = Object.assign(
      new Error("simulated runtime dispose failure"),
      { name: "RuntimeDisposeError" },
    );
    const dispose = vi.fn(async () => {
      throw cleanupFailure;
    });
    const createRuntimeBackfillService = vi.fn(async () => ({
      backfillService,
      dispose,
    }));

    await runAnalyticsRollupSchedulerPreviewCommand(
      [
        "--enabled",
        "true",
        "--source",
        "usage",
        "--run-at",
        "2026-07-06T13:07:00.000Z",
        "--granularity",
        "hour",
        "--lookback-buckets",
        "1",
        "--safety-delay-ms",
        "300000",
        "--max-buckets",
        "1",
        "--execution-mode",
        "dry-run",
        "--event-limit",
        "500",
      ],
      {
        allowDryRunServiceInvocation: true,
        createRuntimeBackfillService,
      },
    );

    expect(consoleLog).toHaveBeenCalledOnce();
    expect(createRuntimeBackfillService).toHaveBeenCalledOnce();
    expect(runBackfill).toHaveBeenCalledOnce();
    expect(dispose).toHaveBeenCalledOnce();

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.dryRunRuntimeCleanupError).toEqual({
      name: "RuntimeDisposeError",
      message: "simulated runtime dispose failure",
    });
    expect(output.dryRunServiceInvocationResults).toEqual([
      expect.objectContaining({
        status: "service-dry-run-invoked",
        source: "usage",
        serviceResult: expect.objectContaining({
          mode: "dry-run",
          source: "usage",
          sources: ["usage"],
          sourceResults: [
            {
              source: "usage",
              status: "planned",
              inputEventCount: 0,
              aggregateCount: 0,
              upsertedCount: 0,
            },
          ],
          totalInputEventCount: 0,
          totalAggregateCount: 0,
          totalUpsertedCount: 0,
        }),
        error: null,
        safety: expect.objectContaining({
          invokesBackfillService: true,
          readsEvents: false,
          persistsRollups: false,
          affectsQuotaCounting: false,
          deletesRawEvents: false,
          sourceSeparationPreserved: true,
          failClosedServiceErrorsApplied: true,
        }),
      }),
    ]);
    expect(output.executionDecision).toMatchObject({
      status: "dry-run-ready",
      allowed: true,
      blockedReason: null,
      boundary: {
        trigger: "command",
        requestedMode: "dry-run",
        allowedMode: "dry-run",
        backfillServiceInvocationWired: true,
        backfillExecutionWired: false,
      },
      safety: {
        previewOnly: false,
        invokesBackfillService: true,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
    expect(output.executionDecision.wiringReview.runtimeConsistency).toMatchObject({
      status: "runtime-dry-run-service-invocation-wired",
      requestedCapability: "command:dry-run",
      serviceInvocationCurrentlyAllowed: true,
      automaticTriggersRemainUnwired: true,
      executeRemainsUnwired: true,
      createsScheduledJob: false,
      invokesBackfillService: true,
      executesBackfill: false,
      readsEvents: false,
      persistsRollups: false,
      affectsQuotaCounting: false,
      deletesRawEvents: false,
    });
    expect(listUsageEvents).not.toHaveBeenCalled();
    expect(listRejectedEvents).not.toHaveBeenCalled();
    expect(persistUsageEvents).not.toHaveBeenCalled();
    expect(persistRejectedEvents).not.toHaveBeenCalled();
  });

  it("should not resolve runtime dry-run backfill service factory for preview mode", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    const createRuntimeBackfillService = vi.fn();

    await runAnalyticsRollupSchedulerPreviewCommand(
      [
        "--enabled",
        "true",
        "--source",
        "usage",
        "--run-at",
        "2026-07-06T13:07:00.000Z",
        "--granularity",
        "hour",
        "--lookback-buckets",
        "1",
        "--safety-delay-ms",
        "300000",
        "--max-buckets",
        "1",
      ],
      {
        allowDryRunServiceInvocation: true,
        createRuntimeBackfillService,
      },
    );

    expect(createRuntimeBackfillService).not.toHaveBeenCalled();

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.dryRunServiceInvocationResults).toBeUndefined();
    expect(output.executionDecision).toMatchObject({
      status: "preview-ready",
      allowed: true,
      blockedReason: null,
      boundary: {
        requestedMode: "preview",
        allowedMode: "preview",
        backfillServiceInvocationWired: false,
      },
      safety: {
        previewOnly: true,
        invokesBackfillService: false,
      },
    });
  });

  it("should not resolve runtime dry-run backfill service factory for dry-run without event limit", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    const createRuntimeBackfillService = vi.fn();

    await runAnalyticsRollupSchedulerPreviewCommand(
      [
        "--enabled",
        "true",
        "--source",
        "both",
        "--run-at",
        "2026-07-06T13:07:00.000Z",
        "--granularity",
        "hour",
        "--lookback-buckets",
        "1",
        "--safety-delay-ms",
        "300000",
        "--max-buckets",
        "1",
        "--execution-mode",
        "dry-run",
      ],
      {
        allowDryRunServiceInvocation: true,
        createRuntimeBackfillService,
      },
    );

    expect(createRuntimeBackfillService).not.toHaveBeenCalled();

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.dryRunServiceInvocationResults).toBeUndefined();
    expect(output.executionDecision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "backfill-service-invocation-not-wired",
      boundary: {
        trigger: "command",
        requestedMode: "dry-run",
        allowedMode: "preview",
        backfillServiceInvocationWired: false,
        backfillExecutionWired: false,
      },
      wiringReview: {
        runtimeConsistency: {
          status: "blocked-or-review-only",
          requestedCapability: "command:dry-run",
          backfillServiceInvocationWired: false,
          serviceInvocationCurrentlyAllowed: false,
          invokesBackfillService: false,
          readsEvents: false,
          persistsRollups: false,
          affectsQuotaCounting: false,
          deletesRawEvents: false,
        },
      },
    });
  });

  it("should not resolve runtime dry-run backfill service factory for process-local dry-run", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    const createRuntimeBackfillService = vi.fn();

    await runAnalyticsRollupSchedulerPreviewCommand(
      [
        "--enabled",
        "true",
        "--source",
        "both",
        "--run-at",
        "2026-07-06T13:07:00.000Z",
        "--granularity",
        "hour",
        "--lookback-buckets",
        "1",
        "--safety-delay-ms",
        "300000",
        "--max-buckets",
        "1",
        "--execution-trigger",
        "process-local",
        "--execution-mode",
        "dry-run",
        "--event-limit",
        "500",
      ],
      {
        allowDryRunServiceInvocation: true,
        createRuntimeBackfillService,
      },
    );

    expect(createRuntimeBackfillService).not.toHaveBeenCalled();

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.dryRunServiceInvocationResults).toBeUndefined();
    expect(output.executionDecision).toMatchObject({
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
        runtimeConsistency: {
          status: "blocked-or-review-only",
          requestedCapability: "process-local:dry-run",
          backfillServiceInvocationWired: false,
          serviceInvocationCurrentlyAllowed: false,
          automaticTriggersRemainUnwired: true,
          invokesBackfillService: false,
          readsEvents: false,
          persistsRollups: false,
          affectsQuotaCounting: false,
          deletesRawEvents: false,
        },
      },
    });
  });

  it("should not resolve runtime dry-run backfill service factory for external-scheduler dry-run", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    const createRuntimeBackfillService = vi.fn();

    await runAnalyticsRollupSchedulerPreviewCommand(
      [
        "--enabled",
        "true",
        "--source",
        "both",
        "--run-at",
        "2026-07-06T13:07:00.000Z",
        "--granularity",
        "hour",
        "--lookback-buckets",
        "1",
        "--safety-delay-ms",
        "300000",
        "--max-buckets",
        "1",
        "--execution-trigger",
        "external-scheduler",
        "--execution-mode",
        "dry-run",
        "--event-limit",
        "500",
      ],
      {
        allowDryRunServiceInvocation: true,
        createRuntimeBackfillService,
      },
    );

    expect(createRuntimeBackfillService).not.toHaveBeenCalled();

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.dryRunServiceInvocationResults).toBeUndefined();
    expect(output.executionDecision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "automatic-trigger-not-wired",
      boundary: {
        trigger: "external-scheduler",
        requestedMode: "dry-run",
        allowedMode: "preview",
        processLocalExecutionWired: false,
        externalSchedulerExecutionWired: false,
        backfillServiceInvocationWired: false,
        backfillExecutionWired: false,
      },
      wiringReview: {
        runtimeConsistency: {
          status: "blocked-or-review-only",
          requestedCapability: "external-scheduler:dry-run",
          backfillServiceInvocationWired: false,
          serviceInvocationCurrentlyAllowed: false,
          automaticTriggersRemainUnwired: true,
          createsScheduledJob: false,
          invokesBackfillService: false,
          readsEvents: false,
          persistsRollups: false,
          affectsQuotaCounting: false,
          deletesRawEvents: false,
        },
      },
      safety: {
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

  it("should not resolve runtime dry-run backfill service factory for execute mode", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    const createRuntimeBackfillService = vi.fn();

    await runAnalyticsRollupSchedulerPreviewCommand(
      [
        "--enabled",
        "true",
        "--source",
        "both",
        "--run-at",
        "2026-07-06T13:07:00.000Z",
        "--granularity",
        "hour",
        "--lookback-buckets",
        "1",
        "--safety-delay-ms",
        "300000",
        "--max-buckets",
        "1",
        "--execution-mode",
        "execute",
        "--event-limit",
        "500",
      ],
      {
        allowDryRunServiceInvocation: true,
        createRuntimeBackfillService,
      },
    );

    expect(createRuntimeBackfillService).not.toHaveBeenCalled();

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.dryRunServiceInvocationResults).toBeUndefined();
    expect(output.executionDecision).toMatchObject({
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
    });
  });
});
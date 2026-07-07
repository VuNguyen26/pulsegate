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
});
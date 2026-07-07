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
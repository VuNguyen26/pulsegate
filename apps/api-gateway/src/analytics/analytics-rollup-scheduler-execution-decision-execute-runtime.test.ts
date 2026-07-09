
import { describe, expect, it } from "vitest";

import { createAnalyticsRollupSchedulePlan } from "./analytics-rollup-schedule-plan.js";
import { createAnalyticsRollupSchedulerExecutionDecision } from "./analytics-rollup-scheduler-execution-decision.js";
import { createAnalyticsRollupSchedulerRunnerPlan } from "./analytics-rollup-scheduler-runner.js";

function createReadyRunnerPlan() {
  const schedulePlan = createAnalyticsRollupSchedulePlan({
    enabled: true,
    runAt: new Date("2026-07-06T13:07:00.000Z"),
    granularity: "hour",
    source: "both",
    lookbackBuckets: 1,
    safetyDelayMs: 300000,
    maxBuckets: 1,
  });

  return createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);
}

describe("analytics rollup scheduler execution decision execute runtime model", () => {
  it("should allow command execute only when backfill execution is explicitly wired with guardrails", () => {
    const runnerPlan = createReadyRunnerPlan();

    const decision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      {
        trigger: "command",
        mode: "execute",
        commandExecuteOperatorConfirmed: true,
        commandExecuteEventLimit: 500,
        backfillExecutionWired: true,
      },
    );

    expect(decision).toMatchObject({
      status: "execute-ready",
      allowed: true,
      blockedReason: null,
      boundary: {
        requestedMode: "execute",
        allowedMode: "execute",
        commandTriggeredOnly: true,
        processLocalExecutionWired: false,
        externalSchedulerExecutionWired: false,
        backfillServiceInvocationWired: false,
        backfillExecutionWired: true,
      },
      safety: {
        previewOnly: false,
        createsScheduledJob: false,
        invokesBackfillService: true,
        executesBackfill: true,
        readsEvents: true,
        persistsRollups: true,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
      wiringReview: {
        runtimeConsistency: {
          status: "runtime-execute-backfill-wired",
          requestedCapability: "command:execute",
          backfillServiceInvocationWired: false,
          serviceInvocationCurrentlyAllowed: false,
          automaticTriggersRemainUnwired: true,
          executeRemainsUnwired: false,
          createsScheduledJob: false,
          invokesBackfillService: true,
          executesBackfill: true,
          readsEvents: true,
          persistsRollups: true,
          affectsQuotaCounting: false,
          deletesRawEvents: false,
          historicalReviewArtifactsMayRemainBlocked: true,
        },
        commandExecuteRuntimeGateReview: {
          status: "runtime-gate-open",
          currentGateState: "runtime-execute-wired",
          blockedReason: null,
          gateChecks: {
            dockerPostgresRuntimeValidation: {
              required: true,
              satisfied: true,
              currentState: "satisfied",
            },
          },
          gateDecision: {
            runtimeInvocationAllowed: true,
            willInvokeBackfillService: true,
            willExecuteBackfill: true,
            willReadEvents: true,
            willPersistRollups: true,
            willMutateQuotaCounting: false,
            willDeleteRawEvents: false,
            blockedUntil: null,
          },
        },
        executeRemainsUnwired: false,
        automaticTriggersRemainUnwired: true,
      },
    });
  });

  it("should keep command execute blocked when operator confirmation is missing even if execution wiring is requested", () => {
    const runnerPlan = createReadyRunnerPlan();

    const decision = createAnalyticsRollupSchedulerExecutionDecision(
      runnerPlan,
      {
        trigger: "command",
        mode: "execute",
        commandExecuteEventLimit: 500,
        backfillExecutionWired: true,
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
      safety: {
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
      wiringReview: {
        runtimeConsistency: {
          status: "blocked-or-review-only",
          executeRemainsUnwired: true,
          invokesBackfillService: false,
          executesBackfill: false,
          readsEvents: false,
          persistsRollups: false,
        },
        commandExecuteRuntimeGateReview: {
          status: "runtime-gate-closed",
          currentGateState: "contract-model-only",
          blockedReason: "backfill-execution-not-wired",
          gateDecision: {
            runtimeInvocationAllowed: false,
            willInvokeBackfillService: false,
            willExecuteBackfill: false,
            willReadEvents: false,
            willPersistRollups: false,
          },
        },
        executeRemainsUnwired: true,
      },
    });
  });
});

import { describe, expect, it } from "vitest";

import { createAnalyticsRollupSchedulePlan } from "./analytics-rollup-schedule-plan.js";
import {
  mapAnalyticsRollupSchedulerBackfillRequestToExecuteServiceInput,
  mapAnalyticsRollupSchedulerRunnerPlanToExecuteServiceInputs,
  type AnalyticsRollupSchedulerExecuteBackfillRequest,
} from "./analytics-rollup-scheduler-backfill-request-mapper.js";
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

describe("analytics rollup scheduler execute backfill request mapper", () => {
  it("should map source-scoped runner requests to execute service inputs without invoking runtime", () => {
    const runnerPlan = createReadyRunnerPlan();

    const mappings = mapAnalyticsRollupSchedulerRunnerPlanToExecuteServiceInputs(
      runnerPlan,
      {
        eventLimit: 500,
        commandExecuteOperatorConfirmed: true,
      },
    );

    expect(mappings).toHaveLength(2);
    expect(mappings.map((mapping) => mapping.source)).toEqual([
      "usage",
      "rejected",
    ]);

    for (const mapping of mappings) {
      expect(mapping.runInput).toMatchObject({
        eventLimit: 500,
        plan: {
          mode: "execute",
          source: mapping.source,
          sources: [mapping.source],
          windowPlan: {
            granularity: "hour",
            bucketCount: 1,
          },
        },
      });
      expect(mapping.safety).toEqual({
        mapperOnly: true,
        invokesBackfillService: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
        sourceSeparationPreserved: true,
        eventLimitGuardrailApplied: true,
        maxBucketGuardrailApplied: true,
        serviceInvocationCurrentlyAllowed: false,
        executeRuntimeCurrentlyAllowed: false,
        explicitOperatorConfirmationRequired: true,
        dockerPostgresRuntimeValidationRequired: true,
      });
    }
  });

  it("should reject execute mapping without explicit operator confirmation", () => {
    const runnerPlan = createReadyRunnerPlan();

    expect(() =>
      mapAnalyticsRollupSchedulerRunnerPlanToExecuteServiceInputs(runnerPlan, {
        eventLimit: 500,
        commandExecuteOperatorConfirmed: false,
      }),
    ).toThrow(RangeError);
  });

  it("should reject execute mapping without a positive event limit", () => {
    const runnerPlan = createReadyRunnerPlan();

    expect(() =>
      mapAnalyticsRollupSchedulerRunnerPlanToExecuteServiceInputs(runnerPlan, {
        eventLimit: 0,
        commandExecuteOperatorConfirmed: true,
      }),
    ).toThrow(RangeError);
  });

  it("should reject skipped runner plans before mapping execute service inputs", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: false,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "usage",
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    expect(() =>
      mapAnalyticsRollupSchedulerRunnerPlanToExecuteServiceInputs(runnerPlan, {
        eventLimit: 500,
        commandExecuteOperatorConfirmed: true,
      }),
    ).toThrow(RangeError);
  });

  it("should reject unsafe execute request contracts before runtime wiring", () => {
    const runnerPlan = createReadyRunnerPlan();
    const [request] = runnerPlan.backfillRequests;

    expect(request).toBeDefined();

    const unsafeRequest = {
      ...request,
      mode: "execute",
      willInvokeBackfillService: true,
    } as unknown as AnalyticsRollupSchedulerExecuteBackfillRequest;

    expect(() =>
      mapAnalyticsRollupSchedulerBackfillRequestToExecuteServiceInput(
        unsafeRequest,
        {
          eventLimit: 500,
          commandExecuteOperatorConfirmed: true,
        },
      ),
    ).toThrow(RangeError);
  });
});

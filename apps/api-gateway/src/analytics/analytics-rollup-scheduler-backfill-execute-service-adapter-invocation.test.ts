
import { describe, expect, it, vi } from "vitest";

import type {
  AnalyticsRollupBackfillRunInput,
  AnalyticsRollupBackfillRunSummary,
  AnalyticsRollupBackfillService,
} from "./analytics-rollup-backfill-service.js";
import {
  invokeAnalyticsRollupSchedulerBackfillServiceExecuteAdapter,
  invokeAnalyticsRollupSchedulerBackfillServiceExecuteAdapters,
} from "./analytics-rollup-scheduler-backfill-service-adapter.js";
import {
  mapAnalyticsRollupSchedulerRunnerPlanToExecuteServiceInputs,
  type AnalyticsRollupSchedulerBackfillServiceExecuteMapping,
} from "./analytics-rollup-scheduler-backfill-request-mapper.js";
import { createAnalyticsRollupSchedulePlan } from "./analytics-rollup-schedule-plan.js";
import { createAnalyticsRollupSchedulerRunnerPlan } from "./analytics-rollup-scheduler-runner.js";

function createReadyExecuteMappings(
  source: "usage" | "rejected" | "both" = "both",
): AnalyticsRollupSchedulerBackfillServiceExecuteMapping[] {
  const schedulePlan = createAnalyticsRollupSchedulePlan({
    enabled: true,
    runAt: new Date("2026-07-06T13:07:00.000Z"),
    granularity: "hour",
    source,
    lookbackBuckets: 1,
    safetyDelayMs: 300000,
    maxBuckets: 1,
  });
  const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

  return mapAnalyticsRollupSchedulerRunnerPlanToExecuteServiceInputs(
    runnerPlan,
    {
      eventLimit: 500,
      commandExecuteOperatorConfirmed: true,
    },
  );
}

function createExecuteServiceSummary(
  runInput: AnalyticsRollupBackfillRunInput,
): AnalyticsRollupBackfillRunSummary {
  const { plan } = runInput;
  const sourceResults = plan.sources.map((source) => ({
    source,
    status: "executed" as const,
    inputEventCount: 1,
    aggregateCount: 1,
    upsertedCount: 1,
  }));

  return {
    mode: "execute",
    source: plan.source,
    sources: plan.sources,
    granularity: plan.windowPlan.granularity,
    requestedFrom: plan.windowPlan.requestedFrom,
    requestedTo: plan.windowPlan.requestedTo,
    rebuildFrom: plan.windowPlan.rebuildFrom,
    rebuildTo: plan.windowPlan.rebuildTo,
    bucketCount: plan.windowPlan.bucketCount,
    sourceResults,
    totalInputEventCount: sourceResults.length,
    totalAggregateCount: sourceResults.length,
    totalUpsertedCount: sourceResults.length,
  };
}

describe("analytics rollup scheduler backfill execute service adapter invocation", () => {
  it("should invoke the injected backfill service for mapped execute inputs", async () => {
    const mappings = createReadyExecuteMappings("both");
    const runBackfill = vi.fn<AnalyticsRollupBackfillService["runBackfill"]>(
      async (runInput) => createExecuteServiceSummary(runInput),
    );
    const backfillService: AnalyticsRollupBackfillService = { runBackfill };

    const results =
      await invokeAnalyticsRollupSchedulerBackfillServiceExecuteAdapters(
        mappings,
        backfillService,
      );

    expect(runBackfill).toHaveBeenCalledTimes(2);
    expect(runBackfill).toHaveBeenNthCalledWith(1, mappings[0]?.runInput);
    expect(runBackfill).toHaveBeenNthCalledWith(2, mappings[1]?.runInput);

    expect(results).toHaveLength(2);
    expect(results).toEqual([
      expect.objectContaining({
        kind: "analytics-rollup-scheduler-backfill-service-execute-adapter-invocation",
        status: "service-execute-invoked",
        adapterBoundary:
          "mapped-backfill-run-input-to-rollup-backfill-service-execute",
        currentAdapterState: "runtime-execute-invocation",
        source: "usage",
        serviceMethod: "runBackfill",
        inputMode: "execute",
        outputMode: "execute",
        invocationCardinality: "single-mapped-run-input",
        eventLimit: 500,
        serviceResult: expect.objectContaining({
          mode: "execute",
          source: "usage",
          sources: ["usage"],
          totalInputEventCount: 1,
          totalAggregateCount: 1,
          totalUpsertedCount: 1,
        }),
        error: null,
        safety: expect.objectContaining({
          adapterOnly: false,
          adapterCurrentlyAllowed: true,
          invokesBackfillService: true,
          executesBackfill: true,
          readsEvents: true,
          persistsRollups: true,
          persistenceScope: "rollup-tables-only",
          affectsQuotaCounting: false,
          deletesRawEvents: false,
          sourceSeparationPreserved: true,
          eventLimitGuardrailApplied: true,
          maxBucketGuardrailApplied: true,
          explicitOperatorConfirmationApplied: true,
          failClosedServiceErrorsApplied: true,
          serviceInvocationCurrentlyAllowed: true,
          executeRuntimeCurrentlyAllowed: true,
          dockerPostgresRuntimeValidationRequired: true,
        }),
      }),
      expect.objectContaining({
        status: "service-execute-invoked",
        source: "rejected",
        serviceResult: expect.objectContaining({
          mode: "execute",
          source: "rejected",
          sources: ["rejected"],
        }),
        error: null,
      }),
    ]);
  });

  it("should fail closed when the injected execute backfill service throws", async () => {
    const [mapping] = createReadyExecuteMappings("usage");
    const serviceFailure = Object.assign(
      new Error("simulated scheduler execute service failure"),
      { name: "SchedulerExecuteServiceError" },
    );
    const runBackfill = vi.fn<AnalyticsRollupBackfillService["runBackfill"]>(
      async () => {
        throw serviceFailure;
      },
    );
    const backfillService: AnalyticsRollupBackfillService = { runBackfill };

    const result =
      await invokeAnalyticsRollupSchedulerBackfillServiceExecuteAdapter(
        mapping!,
        backfillService,
      );

    expect(runBackfill).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      status: "failed-closed-service-error",
      source: "usage",
      serviceResult: null,
      error: {
        name: "SchedulerExecuteServiceError",
        message: "simulated scheduler execute service failure",
      },
      safety: {
        affectsQuotaCounting: false,
        deletesRawEvents: false,
        failClosedServiceErrorsApplied: true,
      },
    });
  });

  it("should fail closed when execute service returns a non-execute result", async () => {
    const [mapping] = createReadyExecuteMappings("usage");
    const runBackfill = vi.fn<AnalyticsRollupBackfillService["runBackfill"]>(
      async (runInput) => ({
        ...createExecuteServiceSummary(runInput),
        mode: "dry-run",
      }),
    );
    const backfillService: AnalyticsRollupBackfillService = { runBackfill };

    const result =
      await invokeAnalyticsRollupSchedulerBackfillServiceExecuteAdapter(
        mapping!,
        backfillService,
      );

    expect(result).toMatchObject({
      status: "failed-closed-service-error",
      source: "usage",
      serviceResult: null,
      error: {
        name: "RangeError",
        message:
          "scheduler execute service adapter expected execute service result",
      },
    });
  });

  it("should reject duplicate execute sources before service invocation", async () => {
    const [mapping] = createReadyExecuteMappings("usage");
    const runBackfill = vi.fn<AnalyticsRollupBackfillService["runBackfill"]>(
      async (runInput) => createExecuteServiceSummary(runInput),
    );
    const backfillService: AnalyticsRollupBackfillService = { runBackfill };

    await expect(
      invokeAnalyticsRollupSchedulerBackfillServiceExecuteAdapters(
        [mapping!, mapping!],
        backfillService,
      ),
    ).rejects.toThrow(RangeError);

    expect(runBackfill).not.toHaveBeenCalled();
  });
});

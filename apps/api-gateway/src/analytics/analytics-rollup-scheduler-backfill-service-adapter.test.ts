import { describe, expect, it, vi } from "vitest";

import { createAnalyticsRollupBackfillPlan } from "./analytics-rollup-backfill-plan.js";
import type { AnalyticsRollupBackfillEventReader } from "./analytics-rollup-backfill-event-reader.js";
import { createAnalyticsRollupBackfillService } from "./analytics-rollup-backfill-service.js";
import type { AnalyticsRollupPersistenceService } from "./analytics-rollup-persistence-service.js";
import {
  createAnalyticsRollupSchedulerBackfillServiceDryRunAdapterPreview,
  createAnalyticsRollupSchedulerBackfillServiceDryRunAdapterPreviews,
  invokeAnalyticsRollupSchedulerBackfillServiceDryRunAdapters,
} from "./analytics-rollup-scheduler-backfill-service-adapter.js";
import {
  mapAnalyticsRollupSchedulerBackfillRequestToDryRunServiceInput,
  mapAnalyticsRollupSchedulerRunnerPlanToDryRunServiceInputs,
  type AnalyticsRollupSchedulerBackfillServiceDryRunMapping,
} from "./analytics-rollup-scheduler-backfill-request-mapper.js";
import { createAnalyticsRollupSchedulePlan } from "./analytics-rollup-schedule-plan.js";
import { createAnalyticsRollupSchedulerRunnerPlan } from "./analytics-rollup-scheduler-runner.js";

describe("analytics rollup scheduler backfill service adapter", () => {
  it("should create source-separated dry-run adapter previews from mapped service inputs without invoking service work", () => {
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
    const mappings = mapAnalyticsRollupSchedulerRunnerPlanToDryRunServiceInputs(
      runnerPlan,
      { eventLimit: 500 },
    );

    const previews =
      createAnalyticsRollupSchedulerBackfillServiceDryRunAdapterPreviews(
        mappings,
      );

    expect(previews).toHaveLength(2);
    expect(previews).toEqual([
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
        requestedFrom: new Date("2026-07-06T12:00:00.000Z"),
        requestedTo: new Date("2026-07-06T13:00:00.000Z"),
        rebuildFrom: new Date("2026-07-06T12:00:00.000Z"),
        rebuildTo: new Date("2026-07-06T13:00:00.000Z"),
        bucketCount: 1,
        plannedServiceResult: {
          mode: "dry-run",
          source: "usage",
          sources: ["usage"],
          granularity: "hour",
          requestedFrom: new Date("2026-07-06T12:00:00.000Z"),
          requestedTo: new Date("2026-07-06T13:00:00.000Z"),
          rebuildFrom: new Date("2026-07-06T12:00:00.000Z"),
          rebuildTo: new Date("2026-07-06T13:00:00.000Z"),
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
        }),
      }),
    ]);
  });

  it("should fail closed when a mapped input is not dry-run", () => {
    const requestMapping = mapAnalyticsRollupSchedulerBackfillRequestToDryRunServiceInput(
      {
        source: "usage",
        mode: "dry-run",
        from: new Date("2026-07-06T12:00:00.000Z"),
        to: new Date("2026-07-06T13:00:00.000Z"),
        granularity: "hour",
        bucketCount: 1,
        willInvokeBackfillService: false,
        willReadEvents: false,
        willPersistRollups: false,
      },
      { eventLimit: 500 },
    );

    const unsafeMapping: AnalyticsRollupSchedulerBackfillServiceDryRunMapping = {
      ...requestMapping,
      runInput: {
        ...requestMapping.runInput,
        plan: createAnalyticsRollupBackfillPlan({
          from: "2026-07-06T12:00:00.000Z",
          to: "2026-07-06T13:00:00.000Z",
          granularity: "hour",
          source: "usage",
          mode: "execute",
          maxBuckets: 1,
        }),
      },
    };

    expect(() =>
      createAnalyticsRollupSchedulerBackfillServiceDryRunAdapterPreview(
        unsafeMapping,
      ),
    ).toThrow("only accepts dry-run service inputs");
  });

  it("should require an explicit positive event limit before future service invocation", () => {
    const mapping = mapAnalyticsRollupSchedulerBackfillRequestToDryRunServiceInput(
      {
        source: "usage",
        mode: "dry-run",
        from: new Date("2026-07-06T12:00:00.000Z"),
        to: new Date("2026-07-06T13:00:00.000Z"),
        granularity: "hour",
        bucketCount: 1,
        willInvokeBackfillService: false,
        willReadEvents: false,
        willPersistRollups: false,
      },
      { eventLimit: 500 },
    );

    expect(() =>
      createAnalyticsRollupSchedulerBackfillServiceDryRunAdapterPreview({
        ...mapping,
        runInput: {
          ...mapping.runInput,
          eventLimit: undefined,
        },
      }),
    ).toThrow("eventLimit must be a positive integer");
  });

  it("should reject mapped inputs that do not preserve the non-invoking safety contract", () => {
    const mapping = mapAnalyticsRollupSchedulerBackfillRequestToDryRunServiceInput(
      {
        source: "usage",
        mode: "dry-run",
        from: new Date("2026-07-06T12:00:00.000Z"),
        to: new Date("2026-07-06T13:00:00.000Z"),
        granularity: "hour",
        bucketCount: 1,
        willInvokeBackfillService: false,
        willReadEvents: false,
        willPersistRollups: false,
      },
      { eventLimit: 500 },
    );

    const unsafeMapping = {
      ...mapping,
      safety: {
        ...mapping.safety,
        invokesBackfillService: true,
      },
    } as unknown as AnalyticsRollupSchedulerBackfillServiceDryRunMapping;

    expect(() =>
      createAnalyticsRollupSchedulerBackfillServiceDryRunAdapterPreview(
        unsafeMapping,
      ),
    ).toThrow("requires a non-invoking mapped input contract");
  });

  it("should reject duplicate mapped sources before adapter preview creation", () => {
    const mapping = mapAnalyticsRollupSchedulerBackfillRequestToDryRunServiceInput(
      {
        source: "usage",
        mode: "dry-run",
        from: new Date("2026-07-06T12:00:00.000Z"),
        to: new Date("2026-07-06T13:00:00.000Z"),
        granularity: "hour",
        bucketCount: 1,
        willInvokeBackfillService: false,
        willReadEvents: false,
        willPersistRollups: false,
      },
      { eventLimit: 500 },
    );

    expect(() =>
      createAnalyticsRollupSchedulerBackfillServiceDryRunAdapterPreviews([
        mapping,
        mapping,
      ]),
    ).toThrow("requires unique mapped sources");
  });
  it("should allow mapped scheduler dry-run inputs to invoke the backfill service without event reads or persistence", async () => {
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
    const mappings = mapAnalyticsRollupSchedulerRunnerPlanToDryRunServiceInputs(
      runnerPlan,
      { eventLimit: 500 },
    );

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

    const summaries = [];

    for (const mapping of mappings) {
      summaries.push(await backfillService.runBackfill(mapping.runInput));
    }

    expect(summaries).toEqual([
      {
        mode: "dry-run",
        source: "usage",
        sources: ["usage"],
        granularity: "hour",
        requestedFrom: new Date("2026-07-06T12:00:00.000Z"),
        requestedTo: new Date("2026-07-06T13:00:00.000Z"),
        rebuildFrom: new Date("2026-07-06T12:00:00.000Z"),
        rebuildTo: new Date("2026-07-06T13:00:00.000Z"),
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
      {
        mode: "dry-run",
        source: "rejected",
        sources: ["rejected"],
        granularity: "hour",
        requestedFrom: new Date("2026-07-06T12:00:00.000Z"),
        requestedTo: new Date("2026-07-06T13:00:00.000Z"),
        rebuildFrom: new Date("2026-07-06T12:00:00.000Z"),
        rebuildTo: new Date("2026-07-06T13:00:00.000Z"),
        bucketCount: 1,
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
      },
    ]);

    expect(listUsageEvents).not.toHaveBeenCalled();
    expect(listRejectedEvents).not.toHaveBeenCalled();
    expect(persistUsageEvents).not.toHaveBeenCalled();
    expect(persistRejectedEvents).not.toHaveBeenCalled();
  });

  it("should invoke the injected backfill service for mapped scheduler dry-run inputs without event reads or persistence", async () => {
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
    const mappings = mapAnalyticsRollupSchedulerRunnerPlanToDryRunServiceInputs(
      runnerPlan,
      { eventLimit: 500 },
    );

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

    const results =
      await invokeAnalyticsRollupSchedulerBackfillServiceDryRunAdapters(
        mappings,
        backfillService,
      );

    expect(runBackfill).toHaveBeenCalledTimes(2);
    expect(runBackfill).toHaveBeenNthCalledWith(1, mappings[0]?.runInput);
    expect(runBackfill).toHaveBeenNthCalledWith(2, mappings[1]?.runInput);
    expect(results).toEqual([
      expect.objectContaining({
        kind: "analytics-rollup-scheduler-backfill-service-dry-run-adapter-invocation",
        status: "service-dry-run-invoked",
        adapterBoundary:
          "mapped-backfill-run-input-to-rollup-backfill-service-dry-run",
        currentAdapterState: "runtime-dry-run-invocation",
        source: "usage",
        serviceMethod: "runBackfill",
        inputMode: "dry-run",
        outputMode: "dry-run",
        invocationCardinality: "single-mapped-run-input",
        eventLimit: 500,
        granularity: "hour",
        requestedFrom: new Date("2026-07-06T12:00:00.000Z"),
        requestedTo: new Date("2026-07-06T13:00:00.000Z"),
        rebuildFrom: new Date("2026-07-06T12:00:00.000Z"),
        rebuildTo: new Date("2026-07-06T13:00:00.000Z"),
        bucketCount: 1,
        serviceResult: expect.objectContaining({
          mode: "dry-run",
          source: "usage",
          sources: ["usage"],
          totalInputEventCount: 0,
          totalAggregateCount: 0,
          totalUpsertedCount: 0,
        }),
        error: null,
        safety: {
          adapterOnly: false,
          adapterCurrentlyAllowed: true,
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
        },
      }),
      expect.objectContaining({
        status: "service-dry-run-invoked",
        source: "rejected",
        serviceResult: expect.objectContaining({
          mode: "dry-run",
          source: "rejected",
          sources: ["rejected"],
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

    expect(listUsageEvents).not.toHaveBeenCalled();
    expect(listRejectedEvents).not.toHaveBeenCalled();
    expect(persistUsageEvents).not.toHaveBeenCalled();
    expect(persistRejectedEvents).not.toHaveBeenCalled();
  });

  it("should fail closed when the injected dry-run backfill service throws", async () => {
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
    const mappings = mapAnalyticsRollupSchedulerRunnerPlanToDryRunServiceInputs(
      runnerPlan,
      { eventLimit: 500 },
    );
    const backfillService = {
      runBackfill: vi.fn(async () => {
        throw new Error("simulated dry-run service failure");
      }),
    };

    const results =
      await invokeAnalyticsRollupSchedulerBackfillServiceDryRunAdapters(
        mappings,
        backfillService,
      );

    expect(backfillService.runBackfill).toHaveBeenCalledTimes(1);
    expect(results).toEqual([
      expect.objectContaining({
        status: "failed-closed-service-error",
        source: "usage",
        serviceResult: null,
        error: {
          name: "Error",
          message: "simulated dry-run service failure",
        },
        safety: expect.objectContaining({
          invokesBackfillService: true,
          readsEvents: false,
          persistsRollups: false,
          affectsQuotaCounting: false,
          deletesRawEvents: false,
          failClosedServiceErrorsApplied: true,
        }),
      }),
    ]);
  });
});

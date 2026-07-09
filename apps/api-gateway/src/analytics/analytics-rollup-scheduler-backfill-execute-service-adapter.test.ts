import { describe, expect, it } from "vitest";

import { createAnalyticsRollupSchedulePlan } from "./analytics-rollup-schedule-plan.js";
import {
  createAnalyticsRollupSchedulerBackfillServiceExecuteAdapterPreview,
  createAnalyticsRollupSchedulerBackfillServiceExecuteAdapterPreviews,
} from "./analytics-rollup-scheduler-backfill-service-adapter.js";
import {
  mapAnalyticsRollupSchedulerRunnerPlanToExecuteServiceInputs,
  type AnalyticsRollupSchedulerBackfillServiceExecuteMapping,
} from "./analytics-rollup-scheduler-backfill-request-mapper.js";
import { createAnalyticsRollupSchedulerRunnerPlan } from "./analytics-rollup-scheduler-runner.js";

function createExecuteMappings() {
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

  return mapAnalyticsRollupSchedulerRunnerPlanToExecuteServiceInputs(
    runnerPlan,
    {
      eventLimit: 500,
      commandExecuteOperatorConfirmed: true,
    },
  );
}

describe("analytics rollup scheduler execute backfill service adapter preview", () => {
  it("should create source-scoped execute adapter previews without invoking runtime", () => {
    const mappings = createExecuteMappings();

    const previews =
      createAnalyticsRollupSchedulerBackfillServiceExecuteAdapterPreviews(
        mappings,
      );

    expect(previews).toHaveLength(2);
    expect(previews.map((preview) => preview.source)).toEqual([
      "usage",
      "rejected",
    ]);

    for (const preview of previews) {
      expect(preview).toMatchObject({
        kind: "analytics-rollup-scheduler-backfill-service-execute-adapter-preview",
        status: "blocked-before-service-invocation",
        adapterBoundary:
          "mapped-backfill-run-input-to-rollup-backfill-service-execute",
        currentAdapterState: "contract-model-only",
        serviceMethod: "runBackfill",
        inputMode: "execute",
        outputMode: "execute",
        plannedInvocationCardinality: "single-mapped-run-input",
        eventLimit: 500,
        granularity: "hour",
        bucketCount: 1,
        plannedRunInput: {
          eventLimit: 500,
          plan: {
            mode: "execute",
            source: preview.source,
            sources: [preview.source],
            windowPlan: {
              granularity: "hour",
              bucketCount: 1,
            },
          },
        },
        safety: {
          adapterOnly: true,
          adapterCurrentlyAllowed: false,
          invokesBackfillService: false,
          executesBackfill: false,
          readsEvents: false,
          persistsRollups: false,
          affectsQuotaCounting: false,
          deletesRawEvents: false,
          sourceSeparationPreserved: true,
          eventLimitGuardrailApplied: true,
          maxBucketGuardrailApplied: true,
          explicitOperatorConfirmationRequired: true,
          serviceInvocationCurrentlyAllowed: false,
          executeRuntimeCurrentlyAllowed: false,
          dockerPostgresRuntimeValidationRequired: true,
        },
      });
    }
  });

  it("should reject non-execute mapped inputs", () => {
    const [mapping] = createExecuteMappings();

    expect(mapping).toBeDefined();

    const unsafeMapping = {
      ...mapping,
      runInput: {
        ...mapping.runInput,
        plan: {
          ...mapping.runInput.plan,
          mode: "dry-run",
        },
      },
    } as unknown as AnalyticsRollupSchedulerBackfillServiceExecuteMapping;

    expect(() =>
      createAnalyticsRollupSchedulerBackfillServiceExecuteAdapterPreview(
        unsafeMapping,
      ),
    ).toThrow(RangeError);
  });

  it("should reject unsafe mapped execute input contracts", () => {
    const [mapping] = createExecuteMappings();

    expect(mapping).toBeDefined();

    const unsafeMapping = {
      ...mapping,
      safety: {
        ...mapping.safety,
        serviceInvocationCurrentlyAllowed: true,
      },
    } as unknown as AnalyticsRollupSchedulerBackfillServiceExecuteMapping;

    expect(() =>
      createAnalyticsRollupSchedulerBackfillServiceExecuteAdapterPreview(
        unsafeMapping,
      ),
    ).toThrow(RangeError);
  });

  it("should reject duplicate execute mapped sources", () => {
    const [mapping] = createExecuteMappings();

    expect(mapping).toBeDefined();

    expect(() =>
      createAnalyticsRollupSchedulerBackfillServiceExecuteAdapterPreviews([
        mapping,
        mapping,
      ]),
    ).toThrow(RangeError);
  });
});

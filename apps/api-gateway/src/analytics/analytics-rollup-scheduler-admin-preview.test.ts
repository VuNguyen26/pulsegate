import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildAnalyticsRollupSchedulerAdminPreview,
} from "./analytics-rollup-scheduler-admin-preview.js";

describe(
  "buildAnalyticsRollupSchedulerAdminPreview",
  () => {
    it(
      "builds a fixed observational preview with runtime closed",
      () => {
        const preview =
          buildAnalyticsRollupSchedulerAdminPreview(
            new Date(
              "2026-07-11T04:45:00.000Z",
            ),
          );

        expect(preview).toMatchObject({
          kind:
            "analytics-rollup-scheduler-admin-preview",
          generatedAt:
            "2026-07-11T04:45:00.000Z",
          configurationSource:
            "dashboard-observational-defaults",
          runtimeStateAvailable: false,
          startsScheduledJob: false,
          invokesRuntimeAdapter: false,
          request: {
            trigger: "process-local",
            requestedMode: "preview",
            backgroundRunnerContractEnabled:
              true,
            schedulerEnabled: true,
            runAtIso:
              "2026-07-11T04:45:00.000Z",
            granularity: "hour",
            source: "both",
            lookbackBuckets: 1,
            maxBuckets: 24,
            safetyDelayMs: 60_000,
            allowProcessLocalDryRunRuntimeInvocation:
              false,
          },
          output: {
            summary: {
              ready: true,
              backgroundRunnerSelected:
                true,
              backgroundRunnerPlanAllowed:
                true,
              backgroundRuntimeInvocationAllowed:
                false,
            },
            runtimeGate: {
              summary: {
                runtimeInvocationAllowed:
                  false,
                runtimeFactoryResolutionAllowed:
                  false,
                backfillServiceInvocationAllowed:
                  false,
                executeBackfillAllowed: false,
              },
            },
          },
        });

        expect(
          preview.output.previewPlan,
        ).not.toBeNull();

        expect(
          preview.output.safety,
        ).toEqual({
          createsScheduledJob: false,
          invokesBackfillService: false,
          executesBackfill: false,
          readsEvents: false,
          persistsRollups: false,
          affectsQuotaCounting: false,
          deletesRawEvents: false,
          runsRetentionExecution: false,
        });
      },
    );

    it(
      "rejects an invalid generated-at date",
      () => {
        expect(() =>
          buildAnalyticsRollupSchedulerAdminPreview(
            new Date("invalid"),
          ),
        ).toThrow(
          "analytics scheduler admin preview now must be a valid Date",
        );
      },
    );
  },
);
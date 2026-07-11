import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  loadDashboardSchedulerPreview,
} from "./admin-scheduler-preview-client";

function createPreview() {
  const safety = {
    createsScheduledJob: false,
    invokesBackfillService: false,
    executesBackfill: false,
    readsEvents: false,
    persistsRollups: false,
    affectsQuotaCounting: false,
    deletesRawEvents: false,
    runsRetentionExecution: false,
  };

  return {
    kind:
      "analytics-rollup-scheduler-admin-preview",
    generatedAt:
      "2026-07-11T05:00:00.000Z",
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
        "2026-07-11T05:00:00.000Z",
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
        status: "background-preview-ready",
        runnerStatus:
          "background-preview-plan-ready",
        blockedReason: null,
        ready: true,
        backgroundRunnerSelected: true,
        backgroundRunnerPlanAllowed: true,
        backgroundRuntimeInvocationAllowed:
          false,
        directCommandRuntimePreserved:
          false,
      },
      previewPlan: {
        trigger: "process-local",
        requestedMode: "preview",
        runAtIso:
          "2026-07-11T05:00:00.000Z",
        granularity: "hour",
        source: "both",
        lookbackBuckets: 1,
        maxBuckets: 24,
        safetyDelayMs: 60_000,
        runtimeInvocationAllowed: false,
      },
      runtimeGate: {
        summary: {
          status:
            "background-preview-runtime-closed",
          runnerStatus:
            "background-preview-plan-ready",
          blockedReason:
            "background-preview-only-runtime-closed",
          trigger: "process-local",
          requestedMode: "preview",
          ready: true,
          runtimeInvocationAllowed: false,
          runtimeFactoryResolutionAllowed:
            false,
          backfillServiceInvocationAllowed:
            false,
          executeBackfillAllowed: false,
          directCommandRuntimePreserved:
            false,
        },
        safety,
        review: {
          separatesCommandFromBackgroundSemantics:
            true,
          preservesDirectCommandDryRunAndExecute:
            true,
          backgroundRuntimeStillClosed: true,
          processLocalRuntimeStillClosed:
            true,
          externalSchedulerRuntimeStillClosed:
            true,
          serviceInvocationStillBlocked:
            true,
          quotaCountingUnaffected: true,
          rawEventDeletionBlocked: true,
          retentionExecutionBlocked: true,
        },
        operatorNotes: [
          "Runtime remains closed.",
        ],
      },
      safety,
      review: {
        separatesCommandFromBackgroundSemantics:
          true,
        preservesDirectCommandDryRunAndExecute:
          true,
        backgroundRuntimeStillClosed: true,
        processLocalExecutionStillClosed:
          true,
        externalSchedulerExecutionStillClosed:
          true,
        previewOnlyWhenReady: true,
      },
      operatorNotes: [
        "Observational preview only.",
      ],
    },
  };
}

describe(
  "loadDashboardSchedulerPreview",
  () => {
    it(
      "loads the fixed no-store BFF resource",
      async () => {
        const preview = createPreview();

        const fetchMock = vi.fn(
          async (
            ..._args:
              Parameters<typeof fetch>
          ) =>
            Response.json({
              data: preview,
            }),
        );

        const result =
          await loadDashboardSchedulerPreview(
            fetchMock,
          );

        expect(result).toEqual({
          status: "success",
          data: preview,
        });

        expect(
          fetchMock.mock.calls[0]?.[0],
        ).toBe(
          "/api/admin/analytics/scheduler-preview",
        );

        expect(
          fetchMock.mock.calls[0]?.[1],
        ).toMatchObject({
          cache: "no-store",
          headers: {
            accept: "application/json",
          },
        });
      },
    );

    it(
      "fails closed on an unsafe response",
      async () => {
        const preview = createPreview();

        const result =
          await loadDashboardSchedulerPreview(
            vi.fn(
              async (
                ..._args:
                  Parameters<typeof fetch>
              ) =>
                Response.json({
                  data: {
                    ...preview,
                    startsScheduledJob: true,
                  },
                }),
            ),
          );

        expect(result).toMatchObject({
          status: "error",
          error: {
            code:
              "ADMIN_DASHBOARD_INVALID_RESPONSE",
          },
        });
      },
    );
  },
);
import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  DashboardAdminApiConfig,
} from "./admin-api-config";
import {
  fetchAdminSchedulerPreview,
} from "./admin-scheduler-preview";

const config: DashboardAdminApiConfig = {
  gatewayBaseUrl:
    "http://127.0.0.1:3000",
  apiKeyHeader: "x-admin-api-key",
  readOnlyApiKey: "read-only-secret",
  requestTimeoutMs: 1_000,
  accessMode: "read-only",
};

const preview = {
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
      directCommandRuntimePreserved: false,
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
      safety: {
        createsScheduledJob: false,
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
        runsRetentionExecution: false,
      },
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
    safety: {
      createsScheduledJob: false,
      invokesBackfillService: false,
      executesBackfill: false,
      readsEvents: false,
      persistsRollups: false,
      affectsQuotaCounting: false,
      deletesRawEvents: false,
      runsRetentionExecution: false,
    },
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
} as const;

describe(
  "fetchAdminSchedulerPreview",
  () => {
    it(
      "uses the fixed read-only Gateway endpoint",
      async () => {
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
          await fetchAdminSchedulerPreview(
            config,
            fetchMock,
          );

        expect(result).toEqual({
          ok: true,
          accessMode: "read-only",
          data: preview,
        });

        expect(
          fetchMock.mock.calls[0]?.[0],
        ).toEqual(
          new URL(
            "/internal/admin/analytics/scheduler-preview",
            config.gatewayBaseUrl,
          ),
        );

        expect(
          fetchMock.mock.calls[0]?.[1],
        ).toMatchObject({
          method: "GET",
          cache: "no-store",
          headers: {
            accept: "application/json",
            "x-admin-api-key":
              "read-only-secret",
          },
        });
      },
    );

    it(
      "fails closed when runtime appears open",
      async () => {
        const invalidPreview = {
          ...preview,
          output: {
            ...preview.output,
            runtimeGate: {
              ...preview.output.runtimeGate,
              summary: {
                ...preview.output.runtimeGate.summary,
                runtimeInvocationAllowed: true,
              },
            },
          },
        };

        const result =
          await fetchAdminSchedulerPreview(
            config,
            vi.fn(
              async (
                ..._args:
                  Parameters<typeof fetch>
              ) =>
                Response.json({
                  data: invalidPreview,
                }),
            ),
          );

        expect(result).toMatchObject({
          ok: false,
          error: {
            code:
              "ADMIN_DASHBOARD_INVALID_RESPONSE",
          },
        });
      },
    );
  },
);
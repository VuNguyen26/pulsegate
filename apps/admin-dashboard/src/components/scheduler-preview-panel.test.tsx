import {
  renderToStaticMarkup,
} from "react-dom/server";
import {
  describe,
  expect,
  it,
} from "vitest";

import {
  SchedulerPreviewContent,
  SchedulerPreviewPanel,
} from "./scheduler-preview-panel";

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
  } as const;

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
  } as const;
}

describe(
  "SchedulerPreviewContent",
  () => {
    it(
      "renders plan and closed runtime evidence",
      () => {
        const html =
          renderToStaticMarkup(
            <SchedulerPreviewContent
              preview={createPreview()}
            />,
          );

        expect(html).toContain(
          "Preview plan",
        );
        expect(html).toContain(
          "Closed execution boundary",
        );
        expect(html).toContain(
          "background-preview-runtime-closed",
        );
        expect(html).toContain(
          "Create scheduled job",
        );
        expect(html).toContain(
          "Observational preview only.",
        );
        expect(html).not.toContain(
          ">Start<",
        );
        expect(html).not.toContain(
          ">Execute<",
        );
      },
    );
  },
);

describe(
  "SchedulerPreviewPanel",
  () => {
    it(
      "starts in a read-only loading state",
      () => {
        const html =
          renderToStaticMarkup(
            <SchedulerPreviewPanel />,
          );

        expect(html).toContain(
          'aria-label="Analytics scheduler preview"',
        );
        expect(html).toContain(
          "Refresh preview",
        );
        expect(html).toContain(
          "Evaluating the pure scheduler contract",
        );
        expect(html).toContain(
          "cannot start a job",
        );
      },
    );
  },
);
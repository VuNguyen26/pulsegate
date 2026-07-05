import {
  DEFAULT_ANALYTICS_ROLLUP_BACKFILL_EVENT_LIMIT,
  type AnalyticsRollupBackfillEventReader,
} from "./analytics-rollup-backfill-event-reader.js";
import type {
  AnalyticsRollupBackfillPlan,
  AnalyticsRollupBackfillSource,
} from "./analytics-rollup-backfill-plan.js";
import type { AnalyticsRollupPersistenceService } from "./analytics-rollup-persistence-service.js";

export type AnalyticsRollupBackfillSourceRunStatus =
  | "planned"
  | "executed"
  | "skipped-empty-window";

export type AnalyticsRollupBackfillSourceRunSummary = {
  source: AnalyticsRollupBackfillSource;
  status: AnalyticsRollupBackfillSourceRunStatus;
  inputEventCount: number;
  aggregateCount: number;
  upsertedCount: number;
};

export type AnalyticsRollupBackfillRunInput = {
  plan: AnalyticsRollupBackfillPlan;
  eventLimit?: number;
};

export type AnalyticsRollupBackfillRunSummary = {
  mode: AnalyticsRollupBackfillPlan["mode"];
  source: AnalyticsRollupBackfillPlan["source"];
  sources: AnalyticsRollupBackfillSource[];
  granularity: AnalyticsRollupBackfillPlan["windowPlan"]["granularity"];
  requestedFrom: Date;
  requestedTo: Date;
  rebuildFrom: Date | null;
  rebuildTo: Date | null;
  bucketCount: number;
  sourceResults: AnalyticsRollupBackfillSourceRunSummary[];
  totalInputEventCount: number;
  totalAggregateCount: number;
  totalUpsertedCount: number;
};

export type AnalyticsRollupBackfillService = {
  runBackfill: (
    input: AnalyticsRollupBackfillRunInput,
  ) => Promise<AnalyticsRollupBackfillRunSummary>;
};

function summarizeSourceResults(
  sourceResults: AnalyticsRollupBackfillSourceRunSummary[],
) {
  return sourceResults.reduce(
    (summary, sourceResult) => ({
      totalInputEventCount:
        summary.totalInputEventCount + sourceResult.inputEventCount,
      totalAggregateCount:
        summary.totalAggregateCount + sourceResult.aggregateCount,
      totalUpsertedCount:
        summary.totalUpsertedCount + sourceResult.upsertedCount,
    }),
    {
      totalInputEventCount: 0,
      totalAggregateCount: 0,
      totalUpsertedCount: 0,
    },
  );
}

function createSourceSummary(
  source: AnalyticsRollupBackfillSource,
  status: AnalyticsRollupBackfillSourceRunStatus,
): AnalyticsRollupBackfillSourceRunSummary {
  return {
    source,
    status,
    inputEventCount: 0,
    aggregateCount: 0,
    upsertedCount: 0,
  };
}

function resolveEventLimit(eventLimit: number | undefined): number {
  const resolvedEventLimit =
    eventLimit ?? DEFAULT_ANALYTICS_ROLLUP_BACKFILL_EVENT_LIMIT;

  if (!Number.isInteger(resolvedEventLimit) || resolvedEventLimit < 1) {
    throw new RangeError("eventLimit must be a positive integer");
  }

  return resolvedEventLimit;
}

function assertWithinEventLimit(
  source: AnalyticsRollupBackfillSource,
  eventCount: number,
  eventLimit: number,
): void {
  if (eventCount > eventLimit) {
    throw new RangeError(
      `${source} backfill event count exceeds eventLimit; split the time window or increase eventLimit`,
    );
  }
}

export function createAnalyticsRollupBackfillService(dependencies: {
  eventReader: AnalyticsRollupBackfillEventReader;
  persistenceService: AnalyticsRollupPersistenceService;
}): AnalyticsRollupBackfillService {
  return {
    async runBackfill(input) {
      const { plan } = input;

      let sourceResults: AnalyticsRollupBackfillSourceRunSummary[];

      if (plan.mode === "dry-run") {
        sourceResults = plan.sources.map((source) =>
          createSourceSummary(source, "planned"),
        );
      } else if (
        plan.windowPlan.rebuildFrom === null ||
        plan.windowPlan.rebuildTo === null
      ) {
        sourceResults = plan.sources.map((source) =>
          createSourceSummary(source, "skipped-empty-window"),
        );
      } else {
        const eventLimit = resolveEventLimit(input.eventLimit);
        const readLimit = eventLimit + 1;

        sourceResults = [];

        for (const source of plan.sources) {
          if (source === "usage") {
            const events = await dependencies.eventReader.listUsageEvents({
              rebuildFrom: plan.windowPlan.rebuildFrom,
              rebuildTo: plan.windowPlan.rebuildTo,
              limit: readLimit,
            });

            assertWithinEventLimit(source, events.length, eventLimit);

            const persistenceSummary =
              await dependencies.persistenceService.persistUsageEvents(
                events,
                plan.windowPlan.granularity,
              );

            sourceResults.push({
              source,
              status: "executed",
              ...persistenceSummary,
            });
          } else {
            const events = await dependencies.eventReader.listRejectedEvents({
              rebuildFrom: plan.windowPlan.rebuildFrom,
              rebuildTo: plan.windowPlan.rebuildTo,
              limit: readLimit,
            });

            assertWithinEventLimit(source, events.length, eventLimit);

            const persistenceSummary =
              await dependencies.persistenceService.persistRejectedEvents(
                events,
                plan.windowPlan.granularity,
              );

            sourceResults.push({
              source,
              status: "executed",
              ...persistenceSummary,
            });
          }
        }
      }

      const totals = summarizeSourceResults(sourceResults);

      return {
        mode: plan.mode,
        source: plan.source,
        sources: plan.sources,
        granularity: plan.windowPlan.granularity,
        requestedFrom: plan.windowPlan.requestedFrom,
        requestedTo: plan.windowPlan.requestedTo,
        rebuildFrom: plan.windowPlan.rebuildFrom,
        rebuildTo: plan.windowPlan.rebuildTo,
        bucketCount: plan.windowPlan.bucketCount,
        sourceResults,
        ...totals,
      };
    },
  };
}

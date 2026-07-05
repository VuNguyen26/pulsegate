import type {
  AnalyticsRejectedRollupEvent,
} from "./analytics-rejected-rollup-aggregate.js";
import {
  buildAnalyticsRejectedRollupAggregates,
} from "./analytics-rejected-rollup-aggregate.js";
import type {
  AnalyticsRejectedRollupRepository,
} from "./analytics-rejected-rollup.repository.js";
import type { AnalyticsRollupGranularity } from "./analytics-rollup-time-bucket.js";
import type {
  AnalyticsUsageRollupEvent,
} from "./analytics-usage-rollup-aggregate.js";
import {
  buildAnalyticsUsageRollupAggregates,
} from "./analytics-usage-rollup-aggregate.js";
import type {
  AnalyticsUsageRollupRepository,
} from "./analytics-usage-rollup.repository.js";

export type AnalyticsRollupPersistenceSummary = {
  inputEventCount: number;
  aggregateCount: number;
  upsertedCount: number;
};

export type AnalyticsRollupPersistenceService = {
  persistUsageEvents: (
    events: AnalyticsUsageRollupEvent[],
    granularity: AnalyticsRollupGranularity,
  ) => Promise<AnalyticsRollupPersistenceSummary>;

  persistRejectedEvents: (
    events: AnalyticsRejectedRollupEvent[],
    granularity: AnalyticsRollupGranularity,
  ) => Promise<AnalyticsRollupPersistenceSummary>;
};

export function createAnalyticsRollupPersistenceService(dependencies: {
  usageRollupRepository: AnalyticsUsageRollupRepository;
  rejectedRollupRepository: AnalyticsRejectedRollupRepository;
}): AnalyticsRollupPersistenceService {
  return {
    async persistUsageEvents(events, granularity) {
      const aggregates = buildAnalyticsUsageRollupAggregates(
        events,
        granularity,
      );
      const persistenceResult =
        await dependencies.usageRollupRepository.upsertAggregates(aggregates);

      return {
        inputEventCount: events.length,
        aggregateCount: aggregates.length,
        upsertedCount: persistenceResult.upsertedCount,
      };
    },

    async persistRejectedEvents(events, granularity) {
      const aggregates = buildAnalyticsRejectedRollupAggregates(
        events,
        granularity,
      );
      const persistenceResult =
        await dependencies.rejectedRollupRepository.upsertAggregates(aggregates);

      return {
        inputEventCount: events.length,
        aggregateCount: aggregates.length,
        upsertedCount: persistenceResult.upsertedCount,
      };
    },
  };
}

import type {
  AnalyticsRejectedRollupReadQuery,
  AnalyticsRejectedRollupReadRecord,
  AnalyticsRejectedRollupReadRepository,
} from "./analytics-rejected-rollup-read.repository.js";
import type {
  AnalyticsRollupReadQuery,
} from "./analytics-rollup-read-query.js";
import type {
  AnalyticsUsageRollupReadQuery,
  AnalyticsUsageRollupReadRecord,
  AnalyticsUsageRollupReadRepository,
} from "./analytics-usage-rollup-read.repository.js";

export type AnalyticsRollupReadUsageResult = {
  source: "usage";
  records: AnalyticsUsageRollupReadRecord[];
  count: number;
};

export type AnalyticsRollupReadRejectedResult = {
  source: "rejected";
  records: AnalyticsRejectedRollupReadRecord[];
  count: number;
};

export type AnalyticsRollupReadResult =
  | AnalyticsRollupReadUsageResult
  | AnalyticsRollupReadRejectedResult;

export type AnalyticsRollupReadService = {
  readRollups: (
    query: AnalyticsRollupReadQuery,
  ) => Promise<AnalyticsRollupReadResult>;
};

export function createAnalyticsRollupReadService(dependencies: {
  usageRollupReadRepository: AnalyticsUsageRollupReadRepository;
  rejectedRollupReadRepository: AnalyticsRejectedRollupReadRepository;
}): AnalyticsRollupReadService {
  return {
    async readRollups(query) {
      if (query.source === "usage") {
        const result =
          await dependencies.usageRollupReadRepository.listUsageRollups(
            query as AnalyticsUsageRollupReadQuery,
          );

        return {
          source: "usage",
          records: result.records,
          count: result.count,
        };
      }

      const result =
        await dependencies.rejectedRollupReadRepository.listRejectedRollups(
          query as AnalyticsRejectedRollupReadQuery,
        );

      return {
        source: "rejected",
        records: result.records,
        count: result.count,
      };
    },
  };
}

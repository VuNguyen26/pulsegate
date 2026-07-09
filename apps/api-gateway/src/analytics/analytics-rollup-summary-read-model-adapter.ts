import type { ApiRejectedEventsListingFilters } from "../api-rejections/api-rejected-events-listing.types.js";
import type { ApiRejectedEventsSummaryReadModel } from "../api-rejections/api-rejected-events-summary.types.js";
import type {
  ApiUsageSummaryReadModel,
  ApiUsageSummarySubjectType,
} from "../api-usage/api-usage-summary.types.js";
import type { ApiRejectionReason } from "../generated/prisma/index.js";
import type { AnalyticsRejectedRollupReadRecord } from "./analytics-rejected-rollup-read.repository.js";
import type { AnalyticsUsageRollupReadRecord } from "./analytics-usage-rollup-read.repository.js";

export type RollupSummaryReadModelAdapterStatus =
  | "rollup-summary-read-model-mapped"
  | "rollup-summary-read-model-empty";

export type RollupSummaryReadModelAdapterFallbackReason =
  "rollup-data-empty";

export type RollupSummaryReadModelAdapterResult<TSummary> = {
  readonly status: RollupSummaryReadModelAdapterStatus;
  readonly summary: TSummary | null;
  readonly fallback: {
    readonly path: "raw-event-summary";
    readonly available: true;
    readonly required: boolean;
    readonly reason: RollupSummaryReadModelAdapterFallbackReason | null;
  };
  readonly adapterSafety: {
    readonly readsDatabaseInAdapter: false;
    readonly invokesRepositoryInAdapter: false;
    readonly persistsRollups: false;
    readonly mutatesQuotaCounting: false;
    readonly deletesRawEvents: false;
    readonly wiresSchedulerOrBackgroundJob: false;
    readonly wiresRetentionExecution: false;
    readonly preservesCurrentSummaryResponseShape: true;
  };
};

export type MapUsageRollupRecordsToSummaryInput = {
  readonly subjectType: ApiUsageSummarySubjectType;
  readonly subjectId: string;
  readonly records: readonly AnalyticsUsageRollupReadRecord[];
};

export type MapRejectedRollupRecordsToSummaryInput = {
  readonly filters?: ApiRejectedEventsListingFilters;
  readonly records: readonly AnalyticsRejectedRollupReadRecord[];
};

export function mapUsageRollupRecordsToUsageSummaryReadModel(
  input: MapUsageRollupRecordsToSummaryInput,
): RollupSummaryReadModelAdapterResult<ApiUsageSummaryReadModel> {
  if (input.records.length === 0) {
    return buildEmptyAdapterResult();
  }

  const totals = input.records.reduce(
    (accumulator, record) => ({
      totalRequests: accumulator.totalRequests + record.totalRequests,
      successfulRequests:
        accumulator.successfulRequests + record.successfulRequests,
      errorRequests: accumulator.errorRequests + record.errorRequests,
      totalDurationMs: accumulator.totalDurationMs + record.totalDurationMs,
      cacheHits: accumulator.cacheHits + record.cacheHits,
      cacheMisses: accumulator.cacheMisses + record.cacheMisses,
      cacheBypasses: accumulator.cacheBypasses + record.cacheBypasses,
      lastRequestAt: maxDate(accumulator.lastRequestAt, record.lastRequestAt),
    }),
    {
      totalRequests: 0,
      successfulRequests: 0,
      errorRequests: 0,
      totalDurationMs: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheBypasses: 0,
      lastRequestAt: null as Date | null,
    },
  );

  return buildMappedAdapterResult({
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    totalRequests: totals.totalRequests,
    successfulRequests: totals.successfulRequests,
    errorRequests: totals.errorRequests,
    averageDurationMs:
      totals.totalRequests > 0
        ? Math.round(totals.totalDurationMs / totals.totalRequests)
        : 0,
    cacheHits: totals.cacheHits,
    cacheMisses: totals.cacheMisses,
    cacheBypasses: totals.cacheBypasses,
    lastRequestAt: totals.lastRequestAt,
  });
}

export function mapRejectedRollupRecordsToRejectedSummaryReadModel(
  input: MapRejectedRollupRecordsToSummaryInput,
): RollupSummaryReadModelAdapterResult<ApiRejectedEventsSummaryReadModel> {
  if (input.records.length === 0) {
    return buildEmptyAdapterResult();
  }

  const byReason = new Map<ApiRejectionReason, number>();
  const byStatusCode = new Map<number, number>();
  let totalRejectedRequests = 0;
  let lastRejectedAt: Date | null = null;

  for (const record of input.records) {
    totalRejectedRequests += record.totalRejectedRequests;
    byReason.set(
      record.rejectionReason,
      (byReason.get(record.rejectionReason) ?? 0) +
        record.totalRejectedRequests,
    );
    byStatusCode.set(
      record.statusCode,
      (byStatusCode.get(record.statusCode) ?? 0) +
        record.totalRejectedRequests,
    );
    lastRejectedAt = maxDate(lastRejectedAt, record.lastRejectedAt);
  }

  return buildMappedAdapterResult({
    totalRejectedRequests,
    byReason: [...byReason.entries()]
      .sort(([leftReason], [rightReason]) =>
        leftReason.localeCompare(rightReason),
      )
      .map(([rejectionReason, count]) => ({
        rejectionReason,
        count,
      })),
    byStatusCode: [...byStatusCode.entries()]
      .sort(([leftStatusCode], [rightStatusCode]) =>
        leftStatusCode - rightStatusCode,
      )
      .map(([statusCode, count]) => ({
        statusCode,
        count,
      })),
    lastRejectedAt,
    filters: input.filters ?? {},
  });
}

function buildMappedAdapterResult<TSummary>(
  summary: TSummary,
): RollupSummaryReadModelAdapterResult<TSummary> {
  return {
    status: "rollup-summary-read-model-mapped",
    summary,
    fallback: {
      path: "raw-event-summary",
      available: true,
      required: false,
      reason: null,
    },
    adapterSafety: buildAdapterSafety(),
  };
}

function buildEmptyAdapterResult<TSummary>(): RollupSummaryReadModelAdapterResult<TSummary> {
  return {
    status: "rollup-summary-read-model-empty",
    summary: null,
    fallback: {
      path: "raw-event-summary",
      available: true,
      required: true,
      reason: "rollup-data-empty",
    },
    adapterSafety: buildAdapterSafety(),
  };
}

function buildAdapterSafety(): RollupSummaryReadModelAdapterResult<unknown>["adapterSafety"] {
  return {
    readsDatabaseInAdapter: false,
    invokesRepositoryInAdapter: false,
    persistsRollups: false,
    mutatesQuotaCounting: false,
    deletesRawEvents: false,
    wiresSchedulerOrBackgroundJob: false,
    wiresRetentionExecution: false,
    preservesCurrentSummaryResponseShape: true,
  };
}

function maxDate(left: Date | null, right: Date | null): Date | null {
  if (left === null) {
    return right;
  }

  if (right === null) {
    return left;
  }

  return left > right ? left : right;
}
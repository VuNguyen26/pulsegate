import type { ApiRejectedEventsListingFilters } from "../api-rejections/api-rejected-events-listing.types.js";
import type { ApiRejectedEventsSummaryReadModel } from "../api-rejections/api-rejected-events-summary.types.js";
import type {
  ApiUsageSummaryReadModel,
  ApiUsageSummarySubjectType,
} from "../api-usage/api-usage-summary.types.js";
import type { AnalyticsRejectedRollupReadRecord } from "./analytics-rejected-rollup-read.repository.js";
import {
  mapRejectedRollupRecordsToRejectedSummaryReadModel,
  mapUsageRollupRecordsToUsageSummaryReadModel,
  type RollupSummaryReadModelAdapterFallbackReason,
  type RollupSummaryReadModelAdapterStatus,
} from "./analytics-rollup-summary-read-model-adapter.js";
import type {
  RollupSummaryRuntimeReadFallbackReason,
  RollupSummaryRuntimeReadPath,
} from "./analytics-rollup-summary-runtime-read-decision.js";
import type { RollupSummaryRuntimeReadDecisionMappedRequest } from "./analytics-rollup-summary-runtime-read-decision-request-mapper.js";
import type { AnalyticsUsageRollupReadRecord } from "./analytics-usage-rollup-read.repository.js";

export type RollupSummaryRuntimeReadResolverStatus =
  | "rollup-summary-read-model-returned"
  | "raw-summary-fallback-returned";

export type RollupSummaryRuntimeReadResolverFallbackReason =
  | RollupSummaryRuntimeReadFallbackReason
  | RollupSummaryReadModelAdapterFallbackReason;

export type RollupSummaryRuntimeReadResolverResult<TSummary> = {
  readonly status: RollupSummaryRuntimeReadResolverStatus;
  readonly summary: TSummary;
  readonly selectedReadPath: {
    readonly path: RollupSummaryRuntimeReadPath;
    readonly readsRawEvents: boolean;
    readonly readsRollupTables: boolean;
    readonly affectsQuotaCounting: false;
    readonly deletesRawEvents: false;
  };
  readonly decisionRequest: RollupSummaryRuntimeReadDecisionMappedRequest;
  readonly rollupAdapterStatus: RollupSummaryReadModelAdapterStatus | null;
  readonly fallback: {
    readonly path: "raw-event-summary";
    readonly used: boolean;
    readonly available: true;
    readonly reason: RollupSummaryRuntimeReadResolverFallbackReason | null;
  };
  readonly resolverSafety: {
    readonly endpointRuntimeChangedByResolver: false;
    readonly readsDatabaseInResolver: false;
    readonly invokesRepositoryInResolver: false;
    readonly usesProvidedRollupRecordsOnly: true;
    readonly persistsRollups: false;
    readonly mutatesQuotaCounting: false;
    readonly deletesRawEvents: false;
    readonly wiresSchedulerOrBackgroundJob: false;
    readonly wiresRetentionExecution: false;
    readonly preservesCurrentSummaryResponseShape: true;
  };
};

export type ResolveUsageSummaryRuntimeReadModelInput = {
  readonly decisionRequest: RollupSummaryRuntimeReadDecisionMappedRequest;
  readonly rawSummary: ApiUsageSummaryReadModel;
  readonly subjectType: ApiUsageSummarySubjectType;
  readonly subjectId: string;
  readonly rollupRecords?: readonly AnalyticsUsageRollupReadRecord[];
};

export type ResolveRejectedSummaryRuntimeReadModelInput = {
  readonly decisionRequest: RollupSummaryRuntimeReadDecisionMappedRequest;
  readonly rawSummary: ApiRejectedEventsSummaryReadModel;
  readonly filters?: ApiRejectedEventsListingFilters;
  readonly rollupRecords?: readonly AnalyticsRejectedRollupReadRecord[];
};

export function resolveUsageSummaryRuntimeReadModel(
  input: ResolveUsageSummaryRuntimeReadModelInput,
): RollupSummaryRuntimeReadResolverResult<ApiUsageSummaryReadModel> {
  assertUsageDecisionTarget(input.decisionRequest);

  if (
    input.decisionRequest.decision.selectedReadPath.path !==
    "rollup-read-model"
  ) {
    return buildRawFallbackResult({
      decisionRequest: input.decisionRequest,
      rawSummary: input.rawSummary,
      reason:
        input.decisionRequest.decision.fallback.reason ??
        "rollup-runtime-switch-disabled",
      rollupAdapterStatus: null,
    });
  }

  const adapted = mapUsageRollupRecordsToUsageSummaryReadModel({
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    records: input.rollupRecords ?? [],
  });

  if (adapted.summary === null) {
    return buildRawFallbackResult({
      decisionRequest: input.decisionRequest,
      rawSummary: input.rawSummary,
      reason: adapted.fallback.reason ?? "rollup-data-empty",
      rollupAdapterStatus: adapted.status,
    });
  }

  return buildRollupResult({
    decisionRequest: input.decisionRequest,
    summary: adapted.summary,
    rollupAdapterStatus: adapted.status,
  });
}

export function resolveRejectedSummaryRuntimeReadModel(
  input: ResolveRejectedSummaryRuntimeReadModelInput,
): RollupSummaryRuntimeReadResolverResult<ApiRejectedEventsSummaryReadModel> {
  assertRejectedDecisionTarget(input.decisionRequest);

  if (
    input.decisionRequest.decision.selectedReadPath.path !==
    "rollup-read-model"
  ) {
    return buildRawFallbackResult({
      decisionRequest: input.decisionRequest,
      rawSummary: input.rawSummary,
      reason:
        input.decisionRequest.decision.fallback.reason ??
        "rollup-runtime-switch-disabled",
      rollupAdapterStatus: null,
    });
  }

  const adapted = mapRejectedRollupRecordsToRejectedSummaryReadModel({
    filters: input.filters,
    records: input.rollupRecords ?? [],
  });

  if (adapted.summary === null) {
    return buildRawFallbackResult({
      decisionRequest: input.decisionRequest,
      rawSummary: input.rawSummary,
      reason: adapted.fallback.reason ?? "rollup-data-empty",
      rollupAdapterStatus: adapted.status,
    });
  }

  return buildRollupResult({
    decisionRequest: input.decisionRequest,
    summary: adapted.summary,
    rollupAdapterStatus: adapted.status,
  });
}

function buildRollupResult<TSummary>(input: {
  readonly decisionRequest: RollupSummaryRuntimeReadDecisionMappedRequest;
  readonly summary: TSummary;
  readonly rollupAdapterStatus: RollupSummaryReadModelAdapterStatus;
}): RollupSummaryRuntimeReadResolverResult<TSummary> {
  return {
    status: "rollup-summary-read-model-returned",
    summary: input.summary,
    selectedReadPath: {
      path: "rollup-read-model",
      readsRawEvents: false,
      readsRollupTables: true,
      affectsQuotaCounting: false,
      deletesRawEvents: false,
    },
    decisionRequest: input.decisionRequest,
    rollupAdapterStatus: input.rollupAdapterStatus,
    fallback: {
      path: "raw-event-summary",
      used: false,
      available: true,
      reason: null,
    },
    resolverSafety: buildResolverSafety(),
  };
}

function buildRawFallbackResult<TSummary>(input: {
  readonly decisionRequest: RollupSummaryRuntimeReadDecisionMappedRequest;
  readonly rawSummary: TSummary;
  readonly reason: RollupSummaryRuntimeReadResolverFallbackReason;
  readonly rollupAdapterStatus: RollupSummaryReadModelAdapterStatus | null;
}): RollupSummaryRuntimeReadResolverResult<TSummary> {
  return {
    status: "raw-summary-fallback-returned",
    summary: input.rawSummary,
    selectedReadPath: {
      path: "raw-event-summary",
      readsRawEvents: true,
      readsRollupTables: false,
      affectsQuotaCounting: false,
      deletesRawEvents: false,
    },
    decisionRequest: input.decisionRequest,
    rollupAdapterStatus: input.rollupAdapterStatus,
    fallback: {
      path: "raw-event-summary",
      used: true,
      available: true,
      reason: input.reason,
    },
    resolverSafety: buildResolverSafety(),
  };
}

function buildResolverSafety(): RollupSummaryRuntimeReadResolverResult<unknown>["resolverSafety"] {
  return {
    endpointRuntimeChangedByResolver: false,
    readsDatabaseInResolver: false,
    invokesRepositoryInResolver: false,
    usesProvidedRollupRecordsOnly: true,
    persistsRollups: false,
    mutatesQuotaCounting: false,
    deletesRawEvents: false,
    wiresSchedulerOrBackgroundJob: false,
    wiresRetentionExecution: false,
    preservesCurrentSummaryResponseShape: true,
  };
}

function assertUsageDecisionTarget(
  decisionRequest: RollupSummaryRuntimeReadDecisionMappedRequest,
): void {
  if (
    decisionRequest.target !== "usage-consumer-summary" &&
    decisionRequest.target !== "usage-api-key-summary"
  ) {
    throw new RangeError(
      "usage summary runtime resolver requires a usage summary target",
    );
  }
}

function assertRejectedDecisionTarget(
  decisionRequest: RollupSummaryRuntimeReadDecisionMappedRequest,
): void {
  if (decisionRequest.target !== "rejected-summary") {
    throw new RangeError(
      "rejected summary runtime resolver requires a rejected summary target",
    );
  }
}
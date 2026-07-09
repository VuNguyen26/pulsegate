import type { ApiRejectedEventsListingFilters } from "../api-rejections/api-rejected-events-listing.types.js";
import type { ApiUsageSummaryFilters } from "../api-usage/api-usage-summary.types.js";
import {
  buildRollupSummaryRuntimeReadDecision,
  type RollupSummaryRuntimeReadDecision,
} from "./analytics-rollup-summary-runtime-read-decision.js";
import type { RollupSummaryQueryCompatibilityFilterValue } from "./analytics-rollup-summary-query-compatibility-preview.js";
import type {
  RollupSummaryApiSwitchPreviewDataState,
  RollupSummaryApiSwitchPreviewTarget,
} from "./analytics-rollup-summary-switch-preview.js";

export type RollupSummaryRuntimeReadDecisionRequestMapperSource =
  | "usage-consumer-summary-route"
  | "usage-api-key-summary-route"
  | "rejected-summary-route";

export type RollupSummaryRuntimeReadDecisionRequestMapperOptions = {
  readonly rollupRuntimeReadEnabled?: boolean;
  readonly rollupDataState?: RollupSummaryApiSwitchPreviewDataState;
};

export type BuildUsageSummaryRuntimeReadDecisionRequestInput =
  RollupSummaryRuntimeReadDecisionRequestMapperOptions & {
    readonly filters?: ApiUsageSummaryFilters;
  };

export type BuildRejectedSummaryRuntimeReadDecisionRequestInput =
  RollupSummaryRuntimeReadDecisionRequestMapperOptions & {
    readonly filters?: ApiRejectedEventsListingFilters;
  };

export type RollupSummaryRuntimeReadDecisionMappedRequest = {
  readonly source: RollupSummaryRuntimeReadDecisionRequestMapperSource;
  readonly target: RollupSummaryApiSwitchPreviewTarget;
  readonly mappedFilters: Readonly<
    Record<string, RollupSummaryQueryCompatibilityFilterValue>
  >;
  readonly decision: RollupSummaryRuntimeReadDecision;
  readonly mapperSafety: {
    readonly endpointRuntimeChanged: false;
    readonly readsDatabaseInMapper: false;
    readonly invokesRepositoryInMapper: false;
    readonly persistsRollups: false;
    readonly mutatesQuotaCounting: false;
    readonly deletesRawEvents: false;
    readonly wiresSchedulerOrBackgroundJob: false;
    readonly wiresRetentionExecution: false;
  };
};

export function mapConsumerUsageSummaryRuntimeReadDecisionRequest(
  input: BuildUsageSummaryRuntimeReadDecisionRequestInput = {},
): RollupSummaryRuntimeReadDecisionMappedRequest {
  return buildMappedRequest({
    source: "usage-consumer-summary-route",
    target: "usage-consumer-summary",
    mappedFilters: mapUsageSummaryFilters(input.filters),
    rollupRuntimeReadEnabled: input.rollupRuntimeReadEnabled,
    rollupDataState: input.rollupDataState,
  });
}

export function mapApiKeyUsageSummaryRuntimeReadDecisionRequest(
  input: BuildUsageSummaryRuntimeReadDecisionRequestInput = {},
): RollupSummaryRuntimeReadDecisionMappedRequest {
  return buildMappedRequest({
    source: "usage-api-key-summary-route",
    target: "usage-api-key-summary",
    mappedFilters: mapUsageSummaryFilters(input.filters),
    rollupRuntimeReadEnabled: input.rollupRuntimeReadEnabled,
    rollupDataState: input.rollupDataState,
  });
}

export function mapRejectedSummaryRuntimeReadDecisionRequest(
  input: BuildRejectedSummaryRuntimeReadDecisionRequestInput = {},
): RollupSummaryRuntimeReadDecisionMappedRequest {
  return buildMappedRequest({
    source: "rejected-summary-route",
    target: "rejected-summary",
    mappedFilters: mapRejectedSummaryFilters(input.filters),
    rollupRuntimeReadEnabled: input.rollupRuntimeReadEnabled,
    rollupDataState: input.rollupDataState,
  });
}

function buildMappedRequest(input: {
  readonly source: RollupSummaryRuntimeReadDecisionRequestMapperSource;
  readonly target: RollupSummaryApiSwitchPreviewTarget;
  readonly mappedFilters: Readonly<
    Record<string, RollupSummaryQueryCompatibilityFilterValue>
  >;
  readonly rollupRuntimeReadEnabled?: boolean;
  readonly rollupDataState?: RollupSummaryApiSwitchPreviewDataState;
}): RollupSummaryRuntimeReadDecisionMappedRequest {
  return {
    source: input.source,
    target: input.target,
    mappedFilters: input.mappedFilters,
    decision: buildRollupSummaryRuntimeReadDecision({
      target: input.target,
      filters: input.mappedFilters,
      rollupRuntimeReadEnabled: input.rollupRuntimeReadEnabled,
      rollupDataState: input.rollupDataState,
    }),
    mapperSafety: {
      endpointRuntimeChanged: false,
      readsDatabaseInMapper: false,
      invokesRepositoryInMapper: false,
      persistsRollups: false,
      mutatesQuotaCounting: false,
      deletesRawEvents: false,
      wiresSchedulerOrBackgroundJob: false,
      wiresRetentionExecution: false,
    },
  };
}

function mapUsageSummaryFilters(
  filters: ApiUsageSummaryFilters | undefined,
): Readonly<Record<string, RollupSummaryQueryCompatibilityFilterValue>> {
  const mappedFilters: Record<
    string,
    RollupSummaryQueryCompatibilityFilterValue
  > = {};

  if (!filters) {
    return mappedFilters;
  }

  if (filters.from) {
    mappedFilters.from = filters.from;
  }

  if (filters.to) {
    mappedFilters.to = filters.to;
  }

  if (filters.routePath) {
    mappedFilters.routePath = filters.routePath;
  }

  if (filters.routeMethod) {
    mappedFilters.routeMethod = filters.routeMethod;
  }

  if (typeof filters.statusCode === "number") {
    mappedFilters.statusCode = filters.statusCode;
  }

  if (filters.cacheStatus) {
    mappedFilters.cacheStatus = filters.cacheStatus;
  }

  if (filters.apiKeyAuthSource) {
    mappedFilters.apiKeyAuthSource = filters.apiKeyAuthSource;
  }

  return mappedFilters;
}

function mapRejectedSummaryFilters(
  filters: ApiRejectedEventsListingFilters | undefined,
): Readonly<Record<string, RollupSummaryQueryCompatibilityFilterValue>> {
  const mappedFilters: Record<
    string,
    RollupSummaryQueryCompatibilityFilterValue
  > = {};

  if (!filters) {
    return mappedFilters;
  }

  if (filters.from) {
    mappedFilters.from = filters.from;
  }

  if (filters.to) {
    mappedFilters.to = filters.to;
  }

  if (filters.rejectionReason) {
    mappedFilters.rejectionReason = filters.rejectionReason;
  }

  if (typeof filters.statusCode === "number") {
    mappedFilters.statusCode = filters.statusCode;
  }

  if (filters.routePath) {
    mappedFilters.routePath = filters.routePath;
  }

  if (filters.routeMethod) {
    mappedFilters.routeMethod = filters.routeMethod;
  }

  if (filters.apiKeyAuthSource) {
    mappedFilters.apiKeyAuthSource = filters.apiKeyAuthSource;
  }

  if (filters.apiKeyId) {
    mappedFilters.apiKeyId = filters.apiKeyId;
  }

  if (filters.consumerId) {
    mappedFilters.consumerId = filters.consumerId;
  }

  return mappedFilters;
}
import type { ApiRejectedEventsListingFilters } from "../api-rejections/api-rejected-events-listing.types.js";
import type { ApiUsageSummaryFilters } from "../api-usage/api-usage-summary.types.js";
import {
  buildRollupSummaryApiSwitchPreviewOutput,
  type RollupSummaryApiSwitchPreviewOutput,
} from "./analytics-rollup-summary-api-switch-preview-output.js";
import type {
  RollupSummaryApiSwitchPreviewDataState,
  RollupSummaryApiSwitchPreviewTarget,
} from "./analytics-rollup-summary-switch-preview.js";
import type { RollupSummaryQueryCompatibilityFilterValue } from "./analytics-rollup-summary-query-compatibility-preview.js";

export type RollupSummaryPreviewRequestMapperSource =
  | "usage-consumer-summary-route"
  | "usage-api-key-summary-route"
  | "rejected-summary-route";

export type RollupSummaryPreviewRequestMapperOptions = {
  readonly rollupPreviewEnabled?: boolean;
  readonly rollupDataState?: RollupSummaryApiSwitchPreviewDataState;
};

export type BuildUsageSummaryPreviewRequestInput =
  RollupSummaryPreviewRequestMapperOptions & {
    readonly filters?: ApiUsageSummaryFilters;
  };

export type BuildRejectedSummaryPreviewRequestInput =
  RollupSummaryPreviewRequestMapperOptions & {
    readonly filters?: ApiRejectedEventsListingFilters;
  };

export type RollupSummaryPreviewMappedRequest = {
  readonly source: RollupSummaryPreviewRequestMapperSource;
  readonly target: RollupSummaryApiSwitchPreviewTarget;
  readonly mappedFilters: Readonly<
    Record<string, RollupSummaryQueryCompatibilityFilterValue>
  >;
  readonly output: RollupSummaryApiSwitchPreviewOutput;
  readonly mapperSafety: {
    readonly endpointRuntimeChanged: false;
    readonly readsDatabaseInMapper: false;
    readonly invokesRepositoryInMapper: false;
    readonly persistsRollups: false;
    readonly mutatesQuotaCounting: false;
    readonly deletesRawEvents: false;
  };
};

export function mapConsumerUsageSummaryPreviewRequest(
  input: BuildUsageSummaryPreviewRequestInput = {},
): RollupSummaryPreviewMappedRequest {
  return buildMappedRequest({
    source: "usage-consumer-summary-route",
    target: "usage-consumer-summary",
    mappedFilters: mapUsageSummaryFilters(input.filters),
    rollupPreviewEnabled: input.rollupPreviewEnabled,
    rollupDataState: input.rollupDataState,
  });
}

export function mapApiKeyUsageSummaryPreviewRequest(
  input: BuildUsageSummaryPreviewRequestInput = {},
): RollupSummaryPreviewMappedRequest {
  return buildMappedRequest({
    source: "usage-api-key-summary-route",
    target: "usage-api-key-summary",
    mappedFilters: mapUsageSummaryFilters(input.filters),
    rollupPreviewEnabled: input.rollupPreviewEnabled,
    rollupDataState: input.rollupDataState,
  });
}

export function mapRejectedSummaryPreviewRequest(
  input: BuildRejectedSummaryPreviewRequestInput = {},
): RollupSummaryPreviewMappedRequest {
  return buildMappedRequest({
    source: "rejected-summary-route",
    target: "rejected-summary",
    mappedFilters: mapRejectedSummaryFilters(input.filters),
    rollupPreviewEnabled: input.rollupPreviewEnabled,
    rollupDataState: input.rollupDataState,
  });
}

function buildMappedRequest(input: {
  readonly source: RollupSummaryPreviewRequestMapperSource;
  readonly target: RollupSummaryApiSwitchPreviewTarget;
  readonly mappedFilters: Readonly<
    Record<string, RollupSummaryQueryCompatibilityFilterValue>
  >;
  readonly rollupPreviewEnabled?: boolean;
  readonly rollupDataState?: RollupSummaryApiSwitchPreviewDataState;
}): RollupSummaryPreviewMappedRequest {
  return {
    source: input.source,
    target: input.target,
    mappedFilters: input.mappedFilters,
    output: buildRollupSummaryApiSwitchPreviewOutput({
      target: input.target,
      filters: input.mappedFilters,
      rollupPreviewEnabled: input.rollupPreviewEnabled,
      rollupDataState: input.rollupDataState,
    }),
    mapperSafety: {
      endpointRuntimeChanged: false,
      readsDatabaseInMapper: false,
      invokesRepositoryInMapper: false,
      persistsRollups: false,
      mutatesQuotaCounting: false,
      deletesRawEvents: false,
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
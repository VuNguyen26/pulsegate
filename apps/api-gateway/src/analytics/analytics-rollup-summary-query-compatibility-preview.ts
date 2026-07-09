import type { RollupSummaryApiSwitchPreviewTarget } from "./analytics-rollup-summary-switch-preview.js";

export type RollupSummaryQueryCompatibilityStatus =
  | "rollup-query-compatible-for-preview"
  | "rollup-query-fallback-required";

export type RollupSummaryQueryCompatibilityFallbackReason =
  | "unsupported-query-filter"
  | "missing-bounded-time-window"
  | "invalid-time-window";

export type RollupSummaryQueryCompatibilityFilterValue =
  | string
  | number
  | Date
  | boolean
  | null
  | undefined;

export type BuildRollupSummaryQueryCompatibilityPreviewInput = {
  readonly target: RollupSummaryApiSwitchPreviewTarget;
  readonly filters?: Readonly<
    Record<string, RollupSummaryQueryCompatibilityFilterValue>
  >;
};

export type RollupSummaryQueryCompatibilityPreview = {
  readonly target: RollupSummaryApiSwitchPreviewTarget;
  readonly status: RollupSummaryQueryCompatibilityStatus;
  readonly queryShapeSupported: boolean;
  readonly fallbackReason: RollupSummaryQueryCompatibilityFallbackReason | null;
  readonly supportedFilterKeys: readonly string[];
  readonly providedFilterKeys: readonly string[];
  readonly unsupportedFilterKeys: readonly string[];
  readonly timeWindow: {
    readonly requiresBoundedWindowForRollupPreview: true;
    readonly fromProvided: boolean;
    readonly toProvided: boolean;
    readonly bounded: boolean;
    readonly valid: boolean;
  };
  readonly currentRawSummaryQuery: {
    readonly remainsRuntimeDefault: true;
    readonly supportsCurrentUnboundedQueryBehavior: true;
    readonly sourceOfTruth:
      | "gateway.api_usage_events"
      | "gateway.api_rejected_events";
  };
  readonly rollupReadModelQuery: {
    readonly previewOnly: true;
    readonly queryShapeSupported: boolean;
    readonly requiresBoundedTimeWindow: true;
    readonly readModel:
      | "gateway.api_usage_rollups"
      | "gateway.api_rejected_rollups";
  };
  readonly runtimeSelection: {
    readonly selectedPath: "raw-event-summary";
    readonly runtimeSwitchApplied: false;
    readonly reason: "sprint-52-query-compatibility-preview-only";
  };
  readonly safety: {
    readonly endpointRuntimeChanged: false;
    readonly readsDatabaseInPreviewModel: false;
    readonly invokesRepositoryInPreviewModel: false;
    readonly persistsRollups: false;
    readonly mutatesQuotaCounting: false;
    readonly deletesRawEvents: false;
    readonly wiresSchedulerOrBackgroundJob: false;
    readonly wiresRetentionExecution: false;
  };
};

const USAGE_SUMMARY_SUPPORTED_FILTER_KEYS = [
  "from",
  "to",
  "routePath",
  "routeMethod",
  "statusCode",
  "cacheStatus",
  "apiKeyAuthSource",
] as const;

const REJECTED_SUMMARY_SUPPORTED_FILTER_KEYS = [
  "from",
  "to",
  "rejectionReason",
  "statusCode",
  "routePath",
  "routeMethod",
  "apiKeyAuthSource",
  "apiKeyId",
  "consumerId",
] as const;

const TARGET_QUERY_PROFILES: Record<
  RollupSummaryApiSwitchPreviewTarget,
  {
    readonly supportedFilterKeys: readonly string[];
    readonly sourceOfTruth:
      | "gateway.api_usage_events"
      | "gateway.api_rejected_events";
    readonly readModel:
      | "gateway.api_usage_rollups"
      | "gateway.api_rejected_rollups";
  }
> = {
  "usage-consumer-summary": {
    supportedFilterKeys: USAGE_SUMMARY_SUPPORTED_FILTER_KEYS,
    sourceOfTruth: "gateway.api_usage_events",
    readModel: "gateway.api_usage_rollups",
  },
  "usage-api-key-summary": {
    supportedFilterKeys: USAGE_SUMMARY_SUPPORTED_FILTER_KEYS,
    sourceOfTruth: "gateway.api_usage_events",
    readModel: "gateway.api_usage_rollups",
  },
  "rejected-summary": {
    supportedFilterKeys: REJECTED_SUMMARY_SUPPORTED_FILTER_KEYS,
    sourceOfTruth: "gateway.api_rejected_events",
    readModel: "gateway.api_rejected_rollups",
  },
};

export function buildRollupSummaryQueryCompatibilityPreview(
  input: BuildRollupSummaryQueryCompatibilityPreviewInput,
): RollupSummaryQueryCompatibilityPreview {
  const profile = TARGET_QUERY_PROFILES[input.target];
  const filters = input.filters ?? {};
  const providedFilterKeys = getProvidedFilterKeys(filters);
  const unsupportedFilterKeys = providedFilterKeys.filter(
    (key) => !profile.supportedFilterKeys.includes(key),
  );
  const timeWindow = buildTimeWindowPreview(filters);
  const fallbackReason = resolveFallbackReason({
    unsupportedFilterKeys,
    timeWindow,
  });
  const queryShapeSupported = fallbackReason === null;

  return {
    target: input.target,
    status: queryShapeSupported
      ? "rollup-query-compatible-for-preview"
      : "rollup-query-fallback-required",
    queryShapeSupported,
    fallbackReason,
    supportedFilterKeys: profile.supportedFilterKeys,
    providedFilterKeys,
    unsupportedFilterKeys,
    timeWindow,
    currentRawSummaryQuery: {
      remainsRuntimeDefault: true,
      supportsCurrentUnboundedQueryBehavior: true,
      sourceOfTruth: profile.sourceOfTruth,
    },
    rollupReadModelQuery: {
      previewOnly: true,
      queryShapeSupported,
      requiresBoundedTimeWindow: true,
      readModel: profile.readModel,
    },
    runtimeSelection: {
      selectedPath: "raw-event-summary",
      runtimeSwitchApplied: false,
      reason: "sprint-52-query-compatibility-preview-only",
    },
    safety: {
      endpointRuntimeChanged: false,
      readsDatabaseInPreviewModel: false,
      invokesRepositoryInPreviewModel: false,
      persistsRollups: false,
      mutatesQuotaCounting: false,
      deletesRawEvents: false,
      wiresSchedulerOrBackgroundJob: false,
      wiresRetentionExecution: false,
    },
  };
}

function getProvidedFilterKeys(
  filters: Readonly<Record<string, RollupSummaryQueryCompatibilityFilterValue>>,
): string[] {
  return Object.entries(filters)
    .filter(([, value]) => isProvidedFilterValue(value))
    .map(([key]) => key)
    .sort();
}

function isProvidedFilterValue(
  value: RollupSummaryQueryCompatibilityFilterValue,
): boolean {
  if (value === null || typeof value === "undefined") {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return true;
}

function buildTimeWindowPreview(
  filters: Readonly<Record<string, RollupSummaryQueryCompatibilityFilterValue>>,
): RollupSummaryQueryCompatibilityPreview["timeWindow"] {
  const from = parseDateFilterValue(filters.from);
  const to = parseDateFilterValue(filters.to);
  const fromProvided = isProvidedFilterValue(filters.from);
  const toProvided = isProvidedFilterValue(filters.to);
  const bounded = from !== null && to !== null;
  const valid = bounded ? from.getTime() <= to.getTime() : false;

  return {
    requiresBoundedWindowForRollupPreview: true,
    fromProvided,
    toProvided,
    bounded,
    valid,
  };
}

function parseDateFilterValue(
  value: RollupSummaryQueryCompatibilityFilterValue,
): Date | null {
  if (!isProvidedFilterValue(value)) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function resolveFallbackReason(input: {
  readonly unsupportedFilterKeys: readonly string[];
  readonly timeWindow: RollupSummaryQueryCompatibilityPreview["timeWindow"];
}): RollupSummaryQueryCompatibilityFallbackReason | null {
  if (input.unsupportedFilterKeys.length > 0) {
    return "unsupported-query-filter";
  }

  if (!input.timeWindow.bounded) {
    return "missing-bounded-time-window";
  }

  if (!input.timeWindow.valid) {
    return "invalid-time-window";
  }

  return null;
}
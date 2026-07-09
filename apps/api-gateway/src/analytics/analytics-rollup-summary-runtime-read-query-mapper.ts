import {
  createAnalyticsRollupReadQuery,
  type AnalyticsRollupReadQuery,
} from "./analytics-rollup-read-query.js";
import type { AnalyticsRollupGranularity } from "./analytics-rollup-time-bucket.js";
import type {
  RollupSummaryRuntimeReadFallbackReason,
  RollupSummaryRuntimeReadPath,
} from "./analytics-rollup-summary-runtime-read-decision.js";
import type { RollupSummaryRuntimeReadDecisionMappedRequest } from "./analytics-rollup-summary-runtime-read-decision-request-mapper.js";
import type { RollupSummaryQueryCompatibilityFilterValue } from "./analytics-rollup-summary-query-compatibility-preview.js";

export type RollupSummaryRuntimeReadQueryMapperStatus =
  | "rollup-read-query-mapped"
  | "rollup-read-query-skipped";

export type RollupSummaryRuntimeReadQueryMapperInput = {
  readonly decisionRequest: RollupSummaryRuntimeReadDecisionMappedRequest;
  readonly subjectId?: string;
  readonly granularity?: AnalyticsRollupGranularity;
  readonly limit?: number;
  readonly maxBuckets?: number;
};

export type RollupSummaryRuntimeReadQueryMapperResult = {
  readonly status: RollupSummaryRuntimeReadQueryMapperStatus;
  readonly query: AnalyticsRollupReadQuery | null;
  readonly selectedReadPath: RollupSummaryRuntimeReadPath;
  readonly fallback: {
    readonly path: "raw-event-summary";
    readonly required: boolean;
    readonly reason: RollupSummaryRuntimeReadFallbackReason | null;
  };
  readonly mapperSafety: {
    readonly endpointRuntimeChangedByMapper: false;
    readonly readsDatabaseInMapper: false;
    readonly invokesRepositoryInMapper: false;
    readonly persistsRollups: false;
    readonly mutatesQuotaCounting: false;
    readonly deletesRawEvents: false;
    readonly wiresSchedulerOrBackgroundJob: false;
    readonly wiresRetentionExecution: false;
  };
};

export function mapRollupSummaryRuntimeReadDecisionToRollupReadQuery(
  input: RollupSummaryRuntimeReadQueryMapperInput,
): RollupSummaryRuntimeReadQueryMapperResult {
  const selectedReadPath = input.decisionRequest.decision.selectedReadPath.path;

  if (selectedReadPath !== "rollup-read-model") {
    return {
      status: "rollup-read-query-skipped",
      query: null,
      selectedReadPath,
      fallback: {
        path: "raw-event-summary",
        required: true,
        reason:
          input.decisionRequest.decision.fallback.reason ??
          "rollup-runtime-switch-disabled",
      },
      mapperSafety: buildMapperSafety(),
    };
  }

  const mappedFilters = input.decisionRequest.mappedFilters;
  const source =
    input.decisionRequest.target === "rejected-summary" ? "rejected" : "usage";
  const from = requireMappedDateFilter(mappedFilters.from, "from");
  const to = requireMappedDateFilter(mappedFilters.to, "to");
  const subjectFilters = buildSubjectFilters(input);

  return {
    status: "rollup-read-query-mapped",
    query: createAnalyticsRollupReadQuery({
      source,
      from,
      to,
      granularity: input.granularity ?? "hour",
      routePath: toOptionalString(mappedFilters.routePath),
      routeMethod: toOptionalString(mappedFilters.routeMethod),
      statusCode: toOptionalNumber(mappedFilters.statusCode),
      cacheStatus:
        source === "usage" ? toOptionalString(mappedFilters.cacheStatus) : undefined,
      apiKeyAuthSource: toOptionalString(mappedFilters.apiKeyAuthSource),
      apiKeyId:
        subjectFilters.apiKeyId ?? toOptionalString(mappedFilters.apiKeyId),
      consumerId:
        subjectFilters.consumerId ?? toOptionalString(mappedFilters.consumerId),
      rejectionReason:
        source === "rejected"
          ? toOptionalString(mappedFilters.rejectionReason)
          : undefined,
      limit: input.limit,
      maxBuckets: input.maxBuckets,
    }),
    selectedReadPath,
    fallback: {
      path: "raw-event-summary",
      required: false,
      reason: null,
    },
    mapperSafety: buildMapperSafety(),
  };
}

function buildSubjectFilters(input: RollupSummaryRuntimeReadQueryMapperInput): {
  readonly consumerId?: string;
  readonly apiKeyId?: string;
} {
  if (input.decisionRequest.target === "usage-consumer-summary") {
    if (!input.subjectId) {
      throw new RangeError("consumer usage summary rollup query requires subjectId");
    }

    return {
      consumerId: input.subjectId,
    };
  }

  if (input.decisionRequest.target === "usage-api-key-summary") {
    if (!input.subjectId) {
      throw new RangeError("API key usage summary rollup query requires subjectId");
    }

    return {
      apiKeyId: input.subjectId,
    };
  }

  return {};
}

function requireMappedDateFilter(
  value: RollupSummaryQueryCompatibilityFilterValue | undefined,
  name: "from" | "to",
): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string" && value.trim() !== "") {
    return value;
  }

  throw new RangeError(`${name} is required for rollup summary read query`);
}

function toOptionalString(
  value: RollupSummaryQueryCompatibilityFilterValue | undefined,
): string | undefined {
  if (typeof value === "string" && value.trim() !== "") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return undefined;
}

function toOptionalNumber(
  value: RollupSummaryQueryCompatibilityFilterValue | undefined,
): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function buildMapperSafety(): RollupSummaryRuntimeReadQueryMapperResult["mapperSafety"] {
  return {
    endpointRuntimeChangedByMapper: false,
    readsDatabaseInMapper: false,
    invokesRepositoryInMapper: false,
    persistsRollups: false,
    mutatesQuotaCounting: false,
    deletesRawEvents: false,
    wiresSchedulerOrBackgroundJob: false,
    wiresRetentionExecution: false,
  };
}
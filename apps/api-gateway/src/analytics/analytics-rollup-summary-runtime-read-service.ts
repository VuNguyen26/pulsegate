import type { ApiRejectedEventsListingFilters } from "../api-rejections/api-rejected-events-listing.types.js";
import type { ApiRejectedEventsSummaryReadModel } from "../api-rejections/api-rejected-events-summary.types.js";
import type {
  ApiUsageSummaryReadModel,
  ApiUsageSummarySubjectType,
} from "../api-usage/api-usage-summary.types.js";
import type {
  AnalyticsRollupReadRejectedResult,
  AnalyticsRollupReadService,
  AnalyticsRollupReadUsageResult,
} from "./analytics-rollup-read-service.js";
import type { AnalyticsRollupGranularity } from "./analytics-rollup-time-bucket.js";
import {
  mapRollupSummaryRuntimeReadDecisionToRollupReadQuery,
  type RollupSummaryRuntimeReadQueryMapperResult,
} from "./analytics-rollup-summary-runtime-read-query-mapper.js";
import type {
  RollupSummaryRuntimeReadResolverFallbackReason,
  RollupSummaryRuntimeReadResolverResult,
} from "./analytics-rollup-summary-runtime-read-resolver.js";
import {
  resolveRejectedSummaryRuntimeReadModel,
  resolveUsageSummaryRuntimeReadModel,
} from "./analytics-rollup-summary-runtime-read-resolver.js";
import type { RollupSummaryRuntimeReadDecisionMappedRequest } from "./analytics-rollup-summary-runtime-read-decision-request-mapper.js";

export type RollupSummaryRuntimeReadServiceStatus =
  | "rollup-summary-runtime-read-returned"
  | "raw-summary-runtime-fallback-returned";

export type RollupSummaryRuntimeReadServiceFallbackReason =
  | RollupSummaryRuntimeReadResolverFallbackReason
  | "rollup-read-query-skipped"
  | "rollup-read-service-error"
  | "rollup-read-service-source-mismatch";

export type RollupSummaryRuntimeReadServiceResult<TSummary> = {
  readonly status: RollupSummaryRuntimeReadServiceStatus;
  readonly summary: TSummary;
  readonly queryMapping: RollupSummaryRuntimeReadQueryMapperResult;
  readonly resolver: RollupSummaryRuntimeReadResolverResult<TSummary>;
  readonly rollupReadServiceInvocation: {
    readonly attempted: boolean;
    readonly succeeded: boolean;
    readonly source: "usage" | "rejected" | null;
    readonly recordCount: number | null;
    readonly error: {
      readonly name: string;
      readonly message: string;
    } | null;
  };
  readonly fallback: {
    readonly path: "raw-event-summary";
    readonly used: boolean;
    readonly reason: RollupSummaryRuntimeReadServiceFallbackReason | null;
  };
  readonly serviceSafety: {
    readonly endpointRuntimeChangedByService: false;
    readonly routeRuntimeWiredByService: false;
    readonly usesInjectedRollupReadServiceOnly: true;
    readonly readsDatabaseDirectlyInService: false;
    readonly repositoryInvocationDependsOnInjectedService: true;
    readonly persistsRollups: false;
    readonly mutatesQuotaCounting: false;
    readonly deletesRawEvents: false;
    readonly wiresSchedulerOrBackgroundJob: false;
    readonly wiresRetentionExecution: false;
    readonly preservesCurrentSummaryResponseShape: true;
  };
};

export type ResolveUsageSummaryWithRollupRuntimeReadServiceInput = {
  readonly decisionRequest: RollupSummaryRuntimeReadDecisionMappedRequest;
  readonly rawSummary: ApiUsageSummaryReadModel;
  readonly subjectType: ApiUsageSummarySubjectType;
  readonly subjectId: string;
  readonly rollupReadService: AnalyticsRollupReadService;
  readonly granularity?: AnalyticsRollupGranularity;
  readonly limit?: number;
  readonly maxBuckets?: number;
};

export type ResolveRejectedSummaryWithRollupRuntimeReadServiceInput = {
  readonly decisionRequest: RollupSummaryRuntimeReadDecisionMappedRequest;
  readonly rawSummary: ApiRejectedEventsSummaryReadModel;
  readonly filters?: ApiRejectedEventsListingFilters;
  readonly rollupReadService: AnalyticsRollupReadService;
  readonly granularity?: AnalyticsRollupGranularity;
  readonly limit?: number;
  readonly maxBuckets?: number;
};

export async function resolveUsageSummaryWithRollupRuntimeReadService(
  input: ResolveUsageSummaryWithRollupRuntimeReadServiceInput,
): Promise<RollupSummaryRuntimeReadServiceResult<ApiUsageSummaryReadModel>> {
  const queryMapping = mapRollupSummaryRuntimeReadDecisionToRollupReadQuery({
    decisionRequest: input.decisionRequest,
    subjectId: input.subjectId,
    granularity: input.granularity,
    limit: input.limit,
    maxBuckets: input.maxBuckets,
  });

  if (queryMapping.query === null) {
    const resolver = resolveUsageSummaryRuntimeReadModel({
      decisionRequest: input.decisionRequest,
      rawSummary: input.rawSummary,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      rollupRecords: [],
    });

    return buildFallbackServiceResult({
      queryMapping,
      resolver,
      reason: queryMapping.fallback.reason ?? "rollup-read-query-skipped",
      invocation: buildSkippedInvocation(),
    });
  }

  try {
    const rollupResult = await input.rollupReadService.readRollups(
      queryMapping.query,
    );

    if (rollupResult.source !== "usage") {
      const resolver = resolveUsageSummaryRuntimeReadModel({
        decisionRequest: input.decisionRequest,
        rawSummary: input.rawSummary,
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        rollupRecords: [],
      });

      return buildFallbackServiceResult({
        queryMapping,
        resolver,
        reason: "rollup-read-service-source-mismatch",
        invocation: buildSucceededInvocation(rollupResult),
      });
    }

    const resolver = resolveUsageSummaryRuntimeReadModel({
      decisionRequest: input.decisionRequest,
      rawSummary: input.rawSummary,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      rollupRecords: rollupResult.records,
    });

    return buildResolvedServiceResult({
      queryMapping,
      resolver,
      invocation: buildSucceededInvocation(rollupResult),
    });
  } catch (error) {
    const resolver = resolveUsageSummaryRuntimeReadModel({
      decisionRequest: input.decisionRequest,
      rawSummary: input.rawSummary,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      rollupRecords: [],
    });

    return buildFallbackServiceResult({
      queryMapping,
      resolver,
      reason: "rollup-read-service-error",
      invocation: buildFailedInvocation(error),
    });
  }
}

export async function resolveRejectedSummaryWithRollupRuntimeReadService(
  input: ResolveRejectedSummaryWithRollupRuntimeReadServiceInput,
): Promise<RollupSummaryRuntimeReadServiceResult<ApiRejectedEventsSummaryReadModel>> {
  const queryMapping = mapRollupSummaryRuntimeReadDecisionToRollupReadQuery({
    decisionRequest: input.decisionRequest,
    granularity: input.granularity,
    limit: input.limit,
    maxBuckets: input.maxBuckets,
  });

  if (queryMapping.query === null) {
    const resolver = resolveRejectedSummaryRuntimeReadModel({
      decisionRequest: input.decisionRequest,
      rawSummary: input.rawSummary,
      filters: input.filters,
      rollupRecords: [],
    });

    return buildFallbackServiceResult({
      queryMapping,
      resolver,
      reason: queryMapping.fallback.reason ?? "rollup-read-query-skipped",
      invocation: buildSkippedInvocation(),
    });
  }

  try {
    const rollupResult = await input.rollupReadService.readRollups(
      queryMapping.query,
    );

    if (rollupResult.source !== "rejected") {
      const resolver = resolveRejectedSummaryRuntimeReadModel({
        decisionRequest: input.decisionRequest,
        rawSummary: input.rawSummary,
        filters: input.filters,
        rollupRecords: [],
      });

      return buildFallbackServiceResult({
        queryMapping,
        resolver,
        reason: "rollup-read-service-source-mismatch",
        invocation: buildSucceededInvocation(rollupResult),
      });
    }

    const resolver = resolveRejectedSummaryRuntimeReadModel({
      decisionRequest: input.decisionRequest,
      rawSummary: input.rawSummary,
      filters: input.filters,
      rollupRecords: rollupResult.records,
    });

    return buildResolvedServiceResult({
      queryMapping,
      resolver,
      invocation: buildSucceededInvocation(rollupResult),
    });
  } catch (error) {
    const resolver = resolveRejectedSummaryRuntimeReadModel({
      decisionRequest: input.decisionRequest,
      rawSummary: input.rawSummary,
      filters: input.filters,
      rollupRecords: [],
    });

    return buildFallbackServiceResult({
      queryMapping,
      resolver,
      reason: "rollup-read-service-error",
      invocation: buildFailedInvocation(error),
    });
  }
}

function buildResolvedServiceResult<TSummary>(input: {
  readonly queryMapping: RollupSummaryRuntimeReadQueryMapperResult;
  readonly resolver: RollupSummaryRuntimeReadResolverResult<TSummary>;
  readonly invocation: RollupSummaryRuntimeReadServiceResult<TSummary>["rollupReadServiceInvocation"];
}): RollupSummaryRuntimeReadServiceResult<TSummary> {
  if (input.resolver.status === "rollup-summary-read-model-returned") {
    return {
      status: "rollup-summary-runtime-read-returned",
      summary: input.resolver.summary,
      queryMapping: input.queryMapping,
      resolver: input.resolver,
      rollupReadServiceInvocation: input.invocation,
      fallback: {
        path: "raw-event-summary",
        used: false,
        reason: null,
      },
      serviceSafety: buildServiceSafety(),
    };
  }

  return buildFallbackServiceResult({
    queryMapping: input.queryMapping,
    resolver: input.resolver,
    reason: input.resolver.fallback.reason ?? "rollup-data-empty",
    invocation: input.invocation,
  });
}

function buildFallbackServiceResult<TSummary>(input: {
  readonly queryMapping: RollupSummaryRuntimeReadQueryMapperResult;
  readonly resolver: RollupSummaryRuntimeReadResolverResult<TSummary>;
  readonly reason: RollupSummaryRuntimeReadServiceFallbackReason;
  readonly invocation: RollupSummaryRuntimeReadServiceResult<TSummary>["rollupReadServiceInvocation"];
}): RollupSummaryRuntimeReadServiceResult<TSummary> {
  return {
    status: "raw-summary-runtime-fallback-returned",
    summary: input.resolver.summary,
    queryMapping: input.queryMapping,
    resolver: input.resolver,
    rollupReadServiceInvocation: input.invocation,
    fallback: {
      path: "raw-event-summary",
      used: true,
      reason: input.reason,
    },
    serviceSafety: buildServiceSafety(),
  };
}

function buildSkippedInvocation(): RollupSummaryRuntimeReadServiceResult<unknown>["rollupReadServiceInvocation"] {
  return {
    attempted: false,
    succeeded: false,
    source: null,
    recordCount: null,
    error: null,
  };
}

function buildSucceededInvocation(
  result: AnalyticsRollupReadUsageResult | AnalyticsRollupReadRejectedResult,
): RollupSummaryRuntimeReadServiceResult<unknown>["rollupReadServiceInvocation"] {
  return {
    attempted: true,
    succeeded: true,
    source: result.source,
    recordCount: result.count,
    error: null,
  };
}

function buildFailedInvocation(
  error: unknown,
): RollupSummaryRuntimeReadServiceResult<unknown>["rollupReadServiceInvocation"] {
  return {
    attempted: true,
    succeeded: false,
    source: null,
    recordCount: null,
    error: normalizeError(error),
  };
}

function normalizeError(error: unknown): {
  readonly name: string;
  readonly message: string;
} {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  return {
    name: "Error",
    message: "Unknown rollup read service error",
  };
}

function buildServiceSafety(): RollupSummaryRuntimeReadServiceResult<unknown>["serviceSafety"] {
  return {
    endpointRuntimeChangedByService: false,
    routeRuntimeWiredByService: false,
    usesInjectedRollupReadServiceOnly: true,
    readsDatabaseDirectlyInService: false,
    repositoryInvocationDependsOnInjectedService: true,
    persistsRollups: false,
    mutatesQuotaCounting: false,
    deletesRawEvents: false,
    wiresSchedulerOrBackgroundJob: false,
    wiresRetentionExecution: false,
    preservesCurrentSummaryResponseShape: true,
  };
}
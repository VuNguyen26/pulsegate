import type { AnalyticsRetentionDeletePlanSource } from './analytics-retention-delete-batch-plan.js';
import type {
  AnalyticsRetentionDeleteRepositoryExecutionResult,
  AnalyticsRetentionDeleteRepositoryPreparedOperation,
} from './analytics-retention-delete.repository.js';
import type {
  AnalyticsRetentionExecutionServicePreview,
  AnalyticsRetentionPreparedOperationError,
} from './analytics-retention-execution-service.js';

export interface AnalyticsRetentionExecutionServiceSummaryTotals {
  readonly candidateCount: number;
  readonly maxDeleteCount: number;
  readonly repositoryOperationCount: number;
  readonly preparedOperationCount: number;
  readonly executionResultCount: number;
  readonly deletedCount: number;
}

export interface AnalyticsRetentionExecutionServiceSummaryReasons {
  readonly executionGuard: readonly string[];
  readonly deleteBatchPlan: readonly string[];
  readonly deleteOperationPlan: readonly string[];
}

export interface AnalyticsRetentionPreparedOperationSummary {
  readonly source: AnalyticsRetentionDeletePlanSource;
  readonly cutoffExclusive: string | null;
  readonly requestedLimit: number;
  readonly candidateCountBeforeDelete: number;
  readonly candidateRecheckCompleted: true;
  readonly deleteAllowed: boolean;
  readonly blockedReasons: readonly string[];
}

export interface AnalyticsRetentionExecutionResultSummary {
  readonly source: AnalyticsRetentionDeletePlanSource;
  readonly cutoffExclusive: string | null;
  readonly requestedLimit: number;
  readonly candidateCountBeforeDelete: number;
  readonly deletedCount: number;
  readonly candidateRecheckRequired: true;
  readonly deleteAllowed: boolean;
  readonly blockedReasons: readonly string[];
}

export interface AnalyticsRetentionPreparedOperationErrorSummary {
  readonly source: AnalyticsRetentionDeletePlanSource;
  readonly requestedLimit: number;
  readonly message: string;
  readonly failClosedReason: AnalyticsRetentionPreparedOperationError['failClosedReason'];
  readonly deleteAllowed: false;
}

export interface AnalyticsRetentionExecutionSourceSummary {
  readonly source: AnalyticsRetentionDeletePlanSource;
  readonly retentionDays: number | null;
  readonly cutoffExclusive: string | null;
  readonly candidateCount: number | null;
  readonly maxDeleteCount: number | null;
  readonly repositoryOperationPlanned: boolean;
  readonly repositoryRequestedLimit: number | null;
  readonly preparedOperation: AnalyticsRetentionPreparedOperationSummary | null;
  readonly preparedOperationError: AnalyticsRetentionPreparedOperationErrorSummary | null;
  readonly executionResult: AnalyticsRetentionExecutionResultSummary | null;
}

export interface AnalyticsRetentionExecutionServiceSummary {
  readonly enabled: boolean;
  readonly mode: AnalyticsRetentionExecutionServicePreview['executionArgs']['mode'];
  readonly source: AnalyticsRetentionExecutionServicePreview['plan']['source'];
  readonly generatedAt: string | null;
  readonly dryRunOnly: boolean;
  readonly deleteAllowed: boolean;
  readonly deleteImplementationAvailable: boolean;
  readonly destructiveExecutionPerformed: false;
  readonly hardDeleteLimit: number | null;
  readonly totals: AnalyticsRetentionExecutionServiceSummaryTotals;
  readonly reasons: AnalyticsRetentionExecutionServiceSummaryReasons;
  readonly preparedOperationErrors: readonly AnalyticsRetentionPreparedOperationErrorSummary[];
  readonly sources: readonly AnalyticsRetentionExecutionSourceSummary[];
}

export function buildAnalyticsRetentionExecutionServiceSummary(
  preview: AnalyticsRetentionExecutionServicePreview,
): AnalyticsRetentionExecutionServiceSummary {
  return {
    enabled: preview.policy.enabled,
    mode: preview.executionArgs.mode,
    source: preview.plan.source,
    generatedAt: toIsoStringOrNull(preview.plan.generatedAt),
    dryRunOnly: preview.dryRunOnly,
    deleteAllowed: preview.deleteAllowed,
    deleteImplementationAvailable: preview.deleteImplementationAvailable,
    destructiveExecutionPerformed: false,
    hardDeleteLimit: preview.executionGuard.hardDeleteLimit,
    totals: buildTotals(preview),
    reasons: {
      executionGuard: [...preview.executionGuard.reasons],
      deleteBatchPlan: [...preview.deleteBatchPlan.reasons],
      deleteOperationPlan: [...preview.deleteOperationPlan.reasons],
    },
    preparedOperationErrors: preview.preparedOperationErrors.map(
      summarizePreparedOperationError,
    ),
    sources: getSummarySources(preview).map((source) =>
      buildSourceSummary(preview, source),
    ),
  };
}

function buildTotals(
  preview: AnalyticsRetentionExecutionServicePreview,
): AnalyticsRetentionExecutionServiceSummaryTotals {
  return {
    candidateCount: preview.deleteBatchPlan.totalCandidateCount,
    maxDeleteCount: preview.deleteBatchPlan.totalMaxDeleteCount,
    repositoryOperationCount:
      preview.deleteOperationPlan.repositoryOperationRequests.length,
    preparedOperationCount: preview.preparedOperations.length,
    executionResultCount: preview.executionResults.length,
    deletedCount: preview.executionResults.reduce(
      (total, result) => total + result.deletedCount,
      0,
    ),
  };
}

function getSummarySources(
  preview: AnalyticsRetentionExecutionServicePreview,
): readonly AnalyticsRetentionDeletePlanSource[] {
  const sources: AnalyticsRetentionDeletePlanSource[] = [];

  if (shouldIncludeSource(preview, 'usage')) {
    sources.push('usage');
  }

  if (shouldIncludeSource(preview, 'rejected')) {
    sources.push('rejected');
  }

  return sources;
}

function shouldIncludeSource(
  preview: AnalyticsRetentionExecutionServicePreview,
  source: AnalyticsRetentionDeletePlanSource,
): boolean {
  if (source === 'usage' && preview.plan.usage !== null) {
    return true;
  }

  if (source === 'rejected' && preview.plan.rejected !== null) {
    return true;
  }

  return (
    preview.deleteBatchPlan.sourcePlans.some(
      (sourcePlan) => sourcePlan.source === source,
    ) ||
    preview.deleteOperationPlan.repositoryOperationRequests.some(
      (request) => request.source === source,
    ) ||
    preview.preparedOperations.some((operation) => operation.source === source) ||
    preview.preparedOperationErrors.some((error) => error.source === source) ||
    preview.executionResults.some((result) => result.source === source)
  );
}

function buildSourceSummary(
  preview: AnalyticsRetentionExecutionServicePreview,
  source: AnalyticsRetentionDeletePlanSource,
): AnalyticsRetentionExecutionSourceSummary {
  const retentionSourcePlan =
    source === 'usage' ? preview.plan.usage : preview.plan.rejected;
  const deleteSourcePlan =
    preview.deleteBatchPlan.sourcePlans.find(
      (sourcePlan) => sourcePlan.source === source,
    ) ?? null;
  const operationRequest =
    preview.deleteOperationPlan.repositoryOperationRequests.find(
      (request) => request.source === source,
    ) ?? null;

  return {
    source,
    retentionDays: retentionSourcePlan?.retentionDays ?? null,
    cutoffExclusive: toIsoStringOrNull(retentionSourcePlan?.cutoffExclusive),
    candidateCount: deleteSourcePlan?.candidateCount ?? null,
    maxDeleteCount: deleteSourcePlan?.maxDeleteCount ?? null,
    repositoryOperationPlanned: operationRequest !== null,
    repositoryRequestedLimit: operationRequest?.requestedLimit ?? null,
    preparedOperation: summarizePreparedOperation(preview, source),
    preparedOperationError: summarizePreparedOperationErrorForSource(
      preview,
      source,
    ),
    executionResult: summarizeExecutionResult(preview, source),
  };
}

function summarizePreparedOperation(
  preview: AnalyticsRetentionExecutionServicePreview,
  source: AnalyticsRetentionDeletePlanSource,
): AnalyticsRetentionPreparedOperationSummary | null {
  const operation = findSourceItem(preview.preparedOperations, source);

  if (operation === null) {
    return null;
  }

  return {
    source: operation.source,
    cutoffExclusive: toIsoStringOrNull(operation.cutoffExclusive),
    requestedLimit: operation.requestedLimit,
    candidateCountBeforeDelete: operation.candidateCountBeforeDelete,
    candidateRecheckCompleted: true,
    deleteAllowed: operation.deleteAllowed,
    blockedReasons: [...operation.blockedReasons],
  };
}

function summarizePreparedOperationError(
  error: AnalyticsRetentionPreparedOperationError,
): AnalyticsRetentionPreparedOperationErrorSummary {
  return {
    source: error.source,
    requestedLimit: error.requestedLimit,
    message: error.message,
    failClosedReason: error.failClosedReason,
    deleteAllowed: false,
  };
}

function summarizePreparedOperationErrorForSource(
  preview: AnalyticsRetentionExecutionServicePreview,
  source: AnalyticsRetentionDeletePlanSource,
): AnalyticsRetentionPreparedOperationErrorSummary | null {
  const error = findSourceItem(preview.preparedOperationErrors, source);

  if (error === null) {
    return null;
  }

  return summarizePreparedOperationError(error);
}

function summarizeExecutionResult(
  preview: AnalyticsRetentionExecutionServicePreview,
  source: AnalyticsRetentionDeletePlanSource,
): AnalyticsRetentionExecutionResultSummary | null {
  const result = findSourceItem(preview.executionResults, source);

  if (result === null) {
    return null;
  }

  return {
    source: result.source,
    cutoffExclusive: toIsoStringOrNull(result.cutoffExclusive),
    requestedLimit: result.requestedLimit,
    candidateCountBeforeDelete: result.candidateCountBeforeDelete,
    deletedCount: result.deletedCount,
    candidateRecheckRequired: true,
    deleteAllowed: result.deleteAllowed,
    blockedReasons: [...result.blockedReasons],
  };
}

function findSourceItem<
  T extends
    | AnalyticsRetentionDeleteRepositoryPreparedOperation
    | AnalyticsRetentionPreparedOperationError
    | AnalyticsRetentionDeleteRepositoryExecutionResult,
>(
  items: readonly T[],
  source: AnalyticsRetentionDeletePlanSource,
): T | null {
  return items.find((item) => item.source === source) ?? null;
}

function toIsoStringOrNull(value: Date | null | undefined): string | null {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return null;
  }

  return value.toISOString();
}

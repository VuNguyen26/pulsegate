import type {
  AnalyticsRetentionDeleteBatchPlan,
  AnalyticsRetentionDeletePlanReason,
  AnalyticsRetentionDeletePlanSource,
  AnalyticsRetentionDeleteSourcePlan,
} from './analytics-retention-delete-batch-plan.js';
import type {
  AnalyticsRetentionPlan,
  AnalyticsRetentionSourcePlan,
} from './analytics-retention-policy.js';

export type AnalyticsRetentionDeleteOperationPlanReason =
  | AnalyticsRetentionDeletePlanReason
  | 'DELETE_BATCH_PLAN_BLOCKED'
  | 'USAGE_RETENTION_SOURCE_PLAN_REQUIRED'
  | 'REJECTED_RETENTION_SOURCE_PLAN_REQUIRED'
  | 'USAGE_CUTOFF_EXCLUSIVE_INVALID'
  | 'REJECTED_CUTOFF_EXCLUSIVE_INVALID'
  | 'NO_REPOSITORY_DELETE_OPERATIONS';

export interface AnalyticsRetentionRepositoryOperationRequest {
  readonly deleteBatchPlan: AnalyticsRetentionDeleteBatchPlan;
  readonly source: AnalyticsRetentionDeletePlanSource;
  readonly cutoffExclusive: Date;
  readonly requestedLimit: number;
}

export interface AnalyticsRetentionDeleteOperationPlanInput {
  readonly retentionPlan: AnalyticsRetentionPlan;
  readonly deleteBatchPlan: AnalyticsRetentionDeleteBatchPlan;
}

export interface AnalyticsRetentionDeleteOperationPlan {
  readonly deleteAllowed: boolean;
  readonly candidateRecheckRequired: true;
  readonly repositoryOperationRequests: readonly AnalyticsRetentionRepositoryOperationRequest[];
  readonly reasons: readonly AnalyticsRetentionDeleteOperationPlanReason[];
}

export function buildAnalyticsRetentionDeleteOperationPlan(
  input: AnalyticsRetentionDeleteOperationPlanInput,
): AnalyticsRetentionDeleteOperationPlan {
  const reasons: AnalyticsRetentionDeleteOperationPlanReason[] = [];

  if (!input.deleteBatchPlan.deleteAllowed) {
    return {
      deleteAllowed: false,
      candidateRecheckRequired: true,
      repositoryOperationRequests: [],
      reasons: ['DELETE_BATCH_PLAN_BLOCKED', ...input.deleteBatchPlan.reasons],
    };
  }

  const repositoryOperationRequests: AnalyticsRetentionRepositoryOperationRequest[] = [];

  for (const sourcePlan of input.deleteBatchPlan.sourcePlans) {
    if (sourcePlan.maxDeleteCount === 0) {
      continue;
    }

    const retentionSourcePlan = getRetentionSourcePlan(
      input.retentionPlan,
      sourcePlan.source,
    );

    if (retentionSourcePlan === null) {
      reasons.push(getMissingRetentionSourcePlanReason(sourcePlan.source));
      continue;
    }

    if (!isValidDate(retentionSourcePlan.cutoffExclusive)) {
      reasons.push(getInvalidCutoffReason(sourcePlan.source));
      continue;
    }

    repositoryOperationRequests.push(
      buildRepositoryOperationRequest(
        input.deleteBatchPlan,
        sourcePlan,
        retentionSourcePlan,
      ),
    );
  }

  if (repositoryOperationRequests.length === 0) {
    reasons.push('NO_REPOSITORY_DELETE_OPERATIONS');
  }

  return {
    deleteAllowed: reasons.length === 0,
    candidateRecheckRequired: true,
    repositoryOperationRequests,
    reasons,
  };
}

function buildRepositoryOperationRequest(
  deleteBatchPlan: AnalyticsRetentionDeleteBatchPlan,
  sourcePlan: AnalyticsRetentionDeleteSourcePlan,
  retentionSourcePlan: AnalyticsRetentionSourcePlan,
): AnalyticsRetentionRepositoryOperationRequest {
  return {
    deleteBatchPlan,
    source: sourcePlan.source,
    cutoffExclusive: cloneDate(retentionSourcePlan.cutoffExclusive),
    requestedLimit: sourcePlan.maxDeleteCount,
  };
}

function getRetentionSourcePlan(
  retentionPlan: AnalyticsRetentionPlan,
  source: AnalyticsRetentionDeletePlanSource,
): AnalyticsRetentionSourcePlan | null {
  return source === 'usage' ? retentionPlan.usage : retentionPlan.rejected;
}

function getMissingRetentionSourcePlanReason(
  source: AnalyticsRetentionDeletePlanSource,
): AnalyticsRetentionDeleteOperationPlanReason {
  return source === 'usage'
    ? 'USAGE_RETENTION_SOURCE_PLAN_REQUIRED'
    : 'REJECTED_RETENTION_SOURCE_PLAN_REQUIRED';
}

function getInvalidCutoffReason(
  source: AnalyticsRetentionDeletePlanSource,
): AnalyticsRetentionDeleteOperationPlanReason {
  return source === 'usage'
    ? 'USAGE_CUTOFF_EXCLUSIVE_INVALID'
    : 'REJECTED_CUTOFF_EXCLUSIVE_INVALID';
}

function isValidDate(value: Date): boolean {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function cloneDate(value: Date): Date {
  return new Date(value.getTime());
}

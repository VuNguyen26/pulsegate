import type {
  AnalyticsRetentionDeleteBatchPlan,
  AnalyticsRetentionDeletePlanReason,
  AnalyticsRetentionDeletePlanSource,
} from './analytics-retention-delete-batch-plan.js';

export type AnalyticsRetentionDeleteRepositorySafetyReason =
  | AnalyticsRetentionDeletePlanReason
  | 'DELETE_BATCH_PLAN_BLOCKED'
  | 'SOURCE_NOT_SELECTED'
  | 'CUTOFF_EXCLUSIVE_INVALID'
  | 'REQUESTED_LIMIT_INVALID'
  | 'REQUESTED_LIMIT_EXCEEDS_HARD_DELETE_LIMIT'
  | 'REQUESTED_LIMIT_EXCEEDS_SOURCE_PLAN'
  | 'CANDIDATE_RECHECK_REQUIRED'
  | 'CANDIDATE_COUNT_BEFORE_DELETE_INVALID'
  | 'NO_RECHECKED_CANDIDATES'
  | 'REQUESTED_LIMIT_EXCEEDS_RECHECKED_CANDIDATES';

export interface AnalyticsRetentionDeleteRepositorySafetyInput {
  readonly deleteBatchPlan: AnalyticsRetentionDeleteBatchPlan;
  readonly source: AnalyticsRetentionDeletePlanSource;
  readonly cutoffExclusive: Date;
  readonly requestedLimit: number;
  readonly candidateRecheckCompleted?: boolean;
  readonly candidateCountBeforeDelete: number;
}

export interface AnalyticsRetentionDeleteRepositorySafetyDecision {
  readonly source: AnalyticsRetentionDeletePlanSource;
  readonly cutoffExclusive: Date;
  readonly requestedLimit: number;
  readonly candidateCountBeforeDelete: number;
  readonly deletedCount: 0;
  readonly candidateRecheckRequired: true;
  readonly deleteAllowed: boolean;
  readonly blockedReasons: readonly AnalyticsRetentionDeleteRepositorySafetyReason[];
}

export function evaluateAnalyticsRetentionDeleteRepositorySafety(
  input: AnalyticsRetentionDeleteRepositorySafetyInput,
): AnalyticsRetentionDeleteRepositorySafetyDecision {
  const blockedReasons: AnalyticsRetentionDeleteRepositorySafetyReason[] = [];
  const sourcePlan = input.deleteBatchPlan.sourcePlans.find(
    (plan) => plan.source === input.source,
  );

  if (!input.deleteBatchPlan.deleteAllowed) {
    blockedReasons.push(
      'DELETE_BATCH_PLAN_BLOCKED',
      ...input.deleteBatchPlan.reasons,
    );
  }

  if (sourcePlan === undefined) {
    blockedReasons.push('SOURCE_NOT_SELECTED');
  }

  if (!isValidDate(input.cutoffExclusive)) {
    blockedReasons.push('CUTOFF_EXCLUSIVE_INVALID');
  }

  if (!isPositiveSafeInteger(input.requestedLimit)) {
    blockedReasons.push('REQUESTED_LIMIT_INVALID');
  }

  if (
    input.deleteBatchPlan.hardDeleteLimit === null ||
    input.requestedLimit > input.deleteBatchPlan.hardDeleteLimit
  ) {
    blockedReasons.push('REQUESTED_LIMIT_EXCEEDS_HARD_DELETE_LIMIT');
  }

  if (sourcePlan !== undefined && input.requestedLimit > sourcePlan.maxDeleteCount) {
    blockedReasons.push('REQUESTED_LIMIT_EXCEEDS_SOURCE_PLAN');
  }

  if (input.candidateRecheckCompleted !== true) {
    blockedReasons.push('CANDIDATE_RECHECK_REQUIRED');
  }

  if (!isNonNegativeSafeInteger(input.candidateCountBeforeDelete)) {
    blockedReasons.push('CANDIDATE_COUNT_BEFORE_DELETE_INVALID');
  } else if (input.candidateCountBeforeDelete === 0) {
    blockedReasons.push('NO_RECHECKED_CANDIDATES');
  } else if (input.requestedLimit > input.candidateCountBeforeDelete) {
    blockedReasons.push('REQUESTED_LIMIT_EXCEEDS_RECHECKED_CANDIDATES');
  }

  return {
    source: input.source,
    cutoffExclusive: cloneDate(input.cutoffExclusive),
    requestedLimit: input.requestedLimit,
    candidateCountBeforeDelete: input.candidateCountBeforeDelete,
    deletedCount: 0,
    candidateRecheckRequired: true,
    deleteAllowed: blockedReasons.length === 0,
    blockedReasons,
  };
}

function isValidDate(value: Date): boolean {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function cloneDate(value: Date): Date {
  return new Date(value.getTime());
}

function isPositiveSafeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

function isNonNegativeSafeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

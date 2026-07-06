import type {
  AnalyticsRetentionExecutionGuardDecision,
  AnalyticsRetentionExecutionGuardReason,
} from './analytics-retention-execution-guard.js';

export type AnalyticsRetentionDeletePlanSource = 'usage' | 'rejected';

export type AnalyticsRetentionDeletePlanReason =
  | AnalyticsRetentionExecutionGuardReason
  | 'EXECUTION_GUARD_BLOCKED'
  | 'HARD_DELETE_LIMIT_NOT_AVAILABLE'
  | 'USAGE_CANDIDATE_COUNT_REQUIRED'
  | 'REJECTED_CANDIDATE_COUNT_REQUIRED'
  | 'USAGE_CANDIDATE_COUNT_INVALID'
  | 'REJECTED_CANDIDATE_COUNT_INVALID'
  | 'NO_DELETE_CANDIDATES';

export interface AnalyticsRetentionDeleteBatchPlanInput {
  readonly executionGuard: AnalyticsRetentionExecutionGuardDecision;
  readonly usageCandidateCount?: number;
  readonly rejectedCandidateCount?: number;
}

export interface AnalyticsRetentionDeleteSourcePlan {
  readonly source: AnalyticsRetentionDeletePlanSource;
  readonly candidateCount: number;
  readonly maxDeleteCount: number;
  readonly candidateRecheckRequired: true;
}

export interface AnalyticsRetentionDeleteBatchPlan {
  readonly source: AnalyticsRetentionExecutionGuardDecision['source'];
  readonly deleteAllowed: boolean;
  readonly hardDeleteLimit: number | null;
  readonly totalCandidateCount: number;
  readonly totalMaxDeleteCount: number;
  readonly sourcePlans: readonly AnalyticsRetentionDeleteSourcePlan[];
  readonly candidateRecheckRequired: true;
  readonly reasons: readonly AnalyticsRetentionDeletePlanReason[];
}

interface CandidateCountValidationResult {
  readonly candidateCount: number;
  readonly reason?: AnalyticsRetentionDeletePlanReason;
}

export function buildAnalyticsRetentionDeleteBatchPlan(
  input: AnalyticsRetentionDeleteBatchPlanInput,
): AnalyticsRetentionDeleteBatchPlan {
  const guard = input.executionGuard;
  const reasons: AnalyticsRetentionDeletePlanReason[] = [];

  if (!guard.deleteAllowed) {
    reasons.push('EXECUTION_GUARD_BLOCKED', ...guard.reasons);
  }

  if (guard.hardDeleteLimit === null) {
    reasons.push('HARD_DELETE_LIMIT_NOT_AVAILABLE');
  }

  const selectedSources = getSelectedSources(guard.source);
  const candidateCounts = new Map<AnalyticsRetentionDeletePlanSource, number>();

  for (const source of selectedSources) {
    const validation = validateCandidateCount(input, source);

    candidateCounts.set(source, validation.candidateCount);

    if (validation.reason) {
      reasons.push(validation.reason);
    }
  }

  const totalCandidateCount = [...candidateCounts.values()].reduce(
    (total, count) => total + count,
    0,
  );

  if (totalCandidateCount === 0) {
    reasons.push('NO_DELETE_CANDIDATES');
  }

  const sourcePlans =
    guard.hardDeleteLimit === null
      ? []
      : buildSourcePlans(selectedSources, candidateCounts, guard.hardDeleteLimit);

  const totalMaxDeleteCount = sourcePlans.reduce(
    (total, plan) => total + plan.maxDeleteCount,
    0,
  );

  return {
    source: guard.source,
    deleteAllowed: reasons.length === 0 && totalMaxDeleteCount > 0,
    hardDeleteLimit: guard.hardDeleteLimit,
    totalCandidateCount,
    totalMaxDeleteCount,
    sourcePlans,
    candidateRecheckRequired: true,
    reasons,
  };
}

function getSelectedSources(
  source: AnalyticsRetentionExecutionGuardDecision['source'],
): readonly AnalyticsRetentionDeletePlanSource[] {
  switch (source) {
    case 'usage':
      return ['usage'];
    case 'rejected':
      return ['rejected'];
    case 'both':
      return ['usage', 'rejected'];
  }
}

function validateCandidateCount(
  input: AnalyticsRetentionDeleteBatchPlanInput,
  source: AnalyticsRetentionDeletePlanSource,
): CandidateCountValidationResult {
  const value =
    source === 'usage'
      ? input.usageCandidateCount
      : input.rejectedCandidateCount;

  if (value === undefined) {
    return {
      candidateCount: 0,
      reason:
        source === 'usage'
          ? 'USAGE_CANDIDATE_COUNT_REQUIRED'
          : 'REJECTED_CANDIDATE_COUNT_REQUIRED',
    };
  }

  if (!Number.isSafeInteger(value) || value < 0) {
    return {
      candidateCount: 0,
      reason:
        source === 'usage'
          ? 'USAGE_CANDIDATE_COUNT_INVALID'
          : 'REJECTED_CANDIDATE_COUNT_INVALID',
    };
  }

  return {
    candidateCount: value,
  };
}

function buildSourcePlans(
  selectedSources: readonly AnalyticsRetentionDeletePlanSource[],
  candidateCounts: ReadonlyMap<AnalyticsRetentionDeletePlanSource, number>,
  hardDeleteLimit: number,
): readonly AnalyticsRetentionDeleteSourcePlan[] {
  const sourcePlans: AnalyticsRetentionDeleteSourcePlan[] = [];
  let remainingLimit = hardDeleteLimit;

  for (const source of selectedSources) {
    const candidateCount = candidateCounts.get(source) ?? 0;
    const maxDeleteCount = Math.min(candidateCount, remainingLimit);

    sourcePlans.push({
      source,
      candidateCount,
      maxDeleteCount,
      candidateRecheckRequired: true,
    });

    remainingLimit -= maxDeleteCount;
  }

  return sourcePlans;
}

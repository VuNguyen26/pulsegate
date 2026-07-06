import type {
  AnalyticsRetentionCandidateReadRepository,
  AnalyticsRetentionCandidateReadResult,
  AnalyticsRetentionCandidateSummary,
} from './analytics-retention-candidate-read.repository.js';
import type {
  AnalyticsRetentionConcreteSource,
  AnalyticsRetentionPlan,
  AnalyticsRetentionSourcePlan,
} from './analytics-retention-policy.js';

export type AnalyticsRetentionExecutionCandidateCountLoaderReason =
  | 'USAGE_CANDIDATE_SUMMARY_MISSING'
  | 'REJECTED_CANDIDATE_SUMMARY_MISSING'
  | 'USAGE_CANDIDATE_SUMMARY_UNEXPECTED'
  | 'REJECTED_CANDIDATE_SUMMARY_UNEXPECTED'
  | 'USAGE_CANDIDATE_SUMMARY_SOURCE_MISMATCH'
  | 'REJECTED_CANDIDATE_SUMMARY_SOURCE_MISMATCH'
  | 'USAGE_CUTOFF_EXCLUSIVE_MISMATCH'
  | 'REJECTED_CUTOFF_EXCLUSIVE_MISMATCH'
  | 'USAGE_CANDIDATE_COUNT_INVALID'
  | 'REJECTED_CANDIDATE_COUNT_INVALID';

export interface AnalyticsRetentionExecutionCandidateCounts {
  readonly usageCandidateCount?: number;
  readonly rejectedCandidateCount?: number;
}

export interface AnalyticsRetentionExecutionCandidateCountLoaderInput {
  readonly plan: AnalyticsRetentionPlan;
  readonly candidateReadRepository: AnalyticsRetentionCandidateReadRepository;
}

export interface AnalyticsRetentionExecutionCandidateCountLoaderResult {
  readonly enabled: boolean;
  readonly generatedAt: Date;
  readonly candidates: AnalyticsRetentionCandidateReadResult;
  readonly counts: AnalyticsRetentionExecutionCandidateCounts;
  readonly reasons: readonly AnalyticsRetentionExecutionCandidateCountLoaderReason[];
  readonly dryRunOnly: true;
  readonly deleteAllowed: false;
}

export async function loadAnalyticsRetentionExecutionCandidateCounts(
  input: AnalyticsRetentionExecutionCandidateCountLoaderInput,
): Promise<AnalyticsRetentionExecutionCandidateCountLoaderResult> {
  const candidates = await input.candidateReadRepository.summarizeCandidates(
    input.plan,
  );
  const normalization = normalizeCandidateCounts(input.plan, candidates);

  return {
    enabled: candidates.enabled,
    generatedAt: cloneDate(candidates.generatedAt),
    candidates,
    counts: normalization.counts,
    reasons: normalization.reasons,
    dryRunOnly: true,
    deleteAllowed: false,
  };
}

function normalizeCandidateCounts(
  plan: AnalyticsRetentionPlan,
  candidates: AnalyticsRetentionCandidateReadResult,
): {
  readonly counts: AnalyticsRetentionExecutionCandidateCounts;
  readonly reasons: readonly AnalyticsRetentionExecutionCandidateCountLoaderReason[];
} {
  const reasons: AnalyticsRetentionExecutionCandidateCountLoaderReason[] = [];
  const usageCandidateCount = normalizeSourceCandidateCount({
    source: 'usage',
    sourcePlan: plan.usage,
    candidateSummary: candidates.usage,
    reasons,
  });
  const rejectedCandidateCount = normalizeSourceCandidateCount({
    source: 'rejected',
    sourcePlan: plan.rejected,
    candidateSummary: candidates.rejected,
    reasons,
  });

  return {
    counts: {
      ...(usageCandidateCount === undefined ? {} : { usageCandidateCount }),
      ...(rejectedCandidateCount === undefined
        ? {}
        : { rejectedCandidateCount }),
    },
    reasons,
  };
}

function normalizeSourceCandidateCount(input: {
  readonly source: AnalyticsRetentionConcreteSource;
  readonly sourcePlan: AnalyticsRetentionSourcePlan | null;
  readonly candidateSummary: AnalyticsRetentionCandidateSummary | null;
  readonly reasons: AnalyticsRetentionExecutionCandidateCountLoaderReason[];
}): number | undefined {
  if (input.sourcePlan === null) {
    if (input.candidateSummary !== null) {
      input.reasons.push(getUnexpectedSummaryReason(input.source));
    }

    return undefined;
  }

  if (input.candidateSummary === null) {
    input.reasons.push(getMissingSummaryReason(input.source));
    return undefined;
  }

  if (input.candidateSummary.source !== input.source) {
    input.reasons.push(getSourceMismatchReason(input.source));
    return undefined;
  }

  if (
    input.candidateSummary.cutoffExclusive.getTime() !==
    input.sourcePlan.cutoffExclusive.getTime()
  ) {
    input.reasons.push(getCutoffMismatchReason(input.source));
    return undefined;
  }

  if (!Number.isSafeInteger(input.candidateSummary.candidateCount)) {
    input.reasons.push(getInvalidCandidateCountReason(input.source));
    return undefined;
  }

  if (input.candidateSummary.candidateCount < 0) {
    input.reasons.push(getInvalidCandidateCountReason(input.source));
    return undefined;
  }

  return input.candidateSummary.candidateCount;
}

function getMissingSummaryReason(
  source: AnalyticsRetentionConcreteSource,
): AnalyticsRetentionExecutionCandidateCountLoaderReason {
  return source === 'usage'
    ? 'USAGE_CANDIDATE_SUMMARY_MISSING'
    : 'REJECTED_CANDIDATE_SUMMARY_MISSING';
}

function getUnexpectedSummaryReason(
  source: AnalyticsRetentionConcreteSource,
): AnalyticsRetentionExecutionCandidateCountLoaderReason {
  return source === 'usage'
    ? 'USAGE_CANDIDATE_SUMMARY_UNEXPECTED'
    : 'REJECTED_CANDIDATE_SUMMARY_UNEXPECTED';
}

function getSourceMismatchReason(
  source: AnalyticsRetentionConcreteSource,
): AnalyticsRetentionExecutionCandidateCountLoaderReason {
  return source === 'usage'
    ? 'USAGE_CANDIDATE_SUMMARY_SOURCE_MISMATCH'
    : 'REJECTED_CANDIDATE_SUMMARY_SOURCE_MISMATCH';
}

function getCutoffMismatchReason(
  source: AnalyticsRetentionConcreteSource,
): AnalyticsRetentionExecutionCandidateCountLoaderReason {
  return source === 'usage'
    ? 'USAGE_CUTOFF_EXCLUSIVE_MISMATCH'
    : 'REJECTED_CUTOFF_EXCLUSIVE_MISMATCH';
}

function getInvalidCandidateCountReason(
  source: AnalyticsRetentionConcreteSource,
): AnalyticsRetentionExecutionCandidateCountLoaderReason {
  return source === 'usage'
    ? 'USAGE_CANDIDATE_COUNT_INVALID'
    : 'REJECTED_CANDIDATE_COUNT_INVALID';
}

function cloneDate(value: Date): Date {
  return new Date(value.getTime());
}

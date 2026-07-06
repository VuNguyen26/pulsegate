import type { AnalyticsRetentionCandidateReadRepository } from './analytics-retention-candidate-read.repository.js';
import {
  loadAnalyticsRetentionExecutionCandidateCounts,
  type AnalyticsRetentionExecutionCandidateCountLoaderResult,
} from './analytics-retention-execution-candidate-count-loader.js';
import {
  buildAnalyticsRetentionExecutionServicePreview,
  type AnalyticsRetentionDeleteRepositoryPreparationExecutor,
  type AnalyticsRetentionExecutionServicePolicyInput,
  type AnalyticsRetentionExecutionServicePreview,
} from './analytics-retention-execution-service.js';
import {
  createAnalyticsRetentionPlan,
  parseAnalyticsRetentionPolicy,
} from './analytics-retention-policy.js';

export interface AnalyticsRetentionExecutionServiceCandidateReadPreviewInput {
  readonly policy: AnalyticsRetentionExecutionServicePolicyInput;
  readonly executionArgs?: readonly string[];
  readonly now?: Date;
  readonly candidateReadRepository: AnalyticsRetentionCandidateReadRepository;
  readonly deleteRepositoryExecutor?: AnalyticsRetentionDeleteRepositoryPreparationExecutor;
}

export interface AnalyticsRetentionExecutionServiceCandidateReadPreview {
  readonly candidateCountLoader: AnalyticsRetentionExecutionCandidateCountLoaderResult;
  readonly preview: AnalyticsRetentionExecutionServicePreview;
}

export async function buildAnalyticsRetentionExecutionServiceCandidateReadPreview(
  input: AnalyticsRetentionExecutionServiceCandidateReadPreviewInput,
): Promise<AnalyticsRetentionExecutionServiceCandidateReadPreview> {
  const policy = parseAnalyticsRetentionPolicy(input.policy);
  const plan = createAnalyticsRetentionPlan(policy, input.now ?? new Date());
  const candidateCountLoader =
    await loadAnalyticsRetentionExecutionCandidateCounts({
      plan,
      candidateReadRepository: input.candidateReadRepository,
    });

  const preview = await buildAnalyticsRetentionExecutionServicePreview({
    policy: input.policy,
    executionArgs: input.executionArgs,
    now: plan.generatedAt,
    ...(candidateCountLoader.counts.usageCandidateCount === undefined
      ? {}
      : {
          usageCandidateCount:
            candidateCountLoader.counts.usageCandidateCount,
        }),
    ...(candidateCountLoader.counts.rejectedCandidateCount === undefined
      ? {}
      : {
          rejectedCandidateCount:
            candidateCountLoader.counts.rejectedCandidateCount,
        }),
    ...(input.deleteRepositoryExecutor === undefined
      ? {}
      : { deleteRepositoryExecutor: input.deleteRepositoryExecutor }),
  });

  return {
    candidateCountLoader,
    preview,
  };
}

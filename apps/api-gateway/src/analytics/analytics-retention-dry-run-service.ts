import type {
  AnalyticsRetentionCandidateReadRepository,
  AnalyticsRetentionCandidateReadResult,
} from "./analytics-retention-candidate-read.repository.js";
import {
  createAnalyticsRetentionPlan,
  parseAnalyticsRetentionPolicy,
  type AnalyticsRetentionPlan,
  type AnalyticsRetentionPolicy,
  type AnalyticsRetentionPolicyInput,
} from "./analytics-retention-policy.js";

export type AnalyticsRetentionDryRunRequest = {
  readonly policyInput?: AnalyticsRetentionPolicyInput;
  readonly now?: Date;
};

export type AnalyticsRetentionDryRunResult = {
  readonly policy: AnalyticsRetentionPolicy;
  readonly plan: AnalyticsRetentionPlan;
  readonly candidates: AnalyticsRetentionCandidateReadResult;
  readonly dryRunOnly: true;
  readonly deleteAllowed: false;
};

export type AnalyticsRetentionDryRunService = {
  previewRetention: (
    request?: AnalyticsRetentionDryRunRequest,
  ) => Promise<AnalyticsRetentionDryRunResult>;
};

export function createAnalyticsRetentionDryRunService(
  candidateReadRepository: AnalyticsRetentionCandidateReadRepository,
): AnalyticsRetentionDryRunService {
  return {
    async previewRetention(
      request: AnalyticsRetentionDryRunRequest = {},
    ): Promise<AnalyticsRetentionDryRunResult> {
      const policy = parseAnalyticsRetentionPolicy(request.policyInput);
      const plan = createAnalyticsRetentionPlan(policy, request.now);
      const candidates =
        await candidateReadRepository.summarizeCandidates(plan);

      return {
        policy,
        plan,
        candidates,
        dryRunOnly: true,
        deleteAllowed: false,
      };
    },
  };
}

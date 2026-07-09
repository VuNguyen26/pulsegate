import {
  createAnalyticsRetentionPlan,
  parseAnalyticsRetentionPolicy,
  type AnalyticsRetentionPlan,
} from './analytics-retention-policy.js';
import {
  evaluateAnalyticsRetentionExecutionGuard,
  type AnalyticsRetentionExecutionGuardDecision,
} from './analytics-retention-execution-guard.js';
import {
  parseAnalyticsRetentionExecutionCommandArgs,
  type AnalyticsRetentionExecutionCommandArgs,
} from './analytics-retention-execution-command-args.js';
import {
  buildAnalyticsRetentionExecuteContractReview,
  type AnalyticsRetentionExecuteContractReview,
} from './analytics-retention-execute-contract-review.js';

export interface AnalyticsRetentionExecutionPreviewInput {
  readonly policy: Parameters<typeof parseAnalyticsRetentionPolicy>[0];
  readonly executionArgs?: readonly string[];
  readonly now?: Date;
}

export interface AnalyticsRetentionExecutionPreview {
  readonly policy: ReturnType<typeof parseAnalyticsRetentionPolicy>;
  readonly plan: AnalyticsRetentionPlan;
  readonly executionArgs: AnalyticsRetentionExecutionCommandArgs;
  readonly executionGuard: AnalyticsRetentionExecutionGuardDecision;
  readonly executeContractReview: AnalyticsRetentionExecuteContractReview;
  readonly deleteImplementationAvailable: false;
}

export function buildAnalyticsRetentionExecutionPreview(
  input: AnalyticsRetentionExecutionPreviewInput,
): AnalyticsRetentionExecutionPreview {
  const policy = parseAnalyticsRetentionPolicy(input.policy);
  const plan = createAnalyticsRetentionPlan(policy, input.now ?? new Date());
  const executionArgs = parseAnalyticsRetentionExecutionCommandArgs(
    input.executionArgs ?? [],
  );
  const executionGuard = evaluateAnalyticsRetentionExecutionGuard({
    plan,
    mode: executionArgs.mode,
    confirmExecute: executionArgs.confirmExecute,
    hardDeleteLimit: executionArgs.hardDeleteLimit,
  });
  const executeContractReview = buildAnalyticsRetentionExecuteContractReview({
    confirmationProvided: executionArgs.confirmExecute === true,
    hardDeleteLimit: executionArgs.hardDeleteLimit ?? null,
    candidateRecheckPlanned: false,
    rollbackExpectationDocumented: false,
    auditOutputPlanned: false,
  });

  return {
    policy,
    plan,
    executionArgs,
    executionGuard,
    executeContractReview,
    deleteImplementationAvailable: false,
  };
}
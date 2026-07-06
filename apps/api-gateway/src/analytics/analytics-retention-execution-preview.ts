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

  return {
    policy,
    plan,
    executionArgs,
    executionGuard,
    deleteImplementationAvailable: false,
  };
}

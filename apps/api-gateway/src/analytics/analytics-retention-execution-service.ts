import {
  createAnalyticsRetentionPlan,
  parseAnalyticsRetentionPolicy,
  type AnalyticsRetentionPlan,
  type AnalyticsRetentionPolicy,
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
  buildAnalyticsRetentionDeleteBatchPlan,
  type AnalyticsRetentionDeleteBatchPlan,
  type AnalyticsRetentionDeleteBatchPlanInput,
} from './analytics-retention-delete-batch-plan.js';
import {
  buildAnalyticsRetentionDeleteOperationPlan,
  type AnalyticsRetentionDeleteOperationPlan,
} from './analytics-retention-delete-operation-plan.js';
import type {
  AnalyticsRetentionDeleteRepositoryExecutionResult,
  AnalyticsRetentionDeleteRepositoryExecutor,
  AnalyticsRetentionDeleteRepositoryPreparedOperation,
} from './analytics-retention-delete.repository.js';

export type AnalyticsRetentionExecutionServicePolicyInput =
  Parameters<typeof parseAnalyticsRetentionPolicy>[0];

export type AnalyticsRetentionDeleteRepositoryPreparationExecutor = Pick<
  AnalyticsRetentionDeleteRepositoryExecutor,
  'prepareDeleteOperation'
>;

export interface AnalyticsRetentionExecutionServicePreviewInput {
  readonly policy: AnalyticsRetentionExecutionServicePolicyInput;
  readonly executionArgs?: readonly string[];
  readonly now?: Date;
  readonly usageCandidateCount?: number;
  readonly rejectedCandidateCount?: number;
  readonly deleteRepositoryExecutor?: AnalyticsRetentionDeleteRepositoryPreparationExecutor;
}

export interface AnalyticsRetentionExecutionServicePreview {
  readonly policy: AnalyticsRetentionPolicy;
  readonly plan: AnalyticsRetentionPlan;
  readonly executionArgs: AnalyticsRetentionExecutionCommandArgs;
  readonly executionGuard: AnalyticsRetentionExecutionGuardDecision;
  readonly deleteBatchPlan: AnalyticsRetentionDeleteBatchPlan;
  readonly deleteOperationPlan: AnalyticsRetentionDeleteOperationPlan;
  readonly preparedOperations: readonly AnalyticsRetentionDeleteRepositoryPreparedOperation[];
  readonly executionResults: readonly AnalyticsRetentionDeleteRepositoryExecutionResult[];
  readonly deleteImplementationAvailable: boolean;
  readonly dryRunOnly: boolean;
  readonly deleteAllowed: boolean;
  readonly destructiveExecutionPerformed: false;
}

export async function buildAnalyticsRetentionExecutionServicePreview(
  input: AnalyticsRetentionExecutionServicePreviewInput,
): Promise<AnalyticsRetentionExecutionServicePreview> {
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
  const deleteBatchPlan = buildAnalyticsRetentionDeleteBatchPlan(
    buildDeleteBatchPlanInput(input, executionGuard),
  );
  const deleteOperationPlan = buildAnalyticsRetentionDeleteOperationPlan({
    retentionPlan: plan,
    deleteBatchPlan,
  });
  const preparedOperations = await prepareRepositoryOperations(
    deleteOperationPlan,
    input.deleteRepositoryExecutor,
  );
  const deleteImplementationAvailable =
    input.deleteRepositoryExecutor !== undefined;
  const deleteAllowed = isPreviewDeleteAllowed({
    deleteImplementationAvailable,
    deleteBatchPlan,
    deleteOperationPlan,
    preparedOperations,
  });

  return {
    policy,
    plan,
    executionArgs,
    executionGuard,
    deleteBatchPlan,
    deleteOperationPlan,
    preparedOperations,
    executionResults: [],
    deleteImplementationAvailable,
    dryRunOnly: executionGuard.dryRunOnly,
    deleteAllowed,
    destructiveExecutionPerformed: false,
  };
}

function buildDeleteBatchPlanInput(
  input: AnalyticsRetentionExecutionServicePreviewInput,
  executionGuard: AnalyticsRetentionExecutionGuardDecision,
): AnalyticsRetentionDeleteBatchPlanInput {
  return {
    executionGuard,
    ...(input.usageCandidateCount === undefined
      ? {}
      : { usageCandidateCount: input.usageCandidateCount }),
    ...(input.rejectedCandidateCount === undefined
      ? {}
      : { rejectedCandidateCount: input.rejectedCandidateCount }),
  };
}

async function prepareRepositoryOperations(
  deleteOperationPlan: AnalyticsRetentionDeleteOperationPlan,
  deleteRepositoryExecutor:
    | AnalyticsRetentionDeleteRepositoryPreparationExecutor
    | undefined,
): Promise<AnalyticsRetentionDeleteRepositoryPreparedOperation[]> {
  if (!deleteOperationPlan.deleteAllowed || deleteRepositoryExecutor === undefined) {
    return [];
  }

  const preparedOperations: AnalyticsRetentionDeleteRepositoryPreparedOperation[] = [];

  for (const request of deleteOperationPlan.repositoryOperationRequests) {
    preparedOperations.push(
      await deleteRepositoryExecutor.prepareDeleteOperation(request),
    );
  }

  return preparedOperations;
}

function isPreviewDeleteAllowed(input: {
  readonly deleteImplementationAvailable: boolean;
  readonly deleteBatchPlan: AnalyticsRetentionDeleteBatchPlan;
  readonly deleteOperationPlan: AnalyticsRetentionDeleteOperationPlan;
  readonly preparedOperations: readonly AnalyticsRetentionDeleteRepositoryPreparedOperation[];
}): boolean {
  if (!input.deleteImplementationAvailable) {
    return false;
  }

  if (!input.deleteBatchPlan.deleteAllowed || !input.deleteOperationPlan.deleteAllowed) {
    return false;
  }

  if (
    input.preparedOperations.length !==
    input.deleteOperationPlan.repositoryOperationRequests.length
  ) {
    return false;
  }

  return input.preparedOperations.every((operation) => operation.deleteAllowed);
}

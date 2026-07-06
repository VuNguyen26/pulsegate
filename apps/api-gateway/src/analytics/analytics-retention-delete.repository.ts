import type {
  AnalyticsRetentionDeleteBatchPlan,
  AnalyticsRetentionDeletePlanSource,
} from './analytics-retention-delete-batch-plan.js';
import {
  evaluateAnalyticsRetentionDeleteRepositorySafety,
  type AnalyticsRetentionDeleteRepositorySafetyDecision,
  type AnalyticsRetentionDeleteRepositorySafetyReason,
} from './analytics-retention-delete-repository-safety.js';

export type AnalyticsRetentionDeleteRepositoryExecutionReason =
  | AnalyticsRetentionDeleteRepositorySafetyReason
  | 'DELETED_COUNT_INVALID'
  | 'DELETED_COUNT_EXCEEDS_REQUESTED_LIMIT'
  | 'DELETED_COUNT_EXCEEDS_RECHECKED_CANDIDATES';

export interface AnalyticsRetentionDeleteRepositoryCandidateRecheckInput {
  readonly source: AnalyticsRetentionDeletePlanSource;
  readonly cutoffExclusive: Date;
}

export interface AnalyticsRetentionDeleteRepositoryDeleteInput {
  readonly source: AnalyticsRetentionDeletePlanSource;
  readonly cutoffExclusive: Date;
  readonly limit: number;
  readonly safetyDecision: AnalyticsRetentionDeleteRepositorySafetyDecision;
}

export interface AnalyticsRetentionDeleteRepositoryPort {
  readonly countCandidatesBeforeDelete: (
    input: AnalyticsRetentionDeleteRepositoryCandidateRecheckInput,
  ) => Promise<number>;
  readonly deleteCandidates: (
    input: AnalyticsRetentionDeleteRepositoryDeleteInput,
  ) => Promise<number>;
}

export interface AnalyticsRetentionDeleteRepositoryOperationRequest {
  readonly deleteBatchPlan: AnalyticsRetentionDeleteBatchPlan;
  readonly source: AnalyticsRetentionDeletePlanSource;
  readonly cutoffExclusive: Date;
  readonly requestedLimit: number;
}

export type AnalyticsRetentionDeleteRepositoryPreparedOperation =
  AnalyticsRetentionDeleteRepositorySafetyDecision;

export interface AnalyticsRetentionDeleteRepositoryExecutionResult {
  readonly source: AnalyticsRetentionDeletePlanSource;
  readonly cutoffExclusive: Date;
  readonly requestedLimit: number;
  readonly candidateCountBeforeDelete: number;
  readonly deletedCount: number;
  readonly candidateRecheckRequired: true;
  readonly deleteAllowed: boolean;
  readonly blockedReasons: readonly AnalyticsRetentionDeleteRepositoryExecutionReason[];
}

export interface AnalyticsRetentionDeleteRepositoryExecutor {
  readonly prepareDeleteOperation: (
    request: AnalyticsRetentionDeleteRepositoryOperationRequest,
  ) => Promise<AnalyticsRetentionDeleteRepositoryPreparedOperation>;
  readonly executePreparedDelete: (
    safetyDecision: AnalyticsRetentionDeleteRepositoryPreparedOperation,
  ) => Promise<AnalyticsRetentionDeleteRepositoryExecutionResult>;
}

export function createAnalyticsRetentionDeleteRepositoryExecutor(
  repository: AnalyticsRetentionDeleteRepositoryPort,
): AnalyticsRetentionDeleteRepositoryExecutor {
  return {
    async prepareDeleteOperation(
      request: AnalyticsRetentionDeleteRepositoryOperationRequest,
    ): Promise<AnalyticsRetentionDeleteRepositoryPreparedOperation> {
      const candidateCountBeforeDelete =
        await repository.countCandidatesBeforeDelete({
          source: request.source,
          cutoffExclusive: cloneDate(request.cutoffExclusive),
        });

      return evaluateAnalyticsRetentionDeleteRepositorySafety({
        deleteBatchPlan: request.deleteBatchPlan,
        source: request.source,
        cutoffExclusive: request.cutoffExclusive,
        requestedLimit: request.requestedLimit,
        candidateRecheckCompleted: true,
        candidateCountBeforeDelete,
      });
    },

    async executePreparedDelete(
      safetyDecision: AnalyticsRetentionDeleteRepositoryPreparedOperation,
    ): Promise<AnalyticsRetentionDeleteRepositoryExecutionResult> {
      if (!safetyDecision.deleteAllowed) {
        return buildExecutionResult(safetyDecision, 0, [
          ...safetyDecision.blockedReasons,
        ]);
      }

      const deletedCount = await repository.deleteCandidates({
        source: safetyDecision.source,
        cutoffExclusive: cloneDate(safetyDecision.cutoffExclusive),
        limit: safetyDecision.requestedLimit,
        safetyDecision,
      });

      const blockedReasons = validateDeletedCount(deletedCount, safetyDecision);

      return buildExecutionResult(
        safetyDecision,
        blockedReasons.length === 0 ? deletedCount : 0,
        blockedReasons,
      );
    },
  };
}

function validateDeletedCount(
  deletedCount: number,
  safetyDecision: AnalyticsRetentionDeleteRepositoryPreparedOperation,
): AnalyticsRetentionDeleteRepositoryExecutionReason[] {
  const blockedReasons: AnalyticsRetentionDeleteRepositoryExecutionReason[] = [];

  if (!Number.isSafeInteger(deletedCount) || deletedCount < 0) {
    blockedReasons.push('DELETED_COUNT_INVALID');
    return blockedReasons;
  }

  if (deletedCount > safetyDecision.requestedLimit) {
    blockedReasons.push('DELETED_COUNT_EXCEEDS_REQUESTED_LIMIT');
  }

  if (deletedCount > safetyDecision.candidateCountBeforeDelete) {
    blockedReasons.push('DELETED_COUNT_EXCEEDS_RECHECKED_CANDIDATES');
  }

  return blockedReasons;
}

function buildExecutionResult(
  safetyDecision: AnalyticsRetentionDeleteRepositoryPreparedOperation,
  deletedCount: number,
  blockedReasons: readonly AnalyticsRetentionDeleteRepositoryExecutionReason[],
): AnalyticsRetentionDeleteRepositoryExecutionResult {
  return {
    source: safetyDecision.source,
    cutoffExclusive: cloneDate(safetyDecision.cutoffExclusive),
    requestedLimit: safetyDecision.requestedLimit,
    candidateCountBeforeDelete: safetyDecision.candidateCountBeforeDelete,
    deletedCount,
    candidateRecheckRequired: true,
    deleteAllowed: blockedReasons.length === 0,
    blockedReasons,
  };
}

function cloneDate(value: Date): Date {
  return new Date(value.getTime());
}

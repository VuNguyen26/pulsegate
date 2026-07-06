import { describe, expect, it, vi } from 'vitest';

import {
  buildAnalyticsRetentionDeleteBatchPlan,
  type AnalyticsRetentionDeleteBatchPlan,
} from './analytics-retention-delete-batch-plan.js';
import { createAnalyticsRetentionDeleteRepositoryExecutor } from './analytics-retention-delete.repository.js';
import type { AnalyticsRetentionExecutionGuardDecision } from './analytics-retention-execution-guard.js';

function createAllowedGuard(
  source: AnalyticsRetentionExecutionGuardDecision['source'],
  hardDeleteLimit = 100,
): AnalyticsRetentionExecutionGuardDecision {
  return {
    mode: 'execute',
    source,
    dryRunOnly: false,
    deleteAllowed: true,
    hardDeleteLimit,
    reasons: [],
  };
}

function createAllowedBatchPlan(
  source: AnalyticsRetentionExecutionGuardDecision['source'],
  usageCandidateCount?: number,
  rejectedCandidateCount?: number,
  hardDeleteLimit = 100,
): AnalyticsRetentionDeleteBatchPlan {
  return buildAnalyticsRetentionDeleteBatchPlan({
    executionGuard: createAllowedGuard(source, hardDeleteLimit),
    usageCandidateCount,
    rejectedCandidateCount,
  });
}

function createFakeRepository(options: {
  readonly candidateCountBeforeDelete?: number;
  readonly deletedCount?: number;
} = {}) {
  const countCandidatesBeforeDelete = vi
    .fn()
    .mockResolvedValue(options.candidateCountBeforeDelete ?? 10);
  const deleteCandidates = vi.fn().mockResolvedValue(options.deletedCount ?? 5);

  return {
    repository: {
      countCandidatesBeforeDelete,
      deleteCandidates,
    },
    countCandidatesBeforeDelete,
    deleteCandidates,
  };
}

describe('createAnalyticsRetentionDeleteRepositoryExecutor', () => {
  it('should recheck candidates before preparing a delete operation', async () => {
    const cutoffExclusive = new Date('2026-01-01T00:00:00.000Z');
    const deleteBatchPlan = createAllowedBatchPlan('usage', 100);
    const { repository, countCandidatesBeforeDelete, deleteCandidates } =
      createFakeRepository({
        candidateCountBeforeDelete: 25,
      });
    const executor = createAnalyticsRetentionDeleteRepositoryExecutor(repository);

    const decision = await executor.prepareDeleteOperation({
      deleteBatchPlan,
      source: 'usage',
      cutoffExclusive,
      requestedLimit: 10,
    });

    expect(countCandidatesBeforeDelete).toHaveBeenCalledWith({
      source: 'usage',
      cutoffExclusive,
    });
    expect(deleteCandidates).not.toHaveBeenCalled();
    expect(decision).toEqual({
      source: 'usage',
      cutoffExclusive,
      requestedLimit: 10,
      candidateCountBeforeDelete: 25,
      deletedCount: 0,
      candidateRecheckRequired: true,
      deleteAllowed: true,
      blockedReasons: [],
    });
  });

  it('should not call delete when the prepared safety decision is blocked', async () => {
    const deleteBatchPlan = buildAnalyticsRetentionDeleteBatchPlan({
      executionGuard: {
        mode: 'execute',
        source: 'usage',
        dryRunOnly: false,
        deleteAllowed: false,
        hardDeleteLimit: 100,
        reasons: ['EXECUTE_CONFIRMATION_REQUIRED'],
      },
      usageCandidateCount: 10,
    });
    const { repository, deleteCandidates } = createFakeRepository({
      candidateCountBeforeDelete: 10,
    });
    const executor = createAnalyticsRetentionDeleteRepositoryExecutor(repository);

    const decision = await executor.prepareDeleteOperation({
      deleteBatchPlan,
      source: 'usage',
      cutoffExclusive: new Date('2026-01-01T00:00:00.000Z'),
      requestedLimit: 10,
    });
    const result = await executor.executePreparedDelete(decision);

    expect(deleteCandidates).not.toHaveBeenCalled();
    expect(result.deleteAllowed).toBe(false);
    expect(result.deletedCount).toBe(0);
    expect(result.blockedReasons).toContain('DELETE_BATCH_PLAN_BLOCKED');
    expect(result.blockedReasons).toContain('EXECUTE_CONFIRMATION_REQUIRED');
  });

  it('should not call delete when candidate recheck finds zero candidates', async () => {
    const deleteBatchPlan = createAllowedBatchPlan('usage', 100);
    const { repository, deleteCandidates } = createFakeRepository({
      candidateCountBeforeDelete: 0,
    });
    const executor = createAnalyticsRetentionDeleteRepositoryExecutor(repository);

    const decision = await executor.prepareDeleteOperation({
      deleteBatchPlan,
      source: 'usage',
      cutoffExclusive: new Date('2026-01-01T00:00:00.000Z'),
      requestedLimit: 10,
    });
    const result = await executor.executePreparedDelete(decision);

    expect(deleteCandidates).not.toHaveBeenCalled();
    expect(result.deleteAllowed).toBe(false);
    expect(result.deletedCount).toBe(0);
    expect(result.blockedReasons).toContain('NO_RECHECKED_CANDIDATES');
  });

  it('should call delete only after an allowed prepared safety decision', async () => {
    const cutoffExclusive = new Date('2026-01-01T00:00:00.000Z');
    const deleteBatchPlan = createAllowedBatchPlan('usage', 100);
    const { repository, deleteCandidates } = createFakeRepository({
      candidateCountBeforeDelete: 80,
      deletedCount: 25,
    });
    const executor = createAnalyticsRetentionDeleteRepositoryExecutor(repository);

    const decision = await executor.prepareDeleteOperation({
      deleteBatchPlan,
      source: 'usage',
      cutoffExclusive,
      requestedLimit: 25,
    });
    const result = await executor.executePreparedDelete(decision);

    expect(deleteCandidates).toHaveBeenCalledWith({
      source: 'usage',
      cutoffExclusive: decision.cutoffExclusive,
      limit: 25,
      safetyDecision: decision,
    });
    expect(result).toEqual({
      source: 'usage',
      cutoffExclusive,
      requestedLimit: 25,
      candidateCountBeforeDelete: 80,
      deletedCount: 25,
      candidateRecheckRequired: true,
      deleteAllowed: true,
      blockedReasons: [],
    });
    expect(result.cutoffExclusive).not.toBe(cutoffExclusive);
  });

  it('should reject invalid deleted counts reported by the repository port', async () => {
    const deleteBatchPlan = createAllowedBatchPlan('usage', 100);
    const { repository } = createFakeRepository({
      candidateCountBeforeDelete: 80,
      deletedCount: 1.5,
    });
    const executor = createAnalyticsRetentionDeleteRepositoryExecutor(repository);

    const decision = await executor.prepareDeleteOperation({
      deleteBatchPlan,
      source: 'usage',
      cutoffExclusive: new Date('2026-01-01T00:00:00.000Z'),
      requestedLimit: 25,
    });
    const result = await executor.executePreparedDelete(decision);

    expect(result.deleteAllowed).toBe(false);
    expect(result.deletedCount).toBe(0);
    expect(result.blockedReasons).toEqual(['DELETED_COUNT_INVALID']);
  });

  it('should reject deleted counts that exceed the requested or rechecked limits', async () => {
    const deleteBatchPlan = createAllowedBatchPlan('usage', 100);
    const { repository } = createFakeRepository({
      candidateCountBeforeDelete: 25,
      deletedCount: 26,
    });
    const executor = createAnalyticsRetentionDeleteRepositoryExecutor(repository);

    const decision = await executor.prepareDeleteOperation({
      deleteBatchPlan,
      source: 'usage',
      cutoffExclusive: new Date('2026-01-01T00:00:00.000Z'),
      requestedLimit: 25,
    });
    const result = await executor.executePreparedDelete(decision);

    expect(result.deleteAllowed).toBe(false);
    expect(result.deletedCount).toBe(0);
    expect(result.blockedReasons).toEqual([
      'DELETED_COUNT_EXCEEDS_REQUESTED_LIMIT',
      'DELETED_COUNT_EXCEEDS_RECHECKED_CANDIDATES',
    ]);
  });
});

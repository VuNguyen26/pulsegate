import { describe, expect, it } from 'vitest';

import type { AnalyticsRetentionExecutionGuardDecision } from './analytics-retention-execution-guard.js';
import {
  buildAnalyticsRetentionDeleteBatchPlan,
  type AnalyticsRetentionDeleteBatchPlan,
} from './analytics-retention-delete-batch-plan.js';
import { evaluateAnalyticsRetentionDeleteRepositorySafety } from './analytics-retention-delete-repository-safety.js';

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

describe('evaluateAnalyticsRetentionDeleteRepositorySafety', () => {
  it('should block repository delete when the delete batch plan is blocked', () => {
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

    const decision = evaluateAnalyticsRetentionDeleteRepositorySafety({
      deleteBatchPlan,
      source: 'usage',
      cutoffExclusive: new Date('2026-01-01T00:00:00.000Z'),
      requestedLimit: 10,
      candidateRecheckCompleted: true,
      candidateCountBeforeDelete: 10,
    });

    expect(decision.deleteAllowed).toBe(false);
    expect(decision.deletedCount).toBe(0);
    expect(decision.blockedReasons).toContain('DELETE_BATCH_PLAN_BLOCKED');
    expect(decision.blockedReasons).toContain('EXECUTE_CONFIRMATION_REQUIRED');
  });

  it('should block repository delete when the requested source is not selected', () => {
    const deleteBatchPlan = createAllowedBatchPlan('usage', 10);

    const decision = evaluateAnalyticsRetentionDeleteRepositorySafety({
      deleteBatchPlan,
      source: 'rejected',
      cutoffExclusive: new Date('2026-01-01T00:00:00.000Z'),
      requestedLimit: 10,
      candidateRecheckCompleted: true,
      candidateCountBeforeDelete: 10,
    });

    expect(decision.deleteAllowed).toBe(false);
    expect(decision.blockedReasons).toContain('SOURCE_NOT_SELECTED');
  });

  it('should require a valid cutoff and requested limit', () => {
    const deleteBatchPlan = createAllowedBatchPlan('usage', 10);

    const decision = evaluateAnalyticsRetentionDeleteRepositorySafety({
      deleteBatchPlan,
      source: 'usage',
      cutoffExclusive: new Date('invalid'),
      requestedLimit: 0,
      candidateRecheckCompleted: true,
      candidateCountBeforeDelete: 10,
    });

    expect(decision.deleteAllowed).toBe(false);
    expect(decision.blockedReasons).toContain('CUTOFF_EXCLUSIVE_INVALID');
    expect(decision.blockedReasons).toContain('REQUESTED_LIMIT_INVALID');
  });

  it('should require candidate recheck before repository delete', () => {
    const deleteBatchPlan = createAllowedBatchPlan('usage', 10);

    const decision = evaluateAnalyticsRetentionDeleteRepositorySafety({
      deleteBatchPlan,
      source: 'usage',
      cutoffExclusive: new Date('2026-01-01T00:00:00.000Z'),
      requestedLimit: 10,
      candidateCountBeforeDelete: 10,
    });

    expect(decision.deleteAllowed).toBe(false);
    expect(decision.candidateRecheckRequired).toBe(true);
    expect(decision.blockedReasons).toEqual(['CANDIDATE_RECHECK_REQUIRED']);
  });

  it('should block repository delete when rechecked candidate count is invalid or zero', () => {
    const deleteBatchPlan = createAllowedBatchPlan('usage', 10);

    const invalidDecision = evaluateAnalyticsRetentionDeleteRepositorySafety({
      deleteBatchPlan,
      source: 'usage',
      cutoffExclusive: new Date('2026-01-01T00:00:00.000Z'),
      requestedLimit: 10,
      candidateRecheckCompleted: true,
      candidateCountBeforeDelete: -1,
    });

    expect(invalidDecision.deleteAllowed).toBe(false);
    expect(invalidDecision.blockedReasons).toContain(
      'CANDIDATE_COUNT_BEFORE_DELETE_INVALID',
    );

    const zeroDecision = evaluateAnalyticsRetentionDeleteRepositorySafety({
      deleteBatchPlan,
      source: 'usage',
      cutoffExclusive: new Date('2026-01-01T00:00:00.000Z'),
      requestedLimit: 10,
      candidateRecheckCompleted: true,
      candidateCountBeforeDelete: 0,
    });

    expect(zeroDecision.deleteAllowed).toBe(false);
    expect(zeroDecision.blockedReasons).toContain('NO_RECHECKED_CANDIDATES');
  });

  it('should block repository delete when requested limit exceeds safety caps', () => {
    const deleteBatchPlan = createAllowedBatchPlan('usage', 50, undefined, 50);

    const decision = evaluateAnalyticsRetentionDeleteRepositorySafety({
      deleteBatchPlan,
      source: 'usage',
      cutoffExclusive: new Date('2026-01-01T00:00:00.000Z'),
      requestedLimit: 51,
      candidateRecheckCompleted: true,
      candidateCountBeforeDelete: 100,
    });

    expect(decision.deleteAllowed).toBe(false);
    expect(decision.blockedReasons).toContain(
      'REQUESTED_LIMIT_EXCEEDS_HARD_DELETE_LIMIT',
    );
    expect(decision.blockedReasons).toContain(
      'REQUESTED_LIMIT_EXCEEDS_SOURCE_PLAN',
    );
  });

  it('should block repository delete when requested limit exceeds rechecked candidates', () => {
    const deleteBatchPlan = createAllowedBatchPlan('usage', 100);

    const decision = evaluateAnalyticsRetentionDeleteRepositorySafety({
      deleteBatchPlan,
      source: 'usage',
      cutoffExclusive: new Date('2026-01-01T00:00:00.000Z'),
      requestedLimit: 10,
      candidateRecheckCompleted: true,
      candidateCountBeforeDelete: 9,
    });

    expect(decision.deleteAllowed).toBe(false);
    expect(decision.blockedReasons).toEqual([
      'REQUESTED_LIMIT_EXCEEDS_RECHECKED_CANDIDATES',
    ]);
  });

  it('should allow a repository delete operation only after all safety checks pass', () => {
    const cutoffExclusive = new Date('2026-01-01T00:00:00.000Z');
    const deleteBatchPlan = createAllowedBatchPlan('usage', 100);

    const decision = evaluateAnalyticsRetentionDeleteRepositorySafety({
      deleteBatchPlan,
      source: 'usage',
      cutoffExclusive,
      requestedLimit: 25,
      candidateRecheckCompleted: true,
      candidateCountBeforeDelete: 80,
    });

    expect(decision).toEqual({
      source: 'usage',
      cutoffExclusive,
      requestedLimit: 25,
      candidateCountBeforeDelete: 80,
      deletedCount: 0,
      candidateRecheckRequired: true,
      deleteAllowed: true,
      blockedReasons: [],
    });
    expect(decision.cutoffExclusive).not.toBe(cutoffExclusive);
  });
});

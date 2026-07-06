import { describe, expect, it } from 'vitest';

import type { AnalyticsRetentionExecutionGuardDecision } from './analytics-retention-execution-guard.js';
import { buildAnalyticsRetentionDeleteBatchPlan } from './analytics-retention-delete-batch-plan.js';

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

describe('buildAnalyticsRetentionDeleteBatchPlan', () => {
  it('should block delete planning when execution guard is blocked', () => {
    const plan = buildAnalyticsRetentionDeleteBatchPlan({
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

    expect(plan.deleteAllowed).toBe(false);
    expect(plan.reasons).toContain('EXECUTION_GUARD_BLOCKED');
    expect(plan.reasons).toContain('EXECUTE_CONFIRMATION_REQUIRED');
    expect(plan.totalMaxDeleteCount).toBe(10);
  });

  it('should require hard delete limit from the execution guard', () => {
    const plan = buildAnalyticsRetentionDeleteBatchPlan({
      executionGuard: {
        mode: 'dry-run',
        source: 'usage',
        dryRunOnly: true,
        deleteAllowed: false,
        hardDeleteLimit: null,
        reasons: ['DRY_RUN_MODE'],
      },
      usageCandidateCount: 10,
    });

    expect(plan.deleteAllowed).toBe(false);
    expect(plan.hardDeleteLimit).toBeNull();
    expect(plan.sourcePlans).toEqual([]);
    expect(plan.reasons).toContain('HARD_DELETE_LIMIT_NOT_AVAILABLE');
  });

  it('should require usage candidate count for usage source', () => {
    const plan = buildAnalyticsRetentionDeleteBatchPlan({
      executionGuard: createAllowedGuard('usage'),
    });

    expect(plan.deleteAllowed).toBe(false);
    expect(plan.reasons).toContain('USAGE_CANDIDATE_COUNT_REQUIRED');
  });

  it('should require rejected candidate count for rejected source', () => {
    const plan = buildAnalyticsRetentionDeleteBatchPlan({
      executionGuard: createAllowedGuard('rejected'),
    });

    expect(plan.deleteAllowed).toBe(false);
    expect(plan.reasons).toContain('REJECTED_CANDIDATE_COUNT_REQUIRED');
  });

  it('should reject invalid candidate counts', () => {
    const usagePlan = buildAnalyticsRetentionDeleteBatchPlan({
      executionGuard: createAllowedGuard('usage'),
      usageCandidateCount: -1,
    });

    expect(usagePlan.deleteAllowed).toBe(false);
    expect(usagePlan.reasons).toContain('USAGE_CANDIDATE_COUNT_INVALID');

    const rejectedPlan = buildAnalyticsRetentionDeleteBatchPlan({
      executionGuard: createAllowedGuard('rejected'),
      rejectedCandidateCount: 1.5,
    });

    expect(rejectedPlan.deleteAllowed).toBe(false);
    expect(rejectedPlan.reasons).toContain('REJECTED_CANDIDATE_COUNT_INVALID');
  });

  it('should block delete planning when there are no delete candidates', () => {
    const plan = buildAnalyticsRetentionDeleteBatchPlan({
      executionGuard: createAllowedGuard('usage'),
      usageCandidateCount: 0,
    });

    expect(plan).toEqual({
      source: 'usage',
      deleteAllowed: false,
      hardDeleteLimit: 100,
      totalCandidateCount: 0,
      totalMaxDeleteCount: 0,
      sourcePlans: [
        {
          source: 'usage',
          candidateCount: 0,
          maxDeleteCount: 0,
          candidateRecheckRequired: true,
        },
      ],
      candidateRecheckRequired: true,
      reasons: ['NO_DELETE_CANDIDATES'],
    });
  });

  it('should cap usage delete count by hard delete limit', () => {
    const plan = buildAnalyticsRetentionDeleteBatchPlan({
      executionGuard: createAllowedGuard('usage', 100),
      usageCandidateCount: 250,
    });

    expect(plan).toEqual({
      source: 'usage',
      deleteAllowed: true,
      hardDeleteLimit: 100,
      totalCandidateCount: 250,
      totalMaxDeleteCount: 100,
      sourcePlans: [
        {
          source: 'usage',
          candidateCount: 250,
          maxDeleteCount: 100,
          candidateRecheckRequired: true,
        },
      ],
      candidateRecheckRequired: true,
      reasons: [],
    });
  });

  it('should apply hard delete limit across both sources as a single total cap', () => {
    const plan = buildAnalyticsRetentionDeleteBatchPlan({
      executionGuard: createAllowedGuard('both', 120),
      usageCandidateCount: 100,
      rejectedCandidateCount: 100,
    });

    expect(plan.totalCandidateCount).toBe(200);
    expect(plan.totalMaxDeleteCount).toBe(120);
    expect(plan.sourcePlans).toEqual([
      {
        source: 'usage',
        candidateCount: 100,
        maxDeleteCount: 100,
        candidateRecheckRequired: true,
      },
      {
        source: 'rejected',
        candidateCount: 100,
        maxDeleteCount: 20,
        candidateRecheckRequired: true,
      },
    ]);
    expect(plan.deleteAllowed).toBe(true);
  });

  it('should require candidate counts for both selected sources', () => {
    const plan = buildAnalyticsRetentionDeleteBatchPlan({
      executionGuard: createAllowedGuard('both', 100),
      usageCandidateCount: 10,
    });

    expect(plan.deleteAllowed).toBe(false);
    expect(plan.reasons).toContain('REJECTED_CANDIDATE_COUNT_REQUIRED');
  });
});

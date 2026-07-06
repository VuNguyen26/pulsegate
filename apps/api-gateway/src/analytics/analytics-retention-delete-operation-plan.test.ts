import { describe, expect, it } from 'vitest';

import {
  buildAnalyticsRetentionDeleteBatchPlan,
  type AnalyticsRetentionDeleteBatchPlan,
} from './analytics-retention-delete-batch-plan.js';
import { buildAnalyticsRetentionDeleteOperationPlan } from './analytics-retention-delete-operation-plan.js';
import type { AnalyticsRetentionExecutionGuardDecision } from './analytics-retention-execution-guard.js';
import {
  createAnalyticsRetentionPlan,
  parseAnalyticsRetentionPolicy,
  type AnalyticsRetentionPlan,
} from './analytics-retention-policy.js';

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

function createRetentionPlan(options: {
  readonly source: 'usage' | 'rejected' | 'both';
  readonly now?: Date;
  readonly usageRetentionDays?: number;
  readonly rejectedRetentionDays?: number;
}): AnalyticsRetentionPlan {
  return createAnalyticsRetentionPlan(
    parseAnalyticsRetentionPolicy({
      enabled: true,
      source: options.source,
      usageRetentionDays: options.usageRetentionDays,
      rejectedRetentionDays: options.rejectedRetentionDays,
    }),
    options.now ?? new Date('2026-07-05T00:00:00.000Z'),
  );
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

describe('buildAnalyticsRetentionDeleteOperationPlan', () => {
  it('should block operation planning when the delete batch plan is blocked', () => {
    const retentionPlan = createRetentionPlan({
      source: 'usage',
      usageRetentionDays: 30,
    });
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

    const plan = buildAnalyticsRetentionDeleteOperationPlan({
      retentionPlan,
      deleteBatchPlan,
    });

    expect(plan).toEqual({
      deleteAllowed: false,
      candidateRecheckRequired: true,
      repositoryOperationRequests: [],
      reasons: [
        'DELETE_BATCH_PLAN_BLOCKED',
        'EXECUTION_GUARD_BLOCKED',
        'EXECUTE_CONFIRMATION_REQUIRED',
      ],
    });
  });

  it('should build a usage repository operation request from the retention cutoff and source max delete count', () => {
    const retentionPlan = createRetentionPlan({
      source: 'usage',
      usageRetentionDays: 30,
    });
    const deleteBatchPlan = createAllowedBatchPlan('usage', 250, undefined, 100);

    const plan = buildAnalyticsRetentionDeleteOperationPlan({
      retentionPlan,
      deleteBatchPlan,
    });

    expect(plan.deleteAllowed).toBe(true);
    expect(plan.reasons).toEqual([]);
    expect(plan.repositoryOperationRequests).toEqual([
      {
        deleteBatchPlan,
        source: 'usage',
        cutoffExclusive: new Date('2026-06-05T00:00:00.000Z'),
        requestedLimit: 100,
      },
    ]);
    expect(plan.repositoryOperationRequests[0]?.cutoffExclusive).not.toBe(
      retentionPlan.usage?.cutoffExclusive,
    );
  });

  it('should build separate operation requests for both sources using a single hard delete cap from the batch plan', () => {
    const retentionPlan = createRetentionPlan({
      source: 'both',
      usageRetentionDays: 30,
      rejectedRetentionDays: 45,
    });
    const deleteBatchPlan = createAllowedBatchPlan('both', 100, 100, 120);

    const plan = buildAnalyticsRetentionDeleteOperationPlan({
      retentionPlan,
      deleteBatchPlan,
    });

    expect(plan.deleteAllowed).toBe(true);
    expect(plan.repositoryOperationRequests).toEqual([
      {
        deleteBatchPlan,
        source: 'usage',
        cutoffExclusive: new Date('2026-06-05T00:00:00.000Z'),
        requestedLimit: 100,
      },
      {
        deleteBatchPlan,
        source: 'rejected',
        cutoffExclusive: new Date('2026-05-21T00:00:00.000Z'),
        requestedLimit: 20,
      },
    ]);
  });

  it('should skip zero-sized source operations and keep selected sources separate', () => {
    const retentionPlan = createRetentionPlan({
      source: 'both',
      usageRetentionDays: 30,
      rejectedRetentionDays: 45,
    });
    const deleteBatchPlan = createAllowedBatchPlan('both', 0, 50, 100);

    const plan = buildAnalyticsRetentionDeleteOperationPlan({
      retentionPlan,
      deleteBatchPlan,
    });

    expect(plan.deleteAllowed).toBe(true);
    expect(plan.repositoryOperationRequests).toEqual([
      {
        deleteBatchPlan,
        source: 'rejected',
        cutoffExclusive: new Date('2026-05-21T00:00:00.000Z'),
        requestedLimit: 50,
      },
    ]);
  });

  it('should block when a batch source plan has no matching retention source plan', () => {
    const retentionPlan = createRetentionPlan({
      source: 'usage',
      usageRetentionDays: 30,
    });
    const deleteBatchPlan = createAllowedBatchPlan('both', 10, 10, 100);

    const plan = buildAnalyticsRetentionDeleteOperationPlan({
      retentionPlan,
      deleteBatchPlan,
    });

    expect(plan.deleteAllowed).toBe(false);
    expect(plan.repositoryOperationRequests).toEqual([
      {
        deleteBatchPlan,
        source: 'usage',
        cutoffExclusive: new Date('2026-06-05T00:00:00.000Z'),
        requestedLimit: 10,
      },
    ]);
    expect(plan.reasons).toContain('REJECTED_RETENTION_SOURCE_PLAN_REQUIRED');
  });

  it('should block when a matching retention cutoff is invalid', () => {
    const retentionPlan = {
      ...createRetentionPlan({
        source: 'usage',
        usageRetentionDays: 30,
      }),
      usage: {
        ...createRetentionPlan({
          source: 'usage',
          usageRetentionDays: 30,
        }).usage,
        cutoffExclusive: new Date('invalid'),
      },
    } as unknown as AnalyticsRetentionPlan;
    const deleteBatchPlan = createAllowedBatchPlan('usage', 10, undefined, 100);

    const plan = buildAnalyticsRetentionDeleteOperationPlan({
      retentionPlan,
      deleteBatchPlan,
    });

    expect(plan.deleteAllowed).toBe(false);
    expect(plan.repositoryOperationRequests).toEqual([]);
    expect(plan.reasons).toContain('USAGE_CUTOFF_EXCLUSIVE_INVALID');
    expect(plan.reasons).toContain('NO_REPOSITORY_DELETE_OPERATIONS');
  });
});

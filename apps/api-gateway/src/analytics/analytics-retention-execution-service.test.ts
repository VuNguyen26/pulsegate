import { describe, expect, it } from 'vitest';
import type { AnalyticsRetentionDeletePlanSource } from './analytics-retention-delete-batch-plan.js';
import { ANALYTICS_RETENTION_EXECUTE_CONFIRMATION_VALUE } from './analytics-retention-execution-command-args.js';
import {
  buildAnalyticsRetentionExecutionServicePreview,
  type AnalyticsRetentionDeleteRepositoryPreparationExecutor,
} from './analytics-retention-execution-service.js';
import {
  createAnalyticsRetentionDeleteRepositoryExecutor,
  type AnalyticsRetentionDeleteRepositoryPort,
} from './analytics-retention-delete.repository.js';

const NOW = new Date('2026-07-06T00:00:00.000Z');

describe('analytics retention execution service preview', () => {
  it('returns a blocked preview when retention is disabled', async () => {
    const preview = await buildAnalyticsRetentionExecutionServicePreview({
      policy: {
        enabled: false,
        source: 'usage',
        usageRetentionDays: 90,
      },
      executionArgs: executeArgs(10),
      now: NOW,
      usageCandidateCount: 5,
    });

    expect(preview.policy.enabled).toBe(false);
    expect(preview.executionGuard.deleteAllowed).toBe(false);
    expect(preview.executionGuard.reasons).toContain('RETENTION_DISABLED');
    expect(preview.executionGuard.reasons).toContain('NO_RETENTION_SOURCE_PLAN');
    expect(preview.deleteBatchPlan.deleteAllowed).toBe(false);
    expect(preview.deleteOperationPlan.deleteAllowed).toBe(false);
    expect(preview.preparedOperations).toEqual([]);
    expect(preview.deleteAllowed).toBe(false);
    expect(preview.destructiveExecutionPerformed).toBe(false);
  });

  it('keeps dry-run mode non-destructive', async () => {
    const preview = await buildAnalyticsRetentionExecutionServicePreview({
      policy: {
        enabled: true,
        source: 'usage',
        usageRetentionDays: 90,
      },
      now: NOW,
      usageCandidateCount: 5,
    });

    expect(preview.executionArgs.mode).toBe('dry-run');
    expect(preview.executionGuard.reasons).toEqual(['DRY_RUN_MODE']);
    expect(preview.dryRunOnly).toBe(true);
    expect(preview.deleteImplementationAvailable).toBe(false);
    expect(preview.preparedOperations).toEqual([]);
    expect(preview.executionResults).toEqual([]);
    expect(preview.deleteAllowed).toBe(false);
    expect(preview.destructiveExecutionPerformed).toBe(false);
  });

  it('blocks execute preview when confirmation is missing', async () => {
    const preview = await buildAnalyticsRetentionExecutionServicePreview({
      policy: {
        enabled: true,
        source: 'usage',
        usageRetentionDays: 90,
      },
      executionArgs: ['--mode', 'execute', '--hard-delete-limit', '10'],
      now: NOW,
      usageCandidateCount: 5,
    });

    expect(preview.executionGuard.deleteAllowed).toBe(false);
    expect(preview.executionGuard.reasons).toContain(
      'EXECUTE_CONFIRMATION_REQUIRED',
    );
    expect(preview.deleteBatchPlan.deleteAllowed).toBe(false);
    expect(preview.preparedOperations).toEqual([]);
    expect(preview.deleteAllowed).toBe(false);
  });

  it('blocks execute preview when hard delete limit is missing', async () => {
    const preview = await buildAnalyticsRetentionExecutionServicePreview({
      policy: {
        enabled: true,
        source: 'usage',
        usageRetentionDays: 90,
      },
      executionArgs: [
        '--mode',
        'execute',
        '--confirm-execute',
        ANALYTICS_RETENTION_EXECUTE_CONFIRMATION_VALUE,
      ],
      now: NOW,
      usageCandidateCount: 5,
    });

    expect(preview.executionGuard.deleteAllowed).toBe(false);
    expect(preview.executionGuard.reasons).toContain('HARD_DELETE_LIMIT_REQUIRED');
    expect(preview.deleteBatchPlan.deleteAllowed).toBe(false);
    expect(preview.preparedOperations).toEqual([]);
    expect(preview.deleteAllowed).toBe(false);
  });

  it('blocks delete planning when there are no candidates', async () => {
    const preview = await buildAnalyticsRetentionExecutionServicePreview({
      policy: {
        enabled: true,
        source: 'usage',
        usageRetentionDays: 90,
      },
      executionArgs: executeArgs(10),
      now: NOW,
      usageCandidateCount: 0,
    });

    expect(preview.executionGuard.deleteAllowed).toBe(true);
    expect(preview.deleteBatchPlan.deleteAllowed).toBe(false);
    expect(preview.deleteBatchPlan.reasons).toContain('NO_DELETE_CANDIDATES');
    expect(preview.deleteOperationPlan.deleteAllowed).toBe(false);
    expect(preview.deleteOperationPlan.reasons).toContain(
      'DELETE_BATCH_PLAN_BLOCKED',
    );
    expect(preview.preparedOperations).toEqual([]);
    expect(preview.deleteAllowed).toBe(false);
  });

  it('prepares only usage operations for usage source', async () => {
    const fakeRepository = createFakeDeleteRepository({
      usage: 5,
    });

    const preview = await buildAnalyticsRetentionExecutionServicePreview({
      policy: {
        enabled: true,
        source: 'usage',
        usageRetentionDays: 90,
      },
      executionArgs: executeArgs(10),
      now: NOW,
      usageCandidateCount: 5,
      deleteRepositoryExecutor: fakeRepository.executor,
    });

    const [request] = preview.deleteOperationPlan.repositoryOperationRequests;
    const [preparedOperation] = preview.preparedOperations;

    expect(preview.deleteBatchPlan.sourcePlans).toHaveLength(1);
    expect(request?.source).toBe('usage');
    expect(request?.requestedLimit).toBe(5);
    expect(preparedOperation?.source).toBe('usage');
    expect(preparedOperation?.deleteAllowed).toBe(true);
    expect(preview.deleteAllowed).toBe(true);
    expect(preview.destructiveExecutionPerformed).toBe(false);
    expect(fakeRepository.getDeleteCallCount()).toBe(0);
  });

  it('prepares only rejected operations for rejected source', async () => {
    const fakeRepository = createFakeDeleteRepository({
      rejected: 4,
    });

    const preview = await buildAnalyticsRetentionExecutionServicePreview({
      policy: {
        enabled: true,
        source: 'rejected',
        rejectedRetentionDays: 120,
      },
      executionArgs: executeArgs(10),
      now: NOW,
      rejectedCandidateCount: 4,
      deleteRepositoryExecutor: fakeRepository.executor,
    });

    const [request] = preview.deleteOperationPlan.repositoryOperationRequests;
    const [preparedOperation] = preview.preparedOperations;

    expect(preview.deleteBatchPlan.sourcePlans).toHaveLength(1);
    expect(request?.source).toBe('rejected');
    expect(request?.requestedLimit).toBe(4);
    expect(preparedOperation?.source).toBe('rejected');
    expect(preparedOperation?.deleteAllowed).toBe(true);
    expect(preview.deleteAllowed).toBe(true);
    expect(preview.destructiveExecutionPerformed).toBe(false);
    expect(fakeRepository.getDeleteCallCount()).toBe(0);
  });

  it('prepares both sources with the hard delete limit distributed in source order', async () => {
    const fakeRepository = createFakeDeleteRepository({
      usage: 3,
      rejected: 4,
    });

    const preview = await buildAnalyticsRetentionExecutionServicePreview({
      policy: {
        enabled: true,
        source: 'both',
        usageRetentionDays: 90,
        rejectedRetentionDays: 120,
      },
      executionArgs: executeArgs(5),
      now: NOW,
      usageCandidateCount: 3,
      rejectedCandidateCount: 4,
      deleteRepositoryExecutor: fakeRepository.executor,
    });

    expect(
      preview.deleteOperationPlan.repositoryOperationRequests.map((request) => ({
        source: request.source,
        requestedLimit: request.requestedLimit,
      })),
    ).toEqual([
      {
        source: 'usage',
        requestedLimit: 3,
      },
      {
        source: 'rejected',
        requestedLimit: 2,
      },
    ]);
    expect(preview.preparedOperations).toHaveLength(2);
    expect(preview.preparedOperations.every((operation) => operation.deleteAllowed)).toBe(
      true,
    );
    expect(preview.deleteAllowed).toBe(true);
    expect(fakeRepository.getDeleteCallCount()).toBe(0);
  });

  it('skips a selected source when its max delete count is zero', async () => {
    const fakeRepository = createFakeDeleteRepository({
      rejected: 5,
    });

    const preview = await buildAnalyticsRetentionExecutionServicePreview({
      policy: {
        enabled: true,
        source: 'both',
        usageRetentionDays: 90,
        rejectedRetentionDays: 120,
      },
      executionArgs: executeArgs(2),
      now: NOW,
      usageCandidateCount: 0,
      rejectedCandidateCount: 5,
      deleteRepositoryExecutor: fakeRepository.executor,
    });

    expect(
      preview.deleteBatchPlan.sourcePlans.map((sourcePlan) => ({
        source: sourcePlan.source,
        maxDeleteCount: sourcePlan.maxDeleteCount,
      })),
    ).toEqual([
      {
        source: 'usage',
        maxDeleteCount: 0,
      },
      {
        source: 'rejected',
        maxDeleteCount: 2,
      },
    ]);
    expect(
      preview.deleteOperationPlan.repositoryOperationRequests.map(
        (request) => request.source,
      ),
    ).toEqual(['rejected']);
    expect(preview.preparedOperations).toHaveLength(1);
    expect(preview.preparedOperations[0]?.source).toBe('rejected');
    expect(preview.preparedOperations[0]?.deleteAllowed).toBe(true);
    expect(preview.deleteAllowed).toBe(true);
    expect(fakeRepository.getDeleteCallCount()).toBe(0);
  });
});

function executeArgs(hardDeleteLimit: number): readonly string[] {
  return [
    '--mode',
    'execute',
    '--confirm-execute',
    ANALYTICS_RETENTION_EXECUTE_CONFIRMATION_VALUE,
    '--hard-delete-limit',
    String(hardDeleteLimit),
  ];
}

function createFakeDeleteRepository(
  recheckedCounts: Partial<Record<AnalyticsRetentionDeletePlanSource, number>>,
): {
  readonly executor: AnalyticsRetentionDeleteRepositoryPreparationExecutor;
  readonly getDeleteCallCount: () => number;
} {
  let deleteCallCount = 0;

  const repository: AnalyticsRetentionDeleteRepositoryPort = {
    async countCandidatesBeforeDelete(input) {
      return recheckedCounts[input.source] ?? 0;
    },
    async deleteCandidates() {
      deleteCallCount += 1;
      return 0;
    },
  };

  return {
    executor: createAnalyticsRetentionDeleteRepositoryExecutor(repository),
    getDeleteCallCount: () => deleteCallCount,
  };
}

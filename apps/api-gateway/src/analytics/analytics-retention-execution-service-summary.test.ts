import { describe, expect, it } from 'vitest';
import type { AnalyticsRetentionDeletePlanSource } from './analytics-retention-delete-batch-plan.js';
import {
  createAnalyticsRetentionDeleteRepositoryExecutor,
  type AnalyticsRetentionDeleteRepositoryPort,
} from './analytics-retention-delete.repository.js';
import { ANALYTICS_RETENTION_EXECUTE_CONFIRMATION_VALUE } from './analytics-retention-execution-command-args.js';
import {
  buildAnalyticsRetentionExecutionServicePreview,
  type AnalyticsRetentionDeleteRepositoryPreparationExecutor,
} from './analytics-retention-execution-service.js';
import { buildAnalyticsRetentionExecutionServiceSummary } from './analytics-retention-execution-service-summary.js';

const NOW = new Date('2026-07-06T00:00:00.000Z');

describe('analytics retention execution service summary', () => {
  it('summarizes dry-run preview as non-destructive without implementation', async () => {
    const preview = await buildAnalyticsRetentionExecutionServicePreview({
      policy: {
        enabled: true,
        source: 'usage',
        usageRetentionDays: 90,
      },
      now: NOW,
      usageCandidateCount: 5,
    });

    const summary = buildAnalyticsRetentionExecutionServiceSummary(preview);

    expect(summary).toMatchObject({
      enabled: true,
      mode: 'dry-run',
      source: 'usage',
      generatedAt: '2026-07-06T00:00:00.000Z',
      dryRunOnly: true,
      deleteAllowed: false,
      deleteImplementationAvailable: false,
      destructiveExecutionPerformed: false,
      hardDeleteLimit: null,
      totals: {
        candidateCount: 5,
        maxDeleteCount: 0,
        repositoryOperationCount: 0,
        preparedOperationCount: 0,
        executionResultCount: 0,
        deletedCount: 0,
      },
    });
    expect(summary.reasons.executionGuard).toEqual(['DRY_RUN_MODE']);
    expect(summary.reasons.deleteBatchPlan).toContain('EXECUTION_GUARD_BLOCKED');
    expect(summary.reasons.deleteBatchPlan).toContain('HARD_DELETE_LIMIT_NOT_AVAILABLE');
    expect(summary.sources).toEqual([
      {
        source: 'usage',
        retentionDays: 90,
        cutoffExclusive: '2026-04-07T00:00:00.000Z',
        candidateCount: null,
        maxDeleteCount: null,
        repositoryOperationPlanned: false,
        repositoryRequestedLimit: null,
        preparedOperation: null,
        preparedOperationError: null,
        executionResult: null,
      },
    ]);
  });

  it('summarizes allowed execute preview with prepared operations for both sources', async () => {
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

    const summary = buildAnalyticsRetentionExecutionServiceSummary(preview);

    expect(summary.deleteAllowed).toBe(true);
    expect(summary.deleteImplementationAvailable).toBe(true);
    expect(summary.destructiveExecutionPerformed).toBe(false);
    expect(summary.totals).toEqual({
      candidateCount: 7,
      maxDeleteCount: 5,
      repositoryOperationCount: 2,
      preparedOperationCount: 2,
      executionResultCount: 0,
      deletedCount: 0,
    });
    expect(summary.reasons).toEqual({
      executionGuard: [],
      deleteBatchPlan: [],
      deleteOperationPlan: [],
    });
    expect(
      summary.sources.map((source) => ({
        source: source.source,
        candidateCount: source.candidateCount,
        maxDeleteCount: source.maxDeleteCount,
        repositoryRequestedLimit: source.repositoryRequestedLimit,
        preparedDeleteAllowed: source.preparedOperation?.deleteAllowed,
        preparedCandidateCount: source.preparedOperation?.candidateCountBeforeDelete,
        preparedOperationError: source.preparedOperationError,
        executionResult: source.executionResult,
      })),
    ).toEqual([
      {
        source: 'usage',
        candidateCount: 3,
        maxDeleteCount: 3,
        repositoryRequestedLimit: 3,
        preparedDeleteAllowed: true,
        preparedCandidateCount: 3,
        preparedOperationError: null,
        executionResult: null,
      },
      {
        source: 'rejected',
        candidateCount: 4,
        maxDeleteCount: 2,
        repositoryRequestedLimit: 2,
        preparedDeleteAllowed: true,
        preparedCandidateCount: 4,
        preparedOperationError: null,
        executionResult: null,
      },
    ]);
    expect(fakeRepository.getDeleteCallCount()).toBe(0);
  });

  it('summarizes no-candidate execute preview as blocked before repository operation', async () => {
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

    const summary = buildAnalyticsRetentionExecutionServiceSummary(preview);

    expect(summary.deleteAllowed).toBe(false);
    expect(summary.totals).toEqual({
      candidateCount: 0,
      maxDeleteCount: 0,
      repositoryOperationCount: 0,
      preparedOperationCount: 0,
      executionResultCount: 0,
      deletedCount: 0,
    });
    expect(summary.reasons.deleteBatchPlan).toContain('NO_DELETE_CANDIDATES');
    expect(summary.reasons.deleteOperationPlan).toContain('DELETE_BATCH_PLAN_BLOCKED');
    expect(summary.sources).toEqual([
      {
        source: 'usage',
        retentionDays: 90,
        cutoffExclusive: '2026-04-07T00:00:00.000Z',
        candidateCount: 0,
        maxDeleteCount: 0,
        repositoryOperationPlanned: false,
        repositoryRequestedLimit: null,
        preparedOperation: null,
        preparedOperationError: null,
        executionResult: null,
      },
    ]);
  });

  it('surfaces fail-closed preparation errors in summary output', async () => {
    const failingExecutor: AnalyticsRetentionDeleteRepositoryPreparationExecutor = {
      async prepareDeleteOperation() {
        throw new Error('candidate recheck repository unavailable');
      },
    };

    const preview = await buildAnalyticsRetentionExecutionServicePreview({
      policy: {
        enabled: true,
        source: 'usage',
        usageRetentionDays: 90,
      },
      executionArgs: executeArgs(5),
      now: NOW,
      usageCandidateCount: 5,
      deleteRepositoryExecutor: failingExecutor,
    });

    const summary = buildAnalyticsRetentionExecutionServiceSummary(preview);

    expect(summary.deleteAllowed).toBe(false);
    expect(summary.destructiveExecutionPerformed).toBe(false);
    expect(summary.preparedOperationErrors).toEqual([
      {
        source: 'usage',
        requestedLimit: 5,
        message: 'candidate recheck repository unavailable',
        failClosedReason: 'CANDIDATE_RECHECK_PREPARATION_FAILED',
        deleteAllowed: false,
      },
    ]);
    expect(summary.sources).toHaveLength(1);
    expect(summary.sources[0]).toMatchObject({
      source: 'usage',
      repositoryOperationPlanned: true,
      repositoryRequestedLimit: 5,
      preparedOperation: null,
      preparedOperationError: {
        source: 'usage',
        requestedLimit: 5,
        message: 'candidate recheck repository unavailable',
        failClosedReason: 'CANDIDATE_RECHECK_PREPARATION_FAILED',
        deleteAllowed: false,
      },
      executionResult: null,
    });
  });
  it('summarizes repository safety blocked prepared operations', async () => {
    const fakeRepository = createFakeDeleteRepository({
      usage: 1,
    });
    const preview = await buildAnalyticsRetentionExecutionServicePreview({
      policy: {
        enabled: true,
        source: 'usage',
        usageRetentionDays: 90,
      },
      executionArgs: executeArgs(5),
      now: NOW,
      usageCandidateCount: 5,
      deleteRepositoryExecutor: fakeRepository.executor,
    });

    const summary = buildAnalyticsRetentionExecutionServiceSummary(preview);

    expect(summary.deleteAllowed).toBe(false);
    expect(summary.totals).toEqual({
      candidateCount: 5,
      maxDeleteCount: 5,
      repositoryOperationCount: 1,
      preparedOperationCount: 1,
      executionResultCount: 0,
      deletedCount: 0,
    });
    expect(summary.sources).toHaveLength(1);
    expect(summary.sources[0]?.preparedOperation).toMatchObject({
      source: 'usage',
      requestedLimit: 5,
      candidateCountBeforeDelete: 1,
      candidateRecheckCompleted: true,
      deleteAllowed: false,
    });
    expect(summary.sources[0]?.preparedOperation?.blockedReasons.length).toBeGreaterThan(
      0,
    );
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

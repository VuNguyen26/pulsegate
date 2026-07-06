import { describe, expect, it, vi } from 'vitest';
import type {
  AnalyticsRetentionCandidateReadRepository,
  AnalyticsRetentionCandidateReadResult,
} from './analytics-retention-candidate-read.repository.js';
import type { AnalyticsRetentionDeletePlanSource } from './analytics-retention-delete-batch-plan.js';
import {
  createAnalyticsRetentionDeleteRepositoryExecutor,
  type AnalyticsRetentionDeleteRepositoryPort,
} from './analytics-retention-delete.repository.js';
import { ANALYTICS_RETENTION_EXECUTE_CONFIRMATION_VALUE } from './analytics-retention-execution-command-args.js';
import type { AnalyticsRetentionDeleteRepositoryPreparationExecutor } from './analytics-retention-execution-service.js';
import { buildAnalyticsRetentionExecutionServiceCandidateReadPreview } from './analytics-retention-execution-service-candidate-read-preview.js';

const NOW = new Date('2026-07-06T00:00:00.000Z');

describe('analytics retention execution service candidate-read preview', () => {
  it('builds an execute preview using counts loaded from the candidate read repository', async () => {
    const candidateRepository = createCandidateReadRepository({
      enabled: true,
      generatedAt: NOW,
      usage: {
        source: 'usage',
        cutoffExclusive: new Date('2026-04-07T00:00:00.000Z'),
        retentionDays: 90,
        candidateCount: 5,
        dryRunOnly: true,
        deleteAllowed: false,
      },
      rejected: null,
    });
    const deleteRepository = createFakeDeleteRepository({
      usage: 5,
    });

    const result =
      await buildAnalyticsRetentionExecutionServiceCandidateReadPreview({
        policy: {
          enabled: true,
          source: 'usage',
          usageRetentionDays: 90,
        },
        executionArgs: executeArgs(10),
        now: NOW,
        candidateReadRepository: candidateRepository.repository,
        deleteRepositoryExecutor: deleteRepository.executor,
      });

    expect(result.candidateCountLoader.counts).toEqual({
      usageCandidateCount: 5,
    });
    expect(result.candidateCountLoader.reasons).toEqual([]);
    expect(result.preview.deleteBatchPlan.totalCandidateCount).toBe(5);
    expect(result.preview.deleteBatchPlan.totalMaxDeleteCount).toBe(5);
    expect(
      result.preview.deleteOperationPlan.repositoryOperationRequests.map(
        (request) => ({
          source: request.source,
          requestedLimit: request.requestedLimit,
        }),
      ),
    ).toEqual([
      {
        source: 'usage',
        requestedLimit: 5,
      },
    ]);
    expect(result.preview.preparedOperations).toHaveLength(1);
    expect(result.preview.preparedOperations[0]?.deleteAllowed).toBe(true);
    expect(result.preview.deleteAllowed).toBe(true);
    expect(result.preview.destructiveExecutionPerformed).toBe(false);
    expect(candidateRepository.summarizeCandidates).toHaveBeenCalledTimes(1);
    expect(deleteRepository.getCandidateRecheckCallCount()).toBe(1);
    expect(deleteRepository.getDeleteCallCount()).toBe(0);
  });

  it('keeps dry-run preview non-destructive while loading count-only candidates', async () => {
    const candidateRepository = createCandidateReadRepository({
      enabled: true,
      generatedAt: NOW,
      usage: {
        source: 'usage',
        cutoffExclusive: new Date('2026-04-07T00:00:00.000Z'),
        retentionDays: 90,
        candidateCount: 5,
        dryRunOnly: true,
        deleteAllowed: false,
      },
      rejected: null,
    });
    const deleteRepository = createFakeDeleteRepository({
      usage: 5,
    });

    const result =
      await buildAnalyticsRetentionExecutionServiceCandidateReadPreview({
        policy: {
          enabled: true,
          source: 'usage',
          usageRetentionDays: 90,
        },
        now: NOW,
        candidateReadRepository: candidateRepository.repository,
        deleteRepositoryExecutor: deleteRepository.executor,
      });

    expect(result.candidateCountLoader.counts).toEqual({
      usageCandidateCount: 5,
    });
    expect(result.preview.executionArgs.mode).toBe('dry-run');
    expect(result.preview.executionGuard.reasons).toEqual(['DRY_RUN_MODE']);
    expect(result.preview.deleteAllowed).toBe(false);
    expect(result.preview.preparedOperations).toEqual([]);
    expect(result.preview.executionResults).toEqual([]);
    expect(result.preview.destructiveExecutionPerformed).toBe(false);
    expect(deleteRepository.getCandidateRecheckCallCount()).toBe(0);
    expect(deleteRepository.getDeleteCallCount()).toBe(0);
  });

  it('blocks preview when candidate count loader cannot provide selected source counts', async () => {
    const candidateRepository = createCandidateReadRepository({
      enabled: true,
      generatedAt: NOW,
      usage: null,
      rejected: null,
    });
    const deleteRepository = createFakeDeleteRepository({
      usage: 5,
    });

    const result =
      await buildAnalyticsRetentionExecutionServiceCandidateReadPreview({
        policy: {
          enabled: true,
          source: 'usage',
          usageRetentionDays: 90,
        },
        executionArgs: executeArgs(10),
        now: NOW,
        candidateReadRepository: candidateRepository.repository,
        deleteRepositoryExecutor: deleteRepository.executor,
      });

    expect(result.candidateCountLoader.counts).toEqual({});
    expect(result.candidateCountLoader.reasons).toEqual([
      'USAGE_CANDIDATE_SUMMARY_MISSING',
    ]);
    expect(result.preview.deleteBatchPlan.deleteAllowed).toBe(false);
    expect(result.preview.deleteBatchPlan.reasons).toContain(
      'USAGE_CANDIDATE_COUNT_REQUIRED',
    );
    expect(result.preview.deleteOperationPlan.repositoryOperationRequests).toEqual(
      [],
    );
    expect(result.preview.preparedOperations).toEqual([]);
    expect(result.preview.deleteAllowed).toBe(false);
    expect(deleteRepository.getCandidateRecheckCallCount()).toBe(0);
    expect(deleteRepository.getDeleteCallCount()).toBe(0);
  });

  it('propagates candidate read repository errors before repository delete preparation', async () => {
    const summarizeCandidates = vi.fn().mockRejectedValue(
      new Error('candidate repository unavailable'),
    );
    const candidateReadRepository = {
      summarizeCandidates,
    } satisfies AnalyticsRetentionCandidateReadRepository;
    const deleteRepository = createFakeDeleteRepository({
      usage: 5,
    });

    await expect(
      buildAnalyticsRetentionExecutionServiceCandidateReadPreview({
        policy: {
          enabled: true,
          source: 'usage',
          usageRetentionDays: 90,
        },
        executionArgs: executeArgs(10),
        now: NOW,
        candidateReadRepository,
        deleteRepositoryExecutor: deleteRepository.executor,
      }),
    ).rejects.toThrow(/candidate repository unavailable/);

    expect(summarizeCandidates).toHaveBeenCalledTimes(1);
    expect(deleteRepository.getCandidateRecheckCallCount()).toBe(0);
    expect(deleteRepository.getDeleteCallCount()).toBe(0);
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

function createCandidateReadRepository(
  result: AnalyticsRetentionCandidateReadResult,
): {
  readonly repository: AnalyticsRetentionCandidateReadRepository;
  readonly summarizeCandidates: ReturnType<typeof vi.fn>;
} {
  const summarizeCandidates = vi.fn().mockResolvedValue(result);

  return {
    repository: {
      summarizeCandidates,
    },
    summarizeCandidates,
  };
}

function createFakeDeleteRepository(
  recheckedCounts: Partial<Record<AnalyticsRetentionDeletePlanSource, number>>,
): {
  readonly executor: AnalyticsRetentionDeleteRepositoryPreparationExecutor;
  readonly getCandidateRecheckCallCount: () => number;
  readonly getDeleteCallCount: () => number;
} {
  let candidateRecheckCallCount = 0;
  let deleteCallCount = 0;

  const repository: AnalyticsRetentionDeleteRepositoryPort = {
    async countCandidatesBeforeDelete(input) {
      candidateRecheckCallCount += 1;
      return recheckedCounts[input.source] ?? 0;
    },
    async deleteCandidates() {
      deleteCallCount += 1;
      return 0;
    },
  };

  return {
    executor: createAnalyticsRetentionDeleteRepositoryExecutor(repository),
    getCandidateRecheckCallCount: () => candidateRecheckCallCount,
    getDeleteCallCount: () => deleteCallCount,
  };
}

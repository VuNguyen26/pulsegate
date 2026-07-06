import { describe, expect, it, vi } from 'vitest';
import type {
  AnalyticsRetentionCandidateReadRepository,
  AnalyticsRetentionCandidateReadResult,
} from './analytics-retention-candidate-read.repository.js';
import {
  createAnalyticsRetentionPlan,
  parseAnalyticsRetentionPolicy,
  type AnalyticsRetentionPlan,
} from './analytics-retention-policy.js';
import { loadAnalyticsRetentionExecutionCandidateCounts } from './analytics-retention-execution-candidate-count-loader.js';

const NOW = new Date('2026-07-06T00:00:00.000Z');

describe('analytics retention execution candidate count loader', () => {
  it('loads candidate counts from the existing candidate read repository', async () => {
    const plan = createPlan({
      enabled: true,
      source: 'both',
      usageRetentionDays: 90,
      rejectedRetentionDays: 120,
    });
    const candidateResult = {
      enabled: true,
      generatedAt: NOW,
      usage: {
        source: 'usage',
        cutoffExclusive: new Date('2026-04-07T00:00:00.000Z'),
        retentionDays: 90,
        candidateCount: 12,
        dryRunOnly: true,
        deleteAllowed: false,
      },
      rejected: {
        source: 'rejected',
        cutoffExclusive: new Date('2026-03-08T00:00:00.000Z'),
        retentionDays: 120,
        candidateCount: 34,
        dryRunOnly: true,
        deleteAllowed: false,
      },
    } satisfies AnalyticsRetentionCandidateReadResult;
    const { repository, summarizeCandidates } =
      createCandidateReadRepository(candidateResult);

    const result = await loadAnalyticsRetentionExecutionCandidateCounts({
      plan,
      candidateReadRepository: repository,
    });

    expect(result).toEqual({
      enabled: true,
      generatedAt: NOW,
      candidates: candidateResult,
      counts: {
        usageCandidateCount: 12,
        rejectedCandidateCount: 34,
      },
      reasons: [],
      dryRunOnly: true,
      deleteAllowed: false,
    });
    expect(summarizeCandidates).toHaveBeenCalledWith(plan);
  });

  it('omits disabled retention counts without reporting mismatches', async () => {
    const plan = createPlan({
      enabled: false,
      source: 'both',
      usageRetentionDays: 90,
      rejectedRetentionDays: 120,
    });
    const candidateResult = {
      enabled: false,
      generatedAt: NOW,
      usage: null,
      rejected: null,
    } satisfies AnalyticsRetentionCandidateReadResult;
    const { repository } = createCandidateReadRepository(candidateResult);

    const result = await loadAnalyticsRetentionExecutionCandidateCounts({
      plan,
      candidateReadRepository: repository,
    });

    expect(result.counts).toEqual({});
    expect(result.reasons).toEqual([]);
    expect(result.dryRunOnly).toBe(true);
    expect(result.deleteAllowed).toBe(false);
  });

  it('keeps usage and rejected source separation for usage-only plans', async () => {
    const plan = createPlan({
      enabled: true,
      source: 'usage',
      usageRetentionDays: 90,
    });
    const candidateResult = {
      enabled: true,
      generatedAt: NOW,
      usage: {
        source: 'usage',
        cutoffExclusive: new Date('2026-04-07T00:00:00.000Z'),
        retentionDays: 90,
        candidateCount: 7,
        dryRunOnly: true,
        deleteAllowed: false,
      },
      rejected: null,
    } satisfies AnalyticsRetentionCandidateReadResult;
    const { repository } = createCandidateReadRepository(candidateResult);

    const result = await loadAnalyticsRetentionExecutionCandidateCounts({
      plan,
      candidateReadRepository: repository,
    });

    expect(result.counts).toEqual({
      usageCandidateCount: 7,
    });
    expect(result.reasons).toEqual([]);
  });

  it('does not forward unexpected candidate summaries for unselected sources', async () => {
    const plan = createPlan({
      enabled: true,
      source: 'usage',
      usageRetentionDays: 90,
    });
    const candidateResult = {
      enabled: true,
      generatedAt: NOW,
      usage: {
        source: 'usage',
        cutoffExclusive: new Date('2026-04-07T00:00:00.000Z'),
        retentionDays: 90,
        candidateCount: 7,
        dryRunOnly: true,
        deleteAllowed: false,
      },
      rejected: {
        source: 'rejected',
        cutoffExclusive: new Date('2026-03-08T00:00:00.000Z'),
        retentionDays: 120,
        candidateCount: 99,
        dryRunOnly: true,
        deleteAllowed: false,
      },
    } satisfies AnalyticsRetentionCandidateReadResult;
    const { repository } = createCandidateReadRepository(candidateResult);

    const result = await loadAnalyticsRetentionExecutionCandidateCounts({
      plan,
      candidateReadRepository: repository,
    });

    expect(result.counts).toEqual({
      usageCandidateCount: 7,
    });
    expect(result.reasons).toEqual(['REJECTED_CANDIDATE_SUMMARY_UNEXPECTED']);
  });

  it('does not forward missing candidate summaries for selected sources', async () => {
    const plan = createPlan({
      enabled: true,
      source: 'both',
      usageRetentionDays: 90,
      rejectedRetentionDays: 120,
    });
    const candidateResult = {
      enabled: true,
      generatedAt: NOW,
      usage: null,
      rejected: {
        source: 'rejected',
        cutoffExclusive: new Date('2026-03-08T00:00:00.000Z'),
        retentionDays: 120,
        candidateCount: 3,
        dryRunOnly: true,
        deleteAllowed: false,
      },
    } satisfies AnalyticsRetentionCandidateReadResult;
    const { repository } = createCandidateReadRepository(candidateResult);

    const result = await loadAnalyticsRetentionExecutionCandidateCounts({
      plan,
      candidateReadRepository: repository,
    });

    expect(result.counts).toEqual({
      rejectedCandidateCount: 3,
    });
    expect(result.reasons).toEqual(['USAGE_CANDIDATE_SUMMARY_MISSING']);
  });

  it('does not forward mismatched cutoff candidate summaries', async () => {
    const plan = createPlan({
      enabled: true,
      source: 'usage',
      usageRetentionDays: 90,
    });
    const candidateResult = {
      enabled: true,
      generatedAt: NOW,
      usage: {
        source: 'usage',
        cutoffExclusive: new Date('2026-04-08T00:00:00.000Z'),
        retentionDays: 90,
        candidateCount: 7,
        dryRunOnly: true,
        deleteAllowed: false,
      },
      rejected: null,
    } satisfies AnalyticsRetentionCandidateReadResult;
    const { repository } = createCandidateReadRepository(candidateResult);

    const result = await loadAnalyticsRetentionExecutionCandidateCounts({
      plan,
      candidateReadRepository: repository,
    });

    expect(result.counts).toEqual({});
    expect(result.reasons).toEqual(['USAGE_CUTOFF_EXCLUSIVE_MISMATCH']);
  });

  it('does not forward invalid candidate counts', async () => {
    const plan = createPlan({
      enabled: true,
      source: 'usage',
      usageRetentionDays: 90,
    });
    const candidateResult = {
      enabled: true,
      generatedAt: NOW,
      usage: {
        source: 'usage',
        cutoffExclusive: new Date('2026-04-07T00:00:00.000Z'),
        retentionDays: 90,
        candidateCount: -1,
        dryRunOnly: true,
        deleteAllowed: false,
      },
      rejected: null,
    } satisfies AnalyticsRetentionCandidateReadResult;
    const { repository } = createCandidateReadRepository(candidateResult);

    const result = await loadAnalyticsRetentionExecutionCandidateCounts({
      plan,
      candidateReadRepository: repository,
    });

    expect(result.counts).toEqual({});
    expect(result.reasons).toEqual(['USAGE_CANDIDATE_COUNT_INVALID']);
  });

  it('propagates repository defensive errors without retrying or deleting', async () => {
    const plan = {
      ...createPlan({
        enabled: true,
        source: 'usage',
        usageRetentionDays: 90,
      }),
      mode: 'execute',
    } as unknown as AnalyticsRetentionPlan;
    const summarizeCandidates = vi.fn().mockRejectedValue(
      new RangeError('analytics retention candidate reads only support dry-run mode'),
    );
    const repository = {
      summarizeCandidates,
    } satisfies AnalyticsRetentionCandidateReadRepository;

    await expect(
      loadAnalyticsRetentionExecutionCandidateCounts({
        plan,
        candidateReadRepository: repository,
      }),
    ).rejects.toThrow(/dry-run/);

    expect(summarizeCandidates).toHaveBeenCalledTimes(1);
  });
});

function createPlan(
  input: Parameters<typeof parseAnalyticsRetentionPolicy>[0],
): AnalyticsRetentionPlan {
  return createAnalyticsRetentionPlan(parseAnalyticsRetentionPolicy(input), NOW);
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

import { describe, expect, it, vi } from 'vitest';

import type {
  AnalyticsRetentionCandidateReadRepository,
  AnalyticsRetentionCandidateReadResult,
} from './analytics-retention-candidate-read.repository.js';
import {
  ANALYTICS_RETENTION_EXECUTE_CONFIRMATION_VALUE,
} from './analytics-retention-execution-command-args.js';
import {
  buildAnalyticsRetentionExecutionServiceCandidateReadPreview,
} from './analytics-retention-execution-service-candidate-read-preview.js';
import {
  buildAnalyticsRetentionOperatorPreviewOutput,
} from './analytics-retention-operator-preview-output.js';

const NOW = new Date('2026-07-06T00:00:00.000Z');

describe('buildAnalyticsRetentionOperatorPreviewOutput', () => {
  it('should build a non-destructive operator preview output with candidate counts and service summary', async () => {
    const { repository, summarizeCandidates } = createCandidateReadRepository({
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
    });

    const preview = await buildAnalyticsRetentionExecutionServiceCandidateReadPreview({
      policy: {
        enabled: true,
        source: 'both',
        usageRetentionDays: 90,
        rejectedRetentionDays: 120,
      },
      executionArgs: [
        '--mode',
        'execute',
        '--confirm-execute',
        ANALYTICS_RETENTION_EXECUTE_CONFIRMATION_VALUE,
        '--hard-delete-limit',
        '100',
      ],
      now: NOW,
      candidateReadRepository: repository,
    });

    const output = buildAnalyticsRetentionOperatorPreviewOutput(preview);

    expect(output.kind).toBe('analytics-retention-operator-preview');
    expect(output.deleteAllowed).toBe(false);
    expect(output.destructiveExecutionPerformed).toBe(false);
    expect(output.safety).toEqual({
      commandDeletesEvents: false,
      candidateReadOnly: true,
      deleteRepositoryExecuted: false,
      deleteAllowed: false,
      destructiveExecutionPerformed: false,
      deleteImplementationAvailable: false,
      servicePreviewDeleteAllowed: output.summary.deleteAllowed,
    });
    expect(output.summary.totals.candidateCount).toBe(46);
    expect(output.summary.totals.executionResultCount).toBe(0);
    expect(output.summary.destructiveExecutionPerformed).toBe(false);
    expect(output.candidateCountLoader).toEqual({
      enabled: true,
      generatedAt: '2026-07-06T00:00:00.000Z',
      counts: {
        usageCandidateCount: 12,
        rejectedCandidateCount: 34,
      },
      reasons: [],
      sources: [
        {
          source: 'usage',
          loaded: true,
          retentionDays: 90,
          cutoffExclusive: '2026-04-07T00:00:00.000Z',
          candidateCount: 12,
          dryRunOnly: true,
          deleteAllowed: false,
        },
        {
          source: 'rejected',
          loaded: true,
          retentionDays: 120,
          cutoffExclusive: '2026-03-08T00:00:00.000Z',
          candidateCount: 34,
          dryRunOnly: true,
          deleteAllowed: false,
        },
      ],
      dryRunOnly: true,
      deleteAllowed: false,
    });
    expect(summarizeCandidates).toHaveBeenCalledTimes(1);
  });

  it('should keep disabled retention as a safe empty operator preview', async () => {
    const { repository } = createCandidateReadRepository({
      enabled: false,
      generatedAt: NOW,
      usage: null,
      rejected: null,
    });

    const preview = await buildAnalyticsRetentionExecutionServiceCandidateReadPreview({
      policy: {
        enabled: false,
        source: 'both',
        usageRetentionDays: 90,
        rejectedRetentionDays: 120,
      },
      now: NOW,
      candidateReadRepository: repository,
    });

    const output = buildAnalyticsRetentionOperatorPreviewOutput(preview);

    expect(output.summary.enabled).toBe(false);
    expect(output.summary.totals.candidateCount).toBe(0);
    expect(output.deleteAllowed).toBe(false);
    expect(output.safety.commandDeletesEvents).toBe(false);
    expect(output.candidateCountLoader.counts).toEqual({
      usageCandidateCount: null,
      rejectedCandidateCount: null,
    });
    expect(output.candidateCountLoader.sources).toEqual([
      {
        source: 'usage',
        loaded: false,
        retentionDays: null,
        cutoffExclusive: null,
        candidateCount: null,
        dryRunOnly: true,
        deleteAllowed: false,
      },
      {
        source: 'rejected',
        loaded: false,
        retentionDays: null,
        cutoffExclusive: null,
        candidateCount: null,
        dryRunOnly: true,
        deleteAllowed: false,
      },
    ]);
  });

  it('should preserve candidate count loader reasons without allowing operator deletion', async () => {
    const { repository } = createCandidateReadRepository({
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
    });

    const preview = await buildAnalyticsRetentionExecutionServiceCandidateReadPreview({
      policy: {
        enabled: true,
        source: 'usage',
        usageRetentionDays: 90,
      },
      now: NOW,
      candidateReadRepository: repository,
    });

    const output = buildAnalyticsRetentionOperatorPreviewOutput(preview);

    expect(output.candidateCountLoader.reasons).toEqual([
      'USAGE_CUTOFF_EXCLUSIVE_MISMATCH',
    ]);
    expect(output.candidateCountLoader.counts).toEqual({
      usageCandidateCount: null,
      rejectedCandidateCount: null,
    });
    expect(output.summary.totals.candidateCount).toBe(0);
    expect(output.summary.reasons.deleteBatchPlan.length).toBeGreaterThan(0);
    expect(output.deleteAllowed).toBe(false);
    expect(output.safety.deleteRepositoryExecuted).toBe(false);
  });
});

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


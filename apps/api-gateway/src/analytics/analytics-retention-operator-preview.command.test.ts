import { describe, expect, it, vi } from 'vitest';

import type {
  AnalyticsRetentionCandidateReadRepository,
  AnalyticsRetentionCandidateReadResult,
} from './analytics-retention-candidate-read.repository.js';
import {
  ANALYTICS_RETENTION_EXECUTE_CONFIRMATION_VALUE,
} from './analytics-retention-execution-command-args.js';
import {
  runAnalyticsRetentionOperatorPreviewCommand,
} from './analytics-retention-operator-preview.command.js';
import type {
  AnalyticsRetentionOperatorPreviewOutput,
} from './analytics-retention-operator-preview-output.js';

const NOW = new Date('2026-07-06T00:00:00.000Z');

describe('runAnalyticsRetentionOperatorPreviewCommand', () => {
  it('should print a dry-run operator preview from a candidate read repository', async () => {
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
      rejected: null,
    });
    const logger = createLogger();

    const output = await runAnalyticsRetentionOperatorPreviewCommand({
      argv: [
        '--enabled',
        'true',
        '--source',
        'usage',
        '--usage-retention-days',
        '90',
      ],
      now: NOW,
      candidateReadRepository: repository,
      logger,
    });

    expect(summarizeCandidates).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledOnce();

    const printedOutput = JSON.parse(String(logger.log.mock.calls[0]?.[0]));

    expect(printedOutput).toEqual(output);
    expect(output.kind).toBe('analytics-retention-operator-preview');
    expect(output.summary.mode).toBe('dry-run');
    expect(output.summary.source).toBe('usage');
    expect(output.summary.totals.candidateCount).toBe(12);
    expect(output.candidateCountLoader.counts).toEqual({
      usageCandidateCount: 12,
      rejectedCandidateCount: null,
    });
    expect(output.deleteAllowed).toBe(false);
    expect(output.destructiveExecutionPerformed).toBe(false);
    expect(output.safety).toMatchObject({
      commandDeletesEvents: false,
      candidateReadOnly: true,
      deleteRepositoryExecuted: false,
      deleteAllowed: false,
      destructiveExecutionPerformed: false,
      deleteImplementationAvailable: false,
    });
  });

  it('should allow execute preview arguments without turning the operator command into delete execution', async () => {
    const { repository } = createCandidateReadRepository({
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
    const logger = createLogger();

    const output = await runAnalyticsRetentionOperatorPreviewCommand({
      argv: [
        '--enabled',
        'true',
        '--source',
        'both',
        '--usage-retention-days',
        '90',
        '--rejected-retention-days',
        '120',
        '--mode',
        'execute',
        '--confirm-execute',
        ANALYTICS_RETENTION_EXECUTE_CONFIRMATION_VALUE,
        '--hard-delete-limit',
        '30',
      ],
      now: NOW,
      candidateReadRepository: repository,
      logger,
    });

    expect(output.summary.mode).toBe('execute');
    expect(output.summary.hardDeleteLimit).toBe(30);
    expect(output.summary.totals.candidateCount).toBe(46);
    expect(output.summary.totals.executionResultCount).toBe(0);
    expect(output.deleteAllowed).toBe(false);
    expect(output.destructiveExecutionPerformed).toBe(false);
    expect(output.safety.commandDeletesEvents).toBe(false);
    expect(output.safety.deleteRepositoryExecuted).toBe(false);
  });

  it('should keep disabled retention as a safe printed preview', async () => {
    const { repository } = createCandidateReadRepository({
      enabled: false,
      generatedAt: NOW,
      usage: null,
      rejected: null,
    });
    const logger = createLogger();

    const output = await runAnalyticsRetentionOperatorPreviewCommand({
      argv: [
        '--enabled',
        'false',
        '--source',
        'both',
        '--usage-retention-days',
        '90',
        '--rejected-retention-days',
        '120',
      ],
      now: NOW,
      candidateReadRepository: repository,
      logger,
    });

    expect(output.summary.enabled).toBe(false);
    expect(output.summary.totals.candidateCount).toBe(0);
    expect(output.candidateCountLoader.counts).toEqual({
      usageCandidateCount: null,
      rejectedCandidateCount: null,
    });
    expect(output.deleteAllowed).toBe(false);
    expect(logger.log).toHaveBeenCalledOnce();
  });

  it('should print incomplete execute preview as non-destructive JSON without delete execution', async () => {
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
      rejected: null,
    });
    const logger = createLogger();

    const output = await runAnalyticsRetentionOperatorPreviewCommand({
      argv: [
        '--enabled',
        'true',
        '--source',
        'usage',
        '--usage-retention-days',
        '90',
        '--mode',
        'execute',
        '--hard-delete-limit',
        '30',
      ],
      now: NOW,
      candidateReadRepository: repository,
      logger,
    });

    expect(summarizeCandidates).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledOnce();

    const printedOutput = JSON.parse(String(logger.log.mock.calls[0]?.[0]));

    expect(printedOutput).toEqual(output);
    expect(output.summary.mode).toBe('execute');
    expect(output.summary.hardDeleteLimit).toBe(30);
    expect(output.summary.totals.candidateCount).toBe(12);
    expectNonDestructiveOperatorPreviewOutput(output);
  });

  it('should reject invalid args before reading candidates', async () => {
    const { repository, summarizeCandidates } = createCandidateReadRepository({
      enabled: true,
      generatedAt: NOW,
      usage: null,
      rejected: null,
    });
    const logger = createLogger();

    await expect(
      runAnalyticsRetentionOperatorPreviewCommand({
        argv: ['--delete-now', 'true'],
        now: NOW,
        candidateReadRepository: repository,
        logger,
      }),
    ).rejects.toThrow(/unknown option/);

    expect(summarizeCandidates).not.toHaveBeenCalled();
    expect(logger.log).not.toHaveBeenCalled();
  });
});

function expectNonDestructiveOperatorPreviewOutput(
  output: AnalyticsRetentionOperatorPreviewOutput,
): void {
  expect(output.deleteAllowed).toBe(false);
  expect(output.destructiveExecutionPerformed).toBe(false);
  expect(output.summary.deleteAllowed).toBe(false);
  expect(output.summary.destructiveExecutionPerformed).toBe(false);
  expect(output.summary.totals.executionResultCount).toBe(0);
  expect(output.candidateCountLoader.dryRunOnly).toBe(true);
  expect(output.candidateCountLoader.deleteAllowed).toBe(false);
  expect(output.safety).toMatchObject({
    commandDeletesEvents: false,
    candidateReadOnly: true,
    deleteRepositoryExecuted: false,
    deleteAllowed: false,
    destructiveExecutionPerformed: false,
    deleteImplementationAvailable: false,
  });

  for (const source of output.candidateCountLoader.sources) {
    expect(source.dryRunOnly).toBe(true);
    expect(source.deleteAllowed).toBe(false);
  }
}

function createLogger() {
  return {
    log: vi.fn((message: string): void => {
      void message;
    }),
  };
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


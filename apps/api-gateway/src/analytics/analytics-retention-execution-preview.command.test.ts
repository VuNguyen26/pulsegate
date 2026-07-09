import { afterEach, describe, expect, it, vi } from 'vitest';

import { ANALYTICS_RETENTION_EXECUTE_CONFIRMATION_VALUE } from './analytics-retention-execution-command-args.js';
import {
  ANALYTICS_RETENTION_EXECUTION_PREVIEW_COMMAND_USAGE,
  runAnalyticsRetentionExecutionPreviewCommand,
  splitAnalyticsRetentionExecutionPreviewCommandArgs,
} from './analytics-retention-execution-preview.command.js';

describe('splitAnalyticsRetentionExecutionPreviewCommandArgs', () => {
  it('should split policy args from execution args', () => {
    expect(
      splitAnalyticsRetentionExecutionPreviewCommandArgs([
        '--enabled',
        'true',
        '--source',
        'both',
        '--usage-retention-days',
        '90',
        '--rejected-retention-days=120',
        '--mode',
        'execute',
        '--confirm-execute',
        ANALYTICS_RETENTION_EXECUTE_CONFIRMATION_VALUE,
        '--hard-delete-limit=100',
      ]),
    ).toEqual({
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
    });
  });

  it('should reject unknown args before building a preview', () => {
    expect(() =>
      splitAnalyticsRetentionExecutionPreviewCommandArgs(['--delete-now', 'true']),
    ).toThrow(/unknown option/);
  });

  it('should reject missing values', () => {
    expect(() =>
      splitAnalyticsRetentionExecutionPreviewCommandArgs(['--enabled']),
    ).toThrow(/requires a value/);

    expect(() =>
      splitAnalyticsRetentionExecutionPreviewCommandArgs([
        '--usage-retention-days=',
      ]),
    ).toThrow(/requires a value/);
  });

  it('should reject duplicate policy options', () => {
    expect(() =>
      splitAnalyticsRetentionExecutionPreviewCommandArgs([
        '--source',
        'usage',
        '--source',
        'rejected',
      ]),
    ).toThrow(/duplicate option/);
  });
});

describe('runAnalyticsRetentionExecutionPreviewCommand', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should document execute contract review as review-only output', () => {
    expect(ANALYTICS_RETENTION_EXECUTION_PREVIEW_COMMAND_USAGE).toContain(
      'executeContractReview',
    );
    expect(ANALYTICS_RETENTION_EXECUTION_PREVIEW_COMMAND_USAGE).toContain(
      'review-only',
    );
    expect(ANALYTICS_RETENTION_EXECUTION_PREVIEW_COMMAND_USAGE).toContain(
      'does not wire deleteCandidates',
    );
    expect(ANALYTICS_RETENTION_EXECUTION_PREVIEW_COMMAND_USAGE).toContain(
      'does not delete analytics events',
    );
  });

  it('should print a dry-run-only execution preview', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    runAnalyticsRetentionExecutionPreviewCommand([
      '--enabled',
      'true',
      '--source',
      'usage',
      '--usage-retention-days',
      '90',
    ]);

    expect(logSpy).toHaveBeenCalledOnce();

    const output = JSON.parse(String(logSpy.mock.calls[0]?.[0]));

    expect(output.executionArgs).toEqual({
      mode: 'dry-run',
    });
    expect(output.executionGuard).toEqual({
      mode: 'dry-run',
      source: 'usage',
      dryRunOnly: true,
      deleteAllowed: false,
      hardDeleteLimit: null,
      reasons: ['DRY_RUN_MODE'],
    });
    expect(output.executeContractReview.summary).toMatchObject({
      allowed: false,
      reviewOnly: true,
      destructiveExecutionAllowed: false,
    });
    expect(output.executeContractReview.guardrails).toMatchObject({
      operatorConfirmationStatus: 'missing',
      hardDeleteLimitStatus: 'missing',
      candidateRecheckStatus: 'missing',
      rollbackExpectationStatus: 'missing',
      auditOutputStatus: 'missing',
    });
    expect(output.executeContractReview.safety).toMatchObject({
      deleteCandidatesWired: false,
      prismaDeleteRepositoryWiredToOperatorFlow: false,
      deletesRawEvents: false,
      affectsQuotaCounting: false,
      runsDestructiveExecution: false,
    });
    expect(output.deleteImplementationAvailable).toBe(false);
  });

  it('should print an execute preview without enabling delete implementation', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    runAnalyticsRetentionExecutionPreviewCommand([
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
      '100',
    ]);

    expect(logSpy).toHaveBeenCalledOnce();

    const output = JSON.parse(String(logSpy.mock.calls[0]?.[0]));

    expect(output.executionGuard).toEqual({
      mode: 'execute',
      source: 'both',
      dryRunOnly: false,
      deleteAllowed: true,
      hardDeleteLimit: 100,
      reasons: [],
    });
    expect(output.executeContractReview.summary).toMatchObject({
      allowed: false,
      reviewOnly: true,
      destructiveExecutionAllowed: false,
    });
    expect(output.executeContractReview.guardrails).toMatchObject({
      operatorConfirmationProvided: true,
      operatorConfirmationStatus: 'ready',
      hardDeleteLimit: 100,
      boundedHardDeleteLimit: true,
      hardDeleteLimitStatus: 'ready',
      candidateRecheckStatus: 'missing',
      rollbackExpectationStatus: 'missing',
      auditOutputStatus: 'missing',
    });
    expect(output.executeContractReview.safety).toMatchObject({
      deleteCandidatesWired: false,
      prismaDeleteRepositoryWiredToOperatorFlow: false,
      deletesRawEvents: false,
      affectsQuotaCounting: false,
      runsDestructiveExecution: false,
    });
    expect(output.deleteImplementationAvailable).toBe(false);
  });
});
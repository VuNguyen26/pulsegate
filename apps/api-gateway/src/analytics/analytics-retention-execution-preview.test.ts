import { describe, expect, it } from 'vitest';

import { ANALYTICS_RETENTION_MIN_DAYS } from './analytics-retention-policy.js';
import {
  ANALYTICS_RETENTION_EXECUTE_CONFIRMATION_VALUE,
} from './analytics-retention-execution-command-args.js';
import { buildAnalyticsRetentionExecutionPreview } from './analytics-retention-execution-preview.js';

const fixedNow = new Date('2026-07-06T00:00:00.000Z');

describe('buildAnalyticsRetentionExecutionPreview', () => {
  it('should build a dry-run-only preview by default', () => {
    const preview = buildAnalyticsRetentionExecutionPreview({
      policy: {
        enabled: true,
        source: 'usage',
        usageRetentionDays: 30,
      },
      now: fixedNow,
    });

    expect(preview.executionArgs).toEqual({
      mode: 'dry-run',
    });
    expect(preview.executionGuard).toEqual({
      mode: 'dry-run',
      source: 'usage',
      dryRunOnly: true,
      deleteAllowed: false,
      hardDeleteLimit: null,
      reasons: ['DRY_RUN_MODE'],
    });
    expect(preview.deleteImplementationAvailable).toBe(false);
  });

  it('should build a blocked execute preview when execute guard flags are missing', () => {
    const preview = buildAnalyticsRetentionExecutionPreview({
      policy: {
        enabled: true,
        source: 'rejected',
        rejectedRetentionDays: 45,
      },
      executionArgs: ['--mode', 'execute'],
      now: fixedNow,
    });

    expect(preview.executionArgs).toEqual({
      mode: 'execute',
    });
    expect(preview.executionGuard.deleteAllowed).toBe(false);
    expect(preview.executionGuard.reasons).toEqual([
      'EXECUTE_CONFIRMATION_REQUIRED',
      'HARD_DELETE_LIMIT_REQUIRED',
    ]);
    expect(preview.deleteImplementationAvailable).toBe(false);
  });

  it('should build a guard-allowed execute preview without providing delete implementation', () => {
    const preview = buildAnalyticsRetentionExecutionPreview({
      policy: {
        enabled: true,
        source: 'both',
        usageRetentionDays: 30,
        rejectedRetentionDays: 45,
      },
      executionArgs: [
        '--mode',
        'execute',
        '--confirm-execute',
        ANALYTICS_RETENTION_EXECUTE_CONFIRMATION_VALUE,
        '--hard-delete-limit',
        '100',
      ],
      now: fixedNow,
    });

    expect(preview.executionArgs).toEqual({
      mode: 'execute',
      confirmExecute: true,
      hardDeleteLimit: 100,
    });
    expect(preview.executionGuard).toEqual({
      mode: 'execute',
      source: 'both',
      dryRunOnly: false,
      deleteAllowed: true,
      hardDeleteLimit: 100,
      reasons: [],
    });
    expect(preview.deleteImplementationAvailable).toBe(false);
  });

  it('should keep disabled retention blocked even with execute guard flags', () => {
    const preview = buildAnalyticsRetentionExecutionPreview({
      policy: {
        enabled: false,
      },
      executionArgs: [
        '--mode=execute',
        `--confirm-execute=${ANALYTICS_RETENTION_EXECUTE_CONFIRMATION_VALUE}`,
        '--hard-delete-limit=100',
      ],
      now: fixedNow,
    });

    expect(preview.executionGuard.deleteAllowed).toBe(false);
    expect(preview.executionGuard.reasons).toContain('RETENTION_DISABLED');
    expect(preview.executionGuard.reasons).toContain('NO_RETENTION_SOURCE_PLAN');
    expect(preview.deleteImplementationAvailable).toBe(false);
  });

  it('should reject invalid retention policy before building execution preview', () => {
    expect(() =>
      buildAnalyticsRetentionExecutionPreview({
        policy: {
          enabled: true,
          source: 'usage',
          usageRetentionDays: ANALYTICS_RETENTION_MIN_DAYS - 1,
        },
        executionArgs: ['--mode', 'execute'],
        now: fixedNow,
      }),
    ).toThrow(/at least/);
  });

  it('should reject unsafe execution args before returning a preview', () => {
    expect(() =>
      buildAnalyticsRetentionExecutionPreview({
        policy: {
          enabled: true,
          source: 'usage',
          usageRetentionDays: 30,
        },
        executionArgs: [
          '--mode',
          'execute',
          '--confirm-execute',
          'true',
        ],
        now: fixedNow,
      }),
    ).toThrow(/must equal/);
  });
});

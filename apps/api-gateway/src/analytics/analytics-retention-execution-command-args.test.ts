import { describe, expect, it } from 'vitest';

import {
  ANALYTICS_RETENTION_EXECUTE_CONFIRMATION_VALUE,
  parseAnalyticsRetentionExecutionCommandArgs,
} from './analytics-retention-execution-command-args.js';

describe('parseAnalyticsRetentionExecutionCommandArgs', () => {
  it('should default to dry-run mode with no execution guard flags', () => {
    expect(parseAnalyticsRetentionExecutionCommandArgs([])).toEqual({
      mode: 'dry-run',
    });
  });

  it('should parse execute mode without allowing delete by itself', () => {
    expect(
      parseAnalyticsRetentionExecutionCommandArgs(['--mode', 'execute']),
    ).toEqual({
      mode: 'execute',
    });
  });

  it('should parse execute guard flags with space-separated values', () => {
    expect(
      parseAnalyticsRetentionExecutionCommandArgs([
        '--mode',
        'execute',
        '--confirm-execute',
        ANALYTICS_RETENTION_EXECUTE_CONFIRMATION_VALUE,
        '--hard-delete-limit',
        '100',
      ]),
    ).toEqual({
      mode: 'execute',
      confirmExecute: true,
      hardDeleteLimit: 100,
    });
  });

  it('should parse execute guard flags with equals-separated values', () => {
    expect(
      parseAnalyticsRetentionExecutionCommandArgs([
        '--mode=execute',
        `--confirm-execute=${ANALYTICS_RETENTION_EXECUTE_CONFIRMATION_VALUE}`,
        '--hard-delete-limit=250',
      ]),
    ).toEqual({
      mode: 'execute',
      confirmExecute: true,
      hardDeleteLimit: 250,
    });
  });

  it('should reject unsupported mode values', () => {
    expect(() =>
      parseAnalyticsRetentionExecutionCommandArgs(['--mode', 'delete']),
    ).toThrow(/dry-run or execute/);
  });

  it('should reject unknown arguments', () => {
    expect(() =>
      parseAnalyticsRetentionExecutionCommandArgs(['--delete-now', 'true']),
    ).toThrow(/Unknown analytics retention execution argument/);
  });

  it('should reject missing option values', () => {
    expect(() =>
      parseAnalyticsRetentionExecutionCommandArgs(['--mode']),
    ).toThrow(/Missing value/);

    expect(() =>
      parseAnalyticsRetentionExecutionCommandArgs(['--hard-delete-limit=']),
    ).toThrow(/Missing value/);
  });

  it('should reject duplicate arguments', () => {
    expect(() =>
      parseAnalyticsRetentionExecutionCommandArgs([
        '--mode',
        'execute',
        '--mode',
        'dry-run',
      ]),
    ).toThrow(/Duplicate/);
  });

  it('should reject unsafe confirmation values', () => {
    expect(() =>
      parseAnalyticsRetentionExecutionCommandArgs([
        '--mode',
        'execute',
        '--confirm-execute',
        'true',
      ]),
    ).toThrow(/must equal/);
  });

  it('should reject invalid hard delete limits', () => {
    expect(() =>
      parseAnalyticsRetentionExecutionCommandArgs([
        '--mode',
        'execute',
        '--hard-delete-limit',
        '0',
      ]),
    ).toThrow(/positive integer/);

    expect(() =>
      parseAnalyticsRetentionExecutionCommandArgs([
        '--mode',
        'execute',
        '--hard-delete-limit',
        '10.5',
      ]),
    ).toThrow(/positive integer/);

    expect(() =>
      parseAnalyticsRetentionExecutionCommandArgs([
        '--mode',
        'execute',
        '--hard-delete-limit',
        '9007199254740992',
      ]),
    ).toThrow(/safe positive integer/);
  });

  it('should reject execute-only flags in dry-run mode', () => {
    expect(() =>
      parseAnalyticsRetentionExecutionCommandArgs([
        '--confirm-execute',
        ANALYTICS_RETENTION_EXECUTE_CONFIRMATION_VALUE,
      ]),
    ).toThrow(/only be used with --mode execute/);

    expect(() =>
      parseAnalyticsRetentionExecutionCommandArgs([
        '--hard-delete-limit',
        '100',
      ]),
    ).toThrow(/only be used with --mode execute/);
  });
});

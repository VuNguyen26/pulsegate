import { describe, expect, it } from 'vitest';

import {
  ANALYTICS_RETENTION_MIN_DAYS,
  createAnalyticsRetentionPlan,
  parseAnalyticsRetentionPolicy,
} from './analytics-retention-policy.js';
import { evaluateAnalyticsRetentionExecutionGuard } from './analytics-retention-execution-guard.js';

const fixedNow = new Date('2026-07-06T00:00:00.000Z');

function createEnabledRetentionPlan() {
  return createAnalyticsRetentionPlan(
    parseAnalyticsRetentionPolicy({
      enabled: true,
      source: 'both',
      usageRetentionDays: 30,
      rejectedRetentionDays: 45,
    }),
    fixedNow,
  );
}

describe('evaluateAnalyticsRetentionExecutionGuard', () => {
  it('should default to a dry-run-only blocked decision', () => {
    const decision = evaluateAnalyticsRetentionExecutionGuard({
      plan: createEnabledRetentionPlan(),
    });

    expect(decision).toEqual({
      mode: 'dry-run',
      source: 'both',
      dryRunOnly: true,
      deleteAllowed: false,
      hardDeleteLimit: null,
      reasons: ['DRY_RUN_MODE'],
    });
  });

  it('should block execute mode when explicit confirmation is missing', () => {
    const decision = evaluateAnalyticsRetentionExecutionGuard({
      plan: createEnabledRetentionPlan(),
      mode: 'execute',
      hardDeleteLimit: 100,
    });

    expect(decision.mode).toBe('execute');
    expect(decision.dryRunOnly).toBe(false);
    expect(decision.deleteAllowed).toBe(false);
    expect(decision.hardDeleteLimit).toBe(100);
    expect(decision.reasons).toContain('EXECUTE_CONFIRMATION_REQUIRED');
  });

  it('should block execute mode when hard delete limit is missing', () => {
    const decision = evaluateAnalyticsRetentionExecutionGuard({
      plan: createEnabledRetentionPlan(),
      mode: 'execute',
      confirmExecute: true,
    });

    expect(decision.deleteAllowed).toBe(false);
    expect(decision.hardDeleteLimit).toBeNull();
    expect(decision.reasons).toEqual(['HARD_DELETE_LIMIT_REQUIRED']);
  });

  it('should block execute mode when hard delete limit is invalid', () => {
    const zeroLimitDecision = evaluateAnalyticsRetentionExecutionGuard({
      plan: createEnabledRetentionPlan(),
      mode: 'execute',
      confirmExecute: true,
      hardDeleteLimit: 0,
    });

    expect(zeroLimitDecision.deleteAllowed).toBe(false);
    expect(zeroLimitDecision.reasons).toEqual(['HARD_DELETE_LIMIT_INVALID']);

    const decimalLimitDecision = evaluateAnalyticsRetentionExecutionGuard({
      plan: createEnabledRetentionPlan(),
      mode: 'execute',
      confirmExecute: true,
      hardDeleteLimit: '10.5',
    });

    expect(decimalLimitDecision.deleteAllowed).toBe(false);
    expect(decimalLimitDecision.reasons).toEqual(['HARD_DELETE_LIMIT_INVALID']);
  });

  it('should block execute mode when retention is disabled', () => {
    const disabledPlan = createAnalyticsRetentionPlan(
      parseAnalyticsRetentionPolicy({
        enabled: false,
      }),
      fixedNow,
    );

    const decision = evaluateAnalyticsRetentionExecutionGuard({
      plan: disabledPlan,
      mode: 'execute',
      confirmExecute: true,
      hardDeleteLimit: 100,
    });

    expect(decision.deleteAllowed).toBe(false);
    expect(decision.reasons).toContain('RETENTION_DISABLED');
    expect(decision.reasons).toContain('NO_RETENTION_SOURCE_PLAN');
  });

  it('should allow execute mode only when all execution guardrails are satisfied', () => {
    const decision = evaluateAnalyticsRetentionExecutionGuard({
      plan: createEnabledRetentionPlan(),
      mode: 'execute',
      confirmExecute: true,
      hardDeleteLimit: '500',
    });

    expect(decision).toEqual({
      mode: 'execute',
      source: 'both',
      dryRunOnly: false,
      deleteAllowed: true,
      hardDeleteLimit: 500,
      reasons: [],
    });
  });

  it('should reject unsupported execution mode values', () => {
    expect(() =>
      evaluateAnalyticsRetentionExecutionGuard({
        plan: createEnabledRetentionPlan(),
        mode: 'delete',
      }),
    ).toThrow(/dry-run or execute/);
  });

  it('should keep source and retention-day validation in the existing policy layer', () => {
    expect(() =>
      parseAnalyticsRetentionPolicy({
        source: 'all',
      }),
    ).toThrow(/source/);

    expect(() =>
      parseAnalyticsRetentionPolicy({
        enabled: true,
        usageRetentionDays: ANALYTICS_RETENTION_MIN_DAYS - 1,
      }),
    ).toThrow(/at least/);
  });
});

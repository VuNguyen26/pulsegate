import { describe, expect, it } from 'vitest';

import {
  ANALYTICS_RETENTION_DEFAULT_DAYS,
  ANALYTICS_RETENTION_MIN_DAYS,
  createAnalyticsRetentionPlan,
  parseAnalyticsRetentionPolicy,
} from './analytics-retention-policy.js';

describe('parseAnalyticsRetentionPolicy', () => {
  it('should default to disabled dry-run retention for both analytics sources', () => {
    const policy = parseAnalyticsRetentionPolicy();

    expect(policy).toEqual({
      enabled: false,
      mode: 'dry-run',
      source: 'both',
      usage: {
        source: 'usage',
        retentionDays: ANALYTICS_RETENTION_DEFAULT_DAYS,
        minRetentionDays: ANALYTICS_RETENTION_MIN_DAYS,
      },
      rejected: {
        source: 'rejected',
        retentionDays: ANALYTICS_RETENTION_DEFAULT_DAYS,
        minRetentionDays: ANALYTICS_RETENTION_MIN_DAYS,
      },
    });
  });

  it('should parse env-like string inputs', () => {
    const policy = parseAnalyticsRetentionPolicy({
      enabled: 'true',
      source: 'both',
      usageRetentionDays: '30',
      rejectedRetentionDays: '45',
    });

    expect(policy.enabled).toBe(true);
    expect(policy.mode).toBe('dry-run');
    expect(policy.source).toBe('both');
    expect(policy.usage?.retentionDays).toBe(30);
    expect(policy.rejected?.retentionDays).toBe(45);
  });

  it('should allow usage-only retention policy', () => {
    const policy = parseAnalyticsRetentionPolicy({
      enabled: true,
      source: 'usage',
      usageRetentionDays: 30,
    });

    expect(policy.source).toBe('usage');
    expect(policy.usage?.retentionDays).toBe(30);
    expect(policy.rejected).toBeNull();
  });

  it('should allow rejected-only retention policy', () => {
    const policy = parseAnalyticsRetentionPolicy({
      enabled: true,
      source: 'rejected',
      rejectedRetentionDays: 60,
    });

    expect(policy.source).toBe('rejected');
    expect(policy.usage).toBeNull();
    expect(policy.rejected?.retentionDays).toBe(60);
  });

  it('should reject unsupported retention source', () => {
    expect(() =>
      parseAnalyticsRetentionPolicy({
        source: 'unknown',
      }),
    ).toThrow(/source/);
  });

  it('should reject non dry-run mode while delete execution is not implemented', () => {
    expect(() =>
      parseAnalyticsRetentionPolicy({
        mode: 'execute',
      }),
    ).toThrow(/dry-run/);
  });

  it('should reject invalid enabled value', () => {
    expect(() =>
      parseAnalyticsRetentionPolicy({
        enabled: 'yes',
      }),
    ).toThrow(/enabled/);
  });

  it('should reject retention days below safety minimum', () => {
    expect(() =>
      parseAnalyticsRetentionPolicy({
        usageRetentionDays: ANALYTICS_RETENTION_MIN_DAYS - 1,
      }),
    ).toThrow(/at least/);
  });

  it('should reject non-integer retention days', () => {
    expect(() =>
      parseAnalyticsRetentionPolicy({
        rejectedRetentionDays: '30.5',
      }),
    ).toThrow(/positive integer/);
  });

  it('should reject unused source-specific retention windows', () => {
    expect(() =>
      parseAnalyticsRetentionPolicy({
        source: 'usage',
        usageRetentionDays: 30,
        rejectedRetentionDays: 45,
      }),
    ).toThrow(/rejectedRetentionDays/);

    expect(() =>
      parseAnalyticsRetentionPolicy({
        source: 'rejected',
        usageRetentionDays: 30,
        rejectedRetentionDays: 45,
      }),
    ).toThrow(/usageRetentionDays/);
  });
});

describe('createAnalyticsRetentionPlan', () => {
  it('should not create source cleanup plans when retention is disabled', () => {
    const policy = parseAnalyticsRetentionPolicy({
      enabled: false,
      usageRetentionDays: 30,
      rejectedRetentionDays: 45,
    });

    const plan = createAnalyticsRetentionPlan(
      policy,
      new Date('2026-07-05T00:00:00.000Z'),
    );

    expect(plan.enabled).toBe(false);
    expect(plan.mode).toBe('dry-run');
    expect(plan.source).toBe('both');
    expect(plan.usage).toBeNull();
    expect(plan.rejected).toBeNull();
  });

  it('should create dry-run-only cutoff plans for enabled sources', () => {
    const policy = parseAnalyticsRetentionPolicy({
      enabled: true,
      source: 'both',
      usageRetentionDays: 30,
      rejectedRetentionDays: 45,
    });

    const plan = createAnalyticsRetentionPlan(
      policy,
      new Date('2026-07-05T00:00:00.000Z'),
    );

    expect(plan.enabled).toBe(true);
    expect(plan.generatedAt.toISOString()).toBe('2026-07-05T00:00:00.000Z');

    expect(plan.usage).toEqual({
      source: 'usage',
      retentionDays: 30,
      cutoffExclusive: new Date('2026-06-05T00:00:00.000Z'),
      dryRunOnly: true,
      deleteAllowed: false,
    });

    expect(plan.rejected).toEqual({
      source: 'rejected',
      retentionDays: 45,
      cutoffExclusive: new Date('2026-05-21T00:00:00.000Z'),
      dryRunOnly: true,
      deleteAllowed: false,
    });
  });

  it('should reject invalid plan clock', () => {
    const policy = parseAnalyticsRetentionPolicy({
      enabled: true,
    });

    expect(() =>
      createAnalyticsRetentionPlan(policy, new Date('invalid')),
    ).toThrow(/valid Date/);
  });
});

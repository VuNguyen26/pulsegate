import { describe, expect, it } from 'vitest';

import { buildAnalyticsRollupBackgroundSchedulerRunnerPlan } from './analytics-rollup-background-scheduler-runner-plan.js';

const safeRequest = {
  trigger: 'process-local' as const,
  requestedMode: 'preview' as const,
  backgroundRunnerContractEnabled: true,
  schedulerEnabled: true,
  runAtIso: '2026-07-09T10:00:00.000Z',
  granularity: 'hour' as const,
  source: 'both' as const,
  lookbackBuckets: 1,
  maxBuckets: 1,
  safetyDelayMs: 300000,
};

const nonDestructiveSafety = {
  createsScheduledJob: false,
  invokesBackfillService: false,
  executesBackfill: false,
  readsEvents: false,
  persistsRollups: false,
  affectsQuotaCounting: false,
  deletesRawEvents: false,
  runsRetentionExecution: false,
};

describe('buildAnalyticsRollupBackgroundSchedulerRunnerPlan', () => {
  it('skips command trigger and preserves the existing direct CLI runtime ownership', () => {
    const plan = buildAnalyticsRollupBackgroundSchedulerRunnerPlan({
      ...safeRequest,
      trigger: 'command',
      requestedMode: 'execute',
    });

    expect(plan.status).toBe('command-trigger-skipped');
    expect(plan.blockedReason).toBe('command-trigger-owned-by-direct-cli');
    expect(plan.ready).toBe(false);
    expect(plan.previewPlan).toBeNull();
    expect(plan.contract.directCommandRuntimePreserved).toBe(true);
    expect(plan.contract.backgroundRuntimeInvocationAllowed).toBe(false);
    expect(plan.safety).toEqual(nonDestructiveSafety);
  });

  it.each(['process-local', 'external-scheduler'] as const)(
    'blocks %s trigger until the background runner contract is enabled',
    (trigger) => {
      const plan = buildAnalyticsRollupBackgroundSchedulerRunnerPlan({
        ...safeRequest,
        trigger,
        backgroundRunnerContractEnabled: false,
      });

      expect(plan.status).toBe('background-trigger-blocked');
      expect(plan.blockedReason).toBe('automatic-trigger-not-wired');
      expect(plan.ready).toBe(false);
      expect(plan.previewPlan).toBeNull();
      expect(plan.contract.backgroundRunnerSelected).toBe(false);
      expect(plan.safety).toEqual(nonDestructiveSafety);
    },
  );

  it.each(['process-local', 'external-scheduler'] as const)(
    'builds a safe %s preview plan without runtime invocation',
    (trigger) => {
      const plan = buildAnalyticsRollupBackgroundSchedulerRunnerPlan({
        ...safeRequest,
        trigger,
      });

      expect(plan.status).toBe('background-preview-plan-ready');
      expect(plan.blockedReason).toBeNull();
      expect(plan.ready).toBe(true);
      expect(plan.previewPlan).toEqual({
        trigger,
        requestedMode: 'preview',
        runAtIso: safeRequest.runAtIso,
        granularity: 'hour',
        source: 'both',
        lookbackBuckets: 1,
        maxBuckets: 1,
        safetyDelayMs: 300000,
        runtimeInvocationAllowed: false,
      });
      expect(plan.contract.backgroundRunnerPlanAllowed).toBe(true);
      expect(plan.contract.backgroundRuntimeInvocationAllowed).toBe(false);
      expect(plan.safety).toEqual(nonDestructiveSafety);
    },
  );

  it.each(['dry-run', 'execute'] as const)(
    'blocks process-local %s runtime invocation from the background runner plan',
    (requestedMode) => {
      const plan = buildAnalyticsRollupBackgroundSchedulerRunnerPlan({
        ...safeRequest,
        requestedMode,
      });

      expect(plan.status).toBe('background-runtime-invocation-blocked');
      expect(plan.blockedReason).toBe('background-runtime-execution-not-wired');
      expect(plan.ready).toBe(false);
      expect(plan.previewPlan).toBeNull();
      expect(plan.contract.backgroundRunnerSelected).toBe(true);
      expect(plan.contract.backgroundRuntimeInvocationAllowed).toBe(false);
      expect(plan.safety).toEqual(nonDestructiveSafety);
    },
  );

  it('keeps preview plan blocked when scheduler config is disabled', () => {
    const plan = buildAnalyticsRollupBackgroundSchedulerRunnerPlan({
      ...safeRequest,
      schedulerEnabled: false,
    });

    expect(plan.status).toBe('background-runner-disabled');
    expect(plan.blockedReason).toBe('background-runner-disabled');
    expect(plan.ready).toBe(false);
    expect(plan.previewPlan).toBeNull();
    expect(plan.safety).toEqual(nonDestructiveSafety);
  });

  it.each([
    ['bad-date', 'invalid-run-at'],
    ['2026-07-09T10:00:00.000Z', 'invalid-lookback-buckets', 0, 1, 300000],
    ['2026-07-09T10:00:00.000Z', 'invalid-max-buckets', 1, 0, 300000],
    ['2026-07-09T10:00:00.000Z', 'lookback-exceeds-max-buckets', 2, 1, 300000],
    ['2026-07-09T10:00:00.000Z', 'invalid-safety-delay-ms', 1, 1, -1],
  ] as const)(
    'rejects invalid bounded runner input with %s',
    (runAtIso, expectedReason, lookbackBuckets = 1, maxBuckets = 1, safetyDelayMs = 300000) => {
      const plan = buildAnalyticsRollupBackgroundSchedulerRunnerPlan({
        ...safeRequest,
        runAtIso,
        lookbackBuckets,
        maxBuckets,
        safetyDelayMs,
      });

      expect(plan.status).toBe('background-runner-plan-invalid');
      expect(plan.blockedReason).toBe(expectedReason);
      expect(plan.ready).toBe(false);
      expect(plan.previewPlan).toBeNull();
      expect(plan.safety).toEqual(nonDestructiveSafety);
    },
  );
});
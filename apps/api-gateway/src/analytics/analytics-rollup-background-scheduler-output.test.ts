import { describe, expect, it } from 'vitest';

import { buildAnalyticsRollupBackgroundSchedulerOutput } from './analytics-rollup-background-scheduler-output.js';

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

describe('buildAnalyticsRollupBackgroundSchedulerOutput', () => {
  it('shows command trigger as preserved direct CLI runtime instead of background runner work', () => {
    const output = buildAnalyticsRollupBackgroundSchedulerOutput({
      ...safeRequest,
      trigger: 'command',
      requestedMode: 'execute',
    });

    expect(output.summary).toMatchObject({
      status: 'command-runtime-preserved',
      runnerStatus: 'command-trigger-skipped',
      blockedReason: 'command-trigger-owned-by-direct-cli',
      ready: false,
      backgroundRunnerSelected: false,
      backgroundRunnerPlanAllowed: false,
      backgroundRuntimeInvocationAllowed: false,
      directCommandRuntimePreserved: true,
    });
    expect(output.previewPlan).toBeNull();
    expect(output.safety).toEqual(nonDestructiveSafety);
    expect(output.review).toEqual({
      separatesCommandFromBackgroundSemantics: true,
      preservesDirectCommandDryRunAndExecute: true,
      backgroundRuntimeStillClosed: true,
      processLocalExecutionStillClosed: true,
      externalSchedulerExecutionStillClosed: true,
      previewOnlyWhenReady: true,
    });
  });

  it.each(['process-local', 'external-scheduler'] as const)(
    'shows %s preview as ready but runtime-closed',
    (trigger) => {
      const output = buildAnalyticsRollupBackgroundSchedulerOutput({
        ...safeRequest,
        trigger,
      });

      expect(output.summary).toMatchObject({
        status: 'background-preview-ready',
        runnerStatus: 'background-preview-plan-ready',
        blockedReason: null,
        ready: true,
        backgroundRunnerSelected: true,
        backgroundRunnerPlanAllowed: true,
        backgroundRuntimeInvocationAllowed: false,
        directCommandRuntimePreserved: false,
      });
      expect(output.previewPlan).toEqual({
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
      expect(output.safety).toEqual(nonDestructiveSafety);
      expect(output.review.backgroundRuntimeStillClosed).toBe(true);
      expect(output.review.previewOnlyWhenReady).toBe(true);
      expect(output.operatorNotes).toContain(
        'Background scheduler output is operator-visible contract data only; it does not start a scheduled job.',
      );
    },
  );

  it('shows disabled scheduler as blocked and without preview plan', () => {
    const output = buildAnalyticsRollupBackgroundSchedulerOutput({
      ...safeRequest,
      schedulerEnabled: false,
    });

    expect(output.summary).toMatchObject({
      status: 'background-runner-blocked',
      runnerStatus: 'background-runner-disabled',
      blockedReason: 'background-runner-disabled',
      ready: false,
      backgroundRuntimeInvocationAllowed: false,
    });
    expect(output.previewPlan).toBeNull();
    expect(output.safety).toEqual(nonDestructiveSafety);
    expect(output.review.previewOnlyWhenReady).toBe(true);
  });

  it.each(['dry-run', 'execute'] as const)(
    'shows background %s request as runtime-blocked',
    (requestedMode) => {
      const output = buildAnalyticsRollupBackgroundSchedulerOutput({
        ...safeRequest,
        requestedMode,
      });

      expect(output.summary).toMatchObject({
        status: 'background-runtime-blocked',
        runnerStatus: 'background-runtime-invocation-blocked',
        blockedReason: 'background-runtime-execution-not-wired',
        ready: false,
        backgroundRunnerSelected: true,
        backgroundRunnerPlanAllowed: false,
        backgroundRuntimeInvocationAllowed: false,
      });
      expect(output.previewPlan).toBeNull();
      expect(output.safety).toEqual(nonDestructiveSafety);
      expect(output.review.backgroundRuntimeStillClosed).toBe(true);
      expect(output.review.processLocalExecutionStillClosed).toBe(true);
      expect(output.review.previewOnlyWhenReady).toBe(true);
    },
  );

  it('keeps invalid background preview input blocked and non-destructive', () => {
    const output = buildAnalyticsRollupBackgroundSchedulerOutput({
      ...safeRequest,
      lookbackBuckets: 2,
      maxBuckets: 1,
    });

    expect(output.summary).toMatchObject({
      status: 'background-runner-blocked',
      runnerStatus: 'background-runner-plan-invalid',
      blockedReason: 'lookback-exceeds-max-buckets',
      ready: false,
      backgroundRuntimeInvocationAllowed: false,
    });
    expect(output.previewPlan).toBeNull();
    expect(output.safety).toEqual(nonDestructiveSafety);
    expect(output.review.previewOnlyWhenReady).toBe(true);
  });
});
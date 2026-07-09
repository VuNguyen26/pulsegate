import { describe, expect, it } from 'vitest';

import { buildAnalyticsRollupBackgroundSchedulerContract } from './analytics-rollup-background-scheduler-contract.js';

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

describe('buildAnalyticsRollupBackgroundSchedulerContract', () => {
  it('keeps command trigger owned by the existing direct CLI runtime path', () => {
    const contract = buildAnalyticsRollupBackgroundSchedulerContract({
      trigger: 'command',
      requestedMode: 'execute',
      backgroundRunnerContractEnabled: true,
    });

    expect(contract.status).toBe('command-runtime-owned-by-direct-cli');
    expect(contract.blockedReason).toBeNull();
    expect(contract.backgroundRunnerSelected).toBe(false);
    expect(contract.backgroundRunnerPlanAllowed).toBe(false);
    expect(contract.backgroundRuntimeInvocationAllowed).toBe(false);
    expect(contract.directCommandRuntimePreserved).toBe(true);
    expect(contract.safety).toEqual(nonDestructiveSafety);
    expect(contract.operatorNotes).toContain(
      'Background scheduler contract must not reinterpret command dry-run or command execute semantics.',
    );
  });

  it.each(['process-local', 'external-scheduler'] as const)(
    'keeps %s background trigger blocked when the contract is not enabled',
    (trigger) => {
      const contract = buildAnalyticsRollupBackgroundSchedulerContract({
        trigger,
        requestedMode: 'preview',
      });

      expect(contract.status).toBe('background-trigger-not-wired');
      expect(contract.blockedReason).toBe('automatic-trigger-not-wired');
      expect(contract.backgroundRunnerSelected).toBe(false);
      expect(contract.backgroundRunnerPlanAllowed).toBe(false);
      expect(contract.backgroundRuntimeInvocationAllowed).toBe(false);
      expect(contract.directCommandRuntimePreserved).toBe(false);
      expect(contract.safety).toEqual(nonDestructiveSafety);
    },
  );

  it.each(['process-local', 'external-scheduler'] as const)(
    'allows %s background preview planning without runtime invocation when explicitly enabled',
    (trigger) => {
      const contract = buildAnalyticsRollupBackgroundSchedulerContract({
        trigger,
        requestedMode: 'preview',
        backgroundRunnerContractEnabled: true,
      });

      expect(contract.status).toBe('background-runner-preview-contract-ready');
      expect(contract.blockedReason).toBeNull();
      expect(contract.backgroundRunnerSelected).toBe(true);
      expect(contract.backgroundRunnerPlanAllowed).toBe(true);
      expect(contract.backgroundRuntimeInvocationAllowed).toBe(false);
      expect(contract.directCommandRuntimePreserved).toBe(false);
      expect(contract.safety).toEqual(nonDestructiveSafety);
      expect(contract.operatorNotes).toContain(
        'Preview contract must not invoke backfill service, read events, persist rollups, affect quota counting, or delete raw events.',
      );
    },
  );

  it.each([
    ['process-local', 'dry-run'],
    ['process-local', 'execute'],
    ['external-scheduler', 'dry-run'],
    ['external-scheduler', 'execute'],
  ] as const)(
    'blocks %s %s runtime invocation even when the background contract is enabled',
    (trigger, requestedMode) => {
      const contract = buildAnalyticsRollupBackgroundSchedulerContract({
        trigger,
        requestedMode,
        backgroundRunnerContractEnabled: true,
      });

      expect(contract.status).toBe('background-runtime-execution-not-wired');
      expect(contract.blockedReason).toBe('background-runtime-execution-not-wired');
      expect(contract.backgroundRunnerSelected).toBe(true);
      expect(contract.backgroundRunnerPlanAllowed).toBe(false);
      expect(contract.backgroundRuntimeInvocationAllowed).toBe(false);
      expect(contract.directCommandRuntimePreserved).toBe(false);
      expect(contract.safety).toEqual(nonDestructiveSafety);
    },
  );
});
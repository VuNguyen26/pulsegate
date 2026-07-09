import {
  buildAnalyticsRollupBackgroundSchedulerContract,
  type AnalyticsRollupBackgroundSchedulerContract,
  type AnalyticsRollupBackgroundSchedulerRequestedMode,
  type AnalyticsRollupBackgroundSchedulerSafetyFlags,
  type AnalyticsRollupBackgroundSchedulerTrigger,
} from './analytics-rollup-background-scheduler-contract.js';

export type AnalyticsRollupBackgroundSchedulerRunnerGranularity = 'hour' | 'day';

export type AnalyticsRollupBackgroundSchedulerRunnerSource =
  | 'usage'
  | 'rejected'
  | 'both';

export type AnalyticsRollupBackgroundSchedulerRunnerPlanStatus =
  | 'command-trigger-skipped'
  | 'background-trigger-blocked'
  | 'background-runner-disabled'
  | 'background-runner-plan-invalid'
  | 'background-preview-plan-ready'
  | 'background-runtime-invocation-blocked';

export type AnalyticsRollupBackgroundSchedulerRunnerPlanBlockedReason =
  | 'command-trigger-owned-by-direct-cli'
  | 'automatic-trigger-not-wired'
  | 'background-runner-disabled'
  | 'background-runtime-execution-not-wired'
  | 'invalid-run-at'
  | 'invalid-lookback-buckets'
  | 'invalid-max-buckets'
  | 'lookback-exceeds-max-buckets'
  | 'invalid-safety-delay-ms';

export interface AnalyticsRollupBackgroundSchedulerRunnerPlanRequest {
  readonly trigger: AnalyticsRollupBackgroundSchedulerTrigger;
  readonly requestedMode: AnalyticsRollupBackgroundSchedulerRequestedMode;
  readonly backgroundRunnerContractEnabled?: boolean;
  readonly schedulerEnabled: boolean;
  readonly runAtIso: string;
  readonly granularity: AnalyticsRollupBackgroundSchedulerRunnerGranularity;
  readonly source: AnalyticsRollupBackgroundSchedulerRunnerSource;
  readonly lookbackBuckets: number;
  readonly maxBuckets: number;
  readonly safetyDelayMs: number;
}

export interface AnalyticsRollupBackgroundSchedulerPreviewPlan {
  readonly trigger: Exclude<AnalyticsRollupBackgroundSchedulerTrigger, 'command'>;
  readonly requestedMode: 'preview';
  readonly runAtIso: string;
  readonly granularity: AnalyticsRollupBackgroundSchedulerRunnerGranularity;
  readonly source: AnalyticsRollupBackgroundSchedulerRunnerSource;
  readonly lookbackBuckets: number;
  readonly maxBuckets: number;
  readonly safetyDelayMs: number;
  readonly runtimeInvocationAllowed: false;
}

export interface AnalyticsRollupBackgroundSchedulerRunnerPlan {
  readonly status: AnalyticsRollupBackgroundSchedulerRunnerPlanStatus;
  readonly blockedReason: AnalyticsRollupBackgroundSchedulerRunnerPlanBlockedReason | null;
  readonly contract: AnalyticsRollupBackgroundSchedulerContract;
  readonly ready: boolean;
  readonly previewPlan: AnalyticsRollupBackgroundSchedulerPreviewPlan | null;
  readonly safety: AnalyticsRollupBackgroundSchedulerSafetyFlags;
  readonly operatorNotes: readonly string[];
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

function buildBlockedRunnerPlan(
  status: AnalyticsRollupBackgroundSchedulerRunnerPlanStatus,
  blockedReason: AnalyticsRollupBackgroundSchedulerRunnerPlanBlockedReason,
  contract: AnalyticsRollupBackgroundSchedulerContract,
  operatorNotes: readonly string[],
): AnalyticsRollupBackgroundSchedulerRunnerPlan {
  return {
    status,
    blockedReason,
    contract,
    ready: false,
    previewPlan: null,
    safety: contract.safety,
    operatorNotes,
  };
}

export function buildAnalyticsRollupBackgroundSchedulerRunnerPlan(
  request: AnalyticsRollupBackgroundSchedulerRunnerPlanRequest,
): AnalyticsRollupBackgroundSchedulerRunnerPlan {
  const contract = buildAnalyticsRollupBackgroundSchedulerContract({
    trigger: request.trigger,
    requestedMode: request.requestedMode,
    backgroundRunnerContractEnabled: request.backgroundRunnerContractEnabled,
  });

  if (request.trigger === 'command') {
    return buildBlockedRunnerPlan(
      'command-trigger-skipped',
      'command-trigger-owned-by-direct-cli',
      contract,
      [
        'Command trigger is handled by the existing direct CLI scheduler-preview runtime.',
        'Background runner planning must not reinterpret command dry-run or execute behavior.',
      ],
    );
  }

  if (contract.status === 'background-trigger-not-wired') {
    return buildBlockedRunnerPlan(
      'background-trigger-blocked',
      'automatic-trigger-not-wired',
      contract,
      [
        'Background trigger is still blocked until the background runner contract is explicitly enabled.',
        'No scheduled job or runtime backfill invocation is created.',
      ],
    );
  }

  if (contract.status === 'background-runtime-execution-not-wired') {
    return buildBlockedRunnerPlan(
      'background-runtime-invocation-blocked',
      'background-runtime-execution-not-wired',
      contract,
      [
        'Background runner contract supports preview planning only at this checkpoint.',
        'Dry-run and execute runtime invocation remain blocked for background triggers.',
      ],
    );
  }

  if (!request.schedulerEnabled) {
    return buildBlockedRunnerPlan(
      'background-runner-disabled',
      'background-runner-disabled',
      contract,
      [
        'Background runner plan is disabled by scheduler configuration.',
        'Disabled runner must not create scheduled jobs or invoke backfill service.',
      ],
    );
  }

  if (Number.isNaN(Date.parse(request.runAtIso))) {
    return buildBlockedRunnerPlan(
      'background-runner-plan-invalid',
      'invalid-run-at',
      contract,
      ['Background runner preview requires a valid ISO runAt timestamp.'],
    );
  }

  if (!isPositiveInteger(request.lookbackBuckets)) {
    return buildBlockedRunnerPlan(
      'background-runner-plan-invalid',
      'invalid-lookback-buckets',
      contract,
      ['Background runner preview requires a positive integer lookback bucket count.'],
    );
  }

  if (!isPositiveInteger(request.maxBuckets)) {
    return buildBlockedRunnerPlan(
      'background-runner-plan-invalid',
      'invalid-max-buckets',
      contract,
      ['Background runner preview requires a positive integer max bucket bound.'],
    );
  }

  if (request.lookbackBuckets > request.maxBuckets) {
    return buildBlockedRunnerPlan(
      'background-runner-plan-invalid',
      'lookback-exceeds-max-buckets',
      contract,
      ['Background runner preview must keep lookback buckets within max bucket bounds.'],
    );
  }

  if (!isNonNegativeInteger(request.safetyDelayMs)) {
    return buildBlockedRunnerPlan(
      'background-runner-plan-invalid',
      'invalid-safety-delay-ms',
      contract,
      ['Background runner preview requires a non-negative integer safety delay.'],
    );
  }

  return {
    status: 'background-preview-plan-ready',
    blockedReason: null,
    contract,
    ready: true,
    previewPlan: {
      trigger: request.trigger,
      requestedMode: 'preview',
      runAtIso: request.runAtIso,
      granularity: request.granularity,
      source: request.source,
      lookbackBuckets: request.lookbackBuckets,
      maxBuckets: request.maxBuckets,
      safetyDelayMs: request.safetyDelayMs,
      runtimeInvocationAllowed: false,
    },
    safety: contract.safety,
    operatorNotes: [
      'Background runner preview plan is ready, but runtime invocation remains disabled.',
      'Ready preview plan must not create a scheduled job, read events, persist rollups, mutate quota counting, or delete raw events.',
    ],
  };
}
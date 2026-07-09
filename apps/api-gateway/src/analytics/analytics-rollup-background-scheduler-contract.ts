export type AnalyticsRollupBackgroundSchedulerTrigger =
  | 'command'
  | 'process-local'
  | 'external-scheduler';

export type AnalyticsRollupBackgroundSchedulerRequestedMode =
  | 'preview'
  | 'dry-run'
  | 'execute';

export type AnalyticsRollupBackgroundSchedulerContractStatus =
  | 'command-runtime-owned-by-direct-cli'
  | 'background-trigger-not-wired'
  | 'background-runner-preview-contract-ready'
  | 'background-runtime-execution-not-wired';

export type AnalyticsRollupBackgroundSchedulerBlockedReason =
  | 'automatic-trigger-not-wired'
  | 'background-runtime-execution-not-wired';

export interface AnalyticsRollupBackgroundSchedulerSafetyFlags {
  readonly createsScheduledJob: boolean;
  readonly invokesBackfillService: boolean;
  readonly executesBackfill: boolean;
  readonly readsEvents: boolean;
  readonly persistsRollups: boolean;
  readonly affectsQuotaCounting: boolean;
  readonly deletesRawEvents: boolean;
  readonly runsRetentionExecution: boolean;
}

export interface AnalyticsRollupBackgroundSchedulerContractRequest {
  readonly trigger: AnalyticsRollupBackgroundSchedulerTrigger;
  readonly requestedMode: AnalyticsRollupBackgroundSchedulerRequestedMode;
  readonly backgroundRunnerContractEnabled?: boolean;
}

export interface AnalyticsRollupBackgroundSchedulerContract {
  readonly trigger: AnalyticsRollupBackgroundSchedulerTrigger;
  readonly requestedMode: AnalyticsRollupBackgroundSchedulerRequestedMode;
  readonly status: AnalyticsRollupBackgroundSchedulerContractStatus;
  readonly blockedReason: AnalyticsRollupBackgroundSchedulerBlockedReason | null;
  readonly backgroundRunnerSelected: boolean;
  readonly backgroundRunnerPlanAllowed: boolean;
  readonly backgroundRuntimeInvocationAllowed: boolean;
  readonly directCommandRuntimePreserved: boolean;
  readonly safety: AnalyticsRollupBackgroundSchedulerSafetyFlags;
  readonly operatorNotes: readonly string[];
}

const NON_DESTRUCTIVE_BACKGROUND_SAFETY: AnalyticsRollupBackgroundSchedulerSafetyFlags = {
  createsScheduledJob: false,
  invokesBackfillService: false,
  executesBackfill: false,
  readsEvents: false,
  persistsRollups: false,
  affectsQuotaCounting: false,
  deletesRawEvents: false,
  runsRetentionExecution: false,
};

export function buildAnalyticsRollupBackgroundSchedulerContract(
  request: AnalyticsRollupBackgroundSchedulerContractRequest,
): AnalyticsRollupBackgroundSchedulerContract {
  if (request.trigger === 'command') {
    return {
      trigger: request.trigger,
      requestedMode: request.requestedMode,
      status: 'command-runtime-owned-by-direct-cli',
      blockedReason: null,
      backgroundRunnerSelected: false,
      backgroundRunnerPlanAllowed: false,
      backgroundRuntimeInvocationAllowed: false,
      directCommandRuntimePreserved: true,
      safety: { ...NON_DESTRUCTIVE_BACKGROUND_SAFETY },
      operatorNotes: [
        'Direct command execution is owned by the existing CLI scheduler-preview runtime path.',
        'Background scheduler contract must not reinterpret command dry-run or command execute semantics.',
      ],
    };
  }

  if (request.backgroundRunnerContractEnabled !== true) {
    return {
      trigger: request.trigger,
      requestedMode: request.requestedMode,
      status: 'background-trigger-not-wired',
      blockedReason: 'automatic-trigger-not-wired',
      backgroundRunnerSelected: false,
      backgroundRunnerPlanAllowed: false,
      backgroundRuntimeInvocationAllowed: false,
      directCommandRuntimePreserved: false,
      safety: { ...NON_DESTRUCTIVE_BACKGROUND_SAFETY },
      operatorNotes: [
        'Background/process-local scheduler semantics are not wired by default.',
        'No automatic backfill service invocation is allowed from this trigger.',
      ],
    };
  }

  if (request.requestedMode !== 'preview') {
    return {
      trigger: request.trigger,
      requestedMode: request.requestedMode,
      status: 'background-runtime-execution-not-wired',
      blockedReason: 'background-runtime-execution-not-wired',
      backgroundRunnerSelected: true,
      backgroundRunnerPlanAllowed: false,
      backgroundRuntimeInvocationAllowed: false,
      directCommandRuntimePreserved: false,
      safety: { ...NON_DESTRUCTIVE_BACKGROUND_SAFETY },
      operatorNotes: [
        'Background runner contract exists, but dry-run/execute runtime invocation is intentionally blocked.',
        'Runtime wiring belongs to a later guarded checkpoint and must remain non-destructive until explicitly opened.',
      ],
    };
  }

  return {
    trigger: request.trigger,
    requestedMode: request.requestedMode,
    status: 'background-runner-preview-contract-ready',
    blockedReason: null,
    backgroundRunnerSelected: true,
    backgroundRunnerPlanAllowed: true,
    backgroundRuntimeInvocationAllowed: false,
    directCommandRuntimePreserved: false,
    safety: { ...NON_DESTRUCTIVE_BACKGROUND_SAFETY },
    operatorNotes: [
      'Background runner preview contract can produce a safe plan only.',
      'Preview contract must not invoke backfill service, read events, persist rollups, affect quota counting, or delete raw events.',
    ],
  };
}
import type {
  AnalyticsRetentionPlan,
  AnalyticsRetentionSource,
} from './analytics-retention-policy.js';

export type AnalyticsRetentionExecutionMode = 'dry-run' | 'execute';

export type AnalyticsRetentionExecutionGuardReason =
  | 'DRY_RUN_MODE'
  | 'RETENTION_DISABLED'
  | 'NO_RETENTION_SOURCE_PLAN'
  | 'EXECUTE_CONFIRMATION_REQUIRED'
  | 'HARD_DELETE_LIMIT_REQUIRED'
  | 'HARD_DELETE_LIMIT_INVALID';

export interface AnalyticsRetentionExecutionGuardInput {
  readonly plan: AnalyticsRetentionPlan;
  readonly mode?: AnalyticsRetentionExecutionMode | string;
  readonly confirmExecute?: boolean;
  readonly hardDeleteLimit?: number | string;
}

export interface AnalyticsRetentionExecutionGuardDecision {
  readonly mode: AnalyticsRetentionExecutionMode;
  readonly source: AnalyticsRetentionSource;
  readonly dryRunOnly: boolean;
  readonly deleteAllowed: boolean;
  readonly hardDeleteLimit: number | null;
  readonly reasons: readonly AnalyticsRetentionExecutionGuardReason[];
}

interface HardDeleteLimitParseResult {
  readonly hardDeleteLimit: number | null;
  readonly reason?: AnalyticsRetentionExecutionGuardReason;
}

export function evaluateAnalyticsRetentionExecutionGuard(
  input: AnalyticsRetentionExecutionGuardInput,
): AnalyticsRetentionExecutionGuardDecision {
  const mode = parseExecutionMode(input.mode);

  if (mode === 'dry-run') {
    return {
      mode,
      source: input.plan.source,
      dryRunOnly: true,
      deleteAllowed: false,
      hardDeleteLimit: null,
      reasons: ['DRY_RUN_MODE'],
    };
  }

  const reasons: AnalyticsRetentionExecutionGuardReason[] = [];

  if (!input.plan.enabled) {
    reasons.push('RETENTION_DISABLED');
  }

  if (!hasRetentionSourcePlan(input.plan)) {
    reasons.push('NO_RETENTION_SOURCE_PLAN');
  }

  if (input.confirmExecute !== true) {
    reasons.push('EXECUTE_CONFIRMATION_REQUIRED');
  }

  const limitResult = parseHardDeleteLimit(input.hardDeleteLimit);

  if (limitResult.reason) {
    reasons.push(limitResult.reason);
  }

  return {
    mode,
    source: input.plan.source,
    dryRunOnly: false,
    deleteAllowed: reasons.length === 0,
    hardDeleteLimit: limitResult.hardDeleteLimit,
    reasons,
  };
}

function parseExecutionMode(
  value: AnalyticsRetentionExecutionMode | string | undefined,
): AnalyticsRetentionExecutionMode {
  if (value === undefined || value === 'dry-run') {
    return 'dry-run';
  }

  if (value === 'execute') {
    return 'execute';
  }

  throw new RangeError('analytics retention execution mode must be dry-run or execute');
}

function hasRetentionSourcePlan(plan: AnalyticsRetentionPlan): boolean {
  return plan.usage !== null || plan.rejected !== null;
}

function parseHardDeleteLimit(
  value: number | string | undefined,
): HardDeleteLimitParseResult {
  if (value === undefined) {
    return {
      hardDeleteLimit: null,
      reason: 'HARD_DELETE_LIMIT_REQUIRED',
    };
  }

  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value < 1) {
      return {
        hardDeleteLimit: null,
        reason: 'HARD_DELETE_LIMIT_INVALID',
      };
    }

    return {
      hardDeleteLimit: value,
    };
  }

  const normalized = value.trim();

  if (!/^[1-9]\d*$/.test(normalized)) {
    return {
      hardDeleteLimit: null,
      reason: 'HARD_DELETE_LIMIT_INVALID',
    };
  }

  const parsed = Number(normalized);

  if (!Number.isSafeInteger(parsed)) {
    return {
      hardDeleteLimit: null,
      reason: 'HARD_DELETE_LIMIT_INVALID',
    };
  }

  return {
    hardDeleteLimit: parsed,
  };
}

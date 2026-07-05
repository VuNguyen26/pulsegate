export const ANALYTICS_RETENTION_MIN_DAYS = 7;
export const ANALYTICS_RETENTION_DEFAULT_DAYS = 90;

export type AnalyticsRetentionSource = 'usage' | 'rejected' | 'both';
export type AnalyticsRetentionConcreteSource = Exclude<AnalyticsRetentionSource, 'both'>;
export type AnalyticsRetentionMode = 'dry-run';

export interface AnalyticsRetentionPolicyInput {
  readonly enabled?: boolean | string;
  readonly mode?: string;
  readonly source?: string;
  readonly usageRetentionDays?: number | string;
  readonly rejectedRetentionDays?: number | string;
}

export interface AnalyticsRetentionSourcePolicy {
  readonly source: AnalyticsRetentionConcreteSource;
  readonly retentionDays: number;
  readonly minRetentionDays: number;
}

export interface AnalyticsRetentionPolicy {
  readonly enabled: boolean;
  readonly mode: AnalyticsRetentionMode;
  readonly source: AnalyticsRetentionSource;
  readonly usage: AnalyticsRetentionSourcePolicy | null;
  readonly rejected: AnalyticsRetentionSourcePolicy | null;
}

export interface AnalyticsRetentionSourcePlan {
  readonly source: AnalyticsRetentionConcreteSource;
  readonly retentionDays: number;
  readonly cutoffExclusive: Date;
  readonly dryRunOnly: true;
  readonly deleteAllowed: false;
}

export interface AnalyticsRetentionPlan {
  readonly enabled: boolean;
  readonly mode: AnalyticsRetentionMode;
  readonly source: AnalyticsRetentionSource;
  readonly generatedAt: Date;
  readonly usage: AnalyticsRetentionSourcePlan | null;
  readonly rejected: AnalyticsRetentionSourcePlan | null;
}

export function parseAnalyticsRetentionPolicy(
  input: AnalyticsRetentionPolicyInput | null | undefined = {},
): AnalyticsRetentionPolicy {
  const policyInput = input ?? {};
  const source = parseSource(policyInput.source);

  assertNoUnusedRetentionDays(source, policyInput);

  const usage = includesUsage(source)
    ? buildSourcePolicy('usage', policyInput.usageRetentionDays)
    : null;

  const rejected = includesRejected(source)
    ? buildSourcePolicy('rejected', policyInput.rejectedRetentionDays)
    : null;

  return {
    enabled: parseEnabled(policyInput.enabled),
    mode: parseMode(policyInput.mode),
    source,
    usage,
    rejected,
  };
}

export function createAnalyticsRetentionPlan(
  policy: AnalyticsRetentionPolicy,
  now: Date = new Date(),
): AnalyticsRetentionPlan {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new Error('analytics retention plan now must be a valid Date');
  }

  const generatedAt = new Date(now.getTime());

  if (!policy.enabled) {
    return {
      enabled: false,
      mode: policy.mode,
      source: policy.source,
      generatedAt,
      usage: null,
      rejected: null,
    };
  }

  return {
    enabled: true,
    mode: policy.mode,
    source: policy.source,
    generatedAt,
    usage: policy.usage ? buildSourcePlan(policy.usage, generatedAt) : null,
    rejected: policy.rejected ? buildSourcePlan(policy.rejected, generatedAt) : null,
  };
}

function parseEnabled(value: boolean | string | undefined): boolean {
  if (value === undefined) {
    return false;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  throw new Error('analytics retention enabled must be a boolean');
}

function parseMode(value: string | undefined): AnalyticsRetentionMode {
  if (value === undefined || value === 'dry-run') {
    return 'dry-run';
  }

  throw new Error('analytics retention mode currently only supports dry-run');
}

function parseSource(value: string | undefined): AnalyticsRetentionSource {
  if (value === undefined) {
    return 'both';
  }

  if (value === 'usage' || value === 'rejected' || value === 'both') {
    return value;
  }

  throw new Error('analytics retention source must be usage, rejected, or both');
}

function buildSourcePolicy(
  source: AnalyticsRetentionConcreteSource,
  value: number | string | undefined,
): AnalyticsRetentionSourcePolicy {
  return {
    source,
    retentionDays: parseRetentionDays(value, `${source}RetentionDays`),
    minRetentionDays: ANALYTICS_RETENTION_MIN_DAYS,
  };
}

function parseRetentionDays(value: number | string | undefined, fieldName: string): number {
  if (value === undefined) {
    return ANALYTICS_RETENTION_DEFAULT_DAYS;
  }

  const retentionDays = normalizePositiveInteger(value, fieldName);

  if (retentionDays < ANALYTICS_RETENTION_MIN_DAYS) {
    throw new Error(
      `${fieldName} must be at least ${ANALYTICS_RETENTION_MIN_DAYS} days`,
    );
  }

  return retentionDays;
}

function normalizePositiveInteger(value: number | string, fieldName: string): number {
  if (typeof value === 'number') {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${fieldName} must be a positive integer`);
    }

    return value;
  }

  const normalized = value.trim();

  if (!/^[1-9]\d*$/.test(normalized)) {
    throw new Error(`${fieldName} must be a positive integer`);
  }

  return Number(normalized);
}

function assertNoUnusedRetentionDays(
  source: AnalyticsRetentionSource,
  input: AnalyticsRetentionPolicyInput,
): void {
  if (!includesUsage(source) && input.usageRetentionDays !== undefined) {
    throw new Error('usageRetentionDays is only allowed when source is usage or both');
  }

  if (!includesRejected(source) && input.rejectedRetentionDays !== undefined) {
    throw new Error('rejectedRetentionDays is only allowed when source is rejected or both');
  }
}

function includesUsage(source: AnalyticsRetentionSource): boolean {
  return source === 'usage' || source === 'both';
}

function includesRejected(source: AnalyticsRetentionSource): boolean {
  return source === 'rejected' || source === 'both';
}

function buildSourcePlan(
  policy: AnalyticsRetentionSourcePolicy,
  generatedAt: Date,
): AnalyticsRetentionSourcePlan {
  return {
    source: policy.source,
    retentionDays: policy.retentionDays,
    cutoffExclusive: subtractUtcDays(generatedAt, policy.retentionDays),
    dryRunOnly: true,
    deleteAllowed: false,
  };
}

function subtractUtcDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() - days);
  return result;
}

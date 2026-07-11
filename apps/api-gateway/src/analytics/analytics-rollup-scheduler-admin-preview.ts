import {
  buildAnalyticsRollupBackgroundSchedulerOutput,
  type AnalyticsRollupBackgroundSchedulerOutput,
} from "./analytics-rollup-background-scheduler-output.js";
import type {
  AnalyticsRollupBackgroundSchedulerRuntimeGateRequest,
} from "./analytics-rollup-background-scheduler-runtime-gate.js";

export const
  ANALYTICS_ROLLUP_SCHEDULER_ADMIN_PREVIEW_LOOKBACK_BUCKETS =
    1;

export const
  ANALYTICS_ROLLUP_SCHEDULER_ADMIN_PREVIEW_MAX_BUCKETS =
    24;

export const
  ANALYTICS_ROLLUP_SCHEDULER_ADMIN_PREVIEW_SAFETY_DELAY_MS =
    60_000;

export interface AnalyticsRollupSchedulerAdminPreview {
  readonly kind:
    "analytics-rollup-scheduler-admin-preview";
  readonly generatedAt: string;
  readonly configurationSource:
    "dashboard-observational-defaults";
  readonly runtimeStateAvailable: false;
  readonly startsScheduledJob: false;
  readonly invokesRuntimeAdapter: false;
  readonly request:
    AnalyticsRollupBackgroundSchedulerRuntimeGateRequest;
  readonly output:
    AnalyticsRollupBackgroundSchedulerOutput;
}

function assertValidNow(
  now: Date,
): void {
  if (
    !(now instanceof Date) ||
    Number.isNaN(now.getTime())
  ) {
    throw new RangeError(
      "analytics scheduler admin preview now must be a valid Date",
    );
  }
}

export function buildAnalyticsRollupSchedulerAdminPreview(
  now: Date = new Date(),
): AnalyticsRollupSchedulerAdminPreview {
  assertValidNow(now);

  const request:
    AnalyticsRollupBackgroundSchedulerRuntimeGateRequest =
    {
      trigger: "process-local",
      requestedMode: "preview",
      backgroundRunnerContractEnabled: true,
      schedulerEnabled: true,
      runAtIso: now.toISOString(),
      granularity: "hour",
      source: "both",
      lookbackBuckets:
        ANALYTICS_ROLLUP_SCHEDULER_ADMIN_PREVIEW_LOOKBACK_BUCKETS,
      maxBuckets:
        ANALYTICS_ROLLUP_SCHEDULER_ADMIN_PREVIEW_MAX_BUCKETS,
      safetyDelayMs:
        ANALYTICS_ROLLUP_SCHEDULER_ADMIN_PREVIEW_SAFETY_DELAY_MS,
      allowProcessLocalDryRunRuntimeInvocation:
        false,
    };

  const output =
    buildAnalyticsRollupBackgroundSchedulerOutput(
      request,
    );

  return {
    kind:
      "analytics-rollup-scheduler-admin-preview",
    generatedAt: now.toISOString(),
    configurationSource:
      "dashboard-observational-defaults",
    runtimeStateAvailable: false,
    startsScheduledJob: false,
    invokesRuntimeAdapter: false,
    request,
    output,
  };
}
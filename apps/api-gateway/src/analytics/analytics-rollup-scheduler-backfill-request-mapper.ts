import { createAnalyticsRollupBackfillPlan } from "./analytics-rollup-backfill-plan.js";
import type { AnalyticsRollupBackfillRunInput } from "./analytics-rollup-backfill-service.js";
import type {
  AnalyticsRollupSchedulerBackfillRequest,
  AnalyticsRollupSchedulerRunnerPlan,
} from "./analytics-rollup-scheduler-runner.js";

export type AnalyticsRollupSchedulerBackfillServiceDryRunMappingSafety = {
  mapperOnly: true;
  invokesBackfillService: false;
  readsEvents: false;
  persistsRollups: false;
  affectsQuotaCounting: false;
  deletesRawEvents: false;
  sourceSeparationPreserved: true;
  eventLimitGuardrailApplied: true;
  maxBucketGuardrailApplied: true;
  serviceInvocationCurrentlyAllowed: false;
};

export type AnalyticsRollupSchedulerBackfillServiceDryRunMapping = {
  source: AnalyticsRollupSchedulerBackfillRequest["source"];
  runInput: AnalyticsRollupBackfillRunInput;
  safety: AnalyticsRollupSchedulerBackfillServiceDryRunMappingSafety;
};

export type AnalyticsRollupSchedulerBackfillServiceDryRunMapperOptions = {
  eventLimit: number;
};

const MAPPING_SAFETY: AnalyticsRollupSchedulerBackfillServiceDryRunMappingSafety =
  {
    mapperOnly: true,
    invokesBackfillService: false,
    readsEvents: false,
    persistsRollups: false,
    affectsQuotaCounting: false,
    deletesRawEvents: false,
    sourceSeparationPreserved: true,
    eventLimitGuardrailApplied: true,
    maxBucketGuardrailApplied: true,
    serviceInvocationCurrentlyAllowed: false,
  };

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a positive integer`);
  }
}

function assertSafeDryRunRequest(
  request: AnalyticsRollupSchedulerBackfillRequest,
): void {
  if (request.mode !== "dry-run") {
    throw new RangeError(
      "scheduler backfill service mapper only accepts dry-run requests",
    );
  }

  if (
    request.willInvokeBackfillService !== false ||
    request.willReadEvents !== false ||
    request.willPersistRollups !== false
  ) {
    throw new RangeError(
      "scheduler backfill service mapper requires a non-invoking request contract",
    );
  }

  assertPositiveInteger(request.bucketCount, "bucketCount");
}

export function mapAnalyticsRollupSchedulerBackfillRequestToDryRunServiceInput(
  request: AnalyticsRollupSchedulerBackfillRequest,
  options: AnalyticsRollupSchedulerBackfillServiceDryRunMapperOptions,
): AnalyticsRollupSchedulerBackfillServiceDryRunMapping {
  assertSafeDryRunRequest(request);
  assertPositiveInteger(options.eventLimit, "eventLimit");

  return {
    source: request.source,
    runInput: {
      plan: createAnalyticsRollupBackfillPlan({
        from: request.from.toISOString(),
        to: request.to.toISOString(),
        granularity: request.granularity,
        source: request.source,
        mode: "dry-run",
        maxBuckets: request.bucketCount,
      }),
      eventLimit: options.eventLimit,
    },
    safety: MAPPING_SAFETY,
  };
}

export function mapAnalyticsRollupSchedulerRunnerPlanToDryRunServiceInputs(
  runnerPlan: AnalyticsRollupSchedulerRunnerPlan,
  options: AnalyticsRollupSchedulerBackfillServiceDryRunMapperOptions,
): AnalyticsRollupSchedulerBackfillServiceDryRunMapping[] {
  if (runnerPlan.status !== "ready") {
    throw new RangeError(
      "scheduler runner plan must be ready before mapping dry-run service inputs",
    );
  }

  return runnerPlan.backfillRequests.map((request) =>
    mapAnalyticsRollupSchedulerBackfillRequestToDryRunServiceInput(
      request,
      options,
    ),
  );
}
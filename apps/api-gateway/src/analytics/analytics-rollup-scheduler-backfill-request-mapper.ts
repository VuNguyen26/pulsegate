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

export type AnalyticsRollupSchedulerExecuteBackfillRequest = Omit<
  AnalyticsRollupSchedulerBackfillRequest,
  "mode"
> & {
  mode: "execute";
};

export type AnalyticsRollupSchedulerBackfillServiceExecuteMappingSafety = {
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
  executeRuntimeCurrentlyAllowed: false;
  explicitOperatorConfirmationRequired: true;
  dockerPostgresRuntimeValidationRequired: true;
};

export type AnalyticsRollupSchedulerBackfillServiceExecuteMapping = {
  source: AnalyticsRollupSchedulerBackfillRequest["source"];
  runInput: AnalyticsRollupBackfillRunInput;
  safety: AnalyticsRollupSchedulerBackfillServiceExecuteMappingSafety;
};

export type AnalyticsRollupSchedulerBackfillServiceExecuteMapperOptions = {
  eventLimit: number;
  commandExecuteOperatorConfirmed: boolean;
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

const EXECUTE_MAPPING_SAFETY: AnalyticsRollupSchedulerBackfillServiceExecuteMappingSafety =
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
    executeRuntimeCurrentlyAllowed: false,
    explicitOperatorConfirmationRequired: true,
    dockerPostgresRuntimeValidationRequired: true,
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

function assertSafeExecuteRequest(
  request: AnalyticsRollupSchedulerExecuteBackfillRequest,
  options: AnalyticsRollupSchedulerBackfillServiceExecuteMapperOptions,
): void {
  if (request.mode !== "execute") {
    throw new RangeError(
      "scheduler execute backfill service mapper only accepts execute requests",
    );
  }

  if (options.commandExecuteOperatorConfirmed !== true) {
    throw new RangeError(
      "scheduler execute backfill service mapper requires explicit operator confirmation",
    );
  }

  if (
    request.willInvokeBackfillService !== false ||
    request.willReadEvents !== false ||
    request.willPersistRollups !== false
  ) {
    throw new RangeError(
      "scheduler execute backfill service mapper requires a non-invoking request contract before runtime wiring",
    );
  }

  assertPositiveInteger(options.eventLimit, "eventLimit");
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

export function mapAnalyticsRollupSchedulerBackfillRequestToExecuteServiceInput(
  request: AnalyticsRollupSchedulerExecuteBackfillRequest,
  options: AnalyticsRollupSchedulerBackfillServiceExecuteMapperOptions,
): AnalyticsRollupSchedulerBackfillServiceExecuteMapping {
  assertSafeExecuteRequest(request, options);

  return {
    source: request.source,
    runInput: {
      plan: createAnalyticsRollupBackfillPlan({
        from: request.from.toISOString(),
        to: request.to.toISOString(),
        granularity: request.granularity,
        source: request.source,
        mode: "execute",
        maxBuckets: request.bucketCount,
      }),
      eventLimit: options.eventLimit,
    },
    safety: EXECUTE_MAPPING_SAFETY,
  };
}

export function mapAnalyticsRollupSchedulerRunnerPlanToExecuteServiceInputs(
  runnerPlan: AnalyticsRollupSchedulerRunnerPlan,
  options: AnalyticsRollupSchedulerBackfillServiceExecuteMapperOptions,
): AnalyticsRollupSchedulerBackfillServiceExecuteMapping[] {
  if (runnerPlan.status !== "ready") {
    throw new RangeError(
      "scheduler runner plan must be ready before mapping execute service inputs",
    );
  }

  return runnerPlan.backfillRequests.map((request) => {
    const executeRequest: AnalyticsRollupSchedulerExecuteBackfillRequest = {
      ...request,
      mode: "execute",
    };

    return mapAnalyticsRollupSchedulerBackfillRequestToExecuteServiceInput(
      executeRequest,
      options,
    );
  });
}

import type {
  AnalyticsRollupBackfillRunInput,
  AnalyticsRollupBackfillRunSummary,
  AnalyticsRollupBackfillService,
  AnalyticsRollupBackfillSourceRunSummary,
} from "./analytics-rollup-backfill-service.js";
import type {
  AnalyticsRollupSchedulerBackfillServiceDryRunMapping,
  AnalyticsRollupSchedulerBackfillServiceExecuteMapping,
} from "./analytics-rollup-scheduler-backfill-request-mapper.js";

export type AnalyticsRollupSchedulerBackfillServiceDryRunAdapterPreviewKind =
  "analytics-rollup-scheduler-backfill-service-dry-run-adapter-preview";

export type AnalyticsRollupSchedulerBackfillServiceDryRunAdapterPreviewStatus =
  "blocked-before-service-invocation";

export type AnalyticsRollupSchedulerBackfillServiceDryRunAdapterSafety = {
  adapterOnly: true;
  adapterCurrentlyAllowed: false;
  invokesBackfillService: false;
  readsEvents: false;
  persistsRollups: false;
  affectsQuotaCounting: false;
  deletesRawEvents: false;
  sourceSeparationPreserved: true;
  eventLimitGuardrailApplied: true;
  maxBucketGuardrailApplied: true;
  failClosedServiceErrorsRequired: true;
  serviceInvocationCurrentlyAllowed: false;
  dockerPostgresRuntimeValidationRequired: true;
};

export type AnalyticsRollupSchedulerBackfillServiceDryRunAdapterPreview = {
  kind: AnalyticsRollupSchedulerBackfillServiceDryRunAdapterPreviewKind;
  status: AnalyticsRollupSchedulerBackfillServiceDryRunAdapterPreviewStatus;
  adapterBoundary: "mapped-backfill-run-input-to-rollup-backfill-service-dry-run";
  currentAdapterState: "contract-model-only";
  source: AnalyticsRollupSchedulerBackfillServiceDryRunMapping["source"];
  serviceMethod: "runBackfill";
  inputMode: "dry-run";
  outputMode: "dry-run";
  plannedInvocationCardinality: "single-mapped-run-input";
  eventLimit: number;
  granularity: AnalyticsRollupBackfillRunSummary["granularity"];
  requestedFrom: Date;
  requestedTo: Date;
  rebuildFrom: Date | null;
  rebuildTo: Date | null;
  bucketCount: number;
  plannedServiceResult: AnalyticsRollupBackfillRunSummary;
  safety: AnalyticsRollupSchedulerBackfillServiceDryRunAdapterSafety;
};

export type AnalyticsRollupSchedulerBackfillServiceExecuteAdapterPreviewKind =
  "analytics-rollup-scheduler-backfill-service-execute-adapter-preview";

export type AnalyticsRollupSchedulerBackfillServiceExecuteAdapterPreviewStatus =
  "blocked-before-service-invocation";

export type AnalyticsRollupSchedulerBackfillServiceExecuteAdapterSafety = {
  adapterOnly: true;
  adapterCurrentlyAllowed: false;
  invokesBackfillService: false;
  executesBackfill: false;
  readsEvents: false;
  persistsRollups: false;
  affectsQuotaCounting: false;
  deletesRawEvents: false;
  sourceSeparationPreserved: true;
  eventLimitGuardrailApplied: true;
  maxBucketGuardrailApplied: true;
  explicitOperatorConfirmationRequired: true;
  serviceInvocationCurrentlyAllowed: false;
  executeRuntimeCurrentlyAllowed: false;
  dockerPostgresRuntimeValidationRequired: true;
};

export type AnalyticsRollupSchedulerBackfillServiceExecuteAdapterPreview = {
  kind: AnalyticsRollupSchedulerBackfillServiceExecuteAdapterPreviewKind;
  status: AnalyticsRollupSchedulerBackfillServiceExecuteAdapterPreviewStatus;
  adapterBoundary: "mapped-backfill-run-input-to-rollup-backfill-service-execute";
  currentAdapterState: "contract-model-only";
  source: AnalyticsRollupSchedulerBackfillServiceExecuteMapping["source"];
  serviceMethod: "runBackfill";
  inputMode: "execute";
  outputMode: "execute";
  plannedInvocationCardinality: "single-mapped-run-input";
  eventLimit: number;
  granularity: AnalyticsRollupBackfillRunSummary["granularity"];
  requestedFrom: Date;
  requestedTo: Date;
  rebuildFrom: Date | null;
  rebuildTo: Date | null;
  bucketCount: number;
  plannedRunInput: AnalyticsRollupBackfillRunInput;
  safety: AnalyticsRollupSchedulerBackfillServiceExecuteAdapterSafety;
};

export type AnalyticsRollupSchedulerBackfillServiceDryRunAdapterInvocationStatus =
  | "service-dry-run-invoked"
  | "failed-closed-service-error";

export type AnalyticsRollupSchedulerBackfillServiceDryRunAdapterInvocationSafety = {
  adapterOnly: false;
  adapterCurrentlyAllowed: true;
  invokesBackfillService: true;
  readsEvents: false;
  persistsRollups: false;
  affectsQuotaCounting: false;
  deletesRawEvents: false;
  sourceSeparationPreserved: true;
  eventLimitGuardrailApplied: true;
  maxBucketGuardrailApplied: true;
  failClosedServiceErrorsApplied: true;
  serviceInvocationCurrentlyAllowed: true;
  dockerPostgresRuntimeValidationRequired: true;
};

export type AnalyticsRollupSchedulerBackfillServiceDryRunAdapterInvocationError = {
  name: string;
  message: string;
};

export type AnalyticsRollupSchedulerBackfillServiceDryRunAdapterInvocationResult = {
  kind: "analytics-rollup-scheduler-backfill-service-dry-run-adapter-invocation";
  status: AnalyticsRollupSchedulerBackfillServiceDryRunAdapterInvocationStatus;
  adapterBoundary: "mapped-backfill-run-input-to-rollup-backfill-service-dry-run";
  currentAdapterState: "runtime-dry-run-invocation";
  source: AnalyticsRollupSchedulerBackfillServiceDryRunMapping["source"];
  serviceMethod: "runBackfill";
  inputMode: "dry-run";
  outputMode: "dry-run";
  invocationCardinality: "single-mapped-run-input";
  eventLimit: number;
  granularity: AnalyticsRollupBackfillRunSummary["granularity"];
  requestedFrom: Date;
  requestedTo: Date;
  rebuildFrom: Date | null;
  rebuildTo: Date | null;
  bucketCount: number;
  serviceResult: AnalyticsRollupBackfillRunSummary | null;
  error: AnalyticsRollupSchedulerBackfillServiceDryRunAdapterInvocationError | null;
  safety: AnalyticsRollupSchedulerBackfillServiceDryRunAdapterInvocationSafety;
};

const ADAPTER_SAFETY: AnalyticsRollupSchedulerBackfillServiceDryRunAdapterSafety =
  {
    adapterOnly: true,
    adapterCurrentlyAllowed: false,
    invokesBackfillService: false,
    readsEvents: false,
    persistsRollups: false,
    affectsQuotaCounting: false,
    deletesRawEvents: false,
    sourceSeparationPreserved: true,
    eventLimitGuardrailApplied: true,
    maxBucketGuardrailApplied: true,
    failClosedServiceErrorsRequired: true,
    serviceInvocationCurrentlyAllowed: false,
    dockerPostgresRuntimeValidationRequired: true,
  };

const INVOCATION_SAFETY: AnalyticsRollupSchedulerBackfillServiceDryRunAdapterInvocationSafety =
  {
    adapterOnly: false,
    adapterCurrentlyAllowed: true,
    invokesBackfillService: true,
    readsEvents: false,
    persistsRollups: false,
    affectsQuotaCounting: false,
    deletesRawEvents: false,
    sourceSeparationPreserved: true,
    eventLimitGuardrailApplied: true,
    maxBucketGuardrailApplied: true,
    failClosedServiceErrorsApplied: true,
    serviceInvocationCurrentlyAllowed: true,
    dockerPostgresRuntimeValidationRequired: true,
  };

const EXECUTE_ADAPTER_SAFETY: AnalyticsRollupSchedulerBackfillServiceExecuteAdapterSafety =
  {
    adapterOnly: true,
    adapterCurrentlyAllowed: false,
    invokesBackfillService: false,
    executesBackfill: false,
    readsEvents: false,
    persistsRollups: false,
    affectsQuotaCounting: false,
    deletesRawEvents: false,
    sourceSeparationPreserved: true,
    eventLimitGuardrailApplied: true,
    maxBucketGuardrailApplied: true,
    explicitOperatorConfirmationRequired: true,
    serviceInvocationCurrentlyAllowed: false,
    executeRuntimeCurrentlyAllowed: false,
    dockerPostgresRuntimeValidationRequired: true,
  };

function assertPositiveInteger(value: number | undefined, name: string): asserts value is number {
  if (!Number.isInteger(value) || value === undefined || value < 1) {
    throw new RangeError(`${name} must be a positive integer`);
  }
}

function assertMappedDryRunServiceInput(
  mapping: AnalyticsRollupSchedulerBackfillServiceDryRunMapping,
): void {
  const { runInput, safety, source } = mapping;
  const { plan } = runInput;

  if (
    safety.mapperOnly !== true ||
    safety.invokesBackfillService !== false ||
    safety.readsEvents !== false ||
    safety.persistsRollups !== false ||
    safety.affectsQuotaCounting !== false ||
    safety.deletesRawEvents !== false ||
    safety.sourceSeparationPreserved !== true ||
    safety.eventLimitGuardrailApplied !== true ||
    safety.maxBucketGuardrailApplied !== true ||
    safety.serviceInvocationCurrentlyAllowed !== false
  ) {
    throw new RangeError(
      "scheduler service adapter preview requires a non-invoking mapped input contract",
    );
  }

  if (plan.mode !== "dry-run") {
    throw new RangeError(
      "scheduler service adapter preview only accepts dry-run service inputs",
    );
  }

  if (plan.source !== source || plan.sources.length !== 1 || plan.sources[0] !== source) {
    throw new RangeError(
      "scheduler service adapter preview requires per-source mapped inputs",
    );
  }

  assertPositiveInteger(runInput.eventLimit, "eventLimit");
  assertPositiveInteger(plan.windowPlan.bucketCount, "bucketCount");
}

function assertMappedExecuteServiceInput(
  mapping: AnalyticsRollupSchedulerBackfillServiceExecuteMapping,
): void {
  const { runInput, safety, source } = mapping;
  const { plan } = runInput;

  if (
    safety.mapperOnly !== true ||
    safety.invokesBackfillService !== false ||
    safety.readsEvents !== false ||
    safety.persistsRollups !== false ||
    safety.affectsQuotaCounting !== false ||
    safety.deletesRawEvents !== false ||
    safety.sourceSeparationPreserved !== true ||
    safety.eventLimitGuardrailApplied !== true ||
    safety.maxBucketGuardrailApplied !== true ||
    safety.serviceInvocationCurrentlyAllowed !== false ||
    safety.executeRuntimeCurrentlyAllowed !== false ||
    safety.explicitOperatorConfirmationRequired !== true ||
    safety.dockerPostgresRuntimeValidationRequired !== true
  ) {
    throw new RangeError(
      "scheduler execute service adapter preview requires a non-invoking mapped input contract",
    );
  }

  if (plan.mode !== "execute") {
    throw new RangeError(
      "scheduler execute service adapter preview only accepts execute service inputs",
    );
  }

  if (plan.source !== source || plan.sources.length !== 1 || plan.sources[0] !== source) {
    throw new RangeError(
      "scheduler execute service adapter preview requires per-source mapped inputs",
    );
  }

  assertPositiveInteger(runInput.eventLimit, "eventLimit");
  assertPositiveInteger(plan.windowPlan.bucketCount, "bucketCount");
}

export function createAnalyticsRollupSchedulerBackfillServiceExecuteAdapterPreview(
  mapping: AnalyticsRollupSchedulerBackfillServiceExecuteMapping,
): AnalyticsRollupSchedulerBackfillServiceExecuteAdapterPreview {
  assertMappedExecuteServiceInput(mapping);

  const { eventLimit, plan } = mapping.runInput;
  assertPositiveInteger(eventLimit, "eventLimit");

  return {
    kind: "analytics-rollup-scheduler-backfill-service-execute-adapter-preview",
    status: "blocked-before-service-invocation",
    adapterBoundary:
      "mapped-backfill-run-input-to-rollup-backfill-service-execute",
    currentAdapterState: "contract-model-only",
    source: mapping.source,
    serviceMethod: "runBackfill",
    inputMode: "execute",
    outputMode: "execute",
    plannedInvocationCardinality: "single-mapped-run-input",
    eventLimit,
    granularity: plan.windowPlan.granularity,
    requestedFrom: plan.windowPlan.requestedFrom,
    requestedTo: plan.windowPlan.requestedTo,
    rebuildFrom: plan.windowPlan.rebuildFrom,
    rebuildTo: plan.windowPlan.rebuildTo,
    bucketCount: plan.windowPlan.bucketCount,
    plannedRunInput: mapping.runInput,
    safety: EXECUTE_ADAPTER_SAFETY,
  };
}

export function createAnalyticsRollupSchedulerBackfillServiceExecuteAdapterPreviews(
  mappings: AnalyticsRollupSchedulerBackfillServiceExecuteMapping[],
): AnalyticsRollupSchedulerBackfillServiceExecuteAdapterPreview[] {
  assertUniqueMappedSources(mappings, "scheduler service adapter execute preview");

  return mappings.map((mapping) =>
    createAnalyticsRollupSchedulerBackfillServiceExecuteAdapterPreview(mapping),
  );
}

function createPlannedSourceResult(
  source: AnalyticsRollupSchedulerBackfillServiceDryRunMapping["source"],
): AnalyticsRollupBackfillSourceRunSummary {
  return {
    source,
    status: "planned",
    inputEventCount: 0,
    aggregateCount: 0,
    upsertedCount: 0,
  };
}

export function createAnalyticsRollupSchedulerBackfillServiceDryRunAdapterPreview(
  mapping: AnalyticsRollupSchedulerBackfillServiceDryRunMapping,
): AnalyticsRollupSchedulerBackfillServiceDryRunAdapterPreview {
  assertMappedDryRunServiceInput(mapping);

  const { eventLimit, plan } = mapping.runInput;
  assertPositiveInteger(eventLimit, "eventLimit");

  const plannedSourceResults = plan.sources.map(createPlannedSourceResult);

  return {
    kind: "analytics-rollup-scheduler-backfill-service-dry-run-adapter-preview",
    status: "blocked-before-service-invocation",
    adapterBoundary:
      "mapped-backfill-run-input-to-rollup-backfill-service-dry-run",
    currentAdapterState: "contract-model-only",
    source: mapping.source,
    serviceMethod: "runBackfill",
    inputMode: "dry-run",
    outputMode: "dry-run",
    plannedInvocationCardinality: "single-mapped-run-input",
    eventLimit,
    granularity: plan.windowPlan.granularity,
    requestedFrom: plan.windowPlan.requestedFrom,
    requestedTo: plan.windowPlan.requestedTo,
    rebuildFrom: plan.windowPlan.rebuildFrom,
    rebuildTo: plan.windowPlan.rebuildTo,
    bucketCount: plan.windowPlan.bucketCount,
    plannedServiceResult: {
      mode: "dry-run",
      source: plan.source,
      sources: plan.sources,
      granularity: plan.windowPlan.granularity,
      requestedFrom: plan.windowPlan.requestedFrom,
      requestedTo: plan.windowPlan.requestedTo,
      rebuildFrom: plan.windowPlan.rebuildFrom,
      rebuildTo: plan.windowPlan.rebuildTo,
      bucketCount: plan.windowPlan.bucketCount,
      sourceResults: plannedSourceResults,
      totalInputEventCount: 0,
      totalAggregateCount: 0,
      totalUpsertedCount: 0,
    },
    safety: ADAPTER_SAFETY,
  };
}

export function createAnalyticsRollupSchedulerBackfillServiceDryRunAdapterPreviews(
  mappings: AnalyticsRollupSchedulerBackfillServiceDryRunMapping[],
): AnalyticsRollupSchedulerBackfillServiceDryRunAdapterPreview[] {
  assertUniqueMappedSources(mappings, "scheduler service adapter preview");

  return mappings.map((mapping) =>
    createAnalyticsRollupSchedulerBackfillServiceDryRunAdapterPreview(mapping),
  );
}

function assertUniqueMappedSources(
  mappings: AnalyticsRollupSchedulerBackfillServiceDryRunMapping[],
  boundaryName: string,
): void {
  const seenSources = new Set<string>();

  for (const mapping of mappings) {
    if (seenSources.has(mapping.source)) {
      throw new RangeError(`${boundaryName} requires unique mapped sources`);
    }

    seenSources.add(mapping.source);
  }
}

function createInvocationError(
  error: unknown,
): AnalyticsRollupSchedulerBackfillServiceDryRunAdapterInvocationError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  return {
    name: "Error",
    message: String(error),
  };
}

function assertDryRunServiceResult(
  mapping: AnalyticsRollupSchedulerBackfillServiceDryRunMapping,
  serviceResult: AnalyticsRollupBackfillRunSummary,
): void {
  if (
    serviceResult.mode !== "dry-run" ||
    serviceResult.source !== mapping.source ||
    serviceResult.sources.length !== 1 ||
    serviceResult.sources[0] !== mapping.source
  ) {
    throw new RangeError(
      "scheduler service adapter invocation requires a source-scoped dry-run service result",
    );
  }

  const [sourceResult] = serviceResult.sourceResults;

  if (
    serviceResult.sourceResults.length !== 1 ||
    sourceResult === undefined ||
    sourceResult.source !== mapping.source ||
    sourceResult.status !== "planned" ||
    sourceResult.inputEventCount !== 0 ||
    sourceResult.aggregateCount !== 0 ||
    sourceResult.upsertedCount !== 0 ||
    serviceResult.totalInputEventCount !== 0 ||
    serviceResult.totalAggregateCount !== 0 ||
    serviceResult.totalUpsertedCount !== 0
  ) {
    throw new RangeError(
      "scheduler service adapter invocation requires a non-persisting dry-run service result",
    );
  }
}

function createBaseInvocationResult(
  mapping: AnalyticsRollupSchedulerBackfillServiceDryRunMapping,
): Omit<
  AnalyticsRollupSchedulerBackfillServiceDryRunAdapterInvocationResult,
  "status" | "serviceResult" | "error"
> {
  const { eventLimit, plan } = mapping.runInput;
  assertPositiveInteger(eventLimit, "eventLimit");

  return {
    kind: "analytics-rollup-scheduler-backfill-service-dry-run-adapter-invocation",
    adapterBoundary:
      "mapped-backfill-run-input-to-rollup-backfill-service-dry-run",
    currentAdapterState: "runtime-dry-run-invocation",
    source: mapping.source,
    serviceMethod: "runBackfill",
    inputMode: "dry-run",
    outputMode: "dry-run",
    invocationCardinality: "single-mapped-run-input",
    eventLimit,
    granularity: plan.windowPlan.granularity,
    requestedFrom: plan.windowPlan.requestedFrom,
    requestedTo: plan.windowPlan.requestedTo,
    rebuildFrom: plan.windowPlan.rebuildFrom,
    rebuildTo: plan.windowPlan.rebuildTo,
    bucketCount: plan.windowPlan.bucketCount,
    safety: INVOCATION_SAFETY,
  };
}

export async function invokeAnalyticsRollupSchedulerBackfillServiceDryRunAdapter(
  mapping: AnalyticsRollupSchedulerBackfillServiceDryRunMapping,
  backfillService: AnalyticsRollupBackfillService,
): Promise<AnalyticsRollupSchedulerBackfillServiceDryRunAdapterInvocationResult> {
  assertMappedDryRunServiceInput(mapping);

  const baseResult = createBaseInvocationResult(mapping);

  try {
    const serviceResult = await backfillService.runBackfill(mapping.runInput);
    assertDryRunServiceResult(mapping, serviceResult);

    return {
      ...baseResult,
      status: "service-dry-run-invoked",
      serviceResult,
      error: null,
    };
  } catch (error: unknown) {
    return {
      ...baseResult,
      status: "failed-closed-service-error",
      serviceResult: null,
      error: createInvocationError(error),
    };
  }
}

export async function invokeAnalyticsRollupSchedulerBackfillServiceDryRunAdapters(
  mappings: AnalyticsRollupSchedulerBackfillServiceDryRunMapping[],
  backfillService: AnalyticsRollupBackfillService,
): Promise<AnalyticsRollupSchedulerBackfillServiceDryRunAdapterInvocationResult[]> {
  assertUniqueMappedSources(
    mappings,
    "scheduler service adapter dry-run invocation",
  );

  const results: AnalyticsRollupSchedulerBackfillServiceDryRunAdapterInvocationResult[] =
    [];

  for (const mapping of mappings) {
    results.push(
      await invokeAnalyticsRollupSchedulerBackfillServiceDryRunAdapter(
        mapping,
        backfillService,
      ),
    );
  }

  return results;
}
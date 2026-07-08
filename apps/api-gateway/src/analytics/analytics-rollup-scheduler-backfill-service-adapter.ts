import type {
  AnalyticsRollupBackfillRunSummary,
  AnalyticsRollupBackfillSourceRunSummary,
} from "./analytics-rollup-backfill-service.js";
import type { AnalyticsRollupSchedulerBackfillServiceDryRunMapping } from "./analytics-rollup-scheduler-backfill-request-mapper.js";

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
  const seenSources = new Set<string>();

  for (const mapping of mappings) {
    if (seenSources.has(mapping.source)) {
      throw new RangeError(
        "scheduler service adapter preview requires unique mapped sources",
      );
    }

    seenSources.add(mapping.source);
  }

  return mappings.map((mapping) =>
    createAnalyticsRollupSchedulerBackfillServiceDryRunAdapterPreview(mapping),
  );
}
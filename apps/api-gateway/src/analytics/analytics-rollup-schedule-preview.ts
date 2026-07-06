import type { AnalyticsRollupBackfillSource } from "./analytics-rollup-backfill-plan.js";
import type { AnalyticsRollupSchedulePlan } from "./analytics-rollup-schedule-plan.js";

export type AnalyticsRollupSchedulePreviewKind =
  "analytics-rollup-schedule-preview";

export type AnalyticsRollupSchedulePreviewMode = "preview";

export type AnalyticsRollupSchedulePreviewSourceSummary = {
  source: AnalyticsRollupBackfillSource;
  status: AnalyticsRollupSchedulePlan["status"];
  plannedBucketCount: number;
  willReadEvents: false;
  willPersistRollups: false;
};

export type AnalyticsRollupSchedulePreviewSafety = {
  previewOnly: true;
  commandCreatesScheduledJob: false;
  commandExecutesBackfill: false;
  readsEvents: false;
  persistsRollups: false;
  affectsQuotaCounting: false;
  deletesRawEvents: false;
};

export type AnalyticsRollupSchedulePreview = {
  kind: AnalyticsRollupSchedulePreviewKind;
  mode: AnalyticsRollupSchedulePreviewMode;
  enabled: boolean;
  status: AnalyticsRollupSchedulePlan["status"];
  source: AnalyticsRollupSchedulePlan["source"];
  sources: AnalyticsRollupBackfillSource[];
  granularity: AnalyticsRollupSchedulePlan["granularity"];
  runAt: Date;
  effectiveTo: Date | null;
  lookbackBuckets: number;
  safetyDelayMs: number;
  requestedFrom: Date | null;
  requestedTo: Date | null;
  rebuildFrom: Date | null;
  rebuildTo: Date | null;
  bucketCount: number;
  sourceResults: AnalyticsRollupSchedulePreviewSourceSummary[];
  safety: AnalyticsRollupSchedulePreviewSafety;
};

const PREVIEW_SAFETY: AnalyticsRollupSchedulePreviewSafety = {
  previewOnly: true,
  commandCreatesScheduledJob: false,
  commandExecutesBackfill: false,
  readsEvents: false,
  persistsRollups: false,
  affectsQuotaCounting: false,
  deletesRawEvents: false,
};

export function createAnalyticsRollupSchedulePreview(
  plan: AnalyticsRollupSchedulePlan,
): AnalyticsRollupSchedulePreview {
  const windowPlan = plan.windowPlan;
  const bucketCount = windowPlan?.bucketCount ?? 0;

  return {
    kind: "analytics-rollup-schedule-preview",
    mode: "preview",
    enabled: plan.enabled,
    status: plan.status,
    source: plan.source,
    sources: plan.sources,
    granularity: plan.granularity,
    runAt: plan.runAt,
    effectiveTo: plan.effectiveTo,
    lookbackBuckets: plan.lookbackBuckets,
    safetyDelayMs: plan.safetyDelayMs,
    requestedFrom: windowPlan?.requestedFrom ?? null,
    requestedTo: windowPlan?.requestedTo ?? null,
    rebuildFrom: windowPlan?.rebuildFrom ?? null,
    rebuildTo: windowPlan?.rebuildTo ?? null,
    bucketCount,
    sourceResults: plan.sources.map((source) => ({
      source,
      status: plan.status,
      plannedBucketCount: bucketCount,
      willReadEvents: false,
      willPersistRollups: false,
    })),
    safety: PREVIEW_SAFETY,
  };
}

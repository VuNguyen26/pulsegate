import type {
  AnalyticsRollupBackfillMode,
  AnalyticsRollupBackfillSource,
} from "./analytics-rollup-backfill-plan.js";
import type { AnalyticsRollupSchedulePlan } from "./analytics-rollup-schedule-plan.js";

export type AnalyticsRollupSchedulerRunnerKind =
  "analytics-rollup-scheduler-runner";

export type AnalyticsRollupSchedulerRunnerMode = "preview";

export type AnalyticsRollupSchedulerRunnerStatus = "skipped" | "ready";

export type AnalyticsRollupSchedulerRunnerSkipReason =
  | "schedule-disabled"
  | "no-window-plan";

export type AnalyticsRollupSchedulerBackfillRequest = {
  source: AnalyticsRollupBackfillSource;
  mode: Extract<AnalyticsRollupBackfillMode, "dry-run">;
  from: Date;
  to: Date;
  granularity: AnalyticsRollupSchedulePlan["granularity"];
  bucketCount: number;
  willInvokeBackfillService: false;
  willReadEvents: false;
  willPersistRollups: false;
};

export type AnalyticsRollupSchedulerRunnerSafety = {
  previewOnly: true;
  createsScheduledJob: false;
  invokesBackfillService: false;
  executesBackfill: false;
  readsEvents: false;
  persistsRollups: false;
  affectsQuotaCounting: false;
  deletesRawEvents: false;
};

export type AnalyticsRollupSchedulerRunnerPlan = {
  kind: AnalyticsRollupSchedulerRunnerKind;
  mode: AnalyticsRollupSchedulerRunnerMode;
  enabled: boolean;
  status: AnalyticsRollupSchedulerRunnerStatus;
  scheduleStatus: AnalyticsRollupSchedulePlan["status"];
  skipReason: AnalyticsRollupSchedulerRunnerSkipReason | null;
  source: AnalyticsRollupSchedulePlan["source"];
  sources: AnalyticsRollupBackfillSource[];
  granularity: AnalyticsRollupSchedulePlan["granularity"];
  runAt: Date;
  effectiveTo: Date | null;
  bucketCount: number;
  backfillRequests: AnalyticsRollupSchedulerBackfillRequest[];
  safety: AnalyticsRollupSchedulerRunnerSafety;
};

const RUNNER_SAFETY: AnalyticsRollupSchedulerRunnerSafety = {
  previewOnly: true,
  createsScheduledJob: false,
  invokesBackfillService: false,
  executesBackfill: false,
  readsEvents: false,
  persistsRollups: false,
  affectsQuotaCounting: false,
  deletesRawEvents: false,
};

function resolveSkipReason(
  schedulePlan: AnalyticsRollupSchedulePlan,
): AnalyticsRollupSchedulerRunnerSkipReason | null {
  if (!schedulePlan.enabled || schedulePlan.status === "disabled") {
    return "schedule-disabled";
  }

  if (schedulePlan.windowPlan === null) {
    return "no-window-plan";
  }

  return null;
}

export function createAnalyticsRollupSchedulerRunnerPlan(
  schedulePlan: AnalyticsRollupSchedulePlan,
): AnalyticsRollupSchedulerRunnerPlan {
  const skipReason = resolveSkipReason(schedulePlan);
  const windowPlan = schedulePlan.windowPlan;
  const bucketCount = windowPlan?.bucketCount ?? 0;

  if (skipReason !== null || windowPlan === null) {
    return {
      kind: "analytics-rollup-scheduler-runner",
      mode: "preview",
      enabled: schedulePlan.enabled,
      status: "skipped",
      scheduleStatus: schedulePlan.status,
      skipReason: skipReason ?? "no-window-plan",
      source: schedulePlan.source,
      sources: schedulePlan.sources,
      granularity: schedulePlan.granularity,
      runAt: schedulePlan.runAt,
      effectiveTo: schedulePlan.effectiveTo,
      bucketCount,
      backfillRequests: [],
      safety: RUNNER_SAFETY,
    };
  }

  return {
    kind: "analytics-rollup-scheduler-runner",
    mode: "preview",
    enabled: schedulePlan.enabled,
    status: "ready",
    scheduleStatus: schedulePlan.status,
    skipReason: null,
    source: schedulePlan.source,
    sources: schedulePlan.sources,
    granularity: schedulePlan.granularity,
    runAt: schedulePlan.runAt,
    effectiveTo: schedulePlan.effectiveTo,
    bucketCount,
    backfillRequests: schedulePlan.sources.map((source) => ({
      source,
      mode: "dry-run",
      from: windowPlan.requestedFrom,
      to: windowPlan.requestedTo,
      granularity: schedulePlan.granularity,
      bucketCount,
      willInvokeBackfillService: false,
      willReadEvents: false,
      willPersistRollups: false,
    })),
    safety: RUNNER_SAFETY,
  };
}
import type { AnalyticsRollupSchedulerRunnerPlan } from "./analytics-rollup-scheduler-runner.js";

export type AnalyticsRollupSchedulerExecutionDecisionKind =
  "analytics-rollup-scheduler-execution-decision";

export type AnalyticsRollupSchedulerExecutionTrigger =
  | "command"
  | "process-local"
  | "external-scheduler";

export type AnalyticsRollupSchedulerExecutionMode =
  | "preview"
  | "dry-run"
  | "execute";

export type AnalyticsRollupSchedulerExecutionDecisionStatus =
  | "blocked"
  | "preview-ready";

export type AnalyticsRollupSchedulerExecutionBlockedReason =
  | "scheduler-runner-not-ready"
  | "automatic-trigger-not-wired"
  | "backfill-service-invocation-not-wired"
  | "backfill-execution-not-wired";

export type AnalyticsRollupSchedulerExecutionDecisionInput = {
  trigger?: AnalyticsRollupSchedulerExecutionTrigger;
  mode?: AnalyticsRollupSchedulerExecutionMode;
};

export type AnalyticsRollupSchedulerExecutionBoundary = {
  trigger: AnalyticsRollupSchedulerExecutionTrigger;
  requestedMode: AnalyticsRollupSchedulerExecutionMode;
  allowedMode: Extract<AnalyticsRollupSchedulerExecutionMode, "preview">;
  commandTriggeredOnly: true;
  processLocalExecutionWired: false;
  externalSchedulerExecutionWired: false;
  backfillServiceInvocationWired: false;
  backfillExecutionWired: false;
};

export type AnalyticsRollupSchedulerExecutionDecisionSafety = {
  previewOnly: true;
  createsScheduledJob: false;
  invokesBackfillService: false;
  executesBackfill: false;
  readsEvents: false;
  persistsRollups: false;
  affectsQuotaCounting: false;
  deletesRawEvents: false;
};

export type AnalyticsRollupSchedulerExecutionDecision = {
  kind: AnalyticsRollupSchedulerExecutionDecisionKind;
  status: AnalyticsRollupSchedulerExecutionDecisionStatus;
  allowed: boolean;
  blockedReason: AnalyticsRollupSchedulerExecutionBlockedReason | null;
  runnerStatus: AnalyticsRollupSchedulerRunnerPlan["status"];
  scheduleStatus: AnalyticsRollupSchedulerRunnerPlan["scheduleStatus"];
  source: AnalyticsRollupSchedulerRunnerPlan["source"];
  sources: AnalyticsRollupSchedulerRunnerPlan["sources"];
  granularity: AnalyticsRollupSchedulerRunnerPlan["granularity"];
  runAt: Date;
  effectiveTo: Date | null;
  bucketCount: number;
  backfillRequestCount: number;
  boundary: AnalyticsRollupSchedulerExecutionBoundary;
  safety: AnalyticsRollupSchedulerExecutionDecisionSafety;
};

const EXECUTION_DECISION_SAFETY: AnalyticsRollupSchedulerExecutionDecisionSafety =
  {
    previewOnly: true,
    createsScheduledJob: false,
    invokesBackfillService: false,
    executesBackfill: false,
    readsEvents: false,
    persistsRollups: false,
    affectsQuotaCounting: false,
    deletesRawEvents: false,
  };

function resolveBlockedReason(
  runnerPlan: AnalyticsRollupSchedulerRunnerPlan,
  trigger: AnalyticsRollupSchedulerExecutionTrigger,
  requestedMode: AnalyticsRollupSchedulerExecutionMode,
): AnalyticsRollupSchedulerExecutionBlockedReason | null {
  if (runnerPlan.status !== "ready") {
    return "scheduler-runner-not-ready";
  }

  if (trigger !== "command") {
    return "automatic-trigger-not-wired";
  }

  if (requestedMode === "dry-run") {
    return "backfill-service-invocation-not-wired";
  }

  if (requestedMode === "execute") {
    return "backfill-execution-not-wired";
  }

  return null;
}

export function createAnalyticsRollupSchedulerExecutionDecision(
  runnerPlan: AnalyticsRollupSchedulerRunnerPlan,
  input: AnalyticsRollupSchedulerExecutionDecisionInput = {},
): AnalyticsRollupSchedulerExecutionDecision {
  const trigger = input.trigger ?? "command";
  const requestedMode = input.mode ?? "preview";
  const blockedReason = resolveBlockedReason(
    runnerPlan,
    trigger,
    requestedMode,
  );
  const allowed = blockedReason === null;

  return {
    kind: "analytics-rollup-scheduler-execution-decision",
    status: allowed ? "preview-ready" : "blocked",
    allowed,
    blockedReason,
    runnerStatus: runnerPlan.status,
    scheduleStatus: runnerPlan.scheduleStatus,
    source: runnerPlan.source,
    sources: runnerPlan.sources,
    granularity: runnerPlan.granularity,
    runAt: runnerPlan.runAt,
    effectiveTo: runnerPlan.effectiveTo,
    bucketCount: runnerPlan.bucketCount,
    backfillRequestCount: runnerPlan.backfillRequests.length,
    boundary: {
      trigger,
      requestedMode,
      allowedMode: "preview",
      commandTriggeredOnly: true,
      processLocalExecutionWired: false,
      externalSchedulerExecutionWired: false,
      backfillServiceInvocationWired: false,
      backfillExecutionWired: false,
    },
    safety: EXECUTION_DECISION_SAFETY,
  };
}
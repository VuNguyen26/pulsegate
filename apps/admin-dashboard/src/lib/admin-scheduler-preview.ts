export type DashboardSchedulerSafety = {
  createsScheduledJob: false;
  invokesBackfillService: false;
  executesBackfill: false;
  readsEvents: false;
  persistsRollups: false;
  affectsQuotaCounting: false;
  deletesRawEvents: false;
  runsRetentionExecution: false;
};

export type DashboardSchedulerPreviewPlan = {
  trigger: "process-local";
  requestedMode: "preview";
  runAtIso: string;
  granularity: "hour";
  source: "both";
  lookbackBuckets: 1;
  maxBuckets: 24;
  safetyDelayMs: 60_000;
  runtimeInvocationAllowed: false;
};

export type DashboardSchedulerPreview = {
  kind:
    "analytics-rollup-scheduler-admin-preview";
  generatedAt: string;
  configurationSource:
    "dashboard-observational-defaults";
  runtimeStateAvailable: false;
  startsScheduledJob: false;
  invokesRuntimeAdapter: false;
  request: {
    trigger: "process-local";
    requestedMode: "preview";
    backgroundRunnerContractEnabled: true;
    schedulerEnabled: true;
    runAtIso: string;
    granularity: "hour";
    source: "both";
    lookbackBuckets: 1;
    maxBuckets: 24;
    safetyDelayMs: 60_000;
    allowProcessLocalDryRunRuntimeInvocation:
      false;
  };
  output: {
    summary: {
      status: string;
      runnerStatus: string;
      blockedReason: string | null;
      ready: boolean;
      backgroundRunnerSelected: boolean;
      backgroundRunnerPlanAllowed: boolean;
      backgroundRuntimeInvocationAllowed:
        false;
      directCommandRuntimePreserved:
        boolean;
    };
    previewPlan:
      DashboardSchedulerPreviewPlan | null;
    runtimeGate: {
      summary: {
        status: string;
        runnerStatus: string;
        blockedReason: string | null;
        trigger: "process-local";
        requestedMode: "preview";
        ready: boolean;
        runtimeInvocationAllowed: false;
        runtimeFactoryResolutionAllowed:
          false;
        backfillServiceInvocationAllowed:
          false;
        executeBackfillAllowed: false;
        directCommandRuntimePreserved:
          boolean;
      };
      safety: DashboardSchedulerSafety;
      review: {
        separatesCommandFromBackgroundSemantics:
          boolean;
        preservesDirectCommandDryRunAndExecute:
          boolean;
        backgroundRuntimeStillClosed:
          boolean;
        processLocalRuntimeStillClosed:
          boolean;
        externalSchedulerRuntimeStillClosed:
          boolean;
        serviceInvocationStillBlocked:
          boolean;
        quotaCountingUnaffected: boolean;
        rawEventDeletionBlocked: boolean;
        retentionExecutionBlocked: boolean;
      };
      operatorNotes: readonly string[];
    };
    safety: DashboardSchedulerSafety;
    review: {
      separatesCommandFromBackgroundSemantics:
        boolean;
      preservesDirectCommandDryRunAndExecute:
        boolean;
      backgroundRuntimeStillClosed: boolean;
      processLocalExecutionStillClosed:
        boolean;
      externalSchedulerExecutionStillClosed:
        boolean;
      previewOnlyWhenReady: boolean;
    };
    operatorNotes: readonly string[];
  };
};

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value);

  return (
    actual.length === keys.length &&
    keys.every((key) =>
      Object.prototype.hasOwnProperty.call(
        value,
        key,
      ),
    )
  );
}

function isIsoTimestamp(
  value: unknown,
): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const parsed = new Date(value);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString() === value
  );
}

function isNullableString(
  value: unknown,
): value is string | null {
  return (
    value === null ||
    (
      typeof value === "string" &&
      value.trim().length > 0 &&
      value.length <= 256
    )
  );
}

function isNotes(
  value: unknown,
): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= 32 &&
    value.every(
      (note) =>
        typeof note === "string" &&
        note.trim().length > 0 &&
        note.length <= 1_024,
    )
  );
}

function isSafety(
  value: unknown,
): value is DashboardSchedulerSafety {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "createsScheduledJob",
      "invokesBackfillService",
      "executesBackfill",
      "readsEvents",
      "persistsRollups",
      "affectsQuotaCounting",
      "deletesRawEvents",
      "runsRetentionExecution",
    ])
  ) {
    return false;
  }

  return Object.values(value).every(
    (flag) => flag === false,
  );
}

function isPreviewPlan(
  value: unknown,
): value is DashboardSchedulerPreviewPlan {
  return (
    isRecord(value) &&
    hasExactKeys(value, [
      "trigger",
      "requestedMode",
      "runAtIso",
      "granularity",
      "source",
      "lookbackBuckets",
      "maxBuckets",
      "safetyDelayMs",
      "runtimeInvocationAllowed",
    ]) &&
    value.trigger === "process-local" &&
    value.requestedMode === "preview" &&
    isIsoTimestamp(value.runAtIso) &&
    value.granularity === "hour" &&
    value.source === "both" &&
    value.lookbackBuckets === 1 &&
    value.maxBuckets === 24 &&
    value.safetyDelayMs === 60_000 &&
    value.runtimeInvocationAllowed === false
  );
}

function isOutputSummary(
  value: unknown,
): boolean {
  return (
    isRecord(value) &&
    hasExactKeys(value, [
      "status",
      "runnerStatus",
      "blockedReason",
      "ready",
      "backgroundRunnerSelected",
      "backgroundRunnerPlanAllowed",
      "backgroundRuntimeInvocationAllowed",
      "directCommandRuntimePreserved",
    ]) &&
    typeof value.status === "string" &&
    value.status.length > 0 &&
    typeof value.runnerStatus === "string" &&
    value.runnerStatus.length > 0 &&
    isNullableString(value.blockedReason) &&
    typeof value.ready === "boolean" &&
    typeof value.backgroundRunnerSelected ===
      "boolean" &&
    typeof value.backgroundRunnerPlanAllowed ===
      "boolean" &&
    value.backgroundRuntimeInvocationAllowed ===
      false &&
    typeof value.directCommandRuntimePreserved ===
      "boolean"
  );
}

function isRuntimeSummary(
  value: unknown,
): boolean {
  return (
    isRecord(value) &&
    hasExactKeys(value, [
      "status",
      "runnerStatus",
      "blockedReason",
      "trigger",
      "requestedMode",
      "ready",
      "runtimeInvocationAllowed",
      "runtimeFactoryResolutionAllowed",
      "backfillServiceInvocationAllowed",
      "executeBackfillAllowed",
      "directCommandRuntimePreserved",
    ]) &&
    typeof value.status === "string" &&
    value.status.length > 0 &&
    typeof value.runnerStatus === "string" &&
    value.runnerStatus.length > 0 &&
    isNullableString(value.blockedReason) &&
    value.trigger === "process-local" &&
    value.requestedMode === "preview" &&
    typeof value.ready === "boolean" &&
    value.runtimeInvocationAllowed === false &&
    value.runtimeFactoryResolutionAllowed ===
      false &&
    value.backfillServiceInvocationAllowed ===
      false &&
    value.executeBackfillAllowed === false &&
    typeof value.directCommandRuntimePreserved ===
      "boolean"
  );
}

function isBooleanRecord(
  value: unknown,
  keys: readonly string[],
): boolean {
  return (
    isRecord(value) &&
    hasExactKeys(value, keys) &&
    Object.values(value).every(
      (flag) => typeof flag === "boolean",
    )
  );
}

function isRuntimeGate(
  value: unknown,
): boolean {
  return (
    isRecord(value) &&
    hasExactKeys(value, [
      "summary",
      "safety",
      "review",
      "operatorNotes",
    ]) &&
    isRuntimeSummary(value.summary) &&
    isSafety(value.safety) &&
    isBooleanRecord(value.review, [
      "separatesCommandFromBackgroundSemantics",
      "preservesDirectCommandDryRunAndExecute",
      "backgroundRuntimeStillClosed",
      "processLocalRuntimeStillClosed",
      "externalSchedulerRuntimeStillClosed",
      "serviceInvocationStillBlocked",
      "quotaCountingUnaffected",
      "rawEventDeletionBlocked",
      "retentionExecutionBlocked",
    ]) &&
    isNotes(value.operatorNotes)
  );
}

function isRequest(
  value: unknown,
  generatedAt: string,
): boolean {
  return (
    isRecord(value) &&
    hasExactKeys(value, [
      "trigger",
      "requestedMode",
      "backgroundRunnerContractEnabled",
      "schedulerEnabled",
      "runAtIso",
      "granularity",
      "source",
      "lookbackBuckets",
      "maxBuckets",
      "safetyDelayMs",
      "allowProcessLocalDryRunRuntimeInvocation",
    ]) &&
    value.trigger === "process-local" &&
    value.requestedMode === "preview" &&
    value.backgroundRunnerContractEnabled ===
      true &&
    value.schedulerEnabled === true &&
    value.runAtIso === generatedAt &&
    value.granularity === "hour" &&
    value.source === "both" &&
    value.lookbackBuckets === 1 &&
    value.maxBuckets === 24 &&
    value.safetyDelayMs === 60_000 &&
    value.allowProcessLocalDryRunRuntimeInvocation ===
      false
  );
}

function isOutput(
  value: unknown,
): boolean {
  return (
    isRecord(value) &&
    hasExactKeys(value, [
      "summary",
      "previewPlan",
      "runtimeGate",
      "safety",
      "review",
      "operatorNotes",
    ]) &&
    isOutputSummary(value.summary) &&
    (
      value.previewPlan === null ||
      isPreviewPlan(value.previewPlan)
    ) &&
    isRuntimeGate(value.runtimeGate) &&
    isSafety(value.safety) &&
    isBooleanRecord(value.review, [
      "separatesCommandFromBackgroundSemantics",
      "preservesDirectCommandDryRunAndExecute",
      "backgroundRuntimeStillClosed",
      "processLocalExecutionStillClosed",
      "externalSchedulerExecutionStillClosed",
      "previewOnlyWhenReady",
    ]) &&
    isNotes(value.operatorNotes)
  );
}

export function isDashboardSchedulerPreview(
  value: unknown,
): value is DashboardSchedulerPreview {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "kind",
      "generatedAt",
      "configurationSource",
      "runtimeStateAvailable",
      "startsScheduledJob",
      "invokesRuntimeAdapter",
      "request",
      "output",
    ]) ||
    value.kind !==
      "analytics-rollup-scheduler-admin-preview" ||
    !isIsoTimestamp(value.generatedAt) ||
    value.configurationSource !==
      "dashboard-observational-defaults" ||
    value.runtimeStateAvailable !== false ||
    value.startsScheduledJob !== false ||
    value.invokesRuntimeAdapter !== false
  ) {
    return false;
  }

  return (
    isRequest(
      value.request,
      value.generatedAt,
    ) &&
    isOutput(value.output)
  );
}
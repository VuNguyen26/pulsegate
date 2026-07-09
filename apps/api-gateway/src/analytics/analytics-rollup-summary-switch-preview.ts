export type RollupSummaryApiSwitchPreviewTarget =
  | "usage-consumer-summary"
  | "usage-api-key-summary"
  | "rejected-summary";

export type RollupSummaryApiSwitchPreviewDataState =
  | "fresh"
  | "missing"
  | "empty"
  | "stale"
  | "unknown";

export type RollupSummaryApiSwitchPreviewFallbackReason =
  | "rollup-preview-disabled"
  | "rollup-preview-only"
  | "rollup-data-missing"
  | "rollup-data-empty"
  | "rollup-data-stale"
  | "rollup-data-unknown"
  | "unsupported-query-shape";

export type RollupSummaryApiSwitchPreviewStatus =
  | "current-raw-summary-retained"
  | "rollup-preview-ready-with-raw-fallback"
  | "rollup-preview-fallback-required";

export type RollupSummaryRuntimePath =
  | "raw-event-summary"
  | "rollup-read-model-preview";

export type BuildRollupSummaryApiSwitchPreviewInput = {
  readonly target: RollupSummaryApiSwitchPreviewTarget;
  readonly rollupPreviewEnabled?: boolean;
  readonly queryShapeSupported?: boolean;
  readonly rollupDataState?: RollupSummaryApiSwitchPreviewDataState;
};

export type RollupSummaryApiSwitchPreviewTargetProfile = {
  readonly target: RollupSummaryApiSwitchPreviewTarget;
  readonly routeFamily: string;
  readonly currentRawEventSourceOfTruth:
    | "gateway.api_usage_events"
    | "gateway.api_rejected_events";
  readonly futureRollupReadModel:
    | "gateway.api_usage_rollups"
    | "gateway.api_rejected_rollups";
  readonly currentSummaryRepository:
    | "api-usage-summary.repository"
    | "api-rejected-events-summary.repository";
};

export type RollupSummaryApiSwitchPreview = {
  readonly target: RollupSummaryApiSwitchPreviewTarget;
  readonly status: RollupSummaryApiSwitchPreviewStatus;
  readonly targetProfile: RollupSummaryApiSwitchPreviewTargetProfile;
  readonly currentRuntimePath: {
    readonly path: "raw-event-summary";
    readonly remainsDefault: true;
    readonly readsRawEvents: true;
    readonly readsRollupTables: false;
  };
  readonly rollupPreviewPath: {
    readonly path: "rollup-read-model-preview";
    readonly enabled: boolean;
    readonly queryShapeSupported: boolean;
    readonly dataState: RollupSummaryApiSwitchPreviewDataState;
    readonly wouldReadRollupTables: boolean;
    readonly wouldPersistRollups: false;
  };
  readonly fallback: {
    readonly path: "raw-event-summary";
    readonly required: true;
    readonly reason: RollupSummaryApiSwitchPreviewFallbackReason;
  };
  readonly runtimeSelection: {
    readonly selectedPath: "raw-event-summary";
    readonly runtimeSwitchApplied: false;
    readonly reason: "sprint-52-preview-only";
  };
  readonly comparison: {
    readonly currentRawSummary: {
      readonly sourceOfTruth:
        | "gateway.api_usage_events"
        | "gateway.api_rejected_events";
      readonly remainsAuthoritativeForRuntime: true;
      readonly quotaCountingImpacted: false;
    };
    readonly futureRollupSummary: {
      readonly readModel:
        | "gateway.api_usage_rollups"
        | "gateway.api_rejected_rollups";
      readonly fallbackSourceOfTruth:
        | "gateway.api_usage_events"
        | "gateway.api_rejected_events";
      readonly quotaCountingImpacted: false;
    };
  };
  readonly safety: {
    readonly endpointRuntimeChanged: false;
    readonly readsDatabaseInPreviewModel: false;
    readonly invokesRepositoryInPreviewModel: false;
    readonly persistsRollups: false;
    readonly mutatesQuotaCounting: false;
    readonly deletesRawEvents: false;
    readonly wiresSchedulerOrBackgroundJob: false;
    readonly wiresRetentionExecution: false;
  };
};

const TARGET_PROFILES: Record<
  RollupSummaryApiSwitchPreviewTarget,
  RollupSummaryApiSwitchPreviewTargetProfile
> = {
  "usage-consumer-summary": {
    target: "usage-consumer-summary",
    routeFamily: "/internal/admin/usage/consumers/:consumerId/summary",
    currentRawEventSourceOfTruth: "gateway.api_usage_events",
    futureRollupReadModel: "gateway.api_usage_rollups",
    currentSummaryRepository: "api-usage-summary.repository",
  },
  "usage-api-key-summary": {
    target: "usage-api-key-summary",
    routeFamily: "/internal/admin/usage/api-keys/:apiKeyId/summary",
    currentRawEventSourceOfTruth: "gateway.api_usage_events",
    futureRollupReadModel: "gateway.api_usage_rollups",
    currentSummaryRepository: "api-usage-summary.repository",
  },
  "rejected-summary": {
    target: "rejected-summary",
    routeFamily: "/internal/admin/api-rejections/summary",
    currentRawEventSourceOfTruth: "gateway.api_rejected_events",
    futureRollupReadModel: "gateway.api_rejected_rollups",
    currentSummaryRepository: "api-rejected-events-summary.repository",
  },
};

export function buildRollupSummaryApiSwitchPreview(
  input: BuildRollupSummaryApiSwitchPreviewInput,
): RollupSummaryApiSwitchPreview {
  const profile = TARGET_PROFILES[input.target];
  const rollupPreviewEnabled = input.rollupPreviewEnabled === true;
  const queryShapeSupported = input.queryShapeSupported !== false;
  const rollupDataState = input.rollupDataState ?? "unknown";
  const fallbackReason = resolveFallbackReason({
    rollupPreviewEnabled,
    queryShapeSupported,
    rollupDataState,
  });
  const wouldReadRollupTables =
    rollupPreviewEnabled &&
    queryShapeSupported &&
    rollupDataState === "fresh";

  return {
    target: input.target,
    status: resolveStatus({
      rollupPreviewEnabled,
      queryShapeSupported,
      rollupDataState,
    }),
    targetProfile: profile,
    currentRuntimePath: {
      path: "raw-event-summary",
      remainsDefault: true,
      readsRawEvents: true,
      readsRollupTables: false,
    },
    rollupPreviewPath: {
      path: "rollup-read-model-preview",
      enabled: rollupPreviewEnabled,
      queryShapeSupported,
      dataState: rollupDataState,
      wouldReadRollupTables,
      wouldPersistRollups: false,
    },
    fallback: {
      path: "raw-event-summary",
      required: true,
      reason: fallbackReason,
    },
    runtimeSelection: {
      selectedPath: "raw-event-summary",
      runtimeSwitchApplied: false,
      reason: "sprint-52-preview-only",
    },
    comparison: {
      currentRawSummary: {
        sourceOfTruth: profile.currentRawEventSourceOfTruth,
        remainsAuthoritativeForRuntime: true,
        quotaCountingImpacted: false,
      },
      futureRollupSummary: {
        readModel: profile.futureRollupReadModel,
        fallbackSourceOfTruth: profile.currentRawEventSourceOfTruth,
        quotaCountingImpacted: false,
      },
    },
    safety: {
      endpointRuntimeChanged: false,
      readsDatabaseInPreviewModel: false,
      invokesRepositoryInPreviewModel: false,
      persistsRollups: false,
      mutatesQuotaCounting: false,
      deletesRawEvents: false,
      wiresSchedulerOrBackgroundJob: false,
      wiresRetentionExecution: false,
    },
  };
}

function resolveStatus(input: {
  readonly rollupPreviewEnabled: boolean;
  readonly queryShapeSupported: boolean;
  readonly rollupDataState: RollupSummaryApiSwitchPreviewDataState;
}): RollupSummaryApiSwitchPreviewStatus {
  if (!input.rollupPreviewEnabled) {
    return "current-raw-summary-retained";
  }

  if (input.queryShapeSupported && input.rollupDataState === "fresh") {
    return "rollup-preview-ready-with-raw-fallback";
  }

  return "rollup-preview-fallback-required";
}

function resolveFallbackReason(input: {
  readonly rollupPreviewEnabled: boolean;
  readonly queryShapeSupported: boolean;
  readonly rollupDataState: RollupSummaryApiSwitchPreviewDataState;
}): RollupSummaryApiSwitchPreviewFallbackReason {
  if (!input.rollupPreviewEnabled) {
    return "rollup-preview-disabled";
  }

  if (!input.queryShapeSupported) {
    return "unsupported-query-shape";
  }

  if (input.rollupDataState === "fresh") {
    return "rollup-preview-only";
  }

  if (input.rollupDataState === "missing") {
    return "rollup-data-missing";
  }

  if (input.rollupDataState === "empty") {
    return "rollup-data-empty";
  }

  if (input.rollupDataState === "stale") {
    return "rollup-data-stale";
  }

  return "rollup-data-unknown";
}
import {
  buildRollupSummaryApiSwitchPreview,
  type RollupSummaryApiSwitchPreview,
  type RollupSummaryApiSwitchPreviewDataState,
  type RollupSummaryApiSwitchPreviewFallbackReason,
  type RollupSummaryApiSwitchPreviewTarget,
} from "./analytics-rollup-summary-switch-preview.js";
import {
  buildRollupSummaryQueryCompatibilityPreview,
  type RollupSummaryQueryCompatibilityFallbackReason,
  type RollupSummaryQueryCompatibilityFilterValue,
  type RollupSummaryQueryCompatibilityPreview,
} from "./analytics-rollup-summary-query-compatibility-preview.js";

export type RollupSummaryApiSwitchPreviewOutputStatus =
  | "summary-api-runtime-retained"
  | "summary-api-rollup-preview-ready"
  | "summary-api-rollup-preview-fallback-required";

export type RollupSummaryApiSwitchPreviewEffectiveFallbackReason =
  | RollupSummaryApiSwitchPreviewFallbackReason
  | RollupSummaryQueryCompatibilityFallbackReason;

export type BuildRollupSummaryApiSwitchPreviewOutputInput = {
  readonly target: RollupSummaryApiSwitchPreviewTarget;
  readonly filters?: Readonly<
    Record<string, RollupSummaryQueryCompatibilityFilterValue>
  >;
  readonly rollupPreviewEnabled?: boolean;
  readonly rollupDataState?: RollupSummaryApiSwitchPreviewDataState;
};

export type RollupSummaryApiSwitchPreviewOutput = {
  readonly target: RollupSummaryApiSwitchPreviewTarget;
  readonly status: RollupSummaryApiSwitchPreviewOutputStatus;
  readonly queryCompatibility: RollupSummaryQueryCompatibilityPreview;
  readonly switchPreview: RollupSummaryApiSwitchPreview;
  readonly operatorDecision: {
    readonly currentRuntimePath: "raw-event-summary";
    readonly rollupPreviewPath: "rollup-read-model-preview";
    readonly runtimeSwitchApplied: false;
    readonly rawSummaryRuntimeRetained: true;
    readonly rollupReadModelConsidered: boolean;
    readonly fallbackPath: "raw-event-summary";
  };
  readonly fallbackPlan: {
    readonly required: true;
    readonly selectedPath: "raw-event-summary";
    readonly effectiveReason: RollupSummaryApiSwitchPreviewEffectiveFallbackReason;
    readonly queryFallbackReason:
      | RollupSummaryQueryCompatibilityFallbackReason
      | null;
    readonly rollupFallbackReason: RollupSummaryApiSwitchPreviewFallbackReason;
  };
  readonly reviewerNotes: {
    readonly summaryApiSwitchIsPreviewOnly: true;
    readonly endpointRuntimeBehaviorChanged: false;
    readonly currentRawSummaryRemainsAuthoritative: true;
    readonly selectedReadsStillUseRawEvents: true;
    readonly futureRollupReadRequiresCompatibleQueryAndFreshData: true;
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

export function buildRollupSummaryApiSwitchPreviewOutput(
  input: BuildRollupSummaryApiSwitchPreviewOutputInput,
): RollupSummaryApiSwitchPreviewOutput {
  const rollupPreviewEnabled = input.rollupPreviewEnabled === true;
  const rollupDataState = input.rollupDataState ?? "unknown";
  const queryCompatibility = buildRollupSummaryQueryCompatibilityPreview({
    target: input.target,
    filters: input.filters,
  });
  const switchPreview = buildRollupSummaryApiSwitchPreview({
    target: input.target,
    rollupPreviewEnabled,
    queryShapeSupported: queryCompatibility.queryShapeSupported,
    rollupDataState,
  });
  const effectiveReason = resolveEffectiveFallbackReason({
    queryCompatibility,
    switchPreview,
  });

  return {
    target: input.target,
    status: resolveOutputStatus({
      rollupPreviewEnabled,
      queryCompatibility,
      rollupDataState,
    }),
    queryCompatibility,
    switchPreview,
    operatorDecision: {
      currentRuntimePath: "raw-event-summary",
      rollupPreviewPath: "rollup-read-model-preview",
      runtimeSwitchApplied: false,
      rawSummaryRuntimeRetained: true,
      rollupReadModelConsidered: rollupPreviewEnabled,
      fallbackPath: "raw-event-summary",
    },
    fallbackPlan: {
      required: true,
      selectedPath: "raw-event-summary",
      effectiveReason,
      queryFallbackReason: queryCompatibility.fallbackReason,
      rollupFallbackReason: switchPreview.fallback.reason,
    },
    reviewerNotes: {
      summaryApiSwitchIsPreviewOnly: true,
      endpointRuntimeBehaviorChanged: false,
      currentRawSummaryRemainsAuthoritative: true,
      selectedReadsStillUseRawEvents: true,
      futureRollupReadRequiresCompatibleQueryAndFreshData: true,
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

function resolveOutputStatus(input: {
  readonly rollupPreviewEnabled: boolean;
  readonly queryCompatibility: RollupSummaryQueryCompatibilityPreview;
  readonly rollupDataState: RollupSummaryApiSwitchPreviewDataState;
}): RollupSummaryApiSwitchPreviewOutputStatus {
  if (!input.rollupPreviewEnabled) {
    return "summary-api-runtime-retained";
  }

  if (
    input.queryCompatibility.queryShapeSupported &&
    input.rollupDataState === "fresh"
  ) {
    return "summary-api-rollup-preview-ready";
  }

  return "summary-api-rollup-preview-fallback-required";
}

function resolveEffectiveFallbackReason(input: {
  readonly queryCompatibility: RollupSummaryQueryCompatibilityPreview;
  readonly switchPreview: RollupSummaryApiSwitchPreview;
}): RollupSummaryApiSwitchPreviewEffectiveFallbackReason {
  if (input.queryCompatibility.fallbackReason) {
    return input.queryCompatibility.fallbackReason;
  }

  return input.switchPreview.fallback.reason;
}
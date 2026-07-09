import {
  buildRollupSummaryQueryCompatibilityPreview,
  type RollupSummaryQueryCompatibilityFallbackReason,
  type RollupSummaryQueryCompatibilityFilterValue,
  type RollupSummaryQueryCompatibilityPreview,
} from "./analytics-rollup-summary-query-compatibility-preview.js";
import type {
  RollupSummaryApiSwitchPreviewDataState,
  RollupSummaryApiSwitchPreviewTarget,
} from "./analytics-rollup-summary-switch-preview.js";

export type RollupSummaryRuntimeReadPath =
  | "raw-event-summary"
  | "rollup-read-model";

export type RollupSummaryRuntimeReadDecisionStatus =
  | "rollup-read-model-selected"
  | "raw-summary-fallback-selected";

export type RollupSummaryRuntimeReadFallbackReason =
  | "rollup-runtime-switch-disabled"
  | "rollup-data-missing"
  | "rollup-data-empty"
  | "rollup-data-stale"
  | "rollup-data-unknown"
  | RollupSummaryQueryCompatibilityFallbackReason;

export type BuildRollupSummaryRuntimeReadDecisionInput = {
  readonly target: RollupSummaryApiSwitchPreviewTarget;
  readonly filters?: Readonly<
    Record<string, RollupSummaryQueryCompatibilityFilterValue>
  >;
  readonly rollupRuntimeReadEnabled?: boolean;
  readonly rollupDataState?: RollupSummaryApiSwitchPreviewDataState;
};

export type RollupSummaryRuntimeReadDecision = {
  readonly target: RollupSummaryApiSwitchPreviewTarget;
  readonly status: RollupSummaryRuntimeReadDecisionStatus;
  readonly queryCompatibility: RollupSummaryQueryCompatibilityPreview;
  readonly selectedReadPath: {
    readonly path: RollupSummaryRuntimeReadPath;
    readonly readsRawEvents: boolean;
    readonly readsRollupTables: boolean;
    readonly affectsQuotaCounting: false;
    readonly deletesRawEvents: false;
  };
  readonly fallback: {
    readonly path: "raw-event-summary";
    readonly available: true;
    readonly required: boolean;
    readonly reason: RollupSummaryRuntimeReadFallbackReason | null;
    readonly rawSummaryRemainsSourceOfTruth: boolean;
  };
  readonly runtimeSwitch: {
    readonly requested: boolean;
    readonly applied: boolean;
    readonly reason:
      | "rollup-runtime-read-selected"
      | RollupSummaryRuntimeReadFallbackReason;
  };
  readonly reviewerNotes: {
    readonly selectedSummaryReadsOnly: true;
    readonly preserveCurrentSummaryResponseShape: true;
    readonly fallbackBeforeRollupRepositoryForUnsupportedQuery: boolean;
    readonly rollupDataMustBeFresh: true;
    readonly rawEventSummaryRemainsFallback: true;
  };
  readonly safety: {
    readonly endpointRuntimeChangedByDecisionModel: false;
    readonly readsDatabaseInDecisionModel: false;
    readonly invokesRepositoryInDecisionModel: false;
    readonly persistsRollups: false;
    readonly mutatesQuotaCounting: false;
    readonly deletesRawEvents: false;
    readonly wiresSchedulerOrBackgroundJob: false;
    readonly wiresRetentionExecution: false;
  };
};

export function buildRollupSummaryRuntimeReadDecision(
  input: BuildRollupSummaryRuntimeReadDecisionInput,
): RollupSummaryRuntimeReadDecision {
  const rollupRuntimeReadEnabled = input.rollupRuntimeReadEnabled === true;
  const rollupDataState = input.rollupDataState ?? "unknown";
  const queryCompatibility = buildRollupSummaryQueryCompatibilityPreview({
    target: input.target,
    filters: input.filters,
  });
  const fallbackReason = resolveFallbackReason({
    rollupRuntimeReadEnabled,
    queryCompatibility,
    rollupDataState,
  });
  const selectedReadPath =
    fallbackReason === null ? "rollup-read-model" : "raw-event-summary";

  return {
    target: input.target,
    status:
      selectedReadPath === "rollup-read-model"
        ? "rollup-read-model-selected"
        : "raw-summary-fallback-selected",
    queryCompatibility,
    selectedReadPath: {
      path: selectedReadPath,
      readsRawEvents: selectedReadPath === "raw-event-summary",
      readsRollupTables: selectedReadPath === "rollup-read-model",
      affectsQuotaCounting: false,
      deletesRawEvents: false,
    },
    fallback: {
      path: "raw-event-summary",
      available: true,
      required: selectedReadPath === "raw-event-summary",
      reason: fallbackReason,
      rawSummaryRemainsSourceOfTruth: selectedReadPath === "raw-event-summary",
    },
    runtimeSwitch: {
      requested: rollupRuntimeReadEnabled,
      applied: selectedReadPath === "rollup-read-model",
      reason: fallbackReason ?? "rollup-runtime-read-selected",
    },
    reviewerNotes: {
      selectedSummaryReadsOnly: true,
      preserveCurrentSummaryResponseShape: true,
      fallbackBeforeRollupRepositoryForUnsupportedQuery:
        queryCompatibility.queryShapeSupported === false,
      rollupDataMustBeFresh: true,
      rawEventSummaryRemainsFallback: true,
    },
    safety: {
      endpointRuntimeChangedByDecisionModel: false,
      readsDatabaseInDecisionModel: false,
      invokesRepositoryInDecisionModel: false,
      persistsRollups: false,
      mutatesQuotaCounting: false,
      deletesRawEvents: false,
      wiresSchedulerOrBackgroundJob: false,
      wiresRetentionExecution: false,
    },
  };
}

function resolveFallbackReason(input: {
  readonly rollupRuntimeReadEnabled: boolean;
  readonly queryCompatibility: RollupSummaryQueryCompatibilityPreview;
  readonly rollupDataState: RollupSummaryApiSwitchPreviewDataState;
}): RollupSummaryRuntimeReadFallbackReason | null {
  if (!input.rollupRuntimeReadEnabled) {
    return "rollup-runtime-switch-disabled";
  }

  if (input.queryCompatibility.fallbackReason) {
    return input.queryCompatibility.fallbackReason;
  }

  if (input.rollupDataState === "fresh") {
    return null;
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
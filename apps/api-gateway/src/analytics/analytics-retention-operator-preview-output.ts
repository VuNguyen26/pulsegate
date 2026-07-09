import type {
  AnalyticsRetentionCandidateSummary,
} from './analytics-retention-candidate-read.repository.js';
import type {
  AnalyticsRetentionExecutionCandidateCountLoaderReason,
} from './analytics-retention-execution-candidate-count-loader.js';
import type {
  AnalyticsRetentionExecutionServiceCandidateReadPreview,
} from './analytics-retention-execution-service-candidate-read-preview.js';
import {
  buildAnalyticsRetentionExecutionServiceSummary,
  type AnalyticsRetentionExecutionServiceSummary,
} from './analytics-retention-execution-service-summary.js';
import {
  buildAnalyticsRetentionExecuteContractReview,
  type AnalyticsRetentionExecuteContractReview,
} from './analytics-retention-execute-contract-review.js';
import type {
  AnalyticsRetentionConcreteSource,
} from './analytics-retention-policy.js';

export interface AnalyticsRetentionOperatorPreviewCandidateCounts {
  readonly usageCandidateCount: number | null;
  readonly rejectedCandidateCount: number | null;
}

export interface AnalyticsRetentionOperatorPreviewCandidateSource {
  readonly source: AnalyticsRetentionConcreteSource;
  readonly loaded: boolean;
  readonly retentionDays: number | null;
  readonly cutoffExclusive: string | null;
  readonly candidateCount: number | null;
  readonly dryRunOnly: true;
  readonly deleteAllowed: false;
}

export interface AnalyticsRetentionOperatorPreviewCandidateLoaderSummary {
  readonly enabled: boolean;
  readonly generatedAt: string | null;
  readonly counts: AnalyticsRetentionOperatorPreviewCandidateCounts;
  readonly reasons: readonly AnalyticsRetentionExecutionCandidateCountLoaderReason[];
  readonly sources: readonly AnalyticsRetentionOperatorPreviewCandidateSource[];
  readonly dryRunOnly: true;
  readonly deleteAllowed: false;
}

export interface AnalyticsRetentionOperatorPreviewSafetySummary {
  readonly commandDeletesEvents: false;
  readonly candidateReadOnly: true;
  readonly deleteRepositoryExecuted: false;
  readonly deleteAllowed: false;
  readonly destructiveExecutionPerformed: false;
  readonly deleteImplementationAvailable: boolean;
  readonly servicePreviewDeleteAllowed: boolean;
}

export interface AnalyticsRetentionOperatorPreviewOutput {
  readonly kind: 'analytics-retention-operator-preview';
  readonly summary: AnalyticsRetentionExecutionServiceSummary;
  readonly candidateCountLoader: AnalyticsRetentionOperatorPreviewCandidateLoaderSummary;
  readonly executeContractReview: AnalyticsRetentionExecuteContractReview;
  readonly safety: AnalyticsRetentionOperatorPreviewSafetySummary;
  readonly deleteAllowed: false;
  readonly destructiveExecutionPerformed: false;
}

export function buildAnalyticsRetentionOperatorPreviewOutput(
  input: AnalyticsRetentionExecutionServiceCandidateReadPreview,
): AnalyticsRetentionOperatorPreviewOutput {
  const summary = buildAnalyticsRetentionExecutionServiceSummary(input.preview);
  const executeContractReview = resolveExecuteContractReview(input.preview);

  return {
    kind: 'analytics-retention-operator-preview',
    summary,
    candidateCountLoader: {
      enabled: input.candidateCountLoader.enabled,
      generatedAt: toIsoStringOrNull(input.candidateCountLoader.generatedAt),
      counts: {
        usageCandidateCount:
          input.candidateCountLoader.counts.usageCandidateCount ?? null,
        rejectedCandidateCount:
          input.candidateCountLoader.counts.rejectedCandidateCount ?? null,
      },
      reasons: [...input.candidateCountLoader.reasons],
      sources: [
        summarizeCandidateSource('usage', input.candidateCountLoader.candidates.usage),
        summarizeCandidateSource(
          'rejected',
          input.candidateCountLoader.candidates.rejected,
        ),
      ],
      dryRunOnly: true,
      deleteAllowed: false,
    },
    executeContractReview,
    safety: {
      commandDeletesEvents: false,
      candidateReadOnly: true,
      deleteRepositoryExecuted: false,
      deleteAllowed: false,
      destructiveExecutionPerformed: false,
      deleteImplementationAvailable: summary.deleteImplementationAvailable,
      servicePreviewDeleteAllowed: summary.deleteAllowed,
    },
    deleteAllowed: false,
    destructiveExecutionPerformed: false,
  };
}

function resolveExecuteContractReview(
  preview: AnalyticsRetentionExecutionServiceCandidateReadPreview['preview'],
): AnalyticsRetentionExecuteContractReview {
  const maybePreviewWithContract = preview as {
    readonly executeContractReview?: AnalyticsRetentionExecuteContractReview;
    readonly executionArgs?: {
      readonly confirmExecute?: boolean;
      readonly hardDeleteLimit?: number;
    };
  };

  if (maybePreviewWithContract.executeContractReview !== undefined) {
    return maybePreviewWithContract.executeContractReview;
  }

  return buildAnalyticsRetentionExecuteContractReview({
    confirmationProvided:
      maybePreviewWithContract.executionArgs?.confirmExecute === true,
    hardDeleteLimit: maybePreviewWithContract.executionArgs?.hardDeleteLimit ?? null,
    candidateRecheckPlanned: false,
    rollbackExpectationDocumented: false,
    auditOutputPlanned: false,
  });
}

function summarizeCandidateSource(
  source: AnalyticsRetentionConcreteSource,
  candidateSummary: AnalyticsRetentionCandidateSummary | null,
): AnalyticsRetentionOperatorPreviewCandidateSource {
  if (candidateSummary === null) {
    return {
      source,
      loaded: false,
      retentionDays: null,
      cutoffExclusive: null,
      candidateCount: null,
      dryRunOnly: true,
      deleteAllowed: false,
    };
  }

  return {
    source,
    loaded: true,
    retentionDays: candidateSummary.retentionDays,
    cutoffExclusive: toIsoStringOrNull(candidateSummary.cutoffExclusive),
    candidateCount: candidateSummary.candidateCount,
    dryRunOnly: true,
    deleteAllowed: false,
  };
}

function toIsoStringOrNull(value: Date | null | undefined): string | null {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return null;
  }

  return value.toISOString();
}
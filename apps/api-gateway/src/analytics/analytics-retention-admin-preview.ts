import type {
  AnalyticsRetentionCandidateReadRepository,
  AnalyticsRetentionCandidateSummary,
} from "./analytics-retention-candidate-read.repository.js";
import {
  createAnalyticsRetentionDryRunService,
} from "./analytics-retention-dry-run-service.js";
import {
  ANALYTICS_RETENTION_DEFAULT_DAYS,
} from "./analytics-retention-policy.js";

export interface AnalyticsRetentionAdminCandidatePreview {
  readonly source: "usage" | "rejected";
  readonly cutoffExclusive: string;
  readonly retentionDays: number;
  readonly candidateCount: number;
  readonly dryRunOnly: true;
  readonly deleteAllowed: false;
}

export interface AnalyticsRetentionAdminPreview {
  readonly kind:
    "analytics-retention-admin-preview";
  readonly generatedAt: string;
  readonly configurationSource:
    "dashboard-observational-defaults";
  readonly policy: {
    readonly enabled: true;
    readonly mode: "dry-run";
    readonly source: "both";
    readonly usageRetentionDays: number;
    readonly rejectedRetentionDays: number;
  };
  readonly candidates: {
    readonly enabled: true;
    readonly generatedAt: string;
    readonly usage:
      AnalyticsRetentionAdminCandidatePreview;
    readonly rejected:
      AnalyticsRetentionAdminCandidatePreview;
  };
  readonly readsCandidateCounts: true;
  readonly dryRunOnly: true;
  readonly deleteAllowed: false;
  readonly importsDeleteRepository: false;
  readonly executesRetention: false;
}

export interface AnalyticsRetentionAdminPreviewService {
  previewRetention: (
    now?: Date,
  ) => Promise<AnalyticsRetentionAdminPreview>;
}

function serializeCandidate(
  candidate: AnalyticsRetentionCandidateSummary,
): AnalyticsRetentionAdminCandidatePreview {
  return {
    source: candidate.source,
    cutoffExclusive:
      candidate.cutoffExclusive.toISOString(),
    retentionDays:
      candidate.retentionDays,
    candidateCount:
      candidate.candidateCount,
    dryRunOnly: true,
    deleteAllowed: false,
  };
}

export function createAnalyticsRetentionAdminPreviewService(
  candidateReadRepository:
    AnalyticsRetentionCandidateReadRepository,
): AnalyticsRetentionAdminPreviewService {
  const dryRunService =
    createAnalyticsRetentionDryRunService(
      candidateReadRepository,
    );

  return {
    async previewRetention(
      now: Date = new Date(),
    ): Promise<AnalyticsRetentionAdminPreview> {
      const result =
        await dryRunService.previewRetention({
          now,
          policyInput: {
            enabled: true,
            mode: "dry-run",
            source: "both",
            usageRetentionDays:
              ANALYTICS_RETENTION_DEFAULT_DAYS,
            rejectedRetentionDays:
              ANALYTICS_RETENTION_DEFAULT_DAYS,
          },
        });

      if (
        result.candidates.usage === null ||
        result.candidates.rejected === null
      ) {
        throw new Error(
          "analytics retention admin preview requires both candidate summaries",
        );
      }

      return {
        kind:
          "analytics-retention-admin-preview",
        generatedAt:
          result.plan.generatedAt.toISOString(),
        configurationSource:
          "dashboard-observational-defaults",
        policy: {
          enabled: true,
          mode: "dry-run",
          source: "both",
          usageRetentionDays:
            result.policy.usage
              ?.retentionDays ??
            ANALYTICS_RETENTION_DEFAULT_DAYS,
          rejectedRetentionDays:
            result.policy.rejected
              ?.retentionDays ??
            ANALYTICS_RETENTION_DEFAULT_DAYS,
        },
        candidates: {
          enabled: true,
          generatedAt:
            result.candidates.generatedAt.toISOString(),
          usage: serializeCandidate(
            result.candidates.usage,
          ),
          rejected: serializeCandidate(
            result.candidates.rejected,
          ),
        },
        readsCandidateCounts: true,
        dryRunOnly: true,
        deleteAllowed: false,
        importsDeleteRepository: false,
        executesRetention: false,
      };
    },
  };
}
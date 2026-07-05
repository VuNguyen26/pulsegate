import type { PrismaClient } from "../generated/prisma/index.js";
import type {
  AnalyticsRetentionConcreteSource,
  AnalyticsRetentionPlan,
  AnalyticsRetentionSourcePlan,
} from "./analytics-retention-policy.js";

export type AnalyticsRetentionCandidateSummary = {
  readonly source: AnalyticsRetentionConcreteSource;
  readonly cutoffExclusive: Date;
  readonly retentionDays: number;
  readonly candidateCount: number;
  readonly dryRunOnly: true;
  readonly deleteAllowed: false;
};

export type AnalyticsRetentionCandidateReadResult = {
  readonly enabled: boolean;
  readonly generatedAt: Date;
  readonly usage: AnalyticsRetentionCandidateSummary | null;
  readonly rejected: AnalyticsRetentionCandidateSummary | null;
};

export type AnalyticsRetentionCandidateReadRepository = {
  summarizeCandidates: (
    plan: AnalyticsRetentionPlan,
  ) => Promise<AnalyticsRetentionCandidateReadResult>;
};

function assertDryRunOnly(plan: AnalyticsRetentionPlan): void {
  if (plan.mode !== "dry-run") {
    throw new RangeError("analytics retention candidate reads only support dry-run mode");
  }
}

function buildCandidateSummary(
  sourcePlan: AnalyticsRetentionSourcePlan,
  candidateCount: number,
): AnalyticsRetentionCandidateSummary {
  return {
    source: sourcePlan.source,
    cutoffExclusive: sourcePlan.cutoffExclusive,
    retentionDays: sourcePlan.retentionDays,
    candidateCount,
    dryRunOnly: true,
    deleteAllowed: false,
  };
}

export function createPrismaAnalyticsRetentionCandidateReadRepository(
  prisma: PrismaClient,
): AnalyticsRetentionCandidateReadRepository {
  return {
    async summarizeCandidates(
      plan: AnalyticsRetentionPlan,
    ): Promise<AnalyticsRetentionCandidateReadResult> {
      assertDryRunOnly(plan);

      if (!plan.enabled) {
        return {
          enabled: false,
          generatedAt: plan.generatedAt,
          usage: null,
          rejected: null,
        };
      }

      const usageCount =
        plan.usage === null
          ? null
          : await prisma.apiUsageEvent.count({
              where: {
                occurredAt: {
                  lt: plan.usage.cutoffExclusive,
                },
              },
            });

      const rejectedCount =
        plan.rejected === null
          ? null
          : await prisma.apiRejectedEvent.count({
              where: {
                occurredAt: {
                  lt: plan.rejected.cutoffExclusive,
                },
              },
            });

      return {
        enabled: true,
        generatedAt: plan.generatedAt,
        usage:
          plan.usage === null || usageCount === null
            ? null
            : buildCandidateSummary(plan.usage, usageCount),
        rejected:
          plan.rejected === null || rejectedCount === null
            ? null
            : buildCandidateSummary(plan.rejected, rejectedCount),
      };
    },
  };
}
